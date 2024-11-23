import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname } from "next/navigation";

interface NavigationHistoryContextType {
  history: string[];
  setHistory: React.Dispatch<React.SetStateAction<string[]>>;
}

const NavigationHistoryContext = createContext<NavigationHistoryContextType | null>(null);

export const useNavigationHistory = (): NavigationHistoryContextType => {
  const context = useContext(NavigationHistoryContext);
  if (!context) {
    throw new Error("useNavigationHistory must be used within a NavigationHistoryProvider");
  }
  return context;
};

interface NavigationHistoryProviderProps {
  children: ReactNode;
}

export const NavigationHistoryProvider: React.FC<NavigationHistoryProviderProps> = ({ children }) => {
  const [history, setHistory] = useState<string[]>([]);
  const pathname = usePathname(); // Get the current route path

  useEffect(() => {
    if (pathname) {
      setHistory((prev) => [...prev, pathname]);
    }
  }, [pathname]);

  return (
    <NavigationHistoryContext.Provider value={{ history, setHistory }}>
      {children}
    </NavigationHistoryContext.Provider>
  );
};
