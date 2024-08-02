import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { VideoCall } from "./constructs/video-call";
import { Auth } from "./constructs/auth";

export class KnowledgeTransferStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const auth = new Auth(this, "Auth");
    new VideoCall(this, "VideoCall", {
      auth,
    });
  }
}
