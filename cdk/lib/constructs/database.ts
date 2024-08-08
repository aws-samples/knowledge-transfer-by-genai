import { Construct } from "constructs";
import * as ddb from "aws-cdk-lib/aws-dynamodb";

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
    });

    const meetingTable = new ddb.Table(this, "MeetingTable", {
      partitionKey: {
        name: "id",
        type: ddb.AttributeType.STRING,
      },
      billingMode: ddb.BillingMode.PAY_PER_REQUEST,
    });

    this.alertTable = alertTable;
    this.meetingTable = meetingTable;
  }
}