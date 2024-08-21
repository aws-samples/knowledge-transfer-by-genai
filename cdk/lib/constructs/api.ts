import { Construct } from "constructs";
import { Auth } from "./auth";
import * as iam from "aws-cdk-lib/aws-iam";
import {
  DockerImageCode,
  DockerImageFunction,
  IFunction,
} from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import { Database } from "./database";
import { Knowledge } from "./knowledge";
import { S3Buckets } from "./s3buckets";
import { Duration, Stack } from "aws-cdk-lib";

export interface ApiProps {
  auth: Auth;
  database: Database;
  knowledge: Knowledge;
  buckets: S3Buckets;
  bedrockRegion: string;
  corsAllowOrigins?: string[];
}

export class Api extends Construct {
  readonly handler: IFunction;
  constructor(scope: Construct, id: string, props: ApiProps) {
    super(scope, id);

    const { database, buckets, corsAllowOrigins: allowOrigins = ["*"] } = props;

    const handler = new DockerImageFunction(this, "Handler", {
      code: DockerImageCode.fromImageAsset(
        path.join(__dirname, "../../../backend"),
        {
          platform: Platform.LINUX_AMD64,
          file: "api/Dockerfile",
        }
      ),
      memorySize: 1024,
      timeout: Duration.minutes(1),
      environment: {
        ACCOUNT_ID: Stack.of(this).account,
        REGION: Stack.of(this).region,
        ALERT_TABLE_NAME: database.alertTable.tableName,
        MEETING_TABLE_NAME: props.database.meetingTable.tableName,
        CONCATENATED_BUCKET_NAME: buckets.concatenatedBucket.bucketName,
        TRANSCRIPTION_BUCKET_NAME: buckets.transcriptionBucket.bucketName,
        KNOWLEDGE_BUCKET_NAME: buckets.knowledgeBucket.bucketName,
        CORS_ALLOW_ORIGINS: allowOrigins.join(","),
        KNOWLEDGE_BASE_ID: props.knowledge.knowledgeBaseId,
        BEDROCK_REGION: props.bedrockRegion,
        BEDROCK_AGENT_REGION: Stack.of(props.knowledge).region,
      },
    });
    database.alertTable.grantReadWriteData(handler.role!);
    database.meetingTable.grantReadWriteData(handler.role!);
    buckets.concatenatedBucket.grantRead(handler.role!);
    buckets.transcriptionBucket.grantRead(handler.role!);
    buckets.knowledgeBucket.grantRead(handler.role!);
    handler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
        ],
        resources: ["*"],
      })
    );
    handler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["bedrock:Retrieve"],
        resources: [props.knowledge.knowledgeBaseArn],
      })
    );

    this.handler = handler;
  }
}
