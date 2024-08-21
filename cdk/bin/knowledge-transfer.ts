#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { KnowledgeTransferStack } from "../lib/knowledge-transfer-stack";
import { UsEast1Stack } from "../lib/us-east-1-stack";

const app = new cdk.App();

const ALLOWED_IP_V4_ADDRESS_RANGES: string[] = app.node.tryGetContext(
  "allowedIpV4AddressRanges"
);
const ALLOWED_IP_V6_ADDRESS_RANGES: string[] = app.node.tryGetContext(
  "allowedIpV6AddressRanges"
);

const usEast1Stack = new UsEast1Stack(app, "UsEast1Stack", {
  crossRegionReferences: true,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "us-east-1",
  },
  defaultEventBusRegion: process.env.CDK_DEFAULT_REGION || "ap-northeast-1",
  allowedIpV4AddressRanges: ALLOWED_IP_V4_ADDRESS_RANGES,
  allowedIpV6AddressRanges: ALLOWED_IP_V6_ADDRESS_RANGES,
});

const mainStack = new KnowledgeTransferStack(app, "KnowledgeTransferStack", {
  crossRegionReferences: true,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  usEast1Stack,
});
