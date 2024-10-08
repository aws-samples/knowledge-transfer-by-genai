import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import {
  BatchWriteCommand,
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { Meeting } from "../@types";

const MEETING_TABLE_NAME = process.env.MEETING_TABLE_NAME || "meeting_table";

const dynamoDb = new DynamoDBClient({});
const dynamoDbDocument = DynamoDBDocumentClient.from(dynamoDb);

export const storeMeeting = async (meeting: Meeting) => {
  console.log(`Storing meeting ${JSON.stringify(meeting)}`);
  await dynamoDbDocument.send(
    new PutCommand({
      TableName: MEETING_TABLE_NAME,
      Item: meeting,
    })
  );
  return meeting;
};

export const findAllMeetingsByAlertId = async (
  alertId: string
): Promise<Meeting[]> => {
  console.log("Finding all meetings by alert id");

  const res = await dynamoDbDocument.send(
    new QueryCommand({
      TableName: MEETING_TABLE_NAME,
      IndexName: "AlertIndex",
      KeyConditionExpression: "#alertId = :alertId",
      ExpressionAttributeNames: {
        "#alertId": "alertId",
      },
      ExpressionAttributeValues: {
        ":alertId": alertId,
      },
    })
  );

  return (res.Items || []) as Meeting[];
};

export const findMeetingById = async (meetingId: string): Promise<Meeting> => {
  console.log(`Finding meeting with id ${meetingId}`);
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
  console.log(
    `Updating meeting ${meetingId} with ${JSON.stringify(updatedFields)}`
  );
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
  console.log(`Deleting meeting with id ${meetingId}`);
  await dynamoDbDocument.send(
    new DeleteCommand({
      TableName: MEETING_TABLE_NAME,
      Key: { id: meetingId },
    })
  );
};
