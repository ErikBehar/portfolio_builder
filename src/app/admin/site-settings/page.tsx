import Link from "next/link";
import { AdminBackupPanel } from "@/components/AdminBackupPanel";
import { AdminSiteSettingsForm } from "@/components/AdminSiteSettingsForm";
import { getSiteSettings } from "@/lib/siteSettings";

export default async function AdminSiteSettingsPage() {
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-10">
        <p className="mb-2 text-sm uppercase tracking-[0.2em] text-accent">
          Admin
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Site settings</h1>
        <p className="mt-2 text-muted">
          Update site branding, homepage styling, footer text, and comment settings.
        </p>
      </header>

      <AdminSiteSettingsForm
        key={`${settings.updatedAt}-${settings.footerText}-${settings.commentsEnabled}-${settings.projectCommentsEnabled}-${settings.commentsVisible}-${settings.projectCommentsVisible}-${settings.homeHeaderColor}-${settings.siteTitleColor}`}
        settings={settings}
      />

      <AdminBackupPanel />

      <p className="mt-10 text-sm text-muted">
        <Link href="/admin" className="text-accent underline-offset-4 hover:underline">
          ← Back to admin
        </Link>
      </p>
    </div>
  );
}
