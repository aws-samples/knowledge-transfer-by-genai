import { useCallback } from "react";
import { Meeting, MeetingResponse } from "@/types/meeting";
import useMeetingApi from "./useMeetingApi";

const useMeeting = (alertId: string) => {
  const api = useMeetingApi();

  const _convertToMeeting = (response: MeetingResponse): Meeting => {
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
    ? meetingsResponse.map(_convertToMeeting)
    : undefined;

  const getMeetingVideoUrl = useCallback(
    (meetingId: string) => {
      const { data: meetingVideoUrl } = api.getMeetingVideoUrl(
        alertId,
        meetingId
      );
      return { meetingVideoUrl };
    },
    [api, alertId]
  );

  const getMeeting = useCallback(
    (meetingId: string) => {
      const { data } = api.getMeeting(meetingId);
      const meeting = data ? _convertToMeeting(data) : undefined;
      return { meeting };
    },
    [api]
  );

  return {
    meetings,
    // getMeeting: async (meetingId: string): Promise<Meeting> => {
    //   const response = await api.getMeeting(meetingId);
    //   return _convertToMeeting(response.data!);
    // },
    getMeeting,
    getMeetingVideoUrl,
    refreshMeetings: () => {
      mutateMeetings();
    },
  };
};

export default useMeeting;
