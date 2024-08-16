import { useCallback, useEffect, useMemo } from "react";
import useChatApi from "./useChatApi";
import { produce } from "immer";
import {
  MessageContent,
  PostMessageRequest,
  RelatedDocument,
} from "@/types/chat";
import { create } from "zustand";
import { useChatStream } from "./useChatStream";
import useModel from "./useModel";

const useChatState = create<{
  postingMessage: boolean;
  setPostingMessage: (b: boolean) => void;
  messages: MessageContent[];
  setMessages: (messages: MessageContent[]) => void;
  pushMessage: (message: MessageContent) => void;
  editLastMessage: (content: string) => void;
  removeLastMessage: () => void;
  relatedDocuments: { [index: number]: RelatedDocument[] };
  setRelatedDocuments: (
    messageIndex: number,
    documents: RelatedDocument[]
  ) => void;
}>((set) => ({
  postingMessage: false,
  setPostingMessage: (b) => set({ postingMessage: b }),
  messages: [],
  setMessages: (messages) => set({ messages }),
  pushMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  editLastMessage: (content) =>
    set((state) => ({
      messages: produce(state.messages, (draft) => {
        if (draft.length > 0) {
          draft[draft.length - 1].content[0].body = content;
        }
      }),
    })),
  removeLastMessage: () =>
    set((state) => ({
      messages: state.messages.slice(0, -1),
    })),
  relatedDocuments: {},
  setRelatedDocuments: (messageIndex, documents) =>
    set((state) => ({
      relatedDocuments: produce(state.relatedDocuments, (draft) => {
        draft[messageIndex] = documents;
      }),
    })),
}));

const useChat = (alertId: string) => {
  const {
    postingMessage,
    setPostingMessage,
    setMessages,
    pushMessage,
    editLastMessage,
    removeLastMessage,
    messages,
    relatedDocuments,
    // setRelatedDocuments,
  } = useChatState();

  const { streamMessage, responses, error } = useChatStream();
  const { modelId, setModelId } = useModel();

  const chatApi = useChatApi();
  const {
    data,
    mutate,
    error: conversationError,
  } = chatApi.getConversation(alertId);

  useEffect(() => {
    if (data && data.messages.length > 0) {
      setMessages(data.messages);
      if (modelId === null) {
        setModelId(data.messages[0].model);
      }
    }
  }, [data, setMessages, modelId, setModelId]);

  const postChat = useCallback(
    (params: { content: string }) => {
      const { content } = params;
      const messageContent: MessageContent = {
        role: "user",
        content: [{ body: content, contentType: "text" }],
        model: modelId,
        usedChunks: [],
      };

      setPostingMessage(true);
      pushMessage(messageContent);

      const input: PostMessageRequest = {
        alertId,
        message: messageContent,
      };

      streamMessage(input, (response) => {
        editLastMessage(response); // Handle each response directly
      });

      if (error) {
        console.error(error);
        removeLastMessage();
      }

      setPostingMessage(false);
      mutate();
    },
    [
      alertId,
      setPostingMessage,
      pushMessage,
      streamMessage,
      editLastMessage,
      removeLastMessage,
      mutate,
      modelId,
      error,
    ]
  );

  const retryPostChat = useCallback(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      removeLastMessage();
      postChat({ content: lastMessage.content[0].body });
    }
  }, [messages, removeLastMessage, postChat]);

  const hasError = useMemo(() => {
    return messages.length > 0 && messages[messages.length - 1].role === "user";
  }, [messages]);

  return {
    conversationError,
    postingMessage,
    postChat,
    messages,
    hasError,
    retryPostChat,
    getPostedModel: () => modelId,
    getRelatedDocuments: (messageIndex: number) =>
      relatedDocuments[messageIndex] ?? [],
  };
};

export default useChat;
