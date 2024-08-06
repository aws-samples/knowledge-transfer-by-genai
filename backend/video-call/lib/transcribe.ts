import {
  ChimeSDKMeetingsClient,
  StartMeetingTranscriptionCommand,
  StartMeetingTranscriptionCommandInput,
  TranscribeRegion,
  TranscribeLanguageCode,
} from "@aws-sdk/client-chime-sdk-meetings";

const { REGION } = process.env;
const REGION_PIPELINE = "us-east-1";

const meetingClient = new ChimeSDKMeetingsClient({ region: REGION_PIPELINE });

export const startTranscribe = async (meetingId: string) => {
  const transCribeRequest: StartMeetingTranscriptionCommandInput = {
    MeetingId: meetingId,
    TranscriptionConfiguration: {
      EngineTranscribeSettings: {
        // If unsure of language spoken, set IdentifyLanguage to true
        // Ref: https://docs.aws.amazon.com/chime-sdk/latest/APIReference/API_meeting-chime_EngineTranscribeSettings.html
        // IdentifyLanguage: true,
        LanguageCode: TranscribeLanguageCode.JA_JP,
        Region: REGION as TranscribeRegion,
      },
    },
  };
  try {
    const input = new StartMeetingTranscriptionCommand(transCribeRequest);
    const output = await meetingClient.send(input);
    console.debug("startTranscribe is completed.", { output });
    return output;
  } catch (error: any) {
    console.debug("startTranscribe is failed.", { error });
    throw new Error("startTranscribe is failed.");
  }
};
