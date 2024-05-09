'use client'

import React from 'react'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import useWebApp from '@/hooks/useWebApp'

const Header = () => {
  const { theme } = useTheme()
  const WebApp = useWebApp()
  let imageSuffix = '-white'

  if (theme === 'light') {
    imageSuffix = ''
  }

  return (
    <header className="pb-4 flex justify-between">
      <div className="flex" onClick={
        () => {
          WebApp?.HapticFeedback.impactOccurred('light')
        }
      }>
        <Image
          className="mr-2 shrink-0"
          src={`/society-logo${imageSuffix}.svg`}
          alt="society logo"
          width={120}
          height={120}
        />
      </div>
    </header>
  )
}

export default Header
