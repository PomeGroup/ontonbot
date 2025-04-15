import React from "react";

export interface GemIconProps extends React.SVGAttributes<SVGSVGElement> {}

const GemIcon: React.FC<GemIconProps> = (props) => {
  return (
    <svg
      width={12}
      height={12}
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M3 1.5H9L11 4.5L6 11L1 4.5L3 1.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5.5 1.5L4 4.5L6 11L8 4.5L6.5 1.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M1 4.5H11"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default GemIcon;
