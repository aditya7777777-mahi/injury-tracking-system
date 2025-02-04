import { Geist } from "next/font/google";
import "./globals.css";
import Providers from '@/components/Providers';
const geist = Geist({
  subsets: ["latin"],
});

export const metadata = {
  title: "Injury Tracking System",
  description: "Track and manage injury reports",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={geist.className} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          <div className="root-container">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
