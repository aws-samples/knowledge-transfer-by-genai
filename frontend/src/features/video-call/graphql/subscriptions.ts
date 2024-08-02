/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../graphql-api";
type GeneratedSubscription<InputType, OutputType> = string & {
  __generatedSubscriptionInput: InputType;
  __generatedSubscriptionOutput: OutputType;
};

export const onMeetingMessageReceived = /* GraphQL */ `subscription OnMeetingMessageReceived($target: ID!) {
  onMeetingMessageReceived(target: $target) {
    target
    source
    state
    meetingInfo
    __typename
  }
}
` as GeneratedSubscription<
  APITypes.OnMeetingMessageReceivedSubscriptionVariables,
  APITypes.OnMeetingMessageReceivedSubscription
>;
