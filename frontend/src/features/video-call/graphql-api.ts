/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type ChimeMeeting = {
  __typename: "ChimeMeeting",
  meetingResponse: string,
  attendeeResponse: string,
};

export type MeetingId = {
  __typename: "MeetingId",
  meetingId: string,
};

export type MeetingMessage = {
  __typename: "MeetingMessage",
  target: string,
  source: string,
  state: string,
  meetingInfo: string,
};

export type UserId = {
  __typename: "UserId",
  userId: string,
};

export type UserEmail = {
  __typename: "UserEmail",
  userEmail: string,
};

export type CreateChimeMeetingMutationVariables = {
};

export type CreateChimeMeetingMutation = {
  createChimeMeeting?:  {
    __typename: "ChimeMeeting",
    meetingResponse: string,
    attendeeResponse: string,
  } | null,
};

export type JoinMeetingMutationVariables = {
  meetingResponse: string,
};

export type JoinMeetingMutation = {
  joinMeeting?:  {
    __typename: "ChimeMeeting",
    meetingResponse: string,
    attendeeResponse: string,
  } | null,
};

export type DeleteChimeMeetingMutationVariables = {
  meetingId: string,
};

export type DeleteChimeMeetingMutation = {
  deleteChimeMeeting?:  {
    __typename: "MeetingId",
    meetingId: string,
  } | null,
};

export type SendMeetingMessageMutationVariables = {
  target: string,
  source: string,
  state: string,
  meetingInfo: string,
};

export type SendMeetingMessageMutation = {
  sendMeetingMessage?:  {
    __typename: "MeetingMessage",
    target: string,
    source: string,
    state: string,
    meetingInfo: string,
  } | null,
};

export type DummyQueryVariables = {
};

export type DummyQuery = {
  dummy?:  {
    __typename: "ChimeMeeting",
    meetingResponse: string,
    attendeeResponse: string,
  } | null,
};

export type GetCognitoIdQueryVariables = {
};

export type GetCognitoIdQuery = {
  getCognitoId?:  {
    __typename: "UserId",
    userId: string,
  } | null,
};

export type GetEmailFromIdQueryVariables = {
  idResponse: string,
};

export type GetEmailFromIdQuery = {
  getEmailFromId?:  {
    __typename: "UserEmail",
    userEmail: string,
  } | null,
};

export type OnMeetingMessageReceivedSubscriptionVariables = {
  target: string,
};

export type OnMeetingMessageReceivedSubscription = {
  onMeetingMessageReceived?:  {
    __typename: "MeetingMessage",
    target: string,
    source: string,
    state: string,
    meetingInfo: string,
  } | null,
};
