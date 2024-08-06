import { Construct } from "constructs";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";
import { Duration, Stack } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Database } from "./database";

export interface VideoConcatProps {
  readonly recordingBucket: s3.IBucket;
  readonly database: Database;
}

export class VideoConcat extends Construct {
  constructor(scope: Construct, id: string, props: VideoConcatProps) {
    super(scope, id);

    const concatTriggerFunction = new NodejsFunction(
      this,
      "ConcatTriggerFunction",
      {
        entry: path.join(__dirname, "../../../backend/concat/handler.ts"),
        timeout: Duration.seconds(30),
        depsLockFilePath: path.join(
          __dirname,
          "../../../backend/concat/package-lock.json"
        ),
        environment: {
          ACCOUNT_ID: Stack.of(this).account,
          REGION: Stack.of(this).region,
          ALERT_TABLE_NAME: props.database.alertTable.tableName,
        },
      }
    );
    props.database.alertTable.grantReadWriteData(concatTriggerFunction);

    const rule = new events.Rule(this, "ChimeMeetingDeleteRule", {
      eventPattern: {
        source: ["aws.chime"],
        detailType: ["Chime Meeting State Change"],
        detail: {
          eventType: ["chime:MeetingEnded"],
        },
      },
    });

    rule.addTarget(new targets.LambdaFunction(concatTriggerFunction));
  }
}
