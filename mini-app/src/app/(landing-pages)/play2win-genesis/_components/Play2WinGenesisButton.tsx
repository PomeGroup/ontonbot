import { Button } from "@/components/ui/button";
import React from "react";

interface Play2WinButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const Play2WinGenesisButton: React.FC<Play2WinButtonProps> = ({ children, ...props }) => (
  <Button
    className="w-full text-lg font-bold rounded-[10px] bg-transparent text-white border-2 border-[#3485FE] hover:bg-[#3485FE]/10 hover:text-white p-[7px]"
    variant="outline"
    type="button"
    {...props}
  >
    {children}
  </Button>
);

export default Play2WinGenesisButton;
