export type Role = "assistant" | "user";
export type Model =
  | "anthropic.claude-instant-v1"
  | "anthropic.claude-v2"
  | "anthropic.claude-3-opus-20240229-v1:0"
  | "anthropic.claude-3-sonnet-20240229-v1:0"
  | "anthropic.claude-3-5-sonnet-20240620-v1:0"
  | "anthropic.claude-3-haiku-20240307-v1:0"
  | "mistral.mistral-7b-instruct-v0:2"
  | "mistral.mixtral-8x7b-instruct-v0:1"
  | "mistral.mistral-large-2402-v1:0";

export type Content = {
  contentType: "text";
  body: string;
};

export type UsedChunk = {
  content: string;
  contentType: "s3" | "url" | "youtube";
  source: string;
  rank: number;
};

export type RelatedDocument = {
  chunkBody: string;
  contentType: "s3" | "url" | "youtube";
  sourceLink: string;
  rank: number;
};

export type MessageContent = {
  role: Role;
  content: Content[];
  model: Model;
  usedChunks: UsedChunk[];
};

export type PostMessageRequest = {
  alertId: string;
  message: MessageContent;
};

export type Conversation = {
  messages: MessageContent[];
};
