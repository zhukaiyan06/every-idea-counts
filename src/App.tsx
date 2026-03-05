import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom"
import { useEffect } from 'react'
import { supabase } from "./lib/supabase"
import { useSession } from "./hooks/useSession"
import Layout from "./components/Layout"
import CapturePage from "./pages/CapturePage"
import IdeaDetailPage from "./pages/IdeaDetailPage"
import LibraryPage from "./pages/LibraryPage"
import LoginPage from "./pages/LoginPage"
import SettingsPage from "./pages/SettingsPage"
import WeeklyReviewPage from "./pages/WeeklyReviewPage"

const ALLOWED_EMAIL = import.meta.env.VITE_ALLOWED_EMAIL

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !session) {
      navigate('/login', { replace: true })
    }
  }, [session, loading, navigate])

  if (loading) {
    return <div>加载中...</div>
  }

  if (!session) {
    return null
  }

  return <>{children}</>
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useSession()

  useEffect(() => {
    if (!loading && session) {
      const userEmail = session.user?.email
      if (userEmail !== ALLOWED_EMAIL) {
        alert('未授权：此账号不允许访问')
        supabase.auth.signOut()
      }
    }
  }, [session, loading])

  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthGate>
        <Routes>
          <Route path="/" element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }>
            <Route index element={<Navigate to="/capture" replace />} />
            <Route path="capture" element={<CapturePage />} />
            <Route path="library" element={<LibraryPage />} />
            <Route path="review" element={<WeeklyReviewPage />} />
            <Route path="idea/:id" element={<IdeaDetailPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/capture" replace />} />
        </Routes>
      </AuthGate>
    </BrowserRouter>
  )
}
