import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { Meeting } from "../@types";

const MEETING_TABLE_NAME = process.env.MEETING_TABLE_NAME || "meeting_table";

const dynamoDb = new DynamoDBClient({});
const dynamoDbDocument = DynamoDBDocumentClient.from(dynamoDb);

export const storeMeeting = async (meeting: Meeting) => {
  await dynamoDbDocument.send(
    new PutCommand({
      TableName: MEETING_TABLE_NAME,
      Item: meeting,
    })
  );
  return meeting;
};

export const findAllMeetings = async (): Promise<Meeting[]> => {
  const res = await dynamoDbDocument.send(
    new ScanCommand({
      TableName: MEETING_TABLE_NAME,
    })
  );

  return res.Items ? res.Items.map((item) => unmarshall(item) as Meeting) : [];
};

export const findMeetingById = async (meetingId: string): Promise<Meeting> => {
  const res = await dynamoDbDocument.send(
    new QueryCommand({
      TableName: MEETING_TABLE_NAME,
      KeyConditionExpression: "#id = :id",
      ExpressionAttributeNames: {
        "#id": "id",
      },
      ExpressionAttributeValues: {
        ":id": meetingId,
      },
      ScanIndexForward: false,
    })
  );

  if (!res.Items || res.Items.length === 0) {
    throw new Error(`Meeting with id ${meetingId} not found`);
  }

  return res.Items[0] as Meeting;
};

export const updateMeeting = async (
  meetingId: string,
  updatedFields: Partial<Meeting>
): Promise<void> => {
  const updateExpressions: string[] = [];
  const expressionAttributeValues: { [key: string]: any } = {};
  const expressionAttributeNames: { [key: string]: string } = {};

  Object.entries(updatedFields).forEach(([key, value]) => {
    updateExpressions.push(`#${key} = :${key}`);
    expressionAttributeValues[`:${key}`] = value;
    expressionAttributeNames[`#${key}`] = key;
  });

  await dynamoDbDocument.send(
    new UpdateCommand({
      TableName: MEETING_TABLE_NAME,
      Key: { id: meetingId },
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    })
  );
};

export const removeMeeting = async (meetingId: string): Promise<void> => {
  await dynamoDbDocument.send(
    new DeleteCommand({
      TableName: MEETING_TABLE_NAME,
      Key: { id: meetingId },
    })
  );
};
