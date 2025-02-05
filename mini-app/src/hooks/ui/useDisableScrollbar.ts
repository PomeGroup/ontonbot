import { useEffect } from "react";

export default function useDisableScrollbar(shouldDisable: boolean) {
  useEffect(() => {
    if (shouldDisable) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "auto";
  }, [shouldDisable]);
}
