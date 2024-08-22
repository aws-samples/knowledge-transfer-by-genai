import type {
  CloudFrontRequestHandler,
  CloudFrontRequestEvent,
  CloudFrontRequest,
} from "aws-lambda";
import { createHash } from "crypto";
import * as jwt from "jsonwebtoken";
import * as jwksClient from "jwks-rsa";

const extractToken = (request: CloudFrontRequest): string => {
  const headers = request.headers;
  if (headers.authorization) {
    const authorizationHeader = headers.authorization[0]?.value || "";
    console.log("Authorization header:", authorizationHeader);
    const tokenMatch = authorizationHeader.match(/^Bearer\s+(.+)$/);
    if (tokenMatch) {
      return tokenMatch[1];
    }
  } else {
    throw new Error("Authorization header not found in the request headers.");
  }
  throw new Error("Bearer token not found in the request headers.");
};

const getSigningKey = (kid: string, jwksUri: string): Promise<string> => {
  const client = new jwksClient.JwksClient({
    jwksUri,
  });

  return new Promise((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err) {
        return reject(err);
      }
      const signingKey = key.getPublicKey();
      resolve(signingKey);
    });
  });
};

const verifyToken = async (
  token: string,
  userPoolId: string,
  clientId: string,
  region: string
): Promise<void> => {
  const issuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
  const decodedToken = jwt.decode(token, { complete: true });

  if (
    !decodedToken ||
    typeof decodedToken === "string" ||
    !decodedToken.header
  ) {
    throw new Error("Invalid token format.");
  }

  const { kid } = decodedToken.header;
  const jwksUri = `${issuer}/.well-known/jwks.json`;
  const signingKey = await getSigningKey(kid, jwksUri);

  try {
    const payload = jwt.verify(token, signingKey, {
      algorithms: ["RS256"],
      audience: clientId,
      issuer,
    });
    console.log("Token is valid. Payload:", payload);
  } catch (err) {
    console.error("Token not valid!", err);
    throw new Error("Unauthorized");
  }
};

const hashPayload = (payload: Buffer) => {
  return createHash("sha256").update(payload).digest("hex");
};

export const handler: CloudFrontRequestHandler = async (
  event: CloudFrontRequestEvent
) => {
  console.log("event=" + JSON.stringify(event));
  const request = event.Records[0].cf.request;

  const getHeaderValue = (headerName: string) => {
    const header = request.headers[headerName.toLowerCase()];
    if (header) {
      return header[0].value;
    } else if (request.origin?.custom?.customHeaders) {
      const customHeader =
        request.origin.custom.customHeaders[headerName.toLowerCase()];
      return customHeader ? customHeader[0].value : undefined;
    }
    return undefined;
  };

  const userPoolRegion = getHeaderValue("X-User-Pool-Region")!;
  const userPoolId = getHeaderValue("X-User-Pool-Id")!;
  const clientId = getHeaderValue("X-User-Pool-App-Id")!;

  const token = extractToken(request);
  verifyToken(token, userPoolId, clientId, userPoolRegion);

  const body = request.body?.data ?? "";

  if (request.body) {
    request.body.data = body.slice(0, 100);
    console.log(`size of the body: ${body.length}`);
  }
  console.log("request=" + JSON.stringify(request));

  const hashedBody = hashPayload(Buffer.from(body, "base64"));

  request.headers["x-amz-content-sha256"] = [
    { key: "x-amz-content-sha256", value: hashedBody },
  ];
  console.log(hashedBody);

  // LWA replaces authorization2 to authorization again
  if (request.headers["authorization"] != null) {
    request.headers["authorization2"] = [
      {
        key: "authorization2",
        value: request.headers["authorization"][0].value,
      },
    ];
    delete request.headers["authorization"];
  }

  if (request.body) {
    request.body.data = body;
  }

  return request;
};
