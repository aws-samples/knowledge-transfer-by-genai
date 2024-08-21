import { create } from "zustand";
import { generateClient } from "aws-amplify/api";
import { OnMeetingMessageReceivedSubscription } from "@/features/video-call/graphql-api";
import { getEmailFromId } from "@/features/video-call/graphql/queries";
import {
  createChimeMeeting,
  deleteChimeMeeting,
  joinMeeting,
  sendMeetingMessage,
} from "@/features/video-call/graphql/mutations";
import { onMeetingMessageReceived } from "@/features/video-call/graphql/subscriptions";
import { useCallback } from "react";
import { useMeetingManager } from "amazon-chime-sdk-component-library-react";
import { MeetingSessionConfiguration } from "amazon-chime-sdk-js";

export type Attendee = { id: string; name: string };

export type SendMessageParams = {
  myName: string;
  targetId: string;
  state: "MEETING_START" | "MEETING_END";
  meetingInfo: string;
};

export type MeetingResponse = {
  meeting: any;
  attendee: any;
};

const useChimeState = create<{
  isOpen: boolean;
  isOpenRing: boolean;
  attendees: Attendee[];
  meetingInfo: any;
  setAttendees: (attendees: Attendee[]) => void;
  setMeetingInfo: (meetingInfo: any) => void;
  open: () => void;
  close: () => void;
  openRing: () => void;
  closeRing: () => void;
}>((set) => {
  return {
    isOpen: false,
    isOpenRing: false,
    attendees: [],
    meetingInfo: null,
    setAttendees: (attendees: Attendee[]) => {
      set(() => ({
        attendees,
      }));
    },
    setMeetingInfo: (meetingInfo: any) => {
      set(() => ({
        meetingInfo,
      }));
    },
    open: () => {
      set(() => ({
        isOpen: true,
      }));
    },
    close: () => {
      set(() => ({
        attendees: [],
        meetingInfo: null,
        isOpen: false,
      }));
    },
    openRing: () => {
      set(() => ({
        isOpenRing: true,
      }));
    },
    closeRing: () => {
      set(() => ({
        isOpenRing: false,
      }));
    },
  };
});

const useChime = () => {
  const {
    open,
    close,
    isOpen,
    isOpenRing,
    attendees,
    meetingInfo,
    setAttendees,
    setMeetingInfo,
    openRing,
    closeRing,
  } = useChimeState();

  const meetingManager = useMeetingManager();
  const client = generateClient();

  const sendMessage = useCallback(
    async ({ myName, targetId, state, meetingInfo }: SendMessageParams) => {
      try {
        await client.graphql({
          query: sendMeetingMessage,
          variables: {
            source: myName,
            target: targetId,
            state,
            meetingInfo,
          },
          authMode: "userPool",
        });
      } catch (error) {
        console.error("Error in sendMessage:", error);
      }
    },
    [client]
  );

  // 会議参加通知や会議終了通知を受け取る
  // 受け取ったサブスクライバーは unsubscribe でリリースする
  const subscribeMessage = (
    myName: string,
    callback: (data: OnMeetingMessageReceivedSubscription) => void
  ) => {
    const subscriber = client
      .graphql({
        query: onMeetingMessageReceived,
        variables: {
          target: myName,
        },
        authMode: "userPool",
      })
      .subscribe({
        next: ({ data }) => callback(data),
        error: (error) => console.warn(error),
      });
    return subscriber;
  };

  // 会議の作成・参加を開始する
  const createAndJoin = useCallback(
    async (alertId: string): Promise<MeetingResponse> => {
      const meetingCreated = await client.graphql({
        query: createChimeMeeting,
        variables: {
          alertId,
        },
        authMode: "userPool",
      });
      const meeting = JSON.parse(
        meetingCreated.data.createChimeMeeting.meetingResponse
      );
      const attendee = JSON.parse(
        meetingCreated.data.createChimeMeeting.attendeeResponse
      );
      return { meeting, attendee };
    },
    [client]
  );

  // 招集された会議への参加を開始する
  const join = async (): Promise<MeetingResponse> => {
    const joined = await client.graphql({
      query: joinMeeting,
      variables: {
        meetingResponse: JSON.stringify(meetingInfo),
      },
      authMode: "userPool",
    });
    const meeting = meetingInfo;
    const attendee = JSON.parse(joined.data.joinMeeting.attendeeResponse);

    const meetingSessionConfiguration = new MeetingSessionConfiguration(
      meeting,
      attendee
    );
    await meetingManager.join(meetingSessionConfiguration);
    await meetingManager.start();

    return { meeting, attendee };
  };

  // 会議を終了する
  const disconnect = async (): Promise<void> => {
    if (!meetingInfo) {
      console.log("meetingInfo is empty");
      return;
    }
    const meetingId = meetingInfo.Meeting!.MeetingId;
    await client.graphql({
      query: deleteChimeMeeting,
      variables: {
        meetingId,
      },
      authMode: "userPool",
    });
  };

  // ユーザー ID からメールアドレスを取得する
  const getEmail = async (userId: string): Promise<string> => {
    const userInfos = await client.graphql({
      query: getEmailFromId,
      variables: {
        idResponse: userId,
      },
      authMode: "userPool",
    });
    const email = userInfos?.data?.getEmailFromId?.userEmail ?? "";
    return email;
  };

  // 会議の作成と参加
  const initiateMeeting = useCallback(
    async (alertId: string, initiatorPersonName: string): Promise<void> => {
      const attendees = useChimeState.getState().attendees;
      if (attendees.length == 0) {
        return;
      }
      // 会議の作成・参加を開始する
      const { meeting, attendee } = await createAndJoin(alertId);
      const meetingSessionConfiguration = new MeetingSessionConfiguration(
        meeting,
        attendee
      );
      await meetingManager.join(meetingSessionConfiguration);
      await meetingManager.start();
      setMeetingInfo(meeting);

      // 他の参加者に会議を通知する
      await sendMessage({
        myName: initiatorPersonName,
        targetId: attendees[0].id,
        state: "MEETING_START",
        meetingInfo: JSON.stringify(meeting),
      });
    },
    [createAndJoin, meetingManager, sendMessage, setMeetingInfo]
  );

  return {
    open,
    close,
    isOpen,
    isOpenRing,
    attendees,
    meetingInfo,
    setAttendees,
    setMeetingInfo,
    openRing,
    closeRing,
    createAndJoin,
    join,
    disconnect,
    sendMessage,
    subscribeMessage,
    getEmail,
    initiateMeeting,
  };
};
export default useChime;
