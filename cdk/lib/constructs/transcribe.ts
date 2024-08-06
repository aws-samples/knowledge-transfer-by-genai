import { Construct } from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import { Duration, Stack } from "aws-cdk-lib";
import * as s3n from "aws-cdk-lib/aws-s3-notifications";
import * as iam from "aws-cdk-lib/aws-iam";
import * as events from "@aws-cdk/aws-events";
import * as targets from "@aws-cdk/aws-events-targets";

export interface TranscribeProps {
  readonly recordingBucket: s3.IBucket;
  readonly transcribeBucket: s3.IBucket;
}

export class Transcribe extends Construct {
  constructor(scope: Construct, id: string, props: TranscribeProps) {
    super(scope, id);

    const transcribeFunction = new NodejsFunction(this, "TranscribeFunction", {
      entry: path.join(__dirname, "../../../backend/transcribe/handler.ts"),
      timeout: Duration.seconds(30),
      depsLockFilePath: path.join(
        __dirname,
        "../../../backend/transcribe/package-lock.json"
      ),
      environment: {
        ACCOUNT_ID: Stack.of(this).account,
        REGION: Stack.of(this).region,
        TRANSCRIBE_BUCKET_NAME: props.transcribeBucket.bucketName,
      },
    });
    transcribeFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["transcribe:StartTranscriptionJob"],
        resources: ["*"],
      })
    );

    // props.recordingBucket.grantReadWrite(transcribeFunction);
    // props.transcribeBucket.grantReadWrite(transcribeFunction);

    // // trigger from s3 event
    // props.recordingBucket.addEventNotification(
    //   s3.EventType.OBJECT_CREATED,
    //   new s3n.LambdaDestination(transcribeFunction)
    // );
  }
}
