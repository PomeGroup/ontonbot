import React from "react";

interface IconProps extends React.SVGProps<SVGSVGElement> {}

const PromotionCodeIcon: React.FC<IconProps> = (props) => {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 41 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M15.5 25L25.5 15"
        stroke="currentcolor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="16.3333"
        cy="15.8333"
        r="0.833333"
        fill="currentcolor"
        stroke="currentcolor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="24.6668"
        cy="24.1666"
        r="0.833333"
        fill="currentcolor"
        stroke="currentcolor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M8.83313 12C8.83313 9.97499 10.4747 8.33337 12.4998 8.33337H14.1665C15.1346 8.33282 16.0633 7.94937 16.7498 7.2667L17.9165 6.10004C18.6047 5.40794 19.5404 5.0188 20.5165 5.0188C21.4925 5.0188 22.4282 5.40794 23.1165 6.10004L24.2831 7.2667C24.9696 7.94937 25.8983 8.33282 26.8665 8.33337H28.5331C30.5582 8.33337 32.1998 9.97499 32.1998 12V13.6667C32.2003 14.6349 32.5838 15.5635 33.2665 16.25L34.4331 17.4167C35.1252 18.1049 35.5144 19.0407 35.5144 20.0167C35.5144 20.9927 35.1252 21.9285 34.4331 22.6167L33.2665 23.7834C32.5838 24.4699 32.2003 25.3985 32.1998 26.3667V28.0334C32.1998 30.0584 30.5582 31.7 28.5331 31.7H26.8665C24.9696 31.7006 24.0831 32.084 24.2831 32.7667L23.1165 33.9334C22.4282 34.6255 21.4925 35.0146 20.5165 35.0146C19.5404 35.0146 18.6047 34.6255 17.9165 33.9334L16.7498 32.7667C16.0633 32.084 15.1346 31.7006 14.1665 31.7H12.4998C10.4747 31.7 8.83313 30.0584 8.83313 28.0334V26.3667C8.83257 25.3985 8.44913 24.4699 7.76646 23.7834L6.59979 22.6167C5.9077 21.9285 5.51855 20.9927 5.51855 20.0167C5.51855 19.0407 5.9077 18.1049 6.59979 17.4167L7.76646 16.25C8.44913 15.5635 8.83257 14.6349 8.83313 13.6667V12"
        stroke="currentcolor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default PromotionCodeIcon;
