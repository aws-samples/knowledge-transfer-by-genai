/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../graphql-api";
type GeneratedMutation<InputType, OutputType> = string & {
  __generatedMutationInput: InputType;
  __generatedMutationOutput: OutputType;
};

export const createChimeMeeting = /* GraphQL */ `mutation CreateChimeMeeting($alertId: ID) {
  createChimeMeeting(alertId: $alertId) {
    meetingResponse
    attendeeResponse
    __typename
  }
}
` as GeneratedMutation<
  APITypes.CreateChimeMeetingMutationVariables,
  APITypes.CreateChimeMeetingMutation
>;
export const joinMeeting = /* GraphQL */ `mutation JoinMeeting($meetingResponse: String!) {
  joinMeeting(meetingResponse: $meetingResponse) {
    meetingResponse
    attendeeResponse
    __typename
  }
}
` as GeneratedMutation<
  APITypes.JoinMeetingMutationVariables,
  APITypes.JoinMeetingMutation
>;
export const deleteChimeMeeting = /* GraphQL */ `mutation DeleteChimeMeeting($meetingId: ID!) {
  deleteChimeMeeting(meetingId: $meetingId) {
    meetingId
    __typename
  }
}
` as GeneratedMutation<
  APITypes.DeleteChimeMeetingMutationVariables,
  APITypes.DeleteChimeMeetingMutation
>;
export const sendMeetingMessage = /* GraphQL */ `mutation SendMeetingMessage(
  $target: ID!
  $source: ID!
  $state: String!
  $meetingInfo: String!
) {
  sendMeetingMessage(
    target: $target
    source: $source
    state: $state
    meetingInfo: $meetingInfo
  ) {
    target
    source
    state
    meetingInfo
    __typename
  }
}
` as GeneratedMutation<
  APITypes.SendMeetingMessageMutationVariables,
  APITypes.SendMeetingMessageMutation
>;
