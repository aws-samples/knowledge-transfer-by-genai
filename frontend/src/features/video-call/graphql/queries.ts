/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

import * as APITypes from "../graphql-api";
type GeneratedQuery<InputType, OutputType> = string & {
  __generatedQueryInput: InputType;
  __generatedQueryOutput: OutputType;
};

export const dummy = /* GraphQL */ `query Dummy {
  dummy {
    meetingResponse
    attendeeResponse
    __typename
  }
}
` as GeneratedQuery<APITypes.DummyQueryVariables, APITypes.DummyQuery>;
export const getCognitoId = /* GraphQL */ `query GetCognitoId {
  getCognitoId {
    userId
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetCognitoIdQueryVariables,
  APITypes.GetCognitoIdQuery
>;
export const getEmailFromId = /* GraphQL */ `query GetEmailFromId($idResponse: String!) {
  getEmailFromId(idResponse: $idResponse) {
    userEmail
    __typename
  }
}
` as GeneratedQuery<
  APITypes.GetEmailFromIdQueryVariables,
  APITypes.GetEmailFromIdQuery
>;
