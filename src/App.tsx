import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import Layout from "./components/Layout"
import CapturePage from "./pages/CapturePage"
import IdeaDetailPage from "./pages/IdeaDetailPage"
import LibraryPage from "./pages/LibraryPage"
import SettingsPage from "./pages/SettingsPage"
import WeeklyReviewPage from "./pages/WeeklyReviewPage"
import { startOfflineSyncRunner } from './services/offline'
import { useSession } from './hooks/useSession'


export default function App() {
  const { loading } = useSession()

  useEffect(() => {
    startOfflineSyncRunner()
  }, [])

  // Show loading while authenticating
  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: '#6B7280' }}>正在初始化...</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/capture" replace />} />
          <Route path="capture" element={<CapturePage />} />
          <Route path="library" element={<LibraryPage />} />
          <Route path="review" element={<WeeklyReviewPage />} />
          <Route path="idea/:id" element={<IdeaDetailPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/capture" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
