import ReactPlayer from "react-player";

function Chat() {
  // return <div>Chat</div>;
  return (
    <div className="App">
      <ReactPlayer
        // url="https://d17ginzs61aytk.cloudfront.net/video/68f41b28-2cc9-4edb-a1d5-2f3f56ec2713/composited-video/81fe2d3c-668f-4e9a-a5db-d3c1003db5a7.mp4"
        url="https://d17ginzs61aytk.cloudfront.net/video/test.mp4"
        controls
        width="100%"
        height="100%"
      />
    </div>
  );
}

export default Chat;
