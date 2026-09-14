import { SettingsView } from "@/components/settings/SettingsView";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-1 pt-6 pb-[calc(1.5rem+var(--bottom-nav-space))]">
      <SettingsView />
    </div>
  );
}
