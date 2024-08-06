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

  const client = generateClient();

  // 会議参加通知や会議終了通知を送信する
  const sendMessage = async ({
    myName,
    targetId,
    state,
    meetingInfo,
  }: SendMessageParams) => {
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
  };

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
  const createAndJoin = async (alertId: string): Promise<MeetingResponse> => {
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
  };

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
  };
};
export default useChime;
