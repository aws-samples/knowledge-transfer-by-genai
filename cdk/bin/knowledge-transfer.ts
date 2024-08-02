#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { KnowledgeTransferStack } from "../lib/knowledge-transfer-stack";

const app = new cdk.App();
new KnowledgeTransferStack(app, "KnowledgeTransferStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
