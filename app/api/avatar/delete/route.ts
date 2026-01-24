import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/lib/auth-schema";
import { eq } from "drizzle-orm";

export async function DELETE(request: Request) {
  try {
    const session = await auth.api.getSession(request);

    if (!session) {
      return new Response("Unauthorized Operation", { status: 401 });
    }

    const userId = session.user.id;

    // Get current user's profile picture key
    const [userRecord] = await db
      .select({ profilePictureKey: user.profilePictureKey })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userRecord?.profilePictureKey) {
      return new Response("No avatar to delete", { status: 404 });
    }

    // Clear user's profile picture key first
    await db
      .update(user)
      .set({ profilePictureKey: null })
      .where(eq(user.id, userId));

    // Note: The attachment record will remain in the database with deletedAt timestamp
    // This is handled by the soft delete functionality in the attachments actions

    return new Response(
      JSON.stringify({
        success: true,
        message: "Avatar deleted successfully",
      }),
      { status: 200 },
    );
  } catch (error) {
    console.error("Avatar delete error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}