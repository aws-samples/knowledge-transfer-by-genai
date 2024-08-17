import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
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
        `Conversation found: ${JSON.stringify(res.Items[0].conversation)}`
      );
      const alert = res.Items[0] as Alert;
      return alert.conversation;
    }

    throw new Error(`Conversation with alertId ${alertId} not found`);

    // // Create a new conversation if not found
    // const newConversation: Conversation = {
    //   messages: [],
    // };

    // // Update the alert with the new conversation
    // // await this.storeConversation(alertId, newConversation);

    // return newConversation;
  }

  async storeConversation(
    alertId: string,
    conversation: Conversation
  ): Promise<void> {
    console.log(`Storing conversation: ${JSON.stringify(conversation)}`);
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