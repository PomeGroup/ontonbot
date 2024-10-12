import React, {useEffect, useState} from "react";
import Head from "next/head";
import { useRouter } from 'next/router';
import LeftSidebar from "@/components/_App/LeftSidebar";
import TopNavbar from "@/components/_App/TopNavbar";
import Footer from "@/components/_App/Footer";
import ScrollToTop from "./ScrollToTop";
import ControlPanelModal from "./ControlPanelModal";
import { useSelector } from 'react-redux';
import { selectIsLogin } from '/redux/slices/authSlice';
import useTranslation from "next-translate/useTranslation";

const Layout = ({children}) => {
    const excludedPaths = [
        "/",
        "/sign-in",
        "/sign-up",
        "/forgot-password",
        "/lock-screen",
        "/confirm-mail",
        "/logout"
    ];
    const router = useRouter();
    const isLogin = useSelector(selectIsLogin) ;
    // use translation
    const { t, lang } = useTranslation('common');


    useEffect(() => {
        // Check if on the client-side
        if (typeof window !== 'undefined') {
            if (!isLogin && !excludedPaths.includes(router.pathname)) {
                 router.push("/").then(r => console.log("redirect to login"));
            }
        }
    }, [isLogin, router.pathname]);

    const [active, setActive] = useState(false);

    const toggleActive = () => {
        setActive(!active);
    };


    const needWrapper = !excludedPaths.includes(router.pathname);

    return (
        <>
            <Head>
                <title>
                    {t('OnTon')} - { router.pathname === "/" ? "Login" : router.pathname }
                </title>
                <meta name="viewport" content="initial-scale=1.0, width=device-width"/>
            </Head>

            <div className={ `${ needWrapper && "main-wrapper-content" } ${ active && "active" }` }>
                { (needWrapper) && (
                    <>
                        <TopNavbar toogleActive={ toggleActive }/>

                        <LeftSidebar toogleActive={ toggleActive }/>
                    </>
                ) }

                <div className="main-content">
                    { children }

                    {/*{ (needWrapper) && <Footer/> }*/}
                </div>
            </div>

            {/* ScrollToTop */ }
            <ScrollToTop/>

            { (needWrapper) &&
                <ControlPanelModal/>
            }
        </>
    );
};

export default Layout;
