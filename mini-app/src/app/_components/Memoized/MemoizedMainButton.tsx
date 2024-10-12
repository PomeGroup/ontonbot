import React, { memo } from "react";
import MainButton from "@/app/_components/atoms/buttons/web-app/MainButton";

interface MainButtonProps {
  text: string;
  onClick: () => void;
}

// Memoize MainButton to prevent re-renders
const MemoizedMainButton = memo(({ text, onClick }: MainButtonProps) => (
  <MainButton
    text={text}
    onClick={onClick}
  />
));

// Set display name for better debugging
MemoizedMainButton.displayName = "MemoizedMainButton";

export default MemoizedMainButton;
