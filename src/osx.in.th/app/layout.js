import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthModals } from "@/components/AuthModals";

export const metadata = {
  title: "OSX HUB — Roblox Scripts Shop",
  description: "แหล่งรวมสคริปต์ Roblox คุณภาพสูง ปลอดภัย ทรงพลัง ใช้งานง่าย",
  icons: {
    icon: '/img/NewLogo88 (3).png',
    shortcut: '/img/NewLogo88 (3).png',
    apple: '/img/NewLogo88 (3).png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="th" className="h-full">
      <head>
        {/* Favicon / Web Icon */}
        <link rel="icon" href="/img/NewLogo88 (3).png" type="image/png" />
        <link rel="apple-touch-icon" href="/img/NewLogo88 (3).png" />
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Kanit:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        {/* Font Awesome */}
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />

      </head>
      <body className="min-h-full flex flex-col bg-[#050507] text-[#f4f4f8] antialiased">
        <LanguageProvider>
          <AuthProvider>
            {children}
            <AuthModals />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
