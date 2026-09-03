"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  User,
  Bell,
  Shield,
  Palette,
  Database,
  Key,
  Globe,
} from "lucide-react";

interface SettingsSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const settingsSections = [
  {
    id: "general",
    label: "General",
    icon: User,
    description: "Basic settings and preferences",
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: Palette,
    description: "Theme and display options",
  },
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    description: "Notification preferences",
  },
  {
    id: "security",
    label: "Security",
    icon: Shield,
    description: "Password and authentication",
  },
  {
    id: "data",
    label: "Data & Privacy",
    icon: Database,
    description: "Data management and privacy",
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: Globe,
    description: "External service connections",
  },
  {
    id: "api",
    label: "API Keys",
    icon: Key,
    description: "API access and keys",
  },
];

export function SettingsSidebar({
  activeSection,
  onSectionChange,
}: SettingsSidebarProps) {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your account and application preferences
        </p>
      </div>

      <nav className="space-y-1">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Button
              key={section.id}
              variant={activeSection === section.id ? "secondary" : "ghost"}
              className={cn(
                "w-full justify-start h-auto p-3",
                activeSection === section.id && "bg-secondary",
              )}
              onClick={() => onSectionChange(section.id)}
            >
              <Icon className="mr-3 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">{section.label}</div>
                <div className="text-xs text-muted-foreground">
                  {section.description}
                </div>
              </div>
            </Button>
          );
        })}
      </nav>
    </div>
  );
}
