import * as cdk from "aws-cdk-lib";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

interface SourceEventStackProps extends cdk.StackProps {
  defaultEventBusRegion: string;
}

export class SourceEventStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SourceEventStackProps) {
    super(scope, id, props);

    const defaultEventBusArn = `arn:aws:events:${props.defaultEventBusRegion}:${
      cdk.Stack.of(this).account
    }:event-bus/default`;

    const eventBridgeRole = new iam.Role(this, "EventBridgeCrossRegionRole", {
      assumedBy: new iam.ServicePrincipal("events.amazonaws.com"),
      inlinePolicies: {
        AllowPutEvents: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              actions: ["events:PutEvents"],
              resources: [defaultEventBusArn],
            }),
          ],
        }),
      },
    });

    const eventRule = new events.Rule(this, "CrossRegionEventRule", {
      // eventPattern: {
      //   source: ["aws.chime"],
      //   detailType: ["Chime Meeting State Change"],
      //   detail: {
      //     eventType: ["chime:MeetingEnded"],
      //   },
      // },
      eventPattern: {
        source: ["aws.chime"],
      },
      targets: [
        new targets.EventBus(
          events.EventBus.fromEventBusArn(
            this,
            "DestinationEventBus",
            defaultEventBusArn
          ),
          {
            role: eventBridgeRole,
          }
        ),
      ],
    });
  }
}
