'use client'

import { useMiniApp } from '@tma.js/sdk-react'
import Image from 'next/image'
import { useEffect } from 'react'

export function CommingSoon() {
    const tma = useMiniApp(true)

    useEffect(() => {
        tma?.setBgColor('#ffffff')
        tma?.setHeaderColor('#ffffff')

        document.querySelector('html')?.classList.remove('dark')
        document.querySelector('html')?.classList.add('light')
        return () => {
            document.querySelector('html')?.classList.remove('light')
            document.querySelector('html')?.classList.add('dark')
            tma?.setBgColor('#1C1C1E')
            tma?.setHeaderColor('#1C1C1E')
        }
    }, [tma?.headerColor])

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
            </div>
        </div>
    )
}
