import { Construct } from "constructs";
import {
  CfnOutput,
  CfnResource,
  Duration,
  RemovalPolicy,
  Stack,
} from "aws-cdk-lib";
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
  IBucket,
} from "aws-cdk-lib/aws-s3";
import {
  AllowedMethods,
  CachePolicy,
  // CloudFrontWebDistribution,
  OriginAccessIdentity,
  CfnOriginAccessControl,
  Distribution,
  LambdaEdgeEventType,
  OriginRequestPolicy,
  ViewerProtocolPolicy,
  CacheQueryStringBehavior,
  CacheHeaderBehavior,
  CacheCookieBehavior,
} from "aws-cdk-lib/aws-cloudfront";
import { NodejsBuild } from "deploy-time-build";
import { Auth } from "./auth";
import { NagSuppressions } from "cdk-nag";
import {
  FunctionUrlOrigin,
  S3Origin,
} from "aws-cdk-lib/aws-cloudfront-origins";
import { UsEast1Stack } from "../us-east-1-stack";
import { IFunction, IFunctionUrl } from "aws-cdk-lib/aws-lambda";
import {
  CanonicalUserPrincipal,
  PolicyStatement,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { StringParameter } from "aws-cdk-lib/aws-ssm";
import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId,
} from "aws-cdk-lib/custom-resources";

export interface CloudFrontGatewayProps {
  readonly webAclId: string;
  readonly videoBucket: IBucket;
  readonly enableIpV6: boolean;
  readonly usEast1Stack: UsEast1Stack;
  readonly accessLogBucket?: IBucket;
}

