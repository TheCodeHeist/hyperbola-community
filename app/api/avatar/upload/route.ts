import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/auth-schema";
import { eq } from "drizzle-orm";
import { uploadAttachment } from "@/lib/actions/attachments";

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession(request);

    if (!session) {
      return new Response("Unauthorized Operation", { status: 401 });
    }

    const {
      fileName,
      mimeType,
      fileSize,
    }: {
      fileName: string;
      mimeType: string;
      fileSize?: number;
    } = await request.json();

    // Validate file type (only images for avatars)
    if (!mimeType.startsWith("image/")) {
      return new Response("Only image files are allowed for avatars", {
        status: 400,
      });
    }

    // Validate file size (max 5MB)
    if (fileSize && fileSize > 5 * 1024 * 1024) {
      return new Response("File size must be less than 5MB", { status: 400 });
    }

    const userId = session.user.id;

    // Use the existing uploadAttachment function
    const result = await uploadAttachment({
      fileName,
      mimeType,
      entityId: userId,
      entityType: "user",
      fileSize,
    });

    // Update user's profile picture key
    await db
      .update(user)
      .set({ profilePictureKey: result.fileKey })
      .where(eq(user.id, userId));

    return new Response(
      JSON.stringify({
        uploadUrl: result.uploadUrl,
        fileKey: result.fileKey,
        attachmentId: result.attachment.id,
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Avatar upload error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
