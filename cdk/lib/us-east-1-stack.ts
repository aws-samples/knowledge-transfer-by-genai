import * as cdk from "aws-cdk-lib";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import * as iam from "aws-cdk-lib/aws-iam";
import { Function, IVersion, Runtime, Version } from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import * as path from "path";
import * as ssm from "aws-cdk-lib/aws-ssm";
import * as wafv2 from "aws-cdk-lib/aws-wafv2";
import * as cr from "aws-cdk-lib/custom-resources";

const STACK_REGION = "us-east-1";

interface UsEast1StackProps extends cdk.StackProps {
  readonly defaultEventBusRegion: string;
  readonly allowedIpV4AddressRanges: string[];
  readonly allowedIpV6AddressRanges: string[];
}

export class UsEast1Stack extends cdk.Stack {
  public readonly webAclArn: cdk.CfnOutput;
  public readonly ipV6Enabled: boolean;
  private readonly functionVersionParameter: ssm.StringParameter;
  constructor(scope: Construct, id: string, props: UsEast1StackProps) {
    super(scope, id, props);

    // EventBridge resources to propagate Chime's control plane events
    {
      const defaultEventBusArn = `arn:aws:events:${
        props.defaultEventBusRegion
      }:${cdk.Stack.of(this).account}:event-bus/default`;

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

    // Lambda@Edge resources
    {
      const authFunction = new NodejsFunction(this, "AuthFunction@Edge", {
        runtime: Runtime.NODEJS_20_X,
        entry: path.join(__dirname, "../lib/constructs/lambda/auth-furl.ts"),
        bundling: {},
      });
      this.functionVersionParameter = new ssm.StringParameter(
        this,
        "FunctionVersion",
        {
          stringValue: authFunction.currentVersion.edgeArn,
        }
      );

      const statement = new iam.PolicyStatement();
      const edgeLambdaServicePrincipal = new iam.ServicePrincipal(
        "edgelambda.amazonaws.com"
      );
      statement.addPrincipals(edgeLambdaServicePrincipal);
      statement.addActions(edgeLambdaServicePrincipal.assumeRoleAction);
      (authFunction.role as iam.Role).assumeRolePolicy!.addStatements(
        statement
      );
    }

    // WAF resources
    {
      const rules: wafv2.CfnWebACL.RuleProperty[] = [];

      // create Ipset for ACL
      if (props.allowedIpV4AddressRanges.length > 0) {
        const ipV4SetReferenceStatement = new wafv2.CfnIPSet(
          this,
          "FrontendIpV4Set",
          {
            ipAddressVersion: "IPV4",
            scope: "CLOUDFRONT",
            addresses: props.allowedIpV4AddressRanges,
          }
        );
        rules.push({
          priority: 0,
          name: "FrontendWebAclIpV4RuleSet",
          action: { allow: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "FrontendWebAcl",
            sampledRequestsEnabled: true,
          },
          statement: {
            ipSetReferenceStatement: { arn: ipV4SetReferenceStatement.attrArn },
          },
        });
      }
      if (props.allowedIpV6AddressRanges.length > 0) {
        const ipV6SetReferenceStatement = new wafv2.CfnIPSet(
          this,
          "FrontendIpV6Set",
          {
            ipAddressVersion: "IPV6",
            scope: "CLOUDFRONT",
            addresses: props.allowedIpV6AddressRanges,
          }
        );
        rules.push({
          priority: 1,
          name: "FrontendWebAclIpV6RuleSet",
          action: { allow: {} },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: "FrontendWebAcl",
            sampledRequestsEnabled: true,
          },
          statement: {
            ipSetReferenceStatement: { arn: ipV6SetReferenceStatement.attrArn },
          },
        });
        this.ipV6Enabled = true;
      } else {
        this.ipV6Enabled = false;
      }

      if (rules.length > 0) {
        const webAcl = new wafv2.CfnWebACL(this, "WebAcl", {
          defaultAction: { block: {} },
          name: `FrontendWebAcl${id}`,
          scope: "CLOUDFRONT",
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: `FrontendWebAcl${id}`,
            sampledRequestsEnabled: true,
          },
          rules,
        });

        this.webAclArn = new cdk.CfnOutput(this, "WebAclId", {
          value: webAcl.attrArn,
        });
      } else {
        throw new Error(
          "One or more allowed IP ranges must be specified in IPv4 or IPv6."
        );
      }
    }
  }

  public versionArn(scope: Construct) {
    const id = `VersionArn${this.functionVersionParameter.node.addr}`;
    const existing = cdk.Stack.of(scope).node.tryFindChild(id) as IVersion;
    if (existing) {
      return existing;
    }

    const lookup = new cr.AwsCustomResource(
      cdk.Stack.of(scope),
      `Lookup${id}`,
      {
        onUpdate: {
          // will also be called for a CREATE event
          service: "SSM",
          action: "getParameter",
          parameters: {
            Name: this.functionVersionParameter.parameterName,
          },
          // it is impossible to know when the parameter is updated.
          // so we need to get the value on every deployment.
          physicalResourceId: cr.PhysicalResourceId.of(`${Date.now()}`),
          region: STACK_REGION,
        },
        policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
          resources: [this.functionVersionParameter.parameterArn],
        }),
      }
    );
    return Version.fromVersionArn(
      cdk.Stack.of(scope),
      id,
      lookup.getResponseField("Parameter.Value")
    );
  }
}
