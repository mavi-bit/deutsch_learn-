import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { Spinner } from "./components/ui";
import { useAuth } from "./context/AuthContext";
import AIChat from "./pages/AIChat";
import Dashboard from "./pages/Dashboard";
import Grammar from "./pages/Grammar";
import LessonDetail from "./pages/LessonDetail";
import Lessons from "./pages/Lessons";
import Login from "./pages/Login";
import Progress from "./pages/Progress";
import SettingsPage from "./pages/SettingsPage";
import Speaking from "./pages/Speaking";
import Vocabulary from "./pages/Vocabulary";
import VoiceTeacher from "./pages/VoiceTeacher";

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Routes><Route path="*" element={<Login />} /></Routes>;
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="lessons" element={<Lessons />} />
        <Route path="lessons/:id" element={<LessonDetail />} />
        <Route path="chat" element={<AIChat />} />
        <Route path="live" element={<VoiceTeacher />} />
        <Route path="speaking" element={<Speaking />} />
        <Route path="vocabulary" element={<Vocabulary />} />
        <Route path="grammar" element={<Grammar />} />
        <Route path="progress" element={<Progress />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );
}
