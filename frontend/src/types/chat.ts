export type Role = "assistant" | "user";
export type Model =
  | "anthropic.claude-3-sonnet-20240229-v1:0"
  | "anthropic.claude-3-5-haiku-20241022-v1:0"
  | "anthropic.claude-3-5-sonnet-20241022-v2:0"
  | "us.anthropic.claude-3-7-sonnet-20250219-v1:0"
  | "us.anthropic.claude-haiku-4-5-20251001-v1:0"
  | "us.anthropic.claude-sonnet-4-5-20250929-v1:0";

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

export type UsedChunkWithLink = UsedChunk & {
  link?: string;
  videoLink?: string;
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
