import React from "react";

const FabPlusIcon: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg
      className={className}
      width="64"
      height="64"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect
        x="10"
        y="10"
        width="45"
        height="45"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M32 64C49.6731 64 64 49.6731 64 32C64 14.3269 49.6731 0 32 0C14.3269 0 0 14.3269 0 32C0 49.6731 14.3269 64 32 64ZM36 20C36 17.7909 34.2091 16 32 16C29.7909 16 28 17.7909 28 20V28H20C17.7909 28 16 29.7909 16 32C16 34.2091 17.7909 36 20 36H28V44C28 46.2091 29.7909 48 32 48C34.2091 48 36 46.2091 36 44V36H44C46.2091 36 48 34.2091 48 32C48 29.7909 46.2091 28 44 28H36V20Z"
        fill="currentcolor"
      />
    </svg>
  );
};

export default FabPlusIcon;
