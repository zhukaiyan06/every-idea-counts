import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"

import Layout from "./components/Layout"
import CapturePage from "./pages/CapturePage"
import IdeaDetailPage from "./pages/IdeaDetailPage"
import LibraryPage from "./pages/LibraryPage"
import LoginPage from "./pages/LoginPage"
import SettingsPage from "./pages/SettingsPage"
import WeeklyReviewPage from "./pages/WeeklyReviewPage"

export default function App() {
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
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/capture" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
