import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

const s3Client = new S3Client({});

export const formatTranscription = async (event) => {
  let result: any = { status: "FAILED" };
  let lines: string[] = [];
  let line = "";
  let speaker = "spk_1";
  let mostRecentSpeaker = "spk_1";

  const transcriptUri =
    event.TranscriptionJob.TranscriptionJob.Transcript.TranscriptFileUri;

  // Get transcription URI from the event
  // The transcript URI will look something like this:
  // https://s3.ap-northeast-1.amazonaws.com/xxxx/yyyy.mp4.json
  const bucketName = transcriptUri.split("/")[3];
  const meetingId = transcriptUri.split("/")[4];
  const fileName = transcriptUri.split("/")[5];
  const keyName = `${meetingId}/${fileName}`;

  console.debug(`bucketName: ${bucketName}`);
  console.debug(`meetingId: ${meetingId}`);
  console.debug(`fileName: ${fileName}`);
  console.debug(`key: ${keyName}`);

  try {
    // Download the file from S3.
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: keyName,
    });
    const fileObject = await s3Client.send(getObjectCommand);
    const data = JSON.parse(await fileObject.Body!.transformToString());

    console.debug(`data: ${JSON.stringify(data)}`);

    let speakerLabels;
    try {
      speakerLabels = data.results.speaker_labels;
      console.debug(`speakerLabels: ${JSON.stringify(speakerLabels)}`);
    } catch (error) {
      console.error(
        "Speaker labels are off in processing; shouldn't happen given TranscribeJob setting above but catch in case."
      );
      return;
    }

    // Loop through the speakers and add them to the transcription.
    const items = data.results.items;
    for (const item of items) {
      if (item.start_time) {
        // This is a spoken item
        speaker = item.speaker_label;

        if (speaker === mostRecentSpeaker) {
          // Append the content to line and repeat
          line += ` ${item.alternatives[0].content}`;
        } else {
          // New speaker
          lines.push(`${line}\n\n`);
          mostRecentSpeaker = speaker;
          line = `${item.start_time} ${speaker} ${item.alternatives[0].content}`;
        }
      } else if (item.type === "punctuation") {
        line += item.alternatives[0].content;
      }
    }

    lines.push(line);

    console.debug(`lines: ${JSON.stringify(lines)}`);

    const speakerFormattedContent = lines.join("");
    const speakerTranscriptionKeyName = `${meetingId}/${event.Source.Payload.SourceFileName}-speaker-transcription.txt`;

    // Save the response value in S3.
    const putObjectCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: speakerTranscriptionKeyName,
      Body: speakerFormattedContent,
      ContentType: "text/plain",
    });
    console.debug(`putObjectCommand: ${JSON.stringify(putObjectCommand)}`);
    const response = await s3Client.send(putObjectCommand);
    console.debug(`response: ${JSON.stringify(response)}`);

    result = {
      bucketName: bucketName,
      speakerTranscriptionKeyName: speakerTranscriptionKeyName,
    };
  } catch (e) {
    console.error(e);
    throw e;
  }

  return result;
};
