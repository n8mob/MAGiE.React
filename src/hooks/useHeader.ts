import { useContext } from "react";
import { HeaderContext, HeaderContextType } from "../components/HeaderContext.tsx";

export const useHeader = () => {
  const context: HeaderContextType | undefined = useContext(HeaderContext);
  if (!context) {
    throw new Error("useHeader must be used within a HeaderProvider");
  }
  return context;
};
