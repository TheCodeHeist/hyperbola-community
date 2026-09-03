"use client";

import { Modal, ModalContent } from "@/components/ui/modal";
import { SettingsSidebar } from "@/components/settings-sidebar";
import { SettingsContent } from "@/components/settings-content";
import { useSettings } from "@/lib/settings-context";

export function SettingsModal() {
  const { isOpen, activeSection, closeSettings, setActiveSection } =
    useSettings();

  return (
    <Modal open={isOpen} onOpenChange={closeSettings}>
      <ModalContent className="max-w-6xl h-[80vh] p-0">
        <div className="flex h-full min-h-0">
          {/* Settings Sidebar */}
          <div className="w-72 border-r bg-muted/10 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto min-h-0">
              <SettingsSidebar
                activeSection={activeSection}
                onSectionChange={setActiveSection}
              />
            </div>
          </div>

          {/* Settings Content */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto min-h-0">
              <SettingsContent activeSection={activeSection} />
            </div>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
