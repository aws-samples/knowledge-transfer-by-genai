import { Construct } from "constructs";
import * as ddb from "aws-cdk-lib/aws-dynamodb";
import { CfnOutput, RemovalPolicy } from "aws-cdk-lib";

export class Database extends Construct {
  public readonly alertTable: ddb.Table;
  public readonly meetingTable: ddb.Table;

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

    new CfnOutput(this, "AlertTableName", {
      value: alertTable.tableName,
    });
    new CfnOutput(this, "MeetingTableName", {
      value: meetingTable.tableName,
    });

    this.alertTable = alertTable;
    this.meetingTable = meetingTable;
  }
}
