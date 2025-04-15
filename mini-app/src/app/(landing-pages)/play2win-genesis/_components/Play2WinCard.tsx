// src/app/(landing-pages)/play2win-genesis/_components/Play2WinCard.tsx
import React from "react";
import { usePlay2Win } from "./Play2WinContext";
import Play2WinGenesisButton from "./Play2WinGenesisButton";

const Play2WinCard: React.FC = () => {
  const { nftReserved, contest } = usePlay2Win();

  return (
    <div className="flex flex-col gap-2 w-full">
      <Play2WinGenesisButton disabled={contest.noGame}>Play Game</Play2WinGenesisButton>
      <p className="text-white text-center">
        <span>{nftReserved} </span>
        <span className="italic">NFTs reserved so far (accumulated)</span>
      </p>
    </div>
  );
};

export default Play2WinCard;
