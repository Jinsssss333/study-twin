import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Settings, LogOut, LayoutGrid, Brain, BookOpen, Users, BarChart3, MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  active: string;
  onChange: (val: string) => void;
  studentName?: string;
  onOpenSettings: () => void;
  onSignOut: () => void;
};

const NAV_ITEMS: Array<{ key: string; label: string; icon: React.ReactNode }> = [
  { key: "overview", label: "Overview", icon: <LayoutGrid className="h-4 w-4" /> },
  { key: "twin", label: "Study Twin", icon: <Brain className="h-4 w-4" /> },
  { key: "quizzes", label: "Quizzes", icon: <BookOpen className="h-4 w-4" /> },
  { key: "classrooms", label: "Classrooms", icon: <Users className="h-4 w-4" /> },
  { key: "progress", label: "Progress", icon: <BarChart3 className="h-4 w-4" /> },
  { key: "feedback", label: "Feedback", icon: <MessageSquare className="h-4 w-4" /> },
];

export default function StudentSidebar({
  collapsed,
  onToggle,
  active,
  onChange,
  studentName,
  onOpenSettings,
  onSignOut,
}: SidebarProps) {
  const navigate = useNavigate();

  // Add: Sign out handler with confirmation and redirect to /auth
  const handleSignOut = async () => {
    const ok = window.confirm("Are you sure you want to sign out?");
    if (!ok) return;
    await onSignOut();
    navigate("/auth", { replace: true });
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 260 }}
      className={cn(
        "h-[calc(100vh-4rem)] sticky top-16 border-r bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/60",
        "flex flex-col"
      )}
    >
      <div className="p-3 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="Study Twin" className="h-6 w-6" />
            <div className="text-sm font-semibold truncate max-w-[140px]">Hi, {studentName ?? "Student"}!</div>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={onToggle} className="ml-auto shrink-0">
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>

      <Separator />

      <nav className="p-2 space-y-1 overflow-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.key;
          return (
            <Button
              key={item.key}
              variant={isActive ? "default" : "ghost"}
              className={cn(
                "w-full",
                collapsed ? "px-0 mx-auto w-10 h-10 justify-center" : "px-3 justify-start"
              )}
              onClick={() => onChange(item.key)}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
            >
              <span className={cn(collapsed ? "" : "mr-2")}>{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Button>
          );
        })}
      </nav>

      <div className="mt-auto p-2">
        <Separator className="mb-2" />
        <Button
          variant="ghost"
          className={cn("w-full justify-start", collapsed ? "px-0 mx-auto w-10 h-10" : "px-3")}
          onClick={onOpenSettings}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className="h-4 w-4 mr-2" />
          {!collapsed && <span>Settings</span>}
        </Button>
        <Button
          variant="outline"
          className={cn("w-full justify-start mt-2", collapsed ? "px-0 mx-auto w-10 h-10" : "px-3")}
          onClick={handleSignOut}
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {!collapsed && <span>Sign out</span>}
        </Button>
      </div>
    </motion.aside>
  );
}