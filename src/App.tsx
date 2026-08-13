import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { RequireAccount } from './components/auth/RequireAccount';
import { HomePage } from './pages/HomePage';
import { ArchiveDetailPage } from './pages/ArchiveDetailPage';
import { AuthPage } from './pages/AuthPage';
import { GamePage } from './pages/GamePage';
import { SetupPage } from './pages/SetupPage';
import { MapPage } from './pages/MapPage';
import { PlaySelectionPage } from './pages/PlaySelectionPage';
import { ProductPage } from './pages/ProductPage';
import { ProfilePage } from './pages/ProfilePage';
import { TreasuresPage } from './pages/TreasuresPage';
import { TutorialPage } from './pages/TutorialPage';
import { WelcomePage } from './pages/WelcomePage';
import { useAccountStore } from './stores/useAccountStore';
import { useGameStore } from './stores/useGameStore';

export default function App(): JSX.Element {
  useEffect(() => {
    void useAccountStore.getState().initializeAuthSession().then(() => {
      useGameStore.getState().restoreMatch();
    });
  }, []);

  return (
    <Routes>
      <Route path="/" element={<WelcomePage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/play" element={<PlaySelectionPage />} />
      <Route
        path="/profile"
        element={
          <RequireAccount>
            <ProfilePage />
          </RequireAccount>
        }
      />
      <Route
        path="/game"
        element={
          <RequireAccount>
            <GamePage />
          </RequireAccount>
        }
      />
      <Route path="/map" element={<MapPage />} />
      <Route
        path="/setup"
        element={
          <RequireAccount>
            <SetupPage />
          </RequireAccount>
        }
      />
      <Route path="/tutorial" element={<TutorialPage />} />
      <Route path="/treasures" element={<TreasuresPage />} />
      <Route path="/treasures/:archiveId" element={<ArchiveDetailPage />} />
      <Route path="/product" element={<ProductPage />} />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  );
}
