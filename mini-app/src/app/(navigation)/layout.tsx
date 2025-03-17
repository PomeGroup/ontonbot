"use client";
import BottomNavigation from "@/components/BottomNavigation";
import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return <BottomNavigation>{children}</BottomNavigation>;
}
