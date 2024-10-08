import { useCallback, useEffect, useMemo } from "react";
import useChatApi from "./useChatApi";
import { produce } from "immer";
import { MessageContent, PostMessageRequest } from "@/types/chat";
import { create } from "zustand";
import { useChatStream } from "./useChatStream";
import useModel from "./useModel";

const useChatState = create<{
  postingMessage: boolean;
  setPostingMessage: (b: boolean) => void;
  messages: MessageContent[];
  setMessages: (messages: MessageContent[]) => void;
  pushMessage: (message: MessageContent) => void;
  removeLastMessage: () => void;
  replaceLastMessageContent: (content: string) => void;
}>((set) => ({
  postingMessage: false,
  setPostingMessage: (b) => set({ postingMessage: b }),
  messages: [] as MessageContent[],
  setMessages: (messages: MessageContent[]) => set({ messages }),
  pushMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  removeLastMessage: () =>
    set((state) => ({
      messages: state.messages.slice(0, -1),
    })),
  replaceLastMessageContent: (content) =>
    set((state) => ({
      messages: produce(state.messages, (draft) => {
        draft[draft.length - 1].content[0].body = content;
      }),
    })),
}));

const useChat = (alertId: string) => {
  const {
    postingMessage,
    setPostingMessage,
    setMessages,
    pushMessage,
    removeLastMessage,
    replaceLastMessageContent,
    messages,
  } = useChatState();

  const { streamMessage, error } = useChatStream();
  const { modelId, setModelId } = useModel();

  const chatApi = useChatApi();
  const {
    data,
    mutate,
    error: conversationError,
  } = chatApi.getConversation(alertId);

  useEffect(() => {
    // Reset message when alertId changes
    setMessages([]);

    if (data && data.messages && data.messages.length > 0) {
      setMessages(data.messages);
      setModelId(data.messages[0].model);
    }
  }, [alertId, data, setMessages, modelId, setModelId]);

  const postChat = useCallback(
    (params: { content: string }) => {
      const { content } = params;
      const userMessage: MessageContent = {
        role: "user",
        content: [{ body: content, contentType: "text" }],
        model: modelId,
        usedChunks: [],
      };

      setPostingMessage(true);
      pushMessage(userMessage);

      const assistantMessage: MessageContent = {
        role: "assistant",
        content: [{ body: "", contentType: "text" }],
        model: modelId,
        usedChunks: [],
      };
      pushMessage(assistantMessage);

      const input: PostMessageRequest = {
        alertId,
        message: userMessage,
      };

      streamMessage(
        input,
        (response) => {
          replaceLastMessageContent(response);
        },
        () => {
          setPostingMessage(false);
          mutate();
        }
      );

      if (error) {
        console.error(error);
        removeLastMessage(); // Remove assistant message
        removeLastMessage(); // Remove user message
        setPostingMessage(false);
      }
    },
    [
      alertId,
      setPostingMessage,
      replaceLastMessageContent,
      pushMessage,
      streamMessage,
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
    return (
      messages &&
      messages.length > 0 &&
      messages[messages.length - 1]?.role === "user"
    );
  }, [messages]);

  return {
    conversationError,
    postingMessage,
    postChat,
    messages,
    hasError,
    retryPostChat,
    getPostedModel: () => modelId,
  };
};

export default useChat;
