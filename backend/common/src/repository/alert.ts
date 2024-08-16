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

export const storeAlert = async (alert: Alert) => {
  console.log(`Storing alert ${JSON.stringify(alert)}`);
  await dynamoDbDocument.send(
    new PutCommand({
      TableName: ALERT_TABLE_NAME,
      Item: alert,
    })
  );
  return alert;
};

export const findAllAlerts = async (): Promise<Alert[]> => {
  console.log("Finding all alerts");
  const res = await dynamoDbDocument.send(
    new ScanCommand({
      TableName: ALERT_TABLE_NAME,
    })
  );

  return res.Items ? res.Items.map((item) => unmarshall(item) as Alert) : [];
};

export const findAlertById = async (alertId: string): Promise<Alert> => {
  console.log(`Finding alert with id ${alertId}`);
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
  console.log(`Updating alert ${alertId} status to ${status}`);
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

export const closeWithComment = async (
  alertId: string,
  comment: string
): Promise<void> => {
  console.log(`Closing alert ${alertId} with comment: ${comment}`);

  await dynamoDbDocument.send(
    new UpdateCommand({
      TableName: ALERT_TABLE_NAME,
      Key: { id: alertId },
      UpdateExpression: "SET #status = :status, #comment = :comment",
      ExpressionAttributeNames: {
        "#status": "status",
        "#comment": "comment",
      },
      ExpressionAttributeValues: {
        ":status": "CLOSED",
        ":comment": comment,
      },
    })
  );
};

export const removeAlert = async (alertId: string): Promise<void> => {
  console.log(`Removing alert ${alertId}`);
  await dynamoDbDocument.send(
    new DeleteCommand({
      TableName: ALERT_TABLE_NAME,
      Key: { id: alertId },
    })
  );
};

export const removeAllAlerts = async (): Promise<void> => {
  console.log("Removing all alerts");
  const alerts = await findAllAlerts();
  const deleteRequests = alerts.map((alert) =>
    dynamoDbDocument.send(
      new DeleteCommand({
        TableName: ALERT_TABLE_NAME,
        Key: { id: alert.id },
      })
    )
  );

  await Promise.all(deleteRequests);
};
