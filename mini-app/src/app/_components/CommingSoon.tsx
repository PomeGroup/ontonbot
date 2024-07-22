'use client'

import { Button } from '@/components/ui/button'
import useWebApp from '@/hooks/useWebApp'
import Image from 'next/image'
import { useEffect } from 'react'

export function CommingSoon() {
    const webApp = useWebApp()

    useEffect(() => {
        webApp?.setBackgroundColor('#ffffff')
        webApp?.setHeaderColor('#ffffff')

        document.querySelector('html')?.classList.remove('dark')
        document.querySelector('html')?.classList.add('light')
        return () => {
            document.querySelector('html')?.classList.remove('light')
            document.querySelector('html')?.classList.add('dark')
            webApp?.setBackgroundColor('#1C1C1E')
            webApp?.setHeaderColor('#1C1C1E')
        }
    }, [webApp?.headerColor])

    return (
        <div className='text-center text-black bg-white'>
            <div className='flex items-center justify-center gap-2'>
                <Image src='/onton-logo.png' width={46} height={46} alt='onton logo' />
                <h1 className='font-bold text-3xl'>ONTON Events</h1>
            </div>
            <div className='flex items-center justify-center flex-col gap-5 py-5'>
                <Image src='/comming-soon.gif' width={194} height={194} alt='comming soon gif' />
                <h1 className='font-bold text-3xl'>Comming Soon</h1>
                <p className='font-bold leading-4'>Discover a World of Events at Your Fingertips</p>
                <Button
                    onClick={() => {
                        webApp?.openTelegramLink(`https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/event?startapp=6acf01ed-3122-498a-a937-329766b459aa`)
                    }}
                className='text-white'>TON Gateway 2024</Button>
            </div>
        </div>
    )
}
