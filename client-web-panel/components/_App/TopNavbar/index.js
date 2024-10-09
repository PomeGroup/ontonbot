import * as React from "react";
import {AppBar, IconButton, Stack, Toolbar, Typography} from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import CurrentDate from "./CurrentDate";
import Link from "next/link";
import useTranslation from 'next-translate/useTranslation'
const TopNavbar = ({toogleActive}) => {
    const { t, lang } = useTranslation('common');
    return (
        <>
            <div className="topNavbarDark">
                <AppBar
                    color="inherit"
                    sx={ {
                        backgroundColor: "#fff",
                        boxShadow: "0px 4px 20px rgba(47, 143, 232, 0.07)",
                        py: "6px",
                        mb: "30px",
                        position: "sticky",
                    } }
                    className="top-navbar-for-dark"
                >
                    <Toolbar>
                        <Tooltip title="Hide/Show" arrow>
                            <IconButton
                                size="sm"
                                edge="start"
                                color="inherit"
                                onClick={ toogleActive }
                            >
                                <i className="ri-align-left"></i>
                            </IconButton>
                        </Tooltip>

                        {/* Search form */ }
                        {/*<SearchForm />*/ }

                        <Typography component="div" sx={ {flexGrow: 1} }></Typography>

                        <Stack direction="row" spacing={ 2 }>
                            <nav>
                                <Link href="/dashboard/" locale="ar">
                                    AR
                                </Link>
                                {" "}/{" "}
                                <Link href="/dashboard/" locale="en">
                                    EN
                                </Link>

                            </nav>
                            {/* CurrentDate */ }
                            <CurrentDate/>

                            {/* Notification */ }
                            {/*<Email />*/ }

                            {/* Notification */ }
                            {/*<Notification />*/ }

                            {/* Profile */ }
                            {/*<Profile />*/ }

                        </Stack>
                    </Toolbar>
                </AppBar>
            </div>
        </>
    );
};

export default TopNavbar;
