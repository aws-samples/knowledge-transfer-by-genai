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

    const transcribeBucket = new s3.Bucket(this, "TranscribeBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      autoDeleteObjects: true,
      serverAccessLogsBucket: accessLogBucket,
      serverAccessLogsPrefix: "TranscribeBucket",
    });

    // Need to allow access from mediapipelines.chime.amazonaws.com
    const bucketPolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["s3:PutObject", "s3:PutObjectAcl"],
      principals: [
        new iam.ServicePrincipal("mediapipelines.chime.amazonaws.com"),
      ],
      resources: [recordingBucket.bucketArn, `${recordingBucket.bucketArn}/*`],
    });
    recordingBucket.addToResourcePolicy(bucketPolicyStatement);

    const auth = new Auth(this, "Auth");
    const database = new Database(this, "Database");

    new VideoCall(this, "VideoCall", {
      auth,
      recordingBucket,
      database,
    });

    const alert = new Alert(this, "Alert", {
      auth,
      database,
    });

    const videoConcat = new VideoConcat(this, "VideoConcat", {
      recordingBucket,
      database,
    });

    // const transcribe = new Transcribe(this, "Transcribe", {
    //   recordingBucket,
    //   transcribeBucket,
    // });
  }
}
