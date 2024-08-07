import { prepareInput } from "./prepare-input";
import { formatTranscription } from "./format-transcription";
import { invokeBedrockModel } from "./invokeBedrockModel";

exports.handler = async (event: any) => {
  console.debug("Received event:", JSON.stringify(event, null, 2));
  // Switch by event type
  switch (event.jobType) {
    case "prepareInput":
      return await prepareInput(event);
    case "formatTranscription":
      return await formatTranscription(event);
    case "invokeBedrockModel":
      return await invokeBedrockModel(event);
    default:
      throw new Error("Invalid event type");
  }
};
