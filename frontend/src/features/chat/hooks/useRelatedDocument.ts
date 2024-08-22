import useChatApi from "./useChatApi";
import { UsedChunkWithLink, UsedChunk } from "@/types/chat";

const useRelatedDocument = () => {
  const chatApi = useChatApi();

  // const extractBucketAndKey = useCallback((url: string) => {
  //   const s3Pattern = /^s3:\/\/([^\/]+)\/([^\/]+)\/(.+)$/;
  //   const match = url.match(s3Pattern);
  //   if (match && match.length === 4) {
  //     return {
  //       bucketName: match[1],
  //       meetingId: match[2],
  //       fileName: match[3],
  //     };
  //   }
  //   return { bucketName: "", meetingId: "", fileName: "" };
  // }, []);

  // const getRelatedDocumentsWithLinks = useCallback(
  //   (relatedDocuments?: UsedChunk[]) => {
  //     const relatedDocumentsWithLinks: UsedChunkWithLink[] = [];

  //     if (relatedDocuments) {
  //       relatedDocuments.forEach((doc) => {
  //         const { bucketName, meetingId, fileName } = extractBucketAndKey(
  //           doc.source
  //         );
  //         const { data } = chatApi.getReferenceDocumentUrl(
  //           bucketName,
  //           meetingId,
  //           fileName
  //         );
  //         if (data) {
  //           relatedDocumentsWithLinks.push({
  //             ...doc,
  //             link: data,
  //           });
  //         }
  //       });
  //     }

  //     return relatedDocumentsWithLinks;
  //   },
  //   [chatApi, extractBucketAndKey]
  // );

  const extractBucketAndKey = (url: string) => {
    const s3Pattern = /^s3:\/\/([^\/]+)\/([^\/]+)\/(.+)$/;
    const match = url.match(s3Pattern);
    if (match && match.length === 4) {
      return {
        bucketName: match[1],
        meetingId: match[2],
        fileName: match[3],
      };
    }
    return { bucketName: "", meetingId: "", fileName: "" };
  };

  const getRelatedDocumentsWithLinks = (relatedDocuments?: UsedChunk[]) => {
    const relatedDocumentsWithLinks: UsedChunkWithLink[] = [];

    if (relatedDocuments) {
      relatedDocuments.forEach((doc) => {
        const { bucketName, meetingId, fileName } = extractBucketAndKey(
          doc.source
        );
        const { data } = chatApi.getReferenceDocumentUrl(
          bucketName,
          meetingId,
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
  };
  return {
    extractBucketAndKey,
    getRelatedDocumentsWithLinks,
  };
};

export default useRelatedDocument;
