import { ChimeSDKMeetings } from "@aws-sdk/client-chime-sdk-meetings";
import {
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { v4 } from "uuid";
import { AppSyncResolverHandler } from "aws-lambda";

type EmptyArgument = {};

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
      return await createChimeMeeting();
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

const createChimeMeeting = async (): Promise<CreateChimeMeetingResult> => {
  const meetingResponse = await chimeSDKMeetings.createMeeting({
    ClientRequestToken: v4(),
    MediaRegion: "ap-northeast-1",
    NotificationsConfiguration: {},
    ExternalMeetingId: v4(),
  });

  if (meetingResponse?.Meeting?.MeetingId == null) {
    throw Error("empty MeetingId!");
  }

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
