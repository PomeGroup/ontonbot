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
            console.log("********************pathname", pathname);
            if (pathname === "/") {
                webApp.BackButton.hide(); // Hide the back button on the home page
            } else {
                webApp.BackButton.show(); // Show the back button on other pages

                const handleBackButtonClick = () => {
                    if (history.length > 1) {
                        const lastPage = history[history.length - 2];
                        setHistory((prev) => prev.slice(0, -1)); // Remove the last entry from history
                        router.push(lastPage); // Navigate to the last page
                    } else {
                        webApp.close(); // Close the web app if there's no history
                    }
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
