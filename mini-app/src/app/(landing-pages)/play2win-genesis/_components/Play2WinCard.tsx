import { Button } from "@/components/ui/button";
import React from "react";

const Play2WinCard: React.FC = () => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <Button
        className="w-full text-xl font-semibold rounded-[10px] bg-transparent text-white border-2 border-[#3485FE] py-3 hover:bg-[#3485FE]/10 hover:text-white"
        variant="outline"
      >
        Play Game
      </Button>
      <p className="text-white text-center">
        <span>66 </span>
        <span className="italic">NFTs reserved so far (accumulated)</span>
      </p>
    </div>
  );
};

export default Play2WinCard;
