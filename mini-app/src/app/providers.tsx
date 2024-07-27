'use client'

import { TonConnectUIProvider } from '@tonconnect/ui-react'
import { ThemeProvider } from 'next-themes'
import React from 'react'
import ThemeSetter from './themeSetter'
import WebAppProvider from './_components/WebAppProvider'
import { AppRoot } from '@telegram-apps/telegram-ui';

const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <AppRoot>
            <TonConnectUIProvider
                actionsConfiguration={{
                    twaReturnUrl: `https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event`,
                }}
                manifestUrl="https://gist.githubusercontent.com/nichitagutu/3cc22ee9749e77222c38313de47c94bc/raw/f37de28e672932101702f841d02d7414b93ca9ac/tonconnect-manifest.json"
            >
                <ThemeProvider forcedTheme='dark' attribute="class">
                    <WebAppProvider>
                        <ThemeSetter>{children}</ThemeSetter>
                    </WebAppProvider>
                </ThemeProvider>
            </TonConnectUIProvider>
        </AppRoot>
    )
}

export default Providers
