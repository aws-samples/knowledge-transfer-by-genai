import { CfnOutput, Duration, Stack } from "aws-cdk-lib";
import { UserPool, UserPoolClient } from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import { UsEast1Stack } from "../us-east-1-stack";

export interface AuthProps {
  // usEast1Stack: UsEast1Stack;
}

export class Auth extends Construct {
  readonly userPool: UserPool;
  readonly client: UserPoolClient;
  constructor(scope: Construct, id: string, props?: AuthProps) {
    super(scope, id);

    const userPool = new UserPool(this, "UserPool", {
      passwordPolicy: {
        requireUppercase: true,
        requireSymbols: true,
        requireDigits: true,
        minLength: 8,
      },
      selfSignUpEnabled: true,
      signInAliases: {
        username: false,
        email: true,
      },
    });

    const client = userPool.addClient(`Client`, {
      idTokenValidity: Duration.days(1),
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
    });

    this.client = client;
    this.userPool = userPool;

    // props?.usEast1Stack.addAuthFuncEnvironment({
    //   USER_POOL_REGION: Stack.of(this).region,
    //   USER_POOL_ID: userPool.userPoolId,
    //   USER_POOL_APP_ID: client.userPoolClientId,
    //   // Cognito domain
    //   USER_POOL_DOMAIN: `domain.auth.${
    //     Stack.of(this).region
    //   }.amazoncognito.com`,
    // });

    new CfnOutput(this, "UserPoolId", { value: userPool.userPoolId });
    new CfnOutput(this, "UserPoolClientId", { value: client.userPoolClientId });
  }
}
