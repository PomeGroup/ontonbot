"use client";

import useWebApp from "@/hooks/useWebApp";

const ModalsContainer = () => {
  const webApp = useWebApp();

  return (
    /* this div (#modals-sheet) is used for modals do not remove this */
    <div
      className="absolute"
      id="modals-sheet"
      style={{ height: webApp?.viewportHeight || 0 }}
    />
  );
};

export default ModalsContainer;
