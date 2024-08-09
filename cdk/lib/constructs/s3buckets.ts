import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import { CfnOutput, RemovalPolicy } from "aws-cdk-lib";

export interface S3BucketsProps {}

export class S3Buckets extends Construct {
  public readonly knowledgeBucket: s3.Bucket;
  public readonly recordingBucket: s3.Bucket;
  public readonly transcriptionBucket: s3.Bucket;
  public readonly concatenatedBucket: s3.Bucket;
  public readonly accessLogBucket: s3.Bucket;
  constructor(scope: Construct, id: string, props?: S3BucketsProps) {
    super(scope, id);

    const accessLogBucket = new s3.Bucket(this, "AccessLogBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      autoDeleteObjects: true,
    });

    const knowledgeBucket = new s3.Bucket(this, "KnowledgeBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      autoDeleteObjects: true,
      serverAccessLogsBucket: accessLogBucket,
      serverAccessLogsPrefix: "KnowledgeBucket",
    });

    const recordingBucket = new s3.Bucket(this, "RecordingBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      autoDeleteObjects: true,
      serverAccessLogsBucket: accessLogBucket,
      serverAccessLogsPrefix: "RecordingBucket",
    });

    const transcriptionBucket = new s3.Bucket(this, "TranscriptionBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      objectOwnership: s3.ObjectOwnership.OBJECT_WRITER,
      autoDeleteObjects: true,
      serverAccessLogsBucket: accessLogBucket,
      serverAccessLogsPrefix: "TranscriptionBucket",
    });

    const concatenatedBucket = new s3.Bucket(this, "ConcatenatedBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      // Need to set BUCKET_OWNER_ENFORCED to allow access from frontend
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
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
        "s3:GetObject", // Needed to allow access from concatenation pipeline
        "s3:ListBucket", // Needed to allow access from concatenation pipeline
      ],
      principals: [
        new iam.ServicePrincipal("mediapipelines.chime.amazonaws.com"),
      ],
      resources: [recordingBucket.bucketArn, `${recordingBucket.bucketArn}/*`],
    });
    recordingBucket.addToResourcePolicy(recordingBucketPolicyStatement);

    // Need to allow access from mediapipelines.chime.amazonaws.com
    // Ref: https://docs.aws.amazon.com/chime-sdk/latest/dg/create-concat-pipe-steps.html
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

    new CfnOutput(this, "KnowledgeBucketName", {
      value: knowledgeBucket.bucketName,
    });

    this.knowledgeBucket = knowledgeBucket;
    this.recordingBucket = recordingBucket;
    this.concatenatedBucket = concatenatedBucket;
    this.transcriptionBucket = transcriptionBucket;
    this.accessLogBucket = accessLogBucket;
  }
}
