"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSettings } from "@/lib/settings-context";

export default function SettingsPage() {
  const router = useRouter();
  const { openSettings } = useSettings();

  useEffect(() => {
    // Open settings modal and redirect to dashboard
    openSettings();
    router.replace("/dashboard");
  }, [openSettings, router]);

  return null; // This page will redirect, so no content needed
}