import { MeetingResponse } from "@/types/meeting";
import useHttp from "@/hooks/useHttp";

const useMeetingApi = () => {
  const http = useHttp();

  return {
    getAllMeetingsByAlertId: (alertId: string) => {
      return http.get<MeetingResponse[]>(`/alert/${alertId}/meetings`);
    },
    getMeeting: (meetingId: string) => {
      return http.get<MeetingResponse>(`meeting/${meetingId}`);
    },
    getMeetingVideoUrl: (alertId: string, meetingId: string) => {
      return http.get<string>(
        `/alert/${alertId}/meetings/${meetingId}/video-url`
      );
    },
  };
};

export default useMeetingApi;
