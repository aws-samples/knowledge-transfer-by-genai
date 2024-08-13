import { Meeting } from "@/types/meeting";
import useHttp from "@/hooks/useHttp";

const useMeetingApi = () => {
  const http = useHttp();

  return {
    getAllMeetingsByAlertId: (alertId: string) => {
      return http.get<Meeting[]>(`/alert/${alertId}/meetings`);
    },
    getMeeting: (meetingId: string) => {
      return http.get<Meeting>(`meeting/${meetingId}`);
    },
  };
};

export default useMeetingApi;
