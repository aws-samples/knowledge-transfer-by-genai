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
import { Database } from "./database";
import { Knowledge } from "./knowledge";
import { BedrockModelId } from "../knowledge-transfer-stack";

export interface VideoSummaryGeneratorProps {
  readonly knowledgeBucket: s3.IBucket;
  readonly concatenatedBucket: s3.IBucket;
  readonly transcriptionBucket: s3.IBucket;
  readonly database: Database;
  readonly knowledge: Knowledge;
  readonly bedrockRegion: string;
  readonly bedrockModelId: BedrockModelId;
}

export class VideoSummaryGenerator extends Construct {
  /**
   * StateMachine to generate a summary of a video recording.
   * Ref1: https://aws.amazon.com/jp/blogs/machine-learning/create-summaries-of-recordings-using-generative-ai-with-amazon-bedrock-and-amazon-transcribe/
   * Ref2: https://github.com/aws-samples/amazon-bedrock-samples/blob/main/generative-ai-solutions/recordings-summary-generator/recordings-summary-generation.yaml
   */
  constructor(scope: Construct, id: string, props: VideoSummaryGeneratorProps) {
    super(scope, id);

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
        BEDROCK_MODEL_ID: props.bedrockModelId,
        MEETING_TABLE_NAME: props.database.meetingTable.tableName,
        KNOWLEDGE_BASE_ID: props.knowledge.knowledgeBaseId,
        BEDROCK_REGION: props.bedrockRegion,
        BEDROCK_AGENT_REGION: cdk.Stack.of(props.knowledge).region,
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
    props.database.meetingTable.grantReadWriteData(summaryGenHandler);
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

    const isConcatenatedMediaPipeline = new sfn.Choice(
      this,
      "IsConcatenatedMediaPipeline"
    );

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

    // Note: Both Capture pipeline and Concatenation pipeline send the same event structure.
    // If the event is from the Capture pipeline, the `IsEventConcatenatedMediaPipeline` is set to false.
    // Then the state machine will skip the transcription job and end with a success.
    isConcatenatedMediaPipeline
      .when(
        sfn.Condition.booleanEquals(
          "$.Source.Payload.IsEventConcatenatedMediaPipeline",
          false
        ),
        new sfn.Succeed(this, "Skipped")
      )
      .otherwise(startTranscriptionJob);

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

    const startIngestionJob = new tasks.CallAwsService(
      this,
      "StartIngestionJob",
      {
        service: "bedrockagent",
        action: "startIngestionJob",
        iamAction: "bedrock:StartIngestionJob",
        parameters: {
          KnowledgeBaseId: props.knowledge.knowledgeBaseId,
          DataSourceId: props.knowledge.dataSourceId,
        },
        iamResources: [
          `arn:${cdk.Stack.of(this).partition}:bedrock:${
            cdk.Stack.of(props.knowledge).region
          }:${cdk.Stack.of(props.knowledge).account}:knowledge-base/*`,
        ],
        resultPath: "$.IngestionJob",
      }
    );

    const getIngestionJob = new tasks.CallAwsService(this, "GetIngestionJob", {
      service: "bedrockagent",
      action: "getIngestionJob",
      iamAction: "bedrock:GetIngestionJob",
      parameters: {
        KnowledgeBaseId: props.knowledge.knowledgeBaseId,
        DataSourceId: props.knowledge.dataSourceId,
        IngestionJobId: sfn.JsonPath.stringAt(
          "$.IngestionJob.IngestionJob.IngestionJobId"
        ),
      },
      iamResources: [
        `arn:${cdk.Stack.of(this).partition}:bedrock:${
          cdk.Stack.of(props.knowledge).region
        }:${cdk.Stack.of(props.knowledge).account}:knowledge-base/*`,
      ],
      resultPath: "$.IngestionJob",
    });

    const waitForIngestionJob = new sfn.Wait(this, "WaitForIngestionJob", {
      time: sfn.WaitTime.duration(cdk.Duration.seconds(30)),
    });

    const checkIngestionJobStatus = new sfn.Choice(
      this,
      "CheckIngestionJobStatus"
    );

    const invokeBedrockModel = new tasks.LambdaInvoke(this, "Summarize", {
      lambdaFunction: summaryGenHandler,
      payload: sfn.TaskInput.fromObject({
        jobType: "invokeBedrockModel",
        "TranscriptionJob.$": "$.TranscriptionJob",
        "Source.$": "$.Source",
      }),
      resultPath: "$.InvokeBedrockResult",
    });

    const success = new sfn.Succeed(this, "Success");
    const processFailed = new sfn.Fail(this, "Process Failed");

    const stateMachine = new sfn.StateMachine(
      this,
      "SummaryGeneratorStateMachine",
      {
        definitionBody: sfn.DefinitionBody.fromChainable(
          prepareInput
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
                      new sfn.Choice(this, "SummarizationStatus")
                        .when(
                          sfn.Condition.stringMatches(
                            "$.InvokeBedrockResult.Payload.status",
                            "SUCCEEDED"
                          ),
                          startIngestionJob
                            .next(getIngestionJob)
                            .next(
                              checkIngestionJobStatus
                                .when(
                                  sfn.Condition.stringEquals(
                                    "$.IngestionJob.IngestionJob.Status",
                                    "COMPLETE"
                                  ),
                                  success
                                )
                                .when(
                                  sfn.Condition.stringEquals(
                                    "$.IngestionJob.IngestionJob.Status",
                                    "FAILED"
                                  ),
                                  processFailed
                                )
                                .otherwise(
                                  waitForIngestionJob.next(getIngestionJob)
                                )
                            )
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
            )
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
