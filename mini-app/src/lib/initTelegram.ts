import { init } from '@telegram-apps/sdk-react'

let initialized = false

export default function initTelegram() {
  if (initialized) return

  init()
  initialized = true
}
