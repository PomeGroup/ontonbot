import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { Inter } from "next/font/google";
import "./globals.css";
import { headers } from "next/headers"; // Access HTTP headers
import { redirect } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: "ONton Landing Page",
    description: "ONton - Experience the Future of Event Management",
};

export default function RootLayout({ children }) {

    return (
        <html lang="en">
        <body className={inter.className}>
        <Navbar />
        <main>{children}</main>
        <Footer />
        </body>
        </html>
    );
}
