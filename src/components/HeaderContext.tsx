import { createContext, ReactNode, useState } from "react";

interface HeaderContextType {
  headerContent: ReactNode;
  setHeaderContent: (content: ReactNode) => void;
}

export const HeaderContext = createContext<HeaderContextType | undefined>(undefined);

export const HeaderProvider = ({children}: { children: ReactNode }) => {
  const [headerContent, setHeaderContent] = useState<ReactNode>(null);
  return (
    <HeaderContext.Provider value={{headerContent, setHeaderContent}}>
      {children}
    </HeaderContext.Provider>
  );
};

export type { HeaderContextType };
