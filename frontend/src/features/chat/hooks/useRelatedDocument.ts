import { useCallback } from "react";
import useChatApi from "./useChatApi";
import { UsedChunkWithLink, UsedChunk } from "@/types/chat";

const useRelatedDocument = () => {
  const chatApi = useChatApi();

  const _extractBucketAndKey = (url: string) => {
    const s3Pattern = /^s3:\/\/([^\/]+)\/([^\/]+)\/(.+)$/;
    const match = url.match(s3Pattern);
    if (match && match.length === 4) {
      return {
        bucketName: match[1],
        mediaPipelineId: match[2],
        fileName: match[3],
      };
    }
    return { bucketName: "", mediaPipelineId: "", fileName: "" };
  };

  const getRelatedDocumentsWithLinks = useCallback(
    (relatedDocuments?: UsedChunk[]) => {
      const relatedDocumentsWithLinks: UsedChunkWithLink[] = [];

      if (relatedDocuments) {
        relatedDocuments.forEach((doc) => {
          const { bucketName, mediaPipelineId, fileName } =
            _extractBucketAndKey(doc.source);
          const { data } = chatApi.getReferenceDocumentUrl(
            bucketName,
            mediaPipelineId,
            fileName
          );
          if (data) {
            relatedDocumentsWithLinks.push({
              ...doc,
              link: data,
            });
          }
        });
      }

      return relatedDocumentsWithLinks;
    },
    [chatApi]
  );

  return {
    getRelatedDocumentsWithLinks,
  };
};

export default useRelatedDocument;
