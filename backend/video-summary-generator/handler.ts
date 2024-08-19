import { prepareInput } from "./prepareInput";
import { formatTranscription } from "./formatTranscription";
import { invokeBedrockModel } from "./invokeBedrockModel";
import { startKnowledgeBaseSync } from "./startKnowledgeBaseSync";

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
    case "startKnowledgeBaseSync":
      return await startKnowledgeBaseSync(event);
    default:
      throw new Error("Invalid event type");
  }
};
