import { createContext, useContext, useState, useCallback } from 'react';

const TopbarCtx = createContext({ title: '', subtitle: '', actions: null, setTopbar: () => {} });

export function TopbarProvider({ children }) {
  const [state, setState] = useState({ title: '', subtitle: '', actions: null });
  const setTopbar = useCallback(
    (updates) => setState((prev) => ({ ...prev, ...updates })),
    [],
  );
  return (
    <TopbarCtx.Provider value={{ ...state, setTopbar }}>
      {children}
    </TopbarCtx.Provider>
  );
}

export function useTopbar() {
  return useContext(TopbarCtx);
}
