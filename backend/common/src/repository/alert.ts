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

import { Status, Severity, Alert } from "../@types";

const ALERT_TABLE_NAME = process.env.ALERT_TABLE_NAME || "alert_table";

const dynamoDb = new DynamoDBClient({});
const dynamoDbDocument = DynamoDBDocumentClient.from(dynamoDb);

export const getTableName = () => {
  //debug
  return ALERT_TABLE_NAME;
};

export const storeAlert = async (alert: Alert) => {
  await dynamoDbDocument.send(
    new PutCommand({
      TableName: ALERT_TABLE_NAME,
      Item: alert,
    })
  );
  return alert;
};

export const findAllAlerts = async (): Promise<Alert[]> => {
  const res = await dynamoDbDocument.send(
    new ScanCommand({
      TableName: ALERT_TABLE_NAME,
    })
  );

  return res.Items ? res.Items.map((item) => unmarshall(item) as Alert) : [];
};

export const findAlertById = async (alertId: string): Promise<Alert> => {
  const res = await dynamoDbDocument.send(
    new QueryCommand({
      TableName: ALERT_TABLE_NAME,
      KeyConditionExpression: "#id = :id",
      ExpressionAttributeNames: {
        "#id": "id",
      },
      ExpressionAttributeValues: {
        ":id": alertId,
      },
      ScanIndexForward: false,
    })
  );

  if (!res.Items || res.Items.length === 0) {
    throw new Error(`Alert with id ${alertId} not found`);
  }

  return res.Items[0] as Alert;
};

export const updateAlertStatus = async (
  alertId: string,
  status: Status
): Promise<void> => {
  await dynamoDbDocument.send(
    new UpdateCommand({
      TableName: ALERT_TABLE_NAME,
      Key: { id: alertId },
      UpdateExpression: "SET #status = :status",
      ExpressionAttributeNames: {
        "#status": "status",
      },
      ExpressionAttributeValues: {
        ":status": status,
      },
    })
  );
};

export const appendMeetingToAlert = async (
  alertId: string,
  meetingId: string
): Promise<void> => {
  const meetingSet = new Set([meetingId]);

  await dynamoDbDocument.send(
    new UpdateCommand({
      TableName: ALERT_TABLE_NAME,
      Key: { id: alertId },
      UpdateExpression: "ADD #meetings :meeting",
      ExpressionAttributeNames: {
        "#meetings": "meetings",
      },
      ExpressionAttributeValues: {
        ":meeting": meetingSet,
      },
    })
  );
};

// export const updateAlert = async (
//   alertId: string,
//   updatedFields: Partial<Alert>
// ): Promise<void> => {
//   const updateExpressions: string[] = [];
//   const expressionAttributeValues: { [key: string]: any } = {};

//   Object.entries(updatedFields).forEach(([key, value]) => {
//     updateExpressions.push(`#${key} = :${key}`);
//     expressionAttributeValues[`:${key}`] = value;
//   });

//   await dynamoDbDocument.send(
//     new UpdateCommand({
//       TableName: ALERT_TABLE_NAME,
//       Key: { id: alertId },
//       UpdateExpression: `SET ${updateExpressions.join(", ")}`,
//       ExpressionAttributeNames: updatedFields,
//       ExpressionAttributeValues: expressionAttributeValues,
//       ReturnValues: "ALL_NEW",
//     })
//   );
// };

export const removeAlert = async (alertId: string): Promise<void> => {
  await dynamoDbDocument.send(
    new DeleteCommand({
      TableName: ALERT_TABLE_NAME,
      Key: { id: alertId },
    })
  );
};
