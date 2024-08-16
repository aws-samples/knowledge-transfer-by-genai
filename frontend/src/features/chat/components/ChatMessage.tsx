import React, { useMemo } from "react";
import ChatMessageMarkdown from "./ChatMessageMarkdown";
import { PiUserFill } from "react-icons/pi";
import { MessageContent, RelatedDocument } from "@/types/chat";

type Props = {
  chatContent?: MessageContent;
  relatedDocuments?: RelatedDocument[];
};

const ChatMessage: React.FC<Props> = (props) => {
  const relatedDocuments = useMemo<RelatedDocument[] | undefined>(
    () => props.relatedDocuments,
    [props]
  );

  const chatContent = useMemo<MessageContent | undefined>(() => {
    return props.chatContent;
  }, [props]);

  return (
    <div className={`grid grid-cols-12 gap-2 p-3`}>
      <div className="order-first col-span-12 flex lg:order-none lg:col-span-8 lg:col-start-3">
        {chatContent?.role === "user" && (
          <div className="h-min rounded-full bg-avatar p-2 text-xl text-avatar-foreground">
            <PiUserFill />
          </div>
        )}
        {chatContent?.role === "assistant" && (
          <div className="min-w-[2.3rem] max-w-[2.3rem]">
            <img src="/images/bedrock_icon_64.png" className="rounded" />
          </div>
        )}

        <div className="ml-5 grow">
          {chatContent?.role === "user" && (
            <div>
              {chatContent.content.map((content, idx) => (
                <div key={idx}>
                  {content.body.split("\n").map((c, idxBody) => (
                    <div key={idxBody}>{c}</div>
                  ))}
                </div>
              ))}
            </div>
          )}
          {chatContent?.role === "assistant" && (
            <ChatMessageMarkdown
              relatedDocuments={relatedDocuments}
              // messageId={chatContent.id}
              // TODO
              messageId="dummy"
            >
              {chatContent.content[0].body}
            </ChatMessageMarkdown>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
