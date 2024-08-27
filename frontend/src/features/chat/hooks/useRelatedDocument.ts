import useChatApi from "./useChatApi";
import { UsedChunkWithLink, UsedChunk } from "@/types/chat";

const useRelatedDocument = () => {
  const chatApi = useChatApi();

  const extractMeetingId = (url: string): string | null => {
    // If the URI is meeting file, extract the meeting ID from the URI
    // e.g. s3://bucket-name/meeting-id.mp4-summary.txt
    const { key } = _extractBucketAndKey(url);
    const meetingPattern = /^([a-f0-9-]+)\/.*\.mp4-summary\.txt$/;
    const match = key.match(meetingPattern);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  };

  const _extractBucketAndKey = (url: string) => {
    const s3Pattern = /^s3:\/\/([^\/]+)\/(.+)$/;
    const match = url.match(s3Pattern);
    if (match && match.length === 3) {
      return {
        bucketName: match[1],
        key: match[2],
      };
    }
    return { bucketName: "", key: "" };
  };

  const getRelatedDocumentsWithLinks = (relatedDocuments?: UsedChunk[]) => {
    const relatedDocumentsWithLinks: UsedChunkWithLink[] = [];

    if (relatedDocuments) {
      relatedDocuments.forEach((doc) => {
        const { bucketName, key } = _extractBucketAndKey(doc.source);
        const encodedKey = encodeURIComponent(key);
        const { data } = chatApi.getReferenceDocumentUrl(
          bucketName,
          encodedKey
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
    extractMeetingId,
    getRelatedDocumentsWithLinks,
  };
};

export default useRelatedDocument;
