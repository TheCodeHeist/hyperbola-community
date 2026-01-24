import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { attachment } from "@/lib/schema";

const s3 = new S3Client({
  region: "as-south-1",
  endpoint: "https://localhost:9000",
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER!,
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD!,
  },
  forcePathStyle: true, // Required for MinIO
});

export async function POST(request: Request) {
  const session = await auth.api.getSession(request);

  if (!session) return new Response("Unauthorized Operation", { status: 401 });

  const {
    fileName,
    mimeType,
    entityId,
    entityType,
    fileSize,
  }: {
    fileName: string;
    mimeType: string;
    entityId: string;
    entityType: string;
    fileSize?: number;
  } = await request.json();

  const key = `${session.user.id}/${entityType}/${entityId}/${crypto.randomUUID()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: "hyperbola-uploads",
    Key: key,
    ContentType: mimeType,
  });

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour expiration

  // Create attachment record in database
  const attachmentRecord = await db
    .insert(attachment)
    .values({
      fileKey: key,
      fileName,
      mimeType,
      fileSize,
      entityType,
      entityId,
      uploadedBy: session.user.id,
    })
    .returning();

  return new Response(
    JSON.stringify({
      uploadUrl: signedUrl,
      fileKey: key,
      attachmentId: attachmentRecord[0].id,
    }),
    { status: 200 },
  );
}
