import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { VideoCall } from "./constructs/video-call";
import { Auth } from "./constructs/auth";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Alert } from "./constructs/alert";
import { Database } from "./constructs/database";
import * as events from "aws-cdk-lib/aws-events";
import * as iam from "aws-cdk-lib/aws-iam";
import { Transcribe } from "./constructs/transcribe";
import { VideoConcat } from "./constructs/video-concat";
import { VideoSummaryGenerator } from "./constructs/video-summary-generator";

export class KnowledgeTransferStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const accessLogBucket = new s3.Bucket(this, "AccessLogBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      autoDeleteObjects: true,
    });

    const knowledgeBucket = new s3.Bucket(this, "KnowledgeBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      autoDeleteObjects: true,
      serverAccessLogsBucket: accessLogBucket,
      serverAccessLogsPrefix: "KnowledgeBucket",
    });

    const recordingBucket = new s3.Bucket(this, "RecordingBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      autoDeleteObjects: true,
      serverAccessLogsBucket: accessLogBucket,
      serverAccessLogsPrefix: "RecordingBucket",
    });

    const transcriptionBucket = new s3.Bucket(this, "TranscriptionBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      autoDeleteObjects: true,
      serverAccessLogsBucket: accessLogBucket,
      serverAccessLogsPrefix: "TranscriptionBucket",
    });

    const concatenatedBucket = new s3.Bucket(this, "ConcatenatedBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      autoDeleteObjects: true,
      serverAccessLogsBucket: accessLogBucket,
      serverAccessLogsPrefix: "ConcatenatedBucket",
    });

    // Need to allow access from mediapipelines.chime.amazonaws.com
    // Ref: https://docs.aws.amazon.com/chime-sdk/latest/dg/create-concat-pipe-steps.html
    const recordingBucketPolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        "s3:PutObject",
        "s3:PutObjectAcl",
        "s3:GetObject",
        "s3:ListBucket",
      ],
      principals: [
        new iam.ServicePrincipal("mediapipelines.chime.amazonaws.com"),
      ],
      resources: [recordingBucket.bucketArn, `${recordingBucket.bucketArn}/*`],
    });
    recordingBucket.addToResourcePolicy(recordingBucketPolicyStatement);

    const concatenatedBucketPolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["s3:PutObject", "s3:PutObjectAcl"],
      principals: [
        new iam.ServicePrincipal("mediapipelines.chime.amazonaws.com"),
      ],
      resources: [
        concatenatedBucket.bucketArn,
        `${concatenatedBucket.bucketArn}/*`,
      ],
    });
    concatenatedBucket.addToResourcePolicy(concatenatedBucketPolicyStatement);

    const auth = new Auth(this, "Auth");
    const database = new Database(this, "Database");

    new VideoCall(this, "VideoCall", {
      auth,
      recordingBucket,
      concatenatedBucket,
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
        concatenatedBucket,
        knowledgeBucket,
        transcriptionBucket,
      }
    );

    // Test
    // TODO: Remove this
    const videoConcat = new VideoConcat(this, "VideoConcat", {
      concatenatedBucket,
      database,
    });
  }
}
