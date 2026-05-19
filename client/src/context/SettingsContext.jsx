import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/axios';

const SettingsCtx = createContext({ settingsIncomplete: false, refreshSettingsStatus: () => {} });

export function SettingsProvider({ children }) {
  const [settingsIncomplete, setSettingsIncomplete] = useState(false);

  const refreshSettingsStatus = useCallback(() => {
    api.get('/settings').then((res) => {
      const s = res.data;
      setSettingsIncomplete(
        !s.mealTypes?.length ||
        !s.timezone ||
        s.mealTypes.some((mt) => !mt.cutoffTime),
      );
    }).catch(() => {});
  }, []);

  return (
    <SettingsCtx.Provider value={{ settingsIncomplete, refreshSettingsStatus }}>
      {children}
    </SettingsCtx.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsCtx);
}
