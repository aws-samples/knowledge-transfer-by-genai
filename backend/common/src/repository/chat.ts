import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { Conversation } from "../@types";

const CHAT_TABLE_NAME = process.env.CHAT_TABLE_NAME || "chat_table";

const dynamoDb = new DynamoDBClient({});
const dynamoDbDocument = DynamoDBDocumentClient.from(dynamoDb);

export class ChatRepository {
  async findOrCreateConversation(alertId: string): Promise<Conversation> {
    const res = await dynamoDbDocument.send(
      new QueryCommand({
        TableName: CHAT_TABLE_NAME,
        IndexName: "AlertIndex",
        KeyConditionExpression: "alertId = :alertId",
        ExpressionAttributeValues: {
          ":alertId": alertId,
        },
      })
    );

    if (res.Items && res.Items.length > 0) {
      return res.Items[0] as Conversation;
    }

    // Create a new conversation if not found
    return {
      id: uuidv4(),
      alertId,
      messages: [],
    };
  }

  async storeConversation(conversation: Conversation): Promise<void> {
    await dynamoDbDocument.send(
      new PutCommand({
        TableName: CHAT_TABLE_NAME,
        Item: conversation,
      })
    );
  }

  async findConversationByAlertId(alertId: string): Promise<Conversation> {
    const res = await dynamoDbDocument.send(
      new QueryCommand({
        TableName: CHAT_TABLE_NAME,
        IndexName: "AlertIndex",
        KeyConditionExpression: "alertId = :alertId",
        ExpressionAttributeValues: {
          ":alertId": alertId,
        },
      })
    );

    if (!res.Items || res.Items.length === 0) {
      throw new Error(`Conversation with alertId ${alertId} not found`);
    }

    return res.Items[0] as Conversation;
  }
}
