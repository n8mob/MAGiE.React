import { createContext, ReactNode, useState } from "react";

interface HeaderContextType {
  headerContent: ReactNode;
  setHeaderContent: (content: ReactNode) => void;
  stopwatchDisplay: string;
  setStopwatchDisplay: (display: string) => void;
}

export const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider = ({children}: { children: ReactNode }) => {
  const [headerContent, setHeaderContent] = useState<ReactNode>(null);
  const [stopwatchDisplay, setStopwatchDisplay] = useState<string>("");
  return (
    <HeaderContext.Provider value={{headerContent, setHeaderContent, stopwatchDisplay, setStopwatchDisplay}}>
      {children}
    </HeaderContext.Provider>
  );
};

export type { HeaderContextType };
