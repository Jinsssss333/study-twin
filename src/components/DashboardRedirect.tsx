import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import RoleSelection from "./RoleSelection";

export default function DashboardRedirect() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  
  const studentProfile = useQuery(api.students.getCurrentProfile);
  const teacherProfile = useQuery(api.teachers.getCurrentProfile);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      navigate("/auth");
      return;
    }

    if (!user.role) {
      setShowRoleSelection(true);
      return;
    }

    if (user.role === "student") {
      if (studentProfile === null) {
        navigate("/student/setup");
      } else if (studentProfile) {
        navigate("/student/dashboard");
      }
    } else if (user.role === "teacher") {
      if (teacherProfile === null) {
        navigate("/teacher/setup");
      } else if (teacherProfile) {
        navigate("/teacher/dashboard");
      }
    }
  }, [user, isLoading, studentProfile, teacherProfile, navigate]);

  if (showRoleSelection) {
    return <RoleSelection onRoleSelected={() => setShowRoleSelection(false)} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
