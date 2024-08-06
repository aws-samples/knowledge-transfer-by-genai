#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { KnowledgeTransferStack } from "../lib/knowledge-transfer-stack";
import { SourceEventStack } from "../lib/source-event-stack";

const app = new cdk.App();
const mainStack = new KnowledgeTransferStack(app, "KnowledgeTransferStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

new SourceEventStack(app, "SourceEventStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    // For chime control plane events, the region is always us-east-1
    region: "us-east-1",
  },
  defaultEventBusRegion: process.env.CDK_DEFAULT_REGION || "ap-northeast-1",
});
