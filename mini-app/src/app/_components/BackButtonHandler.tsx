import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useNavigationHistory } from "@/context/NavigationHistoryContext";
import useWebApp from "@/hooks/useWebApp";

const BackButtonHandler: React.FC = () => {
    const router = useRouter();
    const pathname = usePathname(); // Get the current path
    const { history, setHistory } = useNavigationHistory();
    const webApp = useWebApp();

    useEffect(() => {
        if (webApp) {

            if (pathname === "/") {
                webApp.BackButton.hide();
            } else {
                webApp.BackButton.show();
                const handleBackButtonClick = () => {
                    window.history.back()
                    return false;
                };

                webApp.BackButton.onClick(handleBackButtonClick);
                // Clean up the event listener on unmount
                return () => {
                    webApp.BackButton.offClick(handleBackButtonClick);
                };
            }
        }
    }, [pathname, history, setHistory, webApp, router]);

    return null; // This component doesn't render anything
};

export default BackButtonHandler;