export class CloudFrontGateway extends Construct {
  readonly distribution: Distribution;
  readonly assetBucket: Bucket;
  readonly urlParameter: StringParameter;
  readonly oac: OriginAccessIdentity;
  private originCount: number = 1; // 0 is reserved for the default origin
  private readonly lambdaOac: CfnOriginAccessControl;
  private readonly usEast1Stack: UsEast1Stack;
  constructor(scope: Construct, id: string, props: CloudFrontGatewayProps) {
    super(scope, id);

    this.usEast1Stack = props.usEast1Stack;

    const assetBucket = new Bucket(this, "AssetBucket", {
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      serverAccessLogsBucket: props.accessLogBucket,
      serverAccessLogsPrefix: "AssetBucket",
    });

    const originAccessIdentity = new OriginAccessIdentity(this, "OAI");

    const lambdaOac = new CfnOriginAccessControl(this, "LambdaOac", {
      originAccessControlConfig: {
        name: `OAC for lambda fURL(${this.node.addr})`,
        originAccessControlOriginType: "lambda",
        signingBehavior: "always",
        signingProtocol: "sigv4",
      },
    });

    const distribution = new Distribution(this, "Distribution", {
      comment: "Industrial Knowledge Transfer By GenAI",
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: new S3Origin(assetBucket, { originAccessIdentity }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
      },
      enableIpv6: props.enableIpV6,
      // Optionally add logging configuration
      ...(!this.shouldSkipAccessLogging() && {
        logBucket: props.accessLogBucket,
        logFilePrefix: "CloudFrontGateway/",
      }),
    });
    this.distribution = distribution;
    this.oac = originAccessIdentity;

    assetBucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [assetBucket.arnForObjects("*")],
        principals: [
          new CanonicalUserPrincipal(
            originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );

    const urlParameter = new StringParameter(this, "Url", {
      stringValue: "dummy",
    });

    new AwsCustomResource(this, "UpdateUrlParameter", {
      onUpdate: {
        // will also be called for a CREATE event
        service: "SSM",
        action: "putParameter",
        parameters: {
          Name: urlParameter.parameterName,
          Overwrite: true,
          Value: this.getOrigin(),
        },
        physicalResourceId: PhysicalResourceId.of(this.getOrigin()),
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({
        resources: [urlParameter.parameterArn],
      }),
    });

    this.assetBucket = assetBucket;
    this.lambdaOac = lambdaOac;
    this.urlParameter = urlParameter;

    NagSuppressions.addResourceSuppressions(distribution, [
      {
        id: "AwsPrototyping-CloudFrontDistributionGeoRestrictions",
        reason: "this asset is being used all over the world",
      },
    ]);
  }

  addBucket(bucket: IBucket, path: string) {
    bucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [bucket.arnForObjects("*")],
        principals: [
          new CanonicalUserPrincipal(
            this.oac.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );
    this.distribution.addBehavior(path, new S3Origin(bucket), {
      cachePolicy: CachePolicy.CACHING_OPTIMIZED,
      allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
    });
  }

  addLambda(handler: IFunction, furl: IFunctionUrl, path: string) {
    handler.addPermission("AllowCloudFrontServicePrincipal", {
      principal: new ServicePrincipal("cloudfront.amazonaws.com"),
      action: "lambda:InvokeFunctionUrl",
      sourceArn: `arn:aws:cloudfront::${Stack.of(this).account}:distribution/${
        this.distribution.distributionId
      }`,
    });
    const origin = new FunctionUrlOrigin(furl, {
      connectionTimeout: Duration.seconds(6),
    });

    const cfnDistribution = this.distribution.node.defaultChild as CfnResource;
    cfnDistribution.addPropertyOverride(
      `DistributionConfig.Origins.${this.originCount}.OriginAccessControlId`,
      this.lambdaOac.attrId
    );
    this.originCount++;

    this.distribution.addBehavior(path, origin, {
      cachePolicy: CachePolicy.CACHING_DISABLED,
      allowedMethods: AllowedMethods.ALLOW_ALL,
      originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      edgeLambdas: [
        {
          functionVersion: this.usEast1Stack.versionArn(handler),
          eventType: LambdaEdgeEventType.ORIGIN_REQUEST,
          includeBody: true,
        },
      ],
    });
  }

  getOrigin(): string {
    return `https://${this.distribution.domainName}`;
  }

  buildViteApp({
    alertApiEndpoint,
    videoCallEndpoint,
    auth,
  }: {
    alertApiEndpoint: string;
    videoCallEndpoint: string;
    auth: Auth;
  }) {
    const region = Stack.of(auth.userPool).region;
    const buildEnvProps = (() => {
      const defaultProps = {
        VITE_APP_ALERT_API_ENDPOINT: alertApiEndpoint,
        VITE_APP_CHIME_BACKEND: videoCallEndpoint,
        VITE_APP_USER_POOL_ID: auth.userPool.userPoolId,
        VITE_APP_USER_POOL_CLIENT_ID: auth.client.userPoolClientId,
        VITE_APP_REGION: region,
      };
      return defaultProps;
    })();

    new NodejsBuild(this, "ReactBuild", {
      assets: [
        {
          path: "../frontend",
          exclude: [
            "node_modules",
            "dist",
            "dev-dist",
            ".env",
            ".env.local",
            "../cdk/**/*",
            "../backend/**/*",
            "../example/**/*",
            "../docs/**/*",
            "../.github/**/*",
          ],
          commands: ["npm ci"],
        },
      ],
      buildCommands: ["npm run build"],
      buildEnvironment: buildEnvProps,
      destinationBucket: this.assetBucket,
      distribution: this.distribution,
      outputSourceDirectory: "dist",
    });
  }

  /**
   * CloudFront does not support access log delivery in the following regions
   * @see https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/AccessLogs.html#access-logs-choosing-s3-bucket
   */
  private shouldSkipAccessLogging(): boolean {
    const skipLoggingRegions = [
      "af-south-1",
      "ap-east-1",
      "ap-south-2",
      "ap-southeast-3",
      "ap-southeast-4",
      "ca-west-1",
      "eu-south-1",
      "eu-south-2",
      "eu-central-2",
      "il-central-1",
      "me-central-1",
    ];
    return skipLoggingRegions.includes(Stack.of(this).region);
  }
}
