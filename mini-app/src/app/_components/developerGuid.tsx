"use client";

import useWebApp from "@/hooks/useWebApp";
import { trpc } from "../_trpc/client";

const DeveloperGuid = () => {
    const webApp = useWebApp();

    const { data: user, isLoading: userLoading } = trpc.users.getUser.useQuery(
        { init_data: webApp?.initData || "" },
        { enabled: Boolean(webApp?.initData) }
    );

    if (userLoading) return
    return (
        <div className="text-sm z-50 top-20 flex">
            <div>role: </div>
            <div>{user?.role}</div>
            <br />
            <div></div>
            <div></div>
        </div>
    )
}

export default DeveloperGuid