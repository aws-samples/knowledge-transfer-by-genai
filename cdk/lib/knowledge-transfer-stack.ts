import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { VideoCall } from "./constructs/video-call";
import { Auth } from "./constructs/auth";
import { Alert } from "./constructs/alert";
import { Database } from "./constructs/database";
import { VideoSummaryGenerator } from "./constructs/video-summary-generator";
import { S3Buckets } from "./constructs/s3buckets";
import { Knowledge } from "./constructs/knowledge";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as cloudfrontOrigins from "aws-cdk-lib/aws-cloudfront-origins";
import * as iam from "aws-cdk-lib/aws-iam";
import { Frontend } from "./constructs/frontend";

export class KnowledgeTransferStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const auth = new Auth(this, "Auth");
    const database = new Database(this, "Database");
    const buckets = new S3Buckets(this, "S3Buckets");

    new VideoCall(this, "VideoCall", {
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
      }
    );

    // Knowledge
    const knowledge = new Knowledge(this, "Knowledge", {
      knowledgeBucket: buckets.knowledgeBucket,
    });

    const frontend = new Frontend(this, "Frontend", {
      webAclId: "TODO",
      videoBucket: buckets.concatenatedBucket,
      accessLogBucket: buckets.accessLogBucket,
      enableIpV6: true,
    });
    frontend.buildViteApp({
      alertApiEndpoint: alert.api.apiEndpoint,
      auth,
    });

    new cdk.CfnOutput(this, "FrontendURL", {
      value: frontend.getOrigin(),
    });

    // // Distribution for video delivery
    // const originAccessIdentity = new cloudfront.OriginAccessIdentity(
    //   this,
    //   "OAI"
    // );
    // const distribution = new cloudfront.Distribution(this, "Distribution", {
    //   defaultBehavior: {
    //     origin: new cloudfrontOrigins.S3Origin(buckets.concatenatedBucket, {
    //       originAccessIdentity: originAccessIdentity,
    //     }),
    //     viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
    //   },
    // });
    // buckets.concatenatedBucket.addToResourcePolicy(
    //   new iam.PolicyStatement({
    //     actions: ["s3:GetObject"],
    //     resources: [buckets.concatenatedBucket.arnForObjects("*")],
    //     principals: [
    //       new iam.CanonicalUserPrincipal(
    //         originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
    //       ),
    //     ],
    //   })
    // );

    // new cdk.CfnOutput(this, "DistributionDomainName", {
    //   value: distribution.distributionDomainName,
    // });

    // // Test
    // // TODO: Remove this
    // const videoConcat = new VideoConcat(this, "VideoConcat", {
    //   concatenatedBucket: buckets.concatenatedBucket,
    //   database,
    // });
  }
}
