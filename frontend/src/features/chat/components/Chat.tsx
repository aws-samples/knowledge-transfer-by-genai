import React, { useCallback, useEffect, useLayoutEffect } from "react";
import { TextInputChatContent } from "./TextInputChatContent";
import useChat from "../hooks/useChat";
import ChatMessage from "./ChatMessage";
import useScroll from "../hooks/useScroll";
import { useTranslation } from "react-i18next";
import { PiWarningCircleFill } from "react-icons/pi";
import { Button } from "@/components/ui/button";
import SwitchBedrockModel from "./SwitchBedrockModel";

const Chat: React.FC<{ alertId: string }> = (props) => {
  const { alertId } = props;
  const { t } = useTranslation();

  const {
    conversationError,
    postingMessage,
    postChat,
    messages,
    hasError,
    retryPostChat,
    getPostedModel,
  } = useChat(alertId);

  // Error Handling
  useEffect(() => {
    if (conversationError) {
      console.error(conversationError.message ?? "");
    }
  }, [conversationError]);

  const { scrollToBottom, scrollToTop } = useScroll();

  useLayoutEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    } else {
      scrollToTop();
    }
  }, [messages, scrollToBottom, scrollToTop]);

  const onSend = useCallback(
    (content: string) => {
      postChat({ content });
    },
    [postChat]
  );

  return (
    <div className="relative flex h-full flex-1 flex-col">
      <div className="flex-1 overflow-hidden">
        <div className="sticky top-0 z-10 mb-1.5 flex h-8 w-full items-center justify-between border-b border-gray bg-aws-paper p-2">
          <div className="flex w-full justify-between"></div>
          {getPostedModel() && (
            <div className="absolute right-2 top-2 text-xs text-dark-gray">
              model: {getPostedModel()}
            </div>
          )}
        </div>
        <section className="relative size-full flex-1 overflow-auto pb-9">
          <div className="h-full">
            <div
              id="messages"
              role="presentation"
              className="flex h-full flex-col overflow-auto pb-16"
            >
              {messages?.length === 0 ? (
                <div className="relative flex w-full justify-center">
                  <div className="absolute my-0">
                    <SwitchBedrockModel />
                  </div>
                  <div className="absolute mx-3 my-20 flex items-center justify-center text-4xl font-medium text-gray-400">
                    {t("app.name")}
                  </div>
                </div>
              ) : (
                <>
                  {messages?.map((message, idx) => (
                    <div
                      key={idx}
                      className={`${
                        message.role === "assistant" ? "bg-aws-squid-ink/5" : ""
                      }`}
                    >
                      <ChatMessage
                        messageIdx={idx}
                        chatContent={message}
                        relatedDocuments={message.usedChunks}
                      />
                      <div className="w-full border-b border-aws-squid-ink/10"></div>
                    </div>
                  ))}
                </>
              )}
              {hasError && (
                <div className="mb-12 mt-2 flex flex-col items-center">
                  <div className="flex items-center font-bold text-red">
                    <PiWarningCircleFill className="mr-1 text-2xl" />
                    {t("error.answerResponse")}
                  </div>

                  <Button className="mt-2 shadow" onClick={retryPostChat}>
                    {t("button.resend")}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      <div className="bottom-0 z-0 flex w-full flex-col items-center justify-center">
        <TextInputChatContent
          disabledSend={postingMessage || hasError}
          isLoading={postingMessage}
          onSend={onSend}
        />
      </div>
    </div>
  );
};

export default Chat;
