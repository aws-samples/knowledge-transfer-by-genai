FROM public.ecr.aws/docker/library/node:21-bullseye-slim as builder

WORKDIR /app
COPY . .

WORKDIR /app/api
RUN npm i && npm run build

FROM public.ecr.aws/docker/library/node:21-bullseye-slim as runner

# Install lambda web adapter
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.8.4 /lambda-adapter /opt/extensions/lambda-adapter

# Note that the lambda web adapter is listening on port 8080 by default
# Ref: https://github.com/awslabs/aws-lambda-web-adapter#usage
ENV PORT=8080 NODE_ENV=production
# Enable SSE
ENV AWS_LWA_INVOKE_MODE response_stream

WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=builder /app/common ./common
COPY --from=builder /app/api/package.json ./package.json
COPY --from=builder /app/api/dist ./dist
COPY --from=builder /app/api/node_modules ./node_modules

EXPOSE 8080
CMD ["npm", "run", "start:prod"]

