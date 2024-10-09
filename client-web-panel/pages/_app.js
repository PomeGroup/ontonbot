import React, {useMemo} from 'react';
import App from 'next/app';
// Adjust the import path as needed
import '@/styles/remixicon.css'
import 'react-tabs/style/react-tabs.css';
import "swiper/css";
import "swiper/css/bundle";


// Chat Styles
import '@/styles/chat.css'
// Globals Styles
import '@/styles/globals.css'
// Rtl Styles
import '@/styles/rtl.css'
// Dark Mode Styles
import '@/styles/dark.css'

// Theme Styles
import theme from '@/styles/theme'

import {ThemeProvider, CssBaseline} from "@mui/material";
import Layout from "@/components/_App/Layout";
import {Provider} from 'react-redux';
import {store, Persistor} from '@/redux/store'; // import store and persistor from your store file
import {PersistGate} from 'redux-persist/integration/react';
import I18nProvider from 'next-translate/I18nProvider';
import loadNamespaces from 'next-translate/loadNamespaces';
// import useInvalidateTags from '@/hooks/useInvalidateTags';
const MyApp = ({Component, pageProps}) => {
  // useInvalidateTags();
// console.log(process.env.NEXT_PUBLIC_BACKEND_URL)
  return (
    <>
      {/* Redux Provider */}
      <Provider store={store}>
        <PersistGate loading={null} persistor={Persistor}>
          <ThemeProvider theme={theme}>
            <CssBaseline/>
            <I18nProvider lang={pageProps._lang} namespaces={pageProps._ns}>
              <Layout>
                <Component {...pageProps} />
              </Layout>
            </I18nProvider>
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </>
  );
}


export default MyApp;
