"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { attachment } from "@/lib/schema";
import { headers } from "next/headers";

const s3 = new S3Client({
  region: "as-south-1",
  endpoint: process.env.MINIO_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.MINIO_ROOT_USER!,
    secretAccessKey: process.env.MINIO_ROOT_PASSWORD!,
  },
  forcePathStyle: true, // Required for MinIO
});

async function getTeacherId() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) throw new Error("Unauthorized Operation");

  return session.user.id;
}

export async function uploadAttachment(params: {
  fileName: string;
  mimeType: string;
  entityId: string;
  entityType: string;
  fileSize?: number;
}) {
  const teacherId = await getTeacherId();

  const key = `${teacherId}/${params.entityType}/${params.entityId}/${crypto.randomUUID()}-${params.fileName}`;

  const command = new PutObjectCommand({
    Bucket: "hyperbola-uploads",
    Key: key,
    ContentType: params.mimeType,
  });

  const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour expiration

  // Create attachment record in database
  const attachmentRecord = await db
    .insert(attachment)
    .values({
      fileKey: key,
      fileName: params.fileName,
      mimeType: params.mimeType,
      fileSize: params.fileSize,
      entityType: params.entityType,
      entityId: params.entityId,
      uploadedBy: teacherId,
    })
    .returning();

  return {
    uploadUrl: signedUrl,
    fileKey: key,
    attachment: attachmentRecord[0],
  };
}

export async function softDeleteAttachment(attachmentId: number) {
  const teacherId = await getTeacherId();

  const [attachmentRecord] = await db
    .select()
    .from(attachment)
    .where(eq(attachment.id, attachmentId))
    .limit(1);

  if (!attachmentRecord) throw new Error("Attachment not found");

  if (attachmentRecord.uploadedBy !== teacherId)
    throw new Error("Unauthorized Operation");

  await db
    .update(attachment)
    .set({ deletedAt: new Date() })
    .where(and(eq(attachment.id, attachmentId), isNull(attachment.deletedAt)));

  revalidatePath(`/attachments/${attachmentId}`);

  return { success: true, message: "Attachment marked as deleted" };
}

export async function hardDeleteAttachment(attachmentId: number) {
  const teacherId = await getTeacherId();

  const [attachmentRecord] = await db
    .select()
    .from(attachment)
    .where(eq(attachment.id, attachmentId))
    .limit(1);

  if (!attachmentRecord) throw new Error("Attachment not found");

  if (attachmentRecord.uploadedBy !== teacherId)
    throw new Error("Unauthorized Operation");

  try {
    const command = new DeleteObjectCommand({
      Bucket: "hyperbola-uploads",
      Key: attachmentRecord.fileKey,
    });

    await s3.send(command);
  } catch (error) {
    console.error("MinIO delete failed:", error);
    throw new Error("Failed to delete attachment from storage");
  }

  await db.delete(attachment).where(eq(attachment.id, attachmentId));

  revalidatePath(`/attachments/${attachmentId}`);

  return { success: true, message: "Attachment permanently deleted" };
}
