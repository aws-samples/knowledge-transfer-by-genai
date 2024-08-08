import { Construct } from "constructs";
import { Auth } from "./auth";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import { HttpUserPoolAuthorizer } from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import {
  CorsHttpMethod,
  HttpApi,
  HttpMethod,
} from "aws-cdk-lib/aws-apigatewayv2";
import * as iam from "aws-cdk-lib/aws-iam";
import {
  DockerImageCode,
  DockerImageFunction,
  IFunction,
} from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { Platform } from "aws-cdk-lib/aws-ecr-assets";
import { CfnOutput, Duration, Stack } from "aws-cdk-lib";
import { Database } from "./database";

export interface AlertProps {
  auth: Auth;
  database: Database;
  readonly corsAllowOrigins?: string[];
}

export class Alert extends Construct {
  readonly api: HttpApi;
  readonly handler: IFunction;
  constructor(scope: Construct, id: string, props: AlertProps) {
    super(scope, id);

    const { database, corsAllowOrigins: allowOrigins = ["*"] } = props;

    const handler = new DockerImageFunction(this, "Handler", {
      code: DockerImageCode.fromImageAsset(
        path.join(__dirname, "../../../backend"),
        {
          platform: Platform.LINUX_AMD64,
          file: "alert/Dockerfile",
        }
      ),
      memorySize: 1024,
      timeout: Duration.minutes(1),
      environment: {
        ACCOUNT_ID: Stack.of(this).account,
        REGION: Stack.of(this).region,
        ALERT_TABLE_NAME: database.alertTable.tableName,
      },
    });
    database.alertTable.grantReadWriteData(handler.role!);

    const api = new HttpApi(this, "Default", {
      corsPreflight: {
        allowHeaders: ["*"],
        allowMethods: [
          CorsHttpMethod.GET,
          CorsHttpMethod.HEAD,
          CorsHttpMethod.OPTIONS,
          CorsHttpMethod.POST,
          CorsHttpMethod.PUT,
          CorsHttpMethod.PATCH,
          CorsHttpMethod.DELETE,
        ],
        allowOrigins: ["*"],
        maxAge: Duration.days(10),
      },
    });

    const integration = new HttpLambdaIntegration("Integration", handler);
    const authorizer = new HttpUserPoolAuthorizer(
      "Authorizer",
      props.auth.userPool,
      {
        userPoolClients: [props.auth.client],
      }
    );
    let routeProps: any = {
      path: "/{proxy+}",
      integration,
      methods: [
        HttpMethod.GET,
        HttpMethod.POST,
        HttpMethod.PUT,
        HttpMethod.PATCH,
        HttpMethod.DELETE,
      ],
      authorizer,
    };
    api.addRoutes(routeProps);

    this.api = api;
    this.handler = handler;

    new CfnOutput(this, "AlertBackendApiUrl", { value: api.apiEndpoint });
  }
}