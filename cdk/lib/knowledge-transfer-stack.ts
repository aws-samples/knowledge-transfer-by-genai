import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { VideoCall } from "./constructs/video-call";
import { Auth } from "./constructs/auth";
import { Api } from "./constructs/api";
import { Database } from "./constructs/database";
import { VideoSummaryGenerator } from "./constructs/video-summary-generator";
import { S3Buckets } from "./constructs/s3buckets";
import { Knowledge } from "./constructs/knowledge";
import { CloudFrontGateway } from "./constructs/cloudfront-gateway";
import { UsEast1Stack } from "./us-east-1-stack";
import { FunctionUrlAuthType, InvokeMode } from "aws-cdk-lib/aws-lambda";

export type BedrockModelId =
  | "anthropic.claude-v2:1"
  | "anthropic.claude-instant-v1"
  | "anthropic.claude-3-sonnet-20240229-v1:0"
  | "anthropic.claude-3-haiku-20240307-v1:0"
  | "anthropic.claude-3-opus-20240229-v1:0"
  | "anthropic.claude-3-5-sonnet-20240620-v1:0";

interface KnowledgeTransferStackProps extends cdk.StackProps {
  usEast1Stack: UsEast1Stack;
  readonly bedrockRegion?: string;
}

export class KnowledgeTransferStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: KnowledgeTransferStackProps
  ) {
    super(scope, id, props);

    const bedrockRegion = props.bedrockRegion ?? "us-west-2";

    const auth = new Auth(this, "Auth");
    const database = new Database(this, "Database");
    const buckets = new S3Buckets(this, "S3Buckets");

    // Video Call using Chime
    const videoCall = new VideoCall(this, "VideoCall", {
      auth,
      recordingBucket: buckets.recordingBucket,
      concatenatedBucket: buckets.concatenatedBucket,
      database,
    });

    // Knowledge Base
    const knowledge = new Knowledge(this, "Knowledge", {
      knowledgeBucket: buckets.knowledgeBucket,
    });

    // Alert / Video management Api
    const api = new Api(this, "Api", {
      auth,
      database,
      knowledge,
      buckets,
      bedrockRegion,
    });

    // Video summarizer
    const videoSummaryGenerator = new VideoSummaryGenerator(
      this,
      "VideoSummaryGenerator",
      {
        concatenatedBucket: buckets.concatenatedBucket,
        knowledgeBucket: buckets.knowledgeBucket,
        transcriptionBucket: buckets.transcriptionBucket,
        database,
        knowledge,
        bedrockRegion,
        // Model to summarize video
        bedrockModelId: "anthropic.claude-3-opus-20240229-v1:0",
      }
    );

    const cfgw = new CloudFrontGateway(this, "CloudFrontGateway", {
      webAclId: props.usEast1Stack.webAclArn.value,
      videoBucket: buckets.concatenatedBucket,
      accessLogBucket: buckets.accessLogBucket,
      usEast1Stack: props.usEast1Stack,
      enableIpV6: true,
    });
    // Associate lambda with cloudfront
    cfgw.addLambda(
      api.handler,
      api.handler.addFunctionUrl({
        authType: FunctionUrlAuthType.AWS_IAM,
        invokeMode: InvokeMode.RESPONSE_STREAM,
      }),
      "/api/*",
      auth
    );

    cfgw.buildViteApp({
      apiEndpoint: `${cfgw.getOrigin()}/api`,
      videoCallEndpoint: videoCall.api.graphqlUrl,
      auth,
    });

    new cdk.CfnOutput(this, "DistributionUrl", {
      value: cfgw.getOrigin(),
    });
  }
}
