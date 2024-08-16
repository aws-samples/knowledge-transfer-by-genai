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

    // Alert Apis
    const alert = new Alert(this, "Alert", {
      auth,
      database,
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

    // Knowledge
    const knowledge = new Knowledge(this, "Knowledge", {
      knowledgeBucket: buckets.knowledgeBucket,
    });

    const cfgw = new CloudFrontGateway(this, "CloudFrontGateway", {
      webAclId: "TODO",
      videoBucket: buckets.concatenatedBucket,
      accessLogBucket: buckets.accessLogBucket,
      usEast1Stack: props.usEast1Stack,
      enableIpV6: true,
    });
    cfgw.addLambda(
      alert.handler,
      alert.handler.addFunctionUrl({
        authType: FunctionUrlAuthType.AWS_IAM,
        invokeMode: InvokeMode.RESPONSE_STREAM,
      }),
      "/api/*"
    );
    cfgw.addBucket(buckets.concatenatedBucket, "/videos/*");

    cfgw.buildViteApp({
      alertApiEndpoint: `${cfgw.getOrigin()}/api`,
      videoCallEndpoint: videoCall.api.graphqlUrl,
      auth,
    });

    // // Distribution for video delivery
    // // TODO: remove
    // {
    //   const originAccessIdentity = new cloudfront.OriginAccessIdentity(
    //     this,
    //     "OAI"
    //   );
    //   const distribution = new cloudfront.Distribution(this, "Distribution", {
    //     defaultBehavior: {
    //       origin: new cloudfrontOrigins.S3Origin(buckets.concatenatedBucket, {
    //         originAccessIdentity: originAccessIdentity,
    //       }),
    //       viewerProtocolPolicy:
    //         cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    //     },
    //   });
    //   buckets.concatenatedBucket.addToResourcePolicy(
    //     new iam.PolicyStatement({
    //       actions: ["s3:GetObject"],
    //       resources: [buckets.concatenatedBucket.arnForObjects("*")],
    //       principals: [
    //         new iam.CanonicalUserPrincipal(
    //           originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
    //         ),
    //       ],
    //     })
    //   );
    //   new cdk.CfnOutput(this, "DistributionDomainName", {
    //     value: distribution.distributionDomainName,
    //   });
    // }

    new cdk.CfnOutput(this, "DistributionUrl", {
      value: cfgw.getOrigin(),
    });

    // // Test
    // // TODO: Remove this
    // const videoConcat = new VideoConcat(this, "VideoConcat", {
    //   concatenatedBucket: buckets.concatenatedBucket,
    //   database,
    // });
  }
}
