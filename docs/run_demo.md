# デモを動かす

## (Optional) 既存の知見のアップロード

- AWS マネージメントコンソール (以降マネコン) から`CloudFormation` > `KnowledgeTransferStack` > `出力`タブに表示される`S3BucketsKnowledgeBucketNameXXX`の値を控えます。
- マネコンから`S3`の控えたバケット名を開きます。
- 「アップロード」ボタンをクリックし、事前に検索対象に加えたいドキュメントをアップロードします。.txt ファイルや.pdf の他、.docx, .xlsx などの形式がご利用いただけます。詳細は[公式ドキュメント](https://docs.aws.amazon.com/bedrock/latest/userguide/knowledge-base-ds.html)をご確認ください。
- マネコンから`Amazon Bedrock` > `ナレッジベース`にアクセスし、説明に「Industrial Knowledge Transfer By GenAI」と記載されたナレッジベースにアクセスします (名称は`
KBKnowledgeTrKnowledgeXXXXX`)。
- `データソース`> `knowledgetransferstack-s3bucketsknowledgebucketxxxx`を選択し、「同期」をクリックします。同期が完了すると OpenSearch にドキュメントが取り込まれます。

## アラートの作成
