import React, { FC, ReactNode } from "react";
import "./PopupFooterWrapper.module.css";

interface PopupFooterWrapperProps {
  children: ReactNode;
}

const PopupFooterWrapper: FC<PopupFooterWrapperProps> = ({ children }) => {
  return <>{children}</>;
};

export default PopupFooterWrapper;
