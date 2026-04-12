import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { render } from "@react-email/components";
import { DigestEmail } from "@/emails/DigestEmail";
import { DigestResult } from "@/lib/digest";

const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

interface SendDigestEmailParams {
  toEmail: string;
  instanceName: string;
  chunkIndex: number;
  totalChunks: number;
  digest: DigestResult;
}

export async function sendDigestEmail({
  toEmail,
  instanceName,
  chunkIndex,
  totalChunks,
  digest
}: SendDigestEmailParams): Promise<void> {
  const html = await render(
    DigestEmail({
      instanceName,
      chunkIndex,
      totalChunks,
      digest,
      userEmail: toEmail
    })
  );

  const command = new SendEmailCommand({
    Source: process.env.SES_FROM_EMAIL!,
    Destination: {
      ToAddresses: [toEmail]
    },
    Message: {
      Subject: {
        Data: digest.subject,
        Charset: "UTF-8"
      },
      Body: {
        Html: {
          Data: html,
          Charset: "UTF-8"
        }
      }
    }
  });

  await sesClient.send(command);
}
