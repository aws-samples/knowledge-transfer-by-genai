import * as cdk from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as tasks from "aws-cdk-lib/aws-stepfunctions-tasks";
import * as events from "aws-cdk-lib/aws-events";
import * as targets from "aws-cdk-lib/aws-events-targets";
import { Construct } from "constructs";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as path from "path";

type BedrockModelId =
  | "anthropic.claude-v2:1"
  | "anthropic.claude-instant-v1"
  | "anthropic.claude-3-sonnet-20240229-v1:0"
  | "anthropic.claude-3-haiku-20240307-v1:0"
  | "anthropic.claude-3-opus-20240229-v1:0"
  | "anthropic.claude-3-5-sonnet-20240620-v1:0"
  | "mistral.mistral-7b-instruct-v0:2"
  | "mistral.mixtral-8x7b-instruct-v0:1"
  | "mistral.mistral-large-2402-v1:0";

export interface VideoSummaryGeneratorProps {
  readonly knowledgeBucket: s3.IBucket;
  readonly concatenatedBucket: s3.IBucket;
  readonly transcriptionBucket: s3.IBucket;
  readonly bedrockModelId?: BedrockModelId;
  readonly bedrockRegion?: string;
}

export class VideoSummaryGenerator extends Construct {
  /**
   * StateMachine to generate a summary of a video recording.
   * Ref1: https://aws.amazon.com/jp/blogs/machine-learning/create-summaries-of-recordings-using-generative-ai-with-amazon-bedrock-and-amazon-transcribe/
   * Ref2: https://github.com/aws-samples/amazon-bedrock-samples/blob/main/generative-ai-solutions/recordings-summary-generator/recordings-summary-generation.yaml
   */
  constructor(scope: Construct, id: string, props: VideoSummaryGeneratorProps) {
    super(scope, id);

    const bedrockModelId =
      props.bedrockModelId ?? "anthropic.claude-3-opus-20240229-v1:0";
    const bedrockRegion = props.bedrockRegion ?? "us-west-2";

    const summaryGenHandler = new NodejsFunction(this, "SummaryGenHandler", {
      entry: path.join(
        __dirname,
        "../../../backend/video-summary-generator/handler.ts"
      ),
      timeout: cdk.Duration.minutes(15),
      depsLockFilePath: path.join(
        __dirname,
        "../../../backend/video-summary-generator/package-lock.json"
      ),
      environment: {
        ACCOUNT_ID: cdk.Stack.of(this).account,
        REGION: cdk.Stack.of(this).region,
        CONCATENATED_BUCKET_NAME: props.concatenatedBucket.bucketName,
        KNOWLEDGE_BUCKET_NAME: props.knowledgeBucket.bucketName,
        BEDROCK_MODEL_ID: bedrockModelId,
        BEDROCK_REGION: bedrockRegion,
      },
    });
    summaryGenHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["transcribe:StartTranscriptionJob"],
        resources: ["*"],
      })
    );
    summaryGenHandler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["bedrock:InvokeModel"],
        resources: ["*"],
      })
    );
    props.concatenatedBucket.grantReadWrite(summaryGenHandler);
    props.knowledgeBucket.grantReadWrite(summaryGenHandler);
    props.transcriptionBucket.grantReadWrite(summaryGenHandler);

    // Step Functions State Machine
    const prepareInput = new tasks.LambdaInvoke(this, "PrepareInput", {
      lambdaFunction: summaryGenHandler,
      payload: sfn.TaskInput.fromObject({
        jobType: "prepareInput",
        "detail.$": "$$.Execution.Input.detail",
      }),
      resultPath: "$.Source",
      resultSelector: {
        "Payload.$": "$.Payload",
      },
    });

    const startTranscriptionJob = new tasks.CallAwsService(
      this,
      "StartTranscriptionJob",
      {
        service: "transcribe",
        action: "startTranscriptionJob",
        parameters: {
          Media: {
            MediaFileUri: sfn.JsonPath.stringAt("$.Source.Payload.S3Uri"),
          },
          TranscriptionJobName: sfn.JsonPath.stringAt(
            "States.Format('summary-generator-{}', $.Source.Payload.SourceFileNameWithDate)"
          ),
          OutputBucketName: props.transcriptionBucket.bucketName,
          OutputKey: sfn.JsonPath.stringAt(
            "States.Format('{}/{}.json', $$.Execution.Input.detail.meetingId, $.Source.Payload.SourceFileName)"
          ),
          // LanguageCode: "en-US",
          LanguageCode: "ja-JP",
          Settings: {
            ShowSpeakerLabels: true,
            MaxSpeakerLabels: 10,
          },
          Tags: [
            {
              Key: "SourceBucketName",
              Value: sfn.JsonPath.stringAt("$.Source.Payload.SourceBucketName"),
            },
            {
              Key: "SourceKeyName",
              Value: sfn.JsonPath.stringAt("$.Source.Payload.SourceKeyName"),
            },
            {
              Key: "SourceFileName",
              Value: sfn.JsonPath.stringAt("$.Source.Payload.SourceFileName"),
            },
          ],
        },
        iamResources: ["*"],
        resultPath: "$.TranscriptionJob",
      }
    );

    const waitForTranscriptionJob = new sfn.Wait(
      this,
      "WaitForTranscriptionJob",
      {
        time: sfn.WaitTime.duration(cdk.Duration.seconds(20)),
      }
    );

    const getTranscriptionJobStatus = new tasks.CallAwsService(
      this,
      "GetTranscriptionJobStatus",
      {
        service: "transcribe",
        action: "getTranscriptionJob",
        parameters: {
          TranscriptionJobName: sfn.JsonPath.stringAt(
            "$.TranscriptionJob.TranscriptionJob.TranscriptionJobName"
          ),
        },
        iamResources: ["*"],
        resultPath: "$.TranscriptionJob",
      }
    );

    const formatTranscription = new tasks.LambdaInvoke(
      this,
      "FormatTranscription",
      {
        lambdaFunction: summaryGenHandler,
        payload: sfn.TaskInput.fromObject({
          jobType: "formatTranscription",
          "TranscriptionJob.$": "$.TranscriptionJob",
          "Source.$": "$.Source",
        }),
        resultPath: "$.FormatTranscription",
        resultSelector: {
          "BucketName.$": "$.Payload.bucketName",
          "SpeakerTranscriptionKeyName.$":
            "$.Payload.speakerTranscriptionKeyName",
        },
      }
    );

    const invokeBedrockModel = new tasks.LambdaInvoke(
      this,
      "Invoke Bedrock Model",
      {
        lambdaFunction: summaryGenHandler,
        payload: sfn.TaskInput.fromObject({
          jobType: "invokeBedrockModel",
          "TranscriptionJob.$": "$.TranscriptionJob",
          "Source.$": "$.Source",
        }),
        resultPath: "$.InvokeBedrockResult",
      }
    );

    const bedrockModelStatus = new sfn.Choice(this, "Bedrock Model Status");

    const success = new sfn.Succeed(this, "Success");
    const processFailed = new sfn.Fail(this, "Process Failed");

    const stateMachine = new sfn.StateMachine(
      this,
      "SummaryGeneratorStateMachine",
      {
        definition: prepareInput
          .next(startTranscriptionJob)
          .next(waitForTranscriptionJob)
          .next(getTranscriptionJobStatus)
          .next(
            new sfn.Choice(this, "TranscriptionJobStatusChoice")
              .when(
                sfn.Condition.stringEquals(
                  "$.TranscriptionJob.TranscriptionJob.TranscriptionJobStatus",
                  "COMPLETED"
                ),
                formatTranscription
                  .next(invokeBedrockModel)
                  .next(
                    bedrockModelStatus
                      .when(
                        sfn.Condition.stringMatches(
                          "$.InvokeBedrockResult.Payload.status",
                          "SUCCEEDED"
                        ),
                        success
                      )
                      .otherwise(processFailed)
                  )
              )
              .when(
                sfn.Condition.stringEquals(
                  "$.TranscriptionJob.TranscriptionJob.TranscriptionJobStatus",
                  "FAILED"
                ),
                processFailed
              )
              .otherwise(waitForTranscriptionJob)
          ),
      }
    );
    stateMachine.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "transcribe:StartTranscriptionJob",
          "transcribe:GetTranscriptionJob",
          "transcribe:TagResource",
        ],
        resources: ["*"],
      })
    );
    props.concatenatedBucket.grantReadWrite(stateMachine);
    props.knowledgeBucket.grantReadWrite(stateMachine);
    props.transcriptionBucket.grantReadWrite(stateMachine);

    // EventBridge Rule
    // Note: Both Capture pipeline and Concatenation pipeline send the same event structure.
    // So the SFn is triggered twice.
    const rule = new events.Rule(this, "ChimeMediaPipelineStateChangeRule", {
      eventPattern: {
        source: ["aws.chime"],
        detailType: ["Chime Media Pipeline State Change"],
        detail: {
          eventType: ["chime:MediaPipelineDeleted"],
        },
      },
    });
    rule.addTarget(new targets.SfnStateMachine(stateMachine));
  }
}
