import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PageViewTracker } from "@/components/PageViewTracker";
import { COOKIE_NAME, verifyAdminToken } from "@/lib/auth";
import { getHeaderLinks } from "@/lib/headerLinks";
import { getSections } from "@/lib/sections";
import { getSiteSettings } from "@/lib/siteSettings";
import { themeColorsToCssVars } from "@/lib/themeColors";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();

  return {
    title: settings.title,
    description: settings.description,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const isAdmin = await verifyAdminToken(cookieStore.get(COOKIE_NAME)?.value);

  const [sections, headerLinks, siteSettings] = await Promise.all([
    getSections(),
    getHeaderLinks(),
    getSiteSettings(),
  ]);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={themeColorsToCssVars(siteSettings.themeColors)}
    >
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <SiteHeader
          sections={sections}
          headerLinks={headerLinks}
          siteTitle={siteSettings.title}
          siteTitleColor={siteSettings.siteTitleColor}
          isAdmin={isAdmin}
        />
        <main className="flex-1">{children}</main>
        <SiteFooter footerText={siteSettings.footerText} />
        <PageViewTracker />
      </body>
    </html>
  );
}
