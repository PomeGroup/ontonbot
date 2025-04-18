import React from "react";

export interface TicketIconProps extends React.SVGAttributes<SVGSVGElement> {}

const TicketIcon: React.FC<TicketIconProps> = (props) => {
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
        d="M1 4.5C1.39782 4.5 1.77936 4.65804 2.06066 4.93934C2.34197 5.22064 2.5 5.60218 2.5 6C2.5 6.39783 2.34197 6.77936 2.06066 7.06066C1.77936 7.34197 1.39782 7.5 1 7.5V8.5C1 8.76522 1.10536 9.01957 1.29289 9.20711C1.48043 9.39464 1.73478 9.5 2 9.5H10C10.2652 9.5 10.5196 9.39464 10.7071 9.20711C10.8946 9.01957 11 8.76522 11 8.5V7.5C10.6022 7.5 10.2206 7.34197 9.93934 7.06066C9.65804 6.77936 9.5 6.39783 9.5 6C9.5 5.60218 9.65804 5.22064 9.93934 4.93934C10.2206 4.65804 10.6022 4.5 11 4.5V3.5C11 3.23478 10.8946 2.98043 10.7071 2.79289C10.5196 2.60536 10.2652 2.5 10 2.5H2C1.73478 2.5 1.48043 2.60536 1.29289 2.79289C1.10536 2.98043 1 3.23478 1 3.5V4.5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 2.5V3.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 8.5V9.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.5 5.5V6.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export default TicketIcon;
