"use client";
import { AuthUIProvider } from "@daveyplate/better-auth-ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { authClient } from "@/lib/auth-client";
import { SettingsProvider } from "@/lib/settings-context";
import Image from "next/image";
import { ThemeProvider } from "../components/theme-provider";

export function Providers({ children }: { children: ReactNode }) {
  const router = useRouter();

  const handleAvatarUpload = async (file: File): Promise<string | null> => {
    try {
      // Get upload URL from avatar-specific API
      const response = await fetch("/api/avatar/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get upload URL");
      }

      const { uploadUrl, fileKey } = await response.json();

      // Upload file to MinIO
      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      return fileKey; // Return the file key for storage
    } catch (error) {
      console.error("Avatar upload failed:", error);
      return null;
    }
  };

  const handleAvatarDelete = async (url?: string): Promise<void> => {
    try {
      const response = await fetch("/api/avatar/delete", {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete avatar");
      }
    } catch (error) {
      console.error("Avatar delete failed:", error);
      throw error; // Re-throw to let the UI handle the error
    }
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SettingsProvider>
        <AuthUIProvider
          authClient={authClient}
          navigate={router.push}
          replace={router.replace}
          onSessionChange={() => {
            router.refresh();
          }}
          Link={Link}
          gravatar={{
            size: 512,
          }}
          avatar={{
            upload: handleAvatarUpload,
            delete: handleAvatarDelete,
          }}
          account={{
            basePath: "/dashboard",
            fields: ["image", "name"],
          }}
          twoFactor={["totp"]}
          passkey
          changeEmail
          deleteUser
        >
          {children}
        </AuthUIProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}
