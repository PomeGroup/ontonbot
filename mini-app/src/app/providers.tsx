'use client'

import { SDKProvider } from '@tma.js/sdk-react'
import { TonConnectUIProvider } from '@tonconnect/ui-react'
import { ThemeProvider } from 'next-themes'
import React from 'react'
import ThemeSetter from './themeSetter'

const Providers = ({ children }: { children: React.ReactNode }) => {
    return (
        <div>
            <SDKProvider>
                <TonConnectUIProvider
                    actionsConfiguration={{
                        twaReturnUrl: `https://t.me/${
                            process.env.NODE_ENV === 'development'
                                ? process.env.BOT_USERNAME
                                : 'theontonbot'
                        }/event`,
                    }}
                    manifestUrl="https://gist.githubusercontent.com/nichitagutu/3cc22ee9749e77222c38313de47c94bc/raw/f37de28e672932101702f841d02d7414b93ca9ac/tonconnect-manifest.json"
                >
                    <ThemeProvider attribute="class">
                        <ThemeSetter>{children}</ThemeSetter>
                    </ThemeProvider>
                </TonConnectUIProvider>
            </SDKProvider>
        </div>
    )
}

export default Providers
