import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";

type Ctx = {
  helpOpen: boolean;
  setHelpOpen: Dispatch<SetStateAction<boolean>>;
  openHelp: () => void;
};

const HelpContext = createContext<Ctx | null>(null);

export function HelpProvider({ children }: { children: React.ReactNode }) {
  const [helpOpen, setHelpOpen] = useState(false);
  const openHelp = useCallback(() => setHelpOpen(true), []);
  const v = useMemo(
    () => ({ helpOpen, setHelpOpen, openHelp }),
    [helpOpen, openHelp],
  );
  return (
    <HelpContext.Provider value={v}>{children}</HelpContext.Provider>
  );
}

export function useHelp() {
  const ctx = useContext(HelpContext);
  if (!ctx) {
    throw new Error("useHelp must be used under HelpProvider");
  }
  return ctx;
}
