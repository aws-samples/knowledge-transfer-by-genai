import { CfnOutput, RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import { VectorCollection } from "@cdklabs/generative-ai-cdk-constructs/lib/cdk-lib/opensearchserverless";
import {
  Analyzer,
  VectorIndex,
} from "@cdklabs/generative-ai-cdk-constructs/lib/cdk-lib/opensearch-vectorindex";
import {
  CharacterFilterType,
  TokenFilterType,
  TokenizerType,
} from "@cdklabs/generative-ai-cdk-constructs/lib/cdk-lib/opensearchserverless";
import * as s3 from "aws-cdk-lib/aws-s3";
import {
  BedrockFoundationModel,
  ChunkingStrategy,
  S3DataSource,
} from "@cdklabs/generative-ai-cdk-constructs/lib/cdk-lib/bedrock";
import { KnowledgeBase } from "@cdklabs/generative-ai-cdk-constructs/lib/cdk-lib/bedrock";

export interface KnowledgeProps {
  embeddingsModel?: BedrockFoundationModel;
  analyzer?: Analyzer;
  instruction?: string;
  chunkingStrategy?: ChunkingStrategy;
  maxTokens?: number;
  overlapPercentage?: number;
  knowledgeBucket: s3.IBucket;
}

const DEFAULT_JA_ANALYZER: Analyzer = {
  characterFilters: [CharacterFilterType.ICU_NORMALIZER],
  tokenizer: TokenizerType.KUROMOJI_TOKENIZER,
  tokenFilters: [TokenFilterType.KUROMOJI_BASEFORM, TokenFilterType.JA_STOP],
};

export class Knowledge extends Construct {
  readonly knowledgeBaseId: string;
  readonly knowledgeBaseArn: string;
  readonly dataSourceId: string;
  constructor(scope: Construct, id: string, props: KnowledgeProps) {
    super(scope, id);

    const embeddingsModel =
      props.embeddingsModel ?? BedrockFoundationModel.TITAN_EMBED_TEXT_V1;
    const analyzer = props.analyzer ?? DEFAULT_JA_ANALYZER;
    const instruction = props.instruction;
    const chunkingStrategy = props.chunkingStrategy ?? ChunkingStrategy.DEFAULT;
    const maxTokens = props.maxTokens ?? 512;
    const overlapPercentage = props.overlapPercentage ?? 10;

    const vectorCollection = new VectorCollection(this, "KBVectors");
    const vectorIndex = new VectorIndex(this, "KBIndex", {
      collection: vectorCollection,
      // DO NOT CHANGE THIS VALUE
      indexName: "bedrock-knowledge-base-default-index",
      // DO NOT CHANGE THIS VALUE
      vectorField: "bedrock-knowledge-base-default-vector",
      vectorDimensions: embeddingsModel.vectorDimensions!,
      mappings: [
        {
          mappingField: "AMAZON_BEDROCK_TEXT_CHUNK",
          dataType: "text",
          filterable: true,
        },
        {
          mappingField: "AMAZON_BEDROCK_METADATA",
          dataType: "text",
          filterable: false,
        },
      ],
      analyzer,
    });

    const kb = new KnowledgeBase(this, "KB", {
      description: "Industrial Knowledge Transfer By GenAI",
      embeddingsModel,
      vectorStore: vectorCollection,
      vectorIndex: vectorIndex,
      instruction,
    });

    const dataSource = new S3DataSource(this, "DataSource", {
      bucket: props.knowledgeBucket,
      knowledgeBase: kb,
      dataSourceName: props.knowledgeBucket.bucketName,
      chunkingStrategy,
      maxTokens,
      overlapPercentage,
    });

    this.knowledgeBaseId = kb.knowledgeBaseId;
    this.knowledgeBaseArn = kb.knowledgeBaseArn;
    this.dataSourceId = dataSource.dataSourceId;

    new CfnOutput(this, "KnowledgeBaseId", {
      value: kb.knowledgeBaseId,
    });
    new CfnOutput(this, "KnowledgeBaseArn", {
      value: kb.knowledgeBaseArn,
    });
    new CfnOutput(this, `DataSourceId`, {
      value: dataSource.dataSourceId,
    });
  }
}
