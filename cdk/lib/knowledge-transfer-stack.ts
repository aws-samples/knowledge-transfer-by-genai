import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { VideoCall } from "./constructs/video-call";
import { Auth } from "./constructs/auth";
import { Alert } from "./constructs/alert";
import { Database } from "./constructs/database";
import { VideoSummaryGenerator } from "./constructs/video-summary-generator";
import { S3Buckets } from "./constructs/s3buckets";
import { Knowledge } from "./constructs/knowledge";
import { CloudFrontGateway } from "./constructs/cloudfront-gateway";
import { UsEast1Stack } from "./us-east-1-stack";
import { FunctionUrlAuthType, InvokeMode } from "aws-cdk-lib/aws-lambda";

interface KnowledgeTransferStackProps extends cdk.StackProps {
  usEast1Stack: UsEast1Stack;
}

export class KnowledgeTransferStack extends cdk.Stack {
  constructor(
    scope: Construct,
    id: string,
    props: KnowledgeTransferStackProps
  ) {
    super(scope, id, props);

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

    // Alert Apis
    const alert = new Alert(this, "Alert", {
      auth,
      database,
      knowledge,
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
      }
    );

    const cfgw = new CloudFrontGateway(this, "CloudFrontGateway", {
      webAclId: "TODO",
      videoBucket: buckets.concatenatedBucket,
      accessLogBucket: buckets.accessLogBucket,
      usEast1Stack: props.usEast1Stack,
      enableIpV6: true,
    });
    // Associate lambda with cloudfront
    cfgw.addLambda(
      alert.handler,
      alert.handler.addFunctionUrl({
        authType: FunctionUrlAuthType.AWS_IAM,
        invokeMode: InvokeMode.RESPONSE_STREAM,
      }),
      "/api/*"
    );
    // Associate video recording bucket with cloudfront
    cfgw.addBucket(buckets.concatenatedBucket, "/video/*");

    cfgw.buildViteApp({
      alertApiEndpoint: `${cfgw.getOrigin()}/api`,
      videoCallEndpoint: videoCall.api.graphqlUrl,
      auth,
    });

    new cdk.CfnOutput(this, "DistributionUrl", {
      value: cfgw.getOrigin(),
    });
  }
}
