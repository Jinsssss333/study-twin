import { Toaster } from "@/components/ui/sonner";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { InstrumentationProvider } from "@/instrumentation.tsx";
import AuthPage from "@/pages/Auth.tsx";
import StudentDashboard from "@/pages/StudentDashboard.tsx";
import StudentSetup from "@/pages/StudentSetup.tsx";
import QuizPage from "@/pages/QuizPage.tsx";
import JoinClassroom from "@/pages/JoinClassroom.tsx";
import TeacherSetup from "@/pages/TeacherSetup.tsx";
import TeacherDashboard from "@/pages/TeacherDashboard.tsx";
import DashboardRedirect from "@/components/DashboardRedirect.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";
import Landing from "./pages/Landing.tsx";
import NotFound from "./pages/NotFound.tsx";
import "./types/global.d.ts";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);



function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <VlyToolbar />
    <InstrumentationProvider>
      <ConvexAuthProvider client={convex}>
        <BrowserRouter>
          <RouteSyncer />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<AuthPage redirectAfterAuth="/dashboard" />} />
            <Route path="/dashboard" element={<DashboardRedirect />} />

            {/* Student */}
            <Route path="/student/setup" element={<StudentSetup />} />
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/join-classroom" element={<JoinClassroom />} />
            <Route path="/student/quiz/:subject?" element={<QuizPage />} />

            {/* Teacher */}
            <Route path="/teacher/setup" element={<TeacherSetup />} />
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </ConvexAuthProvider>
    </InstrumentationProvider>
  </StrictMode>,
);