import { ReactNode } from 'react';
import { ThemeProvider } from './ThemeContext';
import { UIProvider } from './UIContext';
import { AuthProvider } from './AuthContext';
import { GamesProvider } from './GamesContext';

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <UIProvider>
        <AuthProvider>
          <GamesProvider>
            {children}
          </GamesProvider>
        </AuthProvider>
      </UIProvider>
    </ThemeProvider>
  );
}

export { useTheme } from './ThemeContext';
export { useUI } from './UIContext';
export { useAuth } from './AuthContext';
export { useGames } from './GamesContext';
export type { Game, OnlineDownloadInfo, SyncFileStatus, SyncFile } from './GamesContext';
