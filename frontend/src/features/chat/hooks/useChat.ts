import { useCallback, useEffect, useMemo } from "react";
import useConversationApi from "./useConversationApi";
import { produce } from "immer";
import {
  MessageContent,
  PostMessageRequest,
  RelatedDocument,
} from "@/types/chat";
import { create } from "zustand";
import usePostMessageStreaming from "./usePostMessageStreaming";
import { ulid } from "ulid";
import useModel from "./useModel";
import useFeedbackApi from "./useFeedbackApi";

const NEW_MESSAGE_ID = {
  ASSISTANT: "new-message-assistant",
};

const useChatState = create<{
  conversationId: string;
  setConversationId: (s: string) => void;
  postingMessage: boolean;
  setPostingMessage: (b: boolean) => void;
  chats: { [id: string]: MessageContent[] };
  relatedDocuments: { [messageId: string]: RelatedDocument[] };
  setMessages: (id: string, messages: MessageContent[]) => void;
  pushMessage: (id: string, message: MessageContent) => void;
  editMessage: (id: string, messageId: string, content: string) => void;
  removeMessage: (id: string, messageId: string) => void;
  getMessages: (id: string) => MessageContent[];
  setRelatedDocuments: (
    messageId: string,
    documents: RelatedDocument[]
  ) => void;
}>((set, get) => {
  return {
    conversationId: "",
    setConversationId: (s) => set({ conversationId: s }),
    postingMessage: false,
    setPostingMessage: (b) => set({ postingMessage: b }),
    chats: {},
    relatedDocuments: {},
    setMessages: (id, messages) =>
      set((state) => ({
        chats: produce(state.chats, (draft) => {
          draft[id] = messages;
        }),
      })),
    pushMessage: (id, message) =>
      set((state) => ({
        chats: produce(state.chats, (draft) => {
          draft[id].push(message);
        }),
      })),
    editMessage: (id, messageId, content) =>
      set((state) => ({
        chats: produce(state.chats, (draft) => {
          const message = draft[id].find((msg) => msg.id === messageId);
          if (message) {
            message.content[0].body = content;
          }
        }),
      })),
    removeMessage: (id, messageId) =>
      set((state) => ({
        chats: produce(state.chats, (draft) => {
          const index = draft[id].findIndex((msg) => msg.id === messageId);
          if (index !== -1) draft[id].splice(index, 1);
        }),
      })),
    getMessages: (id) => get().chats[id] ?? [],
    setRelatedDocuments: (messageId, documents) =>
      set((state) => ({
        relatedDocuments: produce(state.relatedDocuments, (draft) => {
          draft[messageId] = documents;
        }),
      })),
  };
});

const useChat = () => {
  const {
    conversationId,
    setConversationId,
    postingMessage,
    setPostingMessage,
    setMessages,
    pushMessage,
    editMessage,
    removeMessage,
    getMessages,
    relatedDocuments,
    setRelatedDocuments,
  } = useChatState();

  const { post: postStreaming } = usePostMessageStreaming();
  const { modelId, setModelId } = useModel();

  const conversationApi = useConversationApi();
  const feedbackApi = useFeedbackApi();
  const {
    data,
    mutate,
    error: conversationError,
  } = conversationApi.getConversation(conversationId);

  const messages = useMemo(
    () => getMessages(conversationId),
    [conversationId, getMessages]
  );

  useEffect(() => {
    if (data) {
      setMessages(conversationId, data.messages);
      setModelId(data.modelId);
    }
  }, [data, conversationId, setMessages, setModelId]);

  const postChat = useCallback(
    (params: { content: string }) => {
      const { content } = params;
      const newConversationId = conversationId || ulid();
      const messageContent: MessageContent = {
        id: ulid(),
        role: "user",
        content: [{ body: content, contentType: "text" }],
        model: modelId,
        usedChunks: [],
      };

      setPostingMessage(true);
      pushMessage(newConversationId, messageContent);

      const input: PostMessageRequest = {
        conversationId: newConversationId,
        message: messageContent,
      };

      postStreaming({
        input,
        dispatch: (c) =>
          editMessage(newConversationId, NEW_MESSAGE_ID.ASSISTANT, c),
      })
        .then(() => mutate())
        .catch((e) => {
          console.error(e);
          removeMessage(newConversationId, NEW_MESSAGE_ID.ASSISTANT);
        })
        .finally(() => {
          setPostingMessage(false);
          if (!conversationId) setConversationId(newConversationId);
        });
    },
    [
      conversationId,
      setConversationId,
      setPostingMessage,
      pushMessage,
      postStreaming,
      editMessage,
      removeMessage,
      mutate,
      modelId,
    ]
  );

  const regenerate = useCallback(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      const input: PostMessageRequest = {
        conversationId,
        message: lastMessage,
      };

      setPostingMessage(true);

      postStreaming({
        input,
        dispatch: (c) => editMessage(conversationId, lastMessage.id, c),
      })
        .then(() => mutate())
        .catch((e) => {
          console.error(e);
        })
        .finally(() => setPostingMessage(false));
    }
  }, [
    messages,
    conversationId,
    postStreaming,
    setPostingMessage,
    editMessage,
    mutate,
  ]);

  const retryPostChat = useCallback(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage) {
      removeMessage(conversationId, lastMessage.id);
      postChat({ content: lastMessage.content[0].body });
    }
  }, [messages, conversationId, removeMessage, postChat]);

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
    regenerate,
    getPostedModel: () => modelId,
    getRelatedDocuments: (messageId: string) =>
      relatedDocuments[messageId] ?? [],
  };
};

export default useChat;
