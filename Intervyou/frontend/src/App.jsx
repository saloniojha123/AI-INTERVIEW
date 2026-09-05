

import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import InterviewSetup from "./pages/InterviewSetup.jsx";
import InterviewRoom from "./pages/InterviewRoom.jsx";
import Report from "./pages/Report.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AppShell from "./components/AppShell.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Home />} />
        <Route path="/setup" element={<InterviewSetup />} />
        <Route path="/interview/:sessionId" element={<InterviewRoom />} />
        <Route path="/report/:sessionId" element={<Report />} />
      </Route>
    </Routes>
  );
}