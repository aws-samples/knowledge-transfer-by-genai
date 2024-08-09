import { ChimeSDKMeetings } from "@aws-sdk/client-chime-sdk-meetings";
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { v4 } from "uuid";
import { AppSyncResolverHandler } from "aws-lambda";
import { startCapture, createConcat } from "./lib/record";
import { startTranscribe } from "./lib/transcribe";
import {
  appendMeetingToAlert,
  storeMeeting,
} from "@industrial-knowledge-transfer-by-genai/common";

const { RECORDING_BUCKET_ARN, CONCATENATED_BUCKET_ARN, ACCOUNT_ID } =
  process.env;

type EmptyArgument = {};

type CreateChimeMeetingArgument = {
  alertId: string;
};

type JoinMeetingArgument = {
  meetingResponse: string;
};

type CognitoIdArgument = {
  idResponse: string;
};

type DeleteChimeMeetingArgument = {
  meetingId: string;
};

type CreateChimeMeetingResult = {
  attendeeResponse: string;
  meetingResponse: string;
};

type JoinMeetingResult = {
  attendeeResponse: any;
  meetingResponse: string;
};

type GetCognitoIdResult = {
  userId: string;
};

type GetCognitoEmailResult = {
  userEmail: string;
};

type DeleteChimeMeetingResult = {
  meetingId: string;
};

type Result =
  | CreateChimeMeetingResult
  | JoinMeetingResult
  | DeleteChimeMeetingResult;
type Argument =
  | CreateChimeMeetingArgument
  | EmptyArgument
  | JoinMeetingArgument
  | DeleteChimeMeetingArgument;

// You must use "us-east-1" as the region for Chime API and set the endpoint.
// https://docs.aws.amazon.com/chime-sdk/latest/dg/configure-sdk-invoke.html
const chimeSDKMeetings = new ChimeSDKMeetings({
  region: "us-east-1",
  endpoint: "https://meetings-chime.us-east-1.amazonaws.com",
});
const cognitoIdentityProviderClient = new CognitoIdentityProviderClient({
  region: process.env.USER_POOL_REGION,
});

export const handler: AppSyncResolverHandler<Argument, Result> = async (
  event,
  context
) => {
  console.log(event);
  switch (event.info.fieldName) {
    case "createChimeMeeting":
      return await createChimeMeeting(
        event.arguments as CreateChimeMeetingArgument
      );
    case "joinMeeting":
      return await joinMeeting(event.arguments as JoinMeetingArgument);
    case "getCognitoId":
      return await getCognitoId();
    case "getEmailFromId":
      return await getEmailFromId(event.arguments as CognitoIdArgument);
    case "deleteChimeMeeting":
      return await deleteChimeMeeting(
        event.arguments as DeleteChimeMeetingArgument
      );
    default:
      throw new Error("invalid event field!");
  }
};

const createChimeMeeting = async (
  request: CreateChimeMeetingArgument
): Promise<CreateChimeMeetingResult> => {
  const meetingResponse = await chimeSDKMeetings.createMeeting({
    ClientRequestToken: v4(),
    MediaRegion: "ap-northeast-1",
    NotificationsConfiguration: {},
    ExternalMeetingId: v4(),
  });

  if (meetingResponse?.Meeting?.MeetingId == null) {
    throw Error("empty MeetingId!");
  }

  console.debug(`meetingResponse: ${JSON.stringify(meetingResponse)}`);

  // Store dynamodb
  // await appendMeetingToAlert(
  //   request.alertId,
  //   meetingResponse.Meeting.MeetingId
  // );

  // Start recording
  const captureDestination = `${RECORDING_BUCKET_ARN}/${meetingResponse.Meeting.MeetingId}`;
  const startCaptureResponse = await startCapture({
    meetingId: meetingResponse.Meeting.MeetingId,
    destination: captureDestination,
    accountId: ACCOUNT_ID!,
  });
  console.debug(
    `startCaptureResponse: ${JSON.stringify(startCaptureResponse)}`
  );

  // Set concat pipeline
  // Add `video` prefix so that can set CloudFront behavior
  const concatDestination = `${CONCATENATED_BUCKET_ARN}/video/${meetingResponse.Meeting.MeetingId}`;
  const concatResponse = await createConcat({
    capturePipelineArn: startCaptureResponse?.MediaPipelineArn!,
    destination: concatDestination,
  });
  console.debug(`concatResponse: ${JSON.stringify(concatResponse)}`);

  // Store meeting info to dynamodb
  await storeMeeting({
    id: meetingResponse.Meeting.MeetingId,
    alertId: request.alertId,
    mediaPipelineArn: startCaptureResponse?.MediaPipelineArn!,
  });

  // // Start transcription
  // const startTranscribeResponse = await startTranscribe(
  //   meetingResponse.Meeting.MeetingId
  // );
  // console.debug(
  //   `startTranscribeResponse: ${JSON.stringify(startTranscribeResponse)}`
  // );

  return await joinMeeting({
    meetingResponse: JSON.stringify(meetingResponse),
  });
};

const joinMeeting = async (
  request: JoinMeetingArgument
): Promise<JoinMeetingResult> => {
  const meeting = JSON.parse(request.meetingResponse);
  const attendeeResponse = await chimeSDKMeetings.createAttendee({
    MeetingId: meeting.Meeting.MeetingId,
    ExternalUserId: v4(),
  });

  return {
    attendeeResponse: JSON.stringify(attendeeResponse),
    ...request,
  };
};

const getCognitoId = async (): Promise<GetCognitoIdResult> => {
  const USER_POOL_ID = process.env.USER_POOL_ID;
  const params = {
    AttributesToGet: ["sub", "email"],
    UserPoolId: USER_POOL_ID,
  };

  const command = new ListUsersCommand(params);
  const userInfos = await cognitoIdentityProviderClient.send(command);

  const userInfosResult: { id: string; name: string }[] = [];

  userInfos?.Users?.map((user) => {
    const sub =
      user?.Attributes?.find((attr) => attr.Name === "sub")?.Value || "";
    const email =
      user?.Attributes?.find((attr) => attr.Name === "email")?.Value || "";
    userInfosResult.push({ id: sub, name: email });
  });

  return { userId: JSON.stringify(userInfosResult) };
};

const getEmailFromId = async (
  request: CognitoIdArgument
): Promise<GetCognitoEmailResult> => {
  const USER_POOL_ID = process.env.USER_POOL_ID;

  const params = {
    AttributesToGet: ["email"],
    Filter: `\"sub\"^=\"${request.idResponse}\"`,
    UserPoolId: USER_POOL_ID,
  };

  const command = new ListUsersCommand(params);
  const userInfos = await cognitoIdentityProviderClient.send(command);

  return { userEmail: userInfos?.Users?.[0]?.Attributes?.[0]?.Value ?? "" };
};

const deleteChimeMeeting = async ({
  meetingId,
}: DeleteChimeMeetingArgument): Promise<DeleteChimeMeetingResult> => {
  if (!meetingId) {
    throw Error("empty MeetingId!");
  }
  await chimeSDKMeetings.deleteMeeting({
    MeetingId: meetingId,
  });
  console.log(`deleteChimeMeeting - MeetingId: ${meetingId}`);
  return { meetingId };
};
