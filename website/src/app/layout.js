import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ONton | Event Management Platform On TON",
  description:
    "ONton is a revolutionary Soulbound Tokens and event management platform in ton blockchain.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {process.env.ENV !== "production" && (
          <meta name="robots" content="noindex" />
        )}
      </head>

      <body className={inter.className}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
