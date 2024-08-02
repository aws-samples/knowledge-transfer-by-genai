import { Construct } from "constructs";
import { CfnOutput, Duration } from "aws-cdk-lib";
import { Auth } from "./auth";
import * as appsync from "aws-cdk-lib/aws-appsync";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import * as path from "path";

export interface VideoCallProps {
  readonly auth: Auth;
}

export class VideoCall extends Construct {
  readonly api: appsync.GraphqlApi;

  constructor(scope: Construct, id: string, props: VideoCallProps) {
    super(scope, id);

    const chimeResolverFunction = new NodejsFunction(
      this,
      "ChimeResolverFunction",
      {
        entry: path.join(__dirname, "../../../backend/video-call/resolvers.ts"),
        timeout: Duration.seconds(30),
        depsLockFilePath: path.join(
          __dirname,
          "../../../backend/video-call/package-lock.json"
        ),
        environment: {
          USER_POOL_ID: props.auth.userPool.userPoolId,
          USER_POOL_REGION: props.auth.userPool.stack.region,
        },
      }
    );

    chimeResolverFunction.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: [
          "chime:createAttendee",
          "chime:createMeeting",
          "chime:deleteMeeting",
          "cognito-idp:ListUsers",
        ],
        resources: ["*"],
      })
    );

    const api = new appsync.GraphqlApi(this, "Api", {
      name: "Api",
      schema: appsync.SchemaFile.fromAsset(
        path.join(__dirname, "../../../backend/video-call/schema.graphql")
      ),
      authorizationConfig: {
        defaultAuthorization: {
          authorizationType: appsync.AuthorizationType.USER_POOL,
          userPoolConfig: {
            userPool: props.auth.userPool,
          },
        },
      },
      logConfig: {
        fieldLogLevel: appsync.FieldLogLevel.ALL,
      },
    });

    const chimeDataSource = api.addLambdaDataSource(
      "ChimeDataSource",
      chimeResolverFunction
    );

    chimeDataSource.createResolver("GetCognitoId", {
      typeName: "Query",
      fieldName: "getCognitoId",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    chimeDataSource.createResolver("GetEmailFromId", {
      typeName: "Query",
      fieldName: "getEmailFromId",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    chimeDataSource.createResolver("CreateChimeMeeting", {
      typeName: "Mutation",
      fieldName: "createChimeMeeting",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    chimeDataSource.createResolver("JoinMeeting", {
      typeName: "Mutation",
      fieldName: "joinMeeting",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    chimeDataSource.createResolver("DeleteChimeMeeting", {
      typeName: "Mutation",
      fieldName: "deleteChimeMeeting",
      requestMappingTemplate: appsync.MappingTemplate.lambdaRequest(),
      responseMappingTemplate: appsync.MappingTemplate.lambdaResult(),
    });

    const dummyDataSource = new appsync.NoneDataSource(
      this,
      "DummyDataSource",
      {
        api,
      }
    );

    dummyDataSource.createResolver("SendMeetingMessage", {
      typeName: "Mutation",
      fieldName: "sendMeetingMessage",
      // only authorize a request when source == user
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #if ($context.identity.sub != $context.arguments.source)
          $util.unauthorized()
        #end
        {
          "version": "2018-05-29",
          "payload": $util.toJson($context.arguments)
        }
      `),
      responseMappingTemplate: appsync.MappingTemplate.fromString(
        "$util.toJson($context.result)"
      ),
    });

    dummyDataSource.createResolver("OnMeetingMessageReceived", {
      typeName: "Subscription",
      fieldName: "onMeetingMessageReceived",
      // only authorize a request when target == user
      requestMappingTemplate: appsync.MappingTemplate.fromString(`
        #if ($context.identity.sub != $context.arguments.target)
          $util.unauthorized()
        #end
        {
          "version": "2018-05-29",
          "payload": {}
        }
      `),
      responseMappingTemplate:
        appsync.MappingTemplate.fromString("$util.toJson(null)"),
    });

    this.api = api;
    new CfnOutput(this, "VideoCallUrl", { value: api.graphqlUrl });
  }
}
