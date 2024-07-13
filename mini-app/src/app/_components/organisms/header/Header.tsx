'use client'

import React from 'react'
import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useHapticFeedback } from '@tma.js/sdk-react'

const Header = () => {
  const { theme } = useTheme()
  const hapticFeedback = useHapticFeedback(true)
  let imageSuffix = '-white'

  if (theme === 'light') {
    imageSuffix = ''
  }

  return (
    <header className="pb-4 flex justify-between">
      <div className="flex" onClick={
        () => {
          hapticFeedback?.impactOccurred('light')
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
