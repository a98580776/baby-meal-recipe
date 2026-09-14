import { SettingsView } from "@/components/settings/SettingsView";

export default function SettingsPage() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-6 pt-6 pb-[calc(1.5rem+var(--bottom-nav-space))]">
      <SettingsView />
    </div>
  );
}
