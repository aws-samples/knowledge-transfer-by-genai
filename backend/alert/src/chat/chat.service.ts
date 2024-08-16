import { Injectable } from "@nestjs/common";
import {
  PostMessageRequest,
  Conversation,
  MessageContent,
} from "@industrial-knowledge-transfer-by-genai/common";
import { ChatRepository } from "@industrial-knowledge-transfer-by-genai/common";
import {
  BedrockRuntimeClient,
  ConverseStreamCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { Observable, Subject } from "rxjs";

const INFERENCE_CONFIG = {
  maxTokens: 512,
  temperature: 0.5,
  topP: 0.9,
};

@Injectable()
export class ChatService {
  private bedrockClient: BedrockRuntimeClient;

  constructor(private readonly chatRepository: ChatRepository) {
    this.bedrockClient = new BedrockRuntimeClient({ region: "us-east-1" });
  }

  handleMessage(
    postMessageRequest: PostMessageRequest
  ): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>();
    let accumulatedResponse = "";

    this.chatRepository
      .findOrCreateConversation(postMessageRequest.alertId)
      .then((conversation) => {
        // Add the new message to the conversation
        conversation.messages.push(postMessageRequest.message);

        // Prepare the ConverseStreamCommand
        const command = new ConverseStreamCommand({
          modelId: postMessageRequest.message.model,
          messages: conversation.messages.map((msg) => ({
            role: msg.role,
            content: msg.content.map((content) => ({
              text: content.body,
            })),
          })),
          inferenceConfig: INFERENCE_CONFIG,
        });

        // Send the command to the model and process the response
        this.bedrockClient
          .send(command)
          .then(async (response) => {
            for await (const item of response.stream) {
              if (item.contentBlockDelta) {
                const text = item.contentBlockDelta.delta?.text;
                if (text) {
                  accumulatedResponse += text;
                  const messageEvent = new MessageEvent("message", {
                    data: `data: ${text}\n\n`,
                  });
                  subject.next(messageEvent);
                }
              }
            }
            subject.complete();

            // Append the concatenated response as a new message in the conversation
            const newMessage: MessageContent = {
              role: "assistant",
              content: [{ contentType: "text", body: accumulatedResponse }],
              model: postMessageRequest.message.model,
              usedChunks: [
                {
                  content: "ほげほげ",
                  contentType: "s3",
                  source: "https://example.com",
                  rank: 1,
                },
              ], // TODO. Retrieve from KnowledgeBase
            };
            conversation.messages.push(newMessage);

            // Store the updated conversation
            await this.chatRepository.storeConversation(
              postMessageRequest.alertId,
              conversation
            );
          })
          .catch((err) => {
            subject.error(`ERROR: Can't invoke model. Reason: ${err}`);
          });
      });

    return subject.asObservable();
  }

  async getConversationByAlertId(alertId: string): Promise<Conversation> {
    return this.chatRepository.findConversationByAlertId(alertId);
  }
}
