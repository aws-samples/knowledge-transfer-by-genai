import { useCallback } from "react";
import { Meeting, MeetingResponse } from "@/types/meeting";
import useMeetingApi from "./useMeetingApi";

const useMeeting = (alertId: string) => {
  const api = useMeetingApi();

  const convertToMeeting = (response: MeetingResponse): Meeting => {
    return {
      ...response,
      capturePipelineId: response.capturePipelineArn.split("/").pop() || "",
      concatPipelineId: response.concatPipelineArn.split("/").pop() || "",
      isConcatenated: !!response.concatenatedAt,
      isSummarized: !!response.summarizedAt,
    };
  };

  const { data: meetingsResponse, mutate: mutateMeetings } =
    api.getAllMeetingsByAlertId(alertId);

  const meetings = meetingsResponse
    ? meetingsResponse.map(convertToMeeting)
    : undefined;

  const getMeetingVideoUrl = useCallback(
    (meetingId: string) => {
      // const response = await api.getMeetingVideoUrl(alertId, meetingId);
      // return response.data;
      const { data: meetingVideoUrl } = api.getMeetingVideoUrl(
        alertId,
        meetingId
      );
      return { meetingVideoUrl };
    },
    [api, alertId]
  );

  return {
    meetings,
    getMeeting: async (meetingId: string): Promise<Meeting> => {
      const response = await api.getMeeting(meetingId);
      return convertToMeeting(response.data!);
    },
    getMeetingVideoUrl,
    refreshMeetings: () => {
      mutateMeetings();
    },
  };
};

export default useMeeting;
