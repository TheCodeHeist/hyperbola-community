"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface SettingsContextType {
  isOpen: boolean;
  activeSection: string;
  openSettings: (section?: string) => void;
  closeSettings: () => void;
  setActiveSection: (section: string) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("general");

  const openSettings = (section = "general") => {
    setActiveSection(section);
    setIsOpen(true);
  };

  const closeSettings = () => {
    setIsOpen(false);
  };

  return (
    <SettingsContext.Provider
      value={{
        isOpen,
        activeSection,
        openSettings,
        closeSettings,
        setActiveSection,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}