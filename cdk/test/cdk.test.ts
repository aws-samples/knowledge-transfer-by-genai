import * as cdk from "aws-cdk-lib";
import { AwsPrototypingChecks, PDKNag } from "@aws-prototyping-sdk/pdk-nag";
import { KnowledgeTransferStack } from "../lib/knowledge-transfer-stack";
import { UsEast1Stack } from "../lib/us-east-1-stack";
import { describe, test } from "@jest/globals";

describe("Stack Tests", () => {
  test("Nag Check and Synth", () => {
    const app = new cdk.App();
    // Security check
    cdk.Aspects.of(app).add(new AwsPrototypingChecks());

    const usEast1Stack = new UsEast1Stack(app, "TestUsEast1Stack", {
      crossRegionReferences: true,
      defaultEventBusRegion: "ap-northeast-1",
      allowedIpV4AddressRanges: ["0.0.0.0/1", "128.0.0.0/1"],
      allowedIpV6AddressRanges: [
        "0000:0000:0000:0000:0000:0000:0000:0000/1",
        "8000:0000:0000:0000:0000:0000:0000:0000/1",
      ],
    });
    const stack = new KnowledgeTransferStack(
      app,
      "TestKnowledgeTransferStack",
      {
        usEast1Stack,
      }
    );
    app.synth();
  });
});
