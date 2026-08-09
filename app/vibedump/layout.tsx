import type { Metadata, Viewport } from "next";
import PWARegister from "./components/PWARegister";

export const metadata: Metadata = {
  title: "VibeDump | XV Sandra Alicia",
  description:
    "Captura y comparte tu punto de vista del XV de Sandra Alicia.",
  manifest: "/vibedump/manifest.webmanifest",
  icons: {
    icon: [
      {
        url: "/vibedump/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/vibedump/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/vibedump/icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "VibeDump",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#09070d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function VibeDumpLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <PWARegister />
      {children}
    </>
  );
}
