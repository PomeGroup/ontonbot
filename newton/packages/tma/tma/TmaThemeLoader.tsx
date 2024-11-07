import { useEffect, type ReactNode } from "react";
import { useMiniApp } from "@tma.js/sdk-react";

const TmaThemeLoader = ({
  children,
  bgColor,
  headerColor,
}: {
  children: ReactNode;
  bgColor: `#${string}`;
  headerColor: `#${string}`;
}) => {
  const tma = useMiniApp(true);

  useEffect(() => {
    tma?.setBgColor(bgColor);
    tma?.setHeaderColor(headerColor);
    tma?.ready();
  }, [tma?.bgColor, tma?.headerColor]);

  return children;
};

export default TmaThemeLoader;
