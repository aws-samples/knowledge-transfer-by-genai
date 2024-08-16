export type RelatedDocument = {
  chunkBody: string;
  contentType: "s3" | "url" | "youtube";
  sourceLink: string;
  rank: number;
};
