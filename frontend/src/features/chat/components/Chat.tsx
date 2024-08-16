import ChatMessageMarkdown from "./ChatMessageMarkdown";

function Chat() {
  return (
    <ChatMessageMarkdown
      relatedDocuments={[
        {
          chunkBody: "chunkBody",
          contentType: "s3",
          sourceLink: "sourceLink",
          rank: 1,
        },
      ]}
      children="children"
      messageId="messageId"
    ></ChatMessageMarkdown>
  );
}

export default Chat;
