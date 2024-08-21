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
      status: response.summarizedAt
        ? "Completed"
        : response.concatenatedAt
          ? "Summarizing"
          : "Saving",
    };
  };

  const { data: meetingsResponse, mutate: mutateMeetings } =
    api.getAllMeetingsByAlertId(alertId);

  const meetings = meetingsResponse
    ? meetingsResponse.map(_convertToMeeting)
    : undefined;

  const getMeeting = useCallback(
    (meetingId: string) => {
      const { data } = api.getMeeting(meetingId);
      const meeting = data ? _convertToMeeting(data) : undefined;
      return { meeting };
    },
    [api]
  );

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

  const getMeetingTranscriptUrl = useCallback(
    (meetingId: string) => {
      const { data: meetingTranscriptUrl } = api.getMeetingTranscriptUrl(
        alertId,
        meetingId
      );
      return { meetingTranscriptUrl };
    },
    [api, alertId]
  );

  const getSummarizedTranscriptUrl = useCallback(
    (meetingId: string) => {
      const { data: summarizedTranscriptUrl } = api.getSummarizedTranscriptUrl(
        alertId,
        meetingId
      );
      return { summarizedTranscriptUrl };
    },
    [api, alertId]
  );

  return {
    meetings,
    getMeeting,
    getMeetingVideoUrl,
    getMeetingTranscriptUrl,
    getSummarizedTranscriptUrl,
    refreshMeetings: () => {
      mutateMeetings();
    },
  };
};

export default useMeeting;
