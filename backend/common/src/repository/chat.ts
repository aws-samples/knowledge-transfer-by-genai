import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { Conversation, Alert } from "../@types";

const ALERT_TABLE_NAME = process.env.ALERT_TABLE_NAME || "alert_table";

const dynamoDb = new DynamoDBClient({});
const dynamoDbDocument = DynamoDBDocumentClient.from(dynamoDb);

export class ChatRepository {
  async findOrCreateConversation(alertId: string): Promise<Conversation> {
    const res = await dynamoDbDocument.send(
      new QueryCommand({
        TableName: ALERT_TABLE_NAME,
        KeyConditionExpression: "id = :alertId",
        ExpressionAttributeValues: {
          ":alertId": alertId,
        },
      })
    );

    if (res.Items && res.Items.length > 0) {
      console.log(
        `Conversation found. Number of messages: ${
          (res.Items[0] as Alert).conversation.messages.length
        }`
      );
      const alert = res.Items[0] as Alert;
      return alert.conversation;
    }

    throw new Error(`Conversation with alertId ${alertId} not found`);
  }

  async storeConversation(
    alertId: string,
    conversation: Conversation
  ): Promise<void> {
    console.log(`Storing conversation with alertId ${alertId}`);
    await dynamoDbDocument.send(
      new UpdateCommand({
        TableName: ALERT_TABLE_NAME,
        Key: { id: alertId },
        UpdateExpression: "SET conversation = :conversation",
        ExpressionAttributeValues: {
          ":conversation": conversation,
        },
        ConditionExpression: "attribute_exists(id)",
      })
    );
  }

  async findConversationByAlertId(alertId: string): Promise<Conversation> {
    console.log(`Finding conversation with alertId ${alertId}`);
    const res = await dynamoDbDocument.send(
      new QueryCommand({
        TableName: ALERT_TABLE_NAME,
        KeyConditionExpression: "id = :alertId",
        ExpressionAttributeValues: {
          ":alertId": alertId,
        },
      })
    );

    if (!res.Items || res.Items.length === 0) {
      throw new Error(`Conversation with alertId ${alertId} not found`);
    }

    const alert = res.Items[0] as Alert;
    return alert.conversation;
  }
}
