import React from "react";
import Play2WinGenesisButton from "./Play2WinGenesisButton";

const Play2WinCard: React.FC = () => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <Play2WinGenesisButton>Play Game</Play2WinGenesisButton>
      <p className="text-white text-center">
        <span>66 </span>
        <span className="italic">NFTs reserved so far (accumulated)</span>
      </p>
    </div>
  );
};

export default Play2WinCard;
