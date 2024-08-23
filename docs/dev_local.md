# ローカル開発

## 準備

### バックエンド

- [デプロイ手順](./deploy.md)を参考にデプロイ
- 環境変数のセット

```sh
export ACCOUNT_ID=1234567890
export REGION=ap-northeast-1
export ALERT_TABLE_NAME=KnowledgeTransferStack-DatabaseAlertTableXXXX
export MEETING_TABLE_NAME=KnowledgeTransferStack-DatabaseMeetingTableXXXX
export CONCATENATED_BUCKET_NAME=knowledgetransferstack-s3bucketsconcatenatedbucket-xxxx
export TRANSCRIPTION_BUCKET_NAME=knowledgetransferstack-s3bucketstranscriptionbucke-xxxx
export KNOWLEDGE_BUCKET_NAME=knowledgetransferstack-s3bucketsknowledgebucketxxx
export KNOWLEDGE_BASE_ID= XXXXX
export BEDROCK_REGION=us-west-2
export BEDROCK_AGENT_REGION=ap-northeast-1
```

### フロントエンド

- フロントエンドディレクトリに移動

```sh
cd frontend
```

- [.env.template](../frontend/src/.env.template)を同ディレクトリにコピー、`.env`にリネーム
- `.env`を開き項目を埋める
  - `VITE_APP_ALERT_API_ENDPOINT`は`http://localhost:3000/api`をセット

```sh
VITE_APP_USER_POOL_ID="	ap-northeast-1_XXXXXX"
VITE_APP_USER_POOL_CLIENT_ID="xxxxxxx"
VITE_APP_CHIME_BACKEND="https://xxxxx.appsync-api.ap-northeast-1.amazonaws.com/graphql"
VITE_APP_ALERT_API_ENDPOINT="http://localhost:3000/api"
```

## ローカル環境の立ち上げ

プロジェクトのルートディレクトリで下記を実行

```sh
npm run dev
```
