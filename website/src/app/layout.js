import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { Inter } from "next/font/google";
import { GoogleTagManager } from "@next/third-parties/google";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ONton Landing Page",
  description: "ONton - Experience the Future of Event Management",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {process.env.ENV === "poduction" && (
          <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM} />
        )}
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
