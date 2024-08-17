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
import {
  BedrockAgentRuntimeClient,
  RetrieveCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";

import { Observable, Subject } from "rxjs";
import { buildSystemPrompt } from "./prompt";

const { KNOWLEDGE_BASE_ID, BEDROCK_REGION, BEDROCK_AGENT_REGION } = process.env;

const INFERENCE_CONFIG = {
  maxTokens: 512,
  temperature: 0.5,
  topP: 0.9,
};

@Injectable()
export class ChatService {
  private bedrockClient: BedrockRuntimeClient;
  private bedrockAgentClient: BedrockAgentRuntimeClient;

  constructor(private readonly chatRepository: ChatRepository) {
    this.bedrockClient = new BedrockRuntimeClient({ region: BEDROCK_REGION });
    this.bedrockAgentClient = new BedrockAgentRuntimeClient({
      region: BEDROCK_AGENT_REGION,
    });
  }

  handleMessage(
    postMessageRequest: PostMessageRequest
  ): Observable<MessageEvent> {
    const subject = new Subject<MessageEvent>();
    let accumulatedResponse = "";

    this.chatRepository
      .findOrCreateConversation(postMessageRequest.alertId)
      .then((conversation) => {
        conversation.messages.push(postMessageRequest.message);

        const retrieveCommand = new RetrieveCommand({
          retrievalQuery: {
            text: postMessageRequest.message.content[0].body,
          },
          knowledgeBaseId: KNOWLEDGE_BASE_ID,
        });

        return this.bedrockAgentClient
          .send(retrieveCommand)
          .then((retrieveResponse) => {
            const relatedDocuments = retrieveResponse.retrievalResults;

            const command = new ConverseStreamCommand({
              modelId: postMessageRequest.message.model,
              messages: conversation.messages.map((msg) => ({
                role: msg.role,
                content: msg.content.map((content) => ({
                  text: content.body,
                })),
              })),
              inferenceConfig: INFERENCE_CONFIG,
              system: [
                {
                  text: buildSystemPrompt(relatedDocuments),
                },
              ],
            });

            return this.bedrockClient.send(command).then(async (response) => {
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

              const newMessage: MessageContent = {
                role: "assistant",
                content: [{ contentType: "text", body: accumulatedResponse }],
                model: postMessageRequest.message.model,
                usedChunks: relatedDocuments.map((doc, index) => ({
                  content: doc.content.text,
                  contentType: "s3",
                  source: doc.location.s3Location.uri,
                  rank: index + 1,
                })),
              };
              conversation.messages.push(newMessage);

              return this.chatRepository.storeConversation(
                postMessageRequest.alertId,
                conversation
              );
            });
          });
      })
      .catch((err) => {
        subject.error(`ERROR: Can't invoke model. Reason: ${err}`);
      });

    return subject.asObservable();
  }

  getConversationByAlertId(alertId: string): Promise<Conversation> {
    return this.chatRepository.findConversationByAlertId(alertId);
  }
}
