import React from "react";

const Label: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <div className="text-[12px] font-medium text-secondary">{children}</div>
  );
};

export default Label;
