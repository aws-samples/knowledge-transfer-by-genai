#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { KnowledgeTransferStack } from "../lib/knowledge-transfer-stack";
// import { SourceEventStack } from "../lib/source-event-stack";
import { UsEast1Stack } from "../lib/us-east-1-stack";

const app = new cdk.App();

const usEast1Stack = new UsEast1Stack(app, "UsEast1Stack", {
  crossRegionReferences: true,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "us-east-1",
  },
  defaultEventBusRegion: process.env.CDK_DEFAULT_REGION || "ap-northeast-1",
  allowedIpV4AddressRanges: ["0.0.0.0/1", "128.0.0.0/1"],
  allowedIpV6AddressRanges: [
    "0000:0000:0000:0000:0000:0000:0000:0000/1",
    "8000:0000:0000:0000:0000:0000:0000:0000/1",
  ],
});

const mainStack = new KnowledgeTransferStack(app, "KnowledgeTransferStack", {
  crossRegionReferences: true,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  usEast1Stack,
});

// new SourceEventStack(app, "SourceEventStack", {
//   env: {
//     account: process.env.CDK_DEFAULT_ACCOUNT,
//     // For chime control plane events, the region is always us-east-1
//     region: "us-east-1",
//   },
//   defaultEventBusRegion: process.env.CDK_DEFAULT_REGION || "ap-northeast-1",
// });
