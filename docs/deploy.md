# デプロイ手順

- お手元に UNIX コマンドおよび Node.js, Docker 実行環境を用意してください。もし無い場合、[SageMaker Studio Code Editor](https://github.com/aws-samples/sagemaker-studio-code-editor-template)がご利用可能です。
- このリポジトリをクローンします

```sh
git clone https://github.com/aws-samples/industrial-knowledge-transfer-by-genai
```

- プロジェクトが依存する npm パッケージをインストールします

```sh
cd industrial-knowledge-transfer-by-genai
npm install
```

- [esbuild](https://esbuild.github.io/)、[AWS CDK](https://aws.amazon.com/jp/cdk/)をインストールします

```sh
npm i -g esbuild
npm i -g aws-cdk
```

- CDK デプロイ前に、デプロイ先リージョンに対して 1 度だけ Bootstrap の作業が必要となります。ここでは東京リージョンへデプロイするものとします。なお<account id>はアカウント ID に置換してください。

```sh
cd cdk
cdk bootstrap aws://<account id>/ap-northeast-1
```

- 必要に応じて[cdk.json](../cdk/cdk.json)の下記項目を編集します

  - `bedrockRegion`: Bedrock が利用できるリージョン
  - `allowedIpV4AddressRanges`, `allowedIpV6AddressRanges`: 許可する IP アドレス範囲の指定

- プロジェクトをデプロイします。環境にもよりますが、20 分ほどかかります。

```sh
cdk deploy --require-approval never --all
```

- 下記のような出力が得られれば成功です。`KnowledgeTransferStack.DistributionUrl` に WEB アプリの URL が出力されますので、ブラウザからアクセスしてください。

```sh
 ✅  KnowledgeTransferStack

✨  Deployment time: 732.74s

Outputs:
...
KnowledgeTransferStack.DistributionUrl = https://xxxxxxx.cloudfront.net
...
Stack ARN:
arn:aws:cloudformation:ap-northeast-1:1234:stack/KnowledgeTransferStack/yyyy

✨  Total time: 762.56s
```

以上でデプロイ手順の解説を終えます。続いて[デモを動かす](./run_demo.md)へお進みください。
