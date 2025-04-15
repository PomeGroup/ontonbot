"use client";

import { usePlay2Win } from "./Play2WinContext";

export default function ScoreProgress() {
  const { userScore, maxScore, userPlayed } = usePlay2Win();
  const percent = Math.min(Math.max((userScore / maxScore) * 100, 0), 100);

  const scoreDiff =
    userScore >= maxScore
      ? "Congratulations! You've reached the maximum score."
      : `just ${maxScore - userScore} more to go. Try again!`;

  if (!userPlayed) {
    return null;
  }

  return (
    <div className="text-center flex flex-col gap-2">
      <span className="text-white">your best score: {userScore}</span>
      <div className="h-1 bg-[#0f2a45] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#51AEFF] rounded-full"
          style={{ width: `${percent}%` }}
        ></div>
      </div>
      <p className="text-[#8e8e93] text-sm">{scoreDiff} </p>
    </div>
  );
}
