import React, { useMemo } from "react";
import ChatMessageMarkdown from "./ChatMessageMarkdown";
import { PiUserFill } from "react-icons/pi";
import { MessageContent, UsedChunk, UsedChunkWithLink } from "@/types/chat";
import useChatApi from "@/features/chat/hooks/useChatApi";
import useRelatedDocument from "../hooks/useRelatedDocument";

type Props = {
  alertId: string;
  messageIdx: number;
  chatContent?: MessageContent;
  relatedDocuments?: UsedChunk[];
};

const ChatMessage: React.FC<Props> = (props) => {
  // const chatApi = useChatApi();

  // const extractBucketAndKey = (url: string) => {
  //   const s3Pattern = /^s3:\/\/([^\/]+)\/([^\/]+)\/(.+)$/;
  //   const match = url.match(s3Pattern);
  //   if (match && match.length === 4) {
  //     return {
  //       bucketName: match[1],
  //       mediaPipelineId: match[2],
  //       fileName: match[3],
  //     };
  //   }
  //   return { bucketName: "", mediaPipelineId: "", fileName: "" };
  // };

  // const relatedDocumentsWithLinks: UsedChunkWithLink[] = [];

  // if (props.relatedDocuments) {
  //   props.relatedDocuments.map((doc) => {
  //     const { bucketName, mediaPipelineId, fileName } = extractBucketAndKey(
  //       doc.source
  //     );
  //     const { data } = chatApi.getReferenceDocumentUrl(
  //       bucketName,
  //       mediaPipelineId,
  //       fileName
  //     );
  //     if (data) {
  //       relatedDocumentsWithLinks.push({
  //         ...doc,
  //         link: data,
  //         // meetingId: mediaPipelineId,
  //       });
  //     }
  //   });
  // }

  const { getRelatedDocumentsWithLinks } = useRelatedDocument();

  const relatedDocumentsWithLinks = useMemo(
    () => getRelatedDocumentsWithLinks(props.relatedDocuments),
    [getRelatedDocumentsWithLinks, props.relatedDocuments]
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
              alertId={props.alertId}
              relatedDocuments={relatedDocumentsWithLinks}
              messageIdx={props.messageIdx}
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
