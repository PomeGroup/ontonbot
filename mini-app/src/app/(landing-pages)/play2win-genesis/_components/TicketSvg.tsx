import React, { SVGProps } from "react";

const TicketSvg: React.FC<SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      width="138"
      height="128"
      viewBox="0 0 138 128"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <pattern
          id="imgpattern"
          patternUnits="userSpaceOnUse"
          width="138"
          height="128"
        >
          <image
            href="https://storage.onton.live/ontonimage/play-2-win-genesis-ticket.png"
            x="0"
            y="0"
            width="138"
            height="128"
            preserveAspectRatio="xMidYMid slice"
          />
        </pattern>
      </defs>
      <path
        d="M0.428779 10C0.428779 4.47715 4.90593 0 10.4288 0H127.571C133.094 0 137.571 4.47715 137.571 10V31.4667C137.571 31.4667 137.571 31.4667 137.571 31.4667C137.571 31.4669 137.571 45.8667 137.571 48C137.572 49.2729 134.681 54.723 132.349 58.9123C130.589 62.0724 130.589 65.9276 132.349 69.0877C134.681 73.277 137.572 78.7271 137.571 80C137.571 82.1333 137.571 95.9998 137.571 96C137.571 96 137.571 96 137.571 96V118C137.571 123.523 133.094 128 127.571 128H10.4288C4.90594 128 0.428779 123.523 0.428779 118V96C0.428779 96 0.428779 96 0.428779 96C0.428779 95.9997 0.428738 82.1333 0.428779 80C0.428804 78.7271 3.31971 73.277 5.65171 69.0877C7.41079 65.9276 7.41079 62.0724 5.6517 58.9123C3.3197 54.723 0.428779 49.2729 0.428779 48C0.428779 45.8667 0.428779 31.4667 0.428779 31.4667C0.428779 31.4667 0.428779 31.4667 0.428779 31.4667V10Z"
        fill="url(#imgpattern)"
      />
    </svg>
  );
};

export default TicketSvg;
