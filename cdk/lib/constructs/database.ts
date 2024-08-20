import { Construct } from "constructs";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import { RemovalPolicy } from "aws-cdk-lib";

export class Database extends Construct {
  public readonly alertTable: ddb.Table;
  public readonly meetingTable: ddb.Table;
  // public readonly chatTable: ddb.Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const alertTable = new ddb.Table(this, "AlertTable", {
      partitionKey: {
        name: "id",
        type: ddb.AttributeType.STRING,
      },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const meetingTable = new ddb.Table(this, "MeetingTable", {
      partitionKey: {
        name: "id",
        type: ddb.AttributeType.STRING,
      },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    meetingTable.addGlobalSecondaryIndex({
      indexName: "AlertIndex",
      partitionKey: {
        name: "alertId",
        type: ddb.AttributeType.STRING,
      },
    });

    // const chatTable = new ddb.Table(this, "ChatTable", {
    //   partitionKey: {
    //     name: "id",
    //     type: ddb.AttributeType.STRING,
    //   },
    //   billingMode: ddb.BillingMode.PAY_PER_REQUEST,
    // });
    // chatTable.addGlobalSecondaryIndex({
    //   indexName: "AlertIndex",
    //   partitionKey: {
    //     name: "alertId",
    //     type: ddb.AttributeType.STRING,
    //   },
    // });

    this.alertTable = alertTable;
    this.meetingTable = meetingTable;
    // this.chatTable = chatTable;
  }
}
