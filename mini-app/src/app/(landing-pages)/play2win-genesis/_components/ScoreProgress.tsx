"use client";
export default function ScoreProgress() {
  return (
    <div className="text-center flex flex-col gap-2">
      <span className="text-white">your best score: 1,280</span>
      <div className="h-1 bg-[#0f2a45] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#51AEFF] rounded-full"
          style={{ width: "85%" }}
        ></div>
      </div>
      <p className="text-[#8e8e93] text-sm">just 220 more to go. Try again!</p>
    </div>
  );
}
