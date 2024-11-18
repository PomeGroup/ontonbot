import React, { ReactNode, createContext, useState } from 'react'

export const TonProofContext = createContext<{ token: string | null, setToken: React.Dispatch<React.SetStateAction<string | null>> | null }>({ token: null, setToken: null })

const TonProofProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);

  return (
    <TonProofContext.Provider value={{ token, setToken }}>
      {children}
    </TonProofContext.Provider>
  )
}

export default TonProofProvider

