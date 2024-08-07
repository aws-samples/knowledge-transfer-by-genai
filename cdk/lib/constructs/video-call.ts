import { Construct } from "constructs";
import { CfnOutput, Duration, Stack } from "aws-cdk-lib";
import { Auth } from "./auth";
import * as appsync from "aws-cdk-lib/aws-appsync";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import * as path from "path";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import { Database } from "./database";

export interface VideoCallProps {
  readonly auth: Auth;
  readonly recordingBucket: s3.IBucket;
  readonly concatenatedBucket: s3.IBucket;
  readonly database: Database;
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
          ACCOUNT_ID: Stack.of(this).account,
          REGION: Stack.of(this).region,
          USER_POOL_ID: props.auth.userPool.userPoolId,
          USER_POOL_REGION: props.auth.userPool.stack.region,
          RECORDING_BUCKET_ARN: props.recordingBucket.bucketArn,
          CONCATENATED_BUCKET_ARN: props.concatenatedBucket.bucketArn,
          ALERT_TABLE_NAME: props.database.alertTable.tableName,
          MEETING_TABLE_NAME: props.database.meetingTable.tableName,
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
          "chime:CreateMediaCapturePipeline",
          "chime:StartMeetingTranscription",
          "cognito-idp:ListUsers",
          "chime:CreateMediaConcatenationPipeline",
        ],
        resources: ["*"],
      })
    );
    props.recordingBucket.grantReadWrite(chimeResolverFunction);
    props.concatenatedBucket.grantReadWrite(chimeResolverFunction);
    props.database.alertTable.grantReadWriteData(chimeResolverFunction);
    props.database.meetingTable.grantReadWriteData(chimeResolverFunction);

    // chimeResolverFunction.addToRolePolicy(
    //   new PolicyStatement({
    //     effect: Effect.ALLOW,
    //     actions: ["chime:CreateMediaCapturePipeline"],
    //     resources: [
    //       `arn:aws:chime:${Stack.of(this).region}:${
    //         Stack.of(this).account
    //       }:media-pipeline/*`,
    //     ],
    //   })
    // );

    new iam.CfnServiceLinkedRole(this, "ChimeSDKMediaPipelineRole", {
      awsServiceName: "mediapipelines.chime.amazonaws.com",
      description: "Service-linked role for Amazon Chime SDK Media Pipelines",
    });
    new iam.CfnServiceLinkedRole(this, "ChimeSDKTranscriptionRole", {
      awsServiceName: "transcription.chime.amazonaws.com",
      description: "Service-linked role for Amazon Chime Transcription",
    });

    const api = new appsync.GraphqlApi(this, "Api", {
      name: "Api",
      definition: {
        schema: appsync.SchemaFile.fromAsset(
          path.join(__dirname, "../../../backend/video-call/schema.graphql")
        ),
      },
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
