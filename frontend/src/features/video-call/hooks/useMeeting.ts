import { Meeting, MeetingResponse } from "@/types/meeting";
import useMeetingApi from "./useMeetingApi";

// const useMeeting = () => {
//   // dummy
//   const meetings: Meeting[] = [
//     {
//       id: "1",
//       alertId: "1",
//       capturePipelineArn:
//         "arn:aws:mediaconnect:ap-northeast-1:123456789012:flow:1-2abcd3e4-5678-90ab-cdef-EXAMPLE123456",
//       capturePipelineId: "1-2abcd3e4-5678-90ab-cdef-EXAMPLE123456",
//       concatPipelineArn:
//         "arn:aws:mediaconnect:ap-northeast-1:123456789012:flow:1-2abcd3e4-5678-90ab-cdef-EXAMPLE123456",
//       concatPipelineId: "1-2abcd3e4-5678-90ab-cdef-EXAMPLE123456",
//       createdAt: "2024-08-07T03:07:17.853Z",
//       isConcatenated: true,
//       isSummarized: true,
//     },
//     {
//       id: "2",
//       alertId: "2",
//       capturePipelineArn:
//         "arn:aws:mediaconnect:ap-northeast-1:123456789012:flow:1-2abcd3e4-5678-90ab-cdef-EXAMPLE123456",
//       capturePipelineId: "1-2abcd3e4-5678-90ab-cdef-EXAMPLE123456",
//       concatPipelineArn:
//         "arn:aws:mediaconnect:ap-northeast-1:123456789012:flow:1-2abcd3e4-5678-90ab-cdef-EXAMPLE123456",
//       concatPipelineId: "1-2abcd3e4-5678-90ab-cdef-EXAMPLE123456",
//       createdAt: "2024-08-07T03:07:17.853Z",
//       isConcatenated: true,
//       isSummarized: true,
//     },
//   ];

//   return {
//     meetings,
//   };
// };

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

  return {
    meetings,
    getMeeting: async (meetingId: string): Promise<Meeting> => {
      const response = await api.getMeeting(meetingId);
      return convertToMeeting(response.data!);
    },
    refreshMeetings: () => {
      mutateMeetings();
    },
  };
};

export default useMeeting;
