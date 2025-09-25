import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Brain, 
  TrendingUp, 
  Users, 
  Plus,
  Target,
  Clock,
  Award,
  BarChart3,
  Zap,
  MessageSquare,
  CheckCircle,
  Settings as SettingsIcon,
  LogOut,
  Sun,
  Moon,
  User as UserIcon,
  LayoutDashboard,
  GraduationCap,
  BookOpenCheck,
  BarChart
} from "lucide-react";
import { useNavigate } from "react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import SubjectMastery from "@/components/student/SubjectMastery";
import { FileDown } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarSeparator, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function StudentDashboard() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Pass empty args object to satisfy typing for queries with optional args
  const student = useQuery(api.students.getCurrentProfile, {});
  const quizzes = useQuery(api.quizzes.getMyQuizzes, {});
  const classrooms = useQuery(api.students.getMyClassrooms, {});
  const feedbacks = useQuery(api.students.getMyFeedback, {});
  const markFeedbackRead = useMutation(api.students.markFeedbackRead);
  const updateProfile = useMutation(api.students.updateProfile);
  const { signOut } = useAuth();

  // Ensure classrooms are non-null for mapping
  const classroomsSafe = (classrooms ?? []).filter(
    (c): c is NonNullable<typeof c> => Boolean(c)
  );

  const generateTwin = useMutation(api.students.generateTwin);
  const reportRef = useRef<HTMLDivElement | null>(null);

  // State for sidebar navigation
  const [activeTab, setActiveTab] = useState<"overview" | "twin" | "quizzes" | "classrooms" | "progress" | "feedback">("overview");
  // Add: local settings state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState<string>(() => (localStorage.getItem("theme") || (document.documentElement.classList.contains("dark") ? "dark" : "light")));
  const [editName, setEditName] = useState(student?.name ?? "");
  const [editGrade, setEditGrade] = useState<number>(student?.grade ?? 9);
  const [editHours, setEditHours] = useState<number>(student?.weeklyStudyHours ?? 5);

  // Sync profile form when student loads/changes
  useEffect(() => {
    if (student) {
      setEditName(student.name ?? "");
      setEditGrade(student.grade ?? 9);
      setEditHours(student.weeklyStudyHours ?? 5);
    }
  }, [student]);

  // Apply theme on mount and when changed
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Helper to toggle theme
  const toggleTheme = (next: boolean) => {
    setTheme(next ? "dark" : "light");
  };

  // Save profile handler
  const handleSaveProfile = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      await updateProfile({
        name: editName,
        grade: Number(editGrade),
        weeklyStudyHours: Number(editHours),
      });
      toast("Profile updated");
      setIsSettingsOpen(false);
    } catch (err: any) {
      toast(err?.message || "Failed to update profile");
    }
  };

  // Add: local state for sidebar
  // Already declared above as activeTab and setActiveTab

  // Replace the horizontal top tab nav with a vertical sidebar layout.
  // Hide the old horizontal nav rendering if it exists by gating it with false.
  /* BEGIN: Sidebar layout wrapper */
  return (
    // ... keep existing code (any guards for loading, redirects, null checks)
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar className="border-r">
          <SidebarHeader className="px-3 pt-3">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="font-semibold">Student</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setActiveTab?.("overview")} isActive={activeTab === "overview"}>
                    <LayoutDashboard className="size-4" />
                    <span>Overview</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setActiveTab?.("twin")} isActive={activeTab === "twin"}>
                    <GraduationCap className="size-4" />
                    <span>Study Twin</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setActiveTab?.("quizzes")} isActive={activeTab === "quizzes"}>
                    <BookOpenCheck className="size-4" />
                    <span>Quizzes</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setActiveTab?.("classrooms")} isActive={activeTab === "classrooms"}>
                    <UserIcon className="size-4" />
                    <span>Classrooms</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setActiveTab?.("progress")} isActive={activeTab === "progress"}>
                    <BarChart className="size-4" />
                    <span>Progress</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setActiveTab?.("feedback")} isActive={activeTab === "feedback"}>
                    <MessageSquare className="size-4" />
                    <span>Feedback</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarSeparator />

            <SidebarGroup>
              <SidebarGroupLabel>Settings</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => setIsSettingsOpen(true)}>
                    <SettingsIcon className="size-4" />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={() => signOut()}>
                    <LogOut className="size-4" />
                    <span>Sign out</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <SidebarInset className="p-4">
          {/* Hide old horizontal nav if any */}
          {/* {false && (existing horizontal tab header)} */}

          {/* Keep the rest of the existing dashboard body exactly as before */}
          {/* ... keep existing code (main dashboard content rendering based on activeTab) */}
        </SidebarInset>
      </div>
      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Profile */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Profile</h3>
              <form className="space-y-3" onSubmit={handleSaveProfile}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="grade">Grade</Label>
                    <Input id="grade" type="number" min={1} max={12} value={editGrade} onChange={(e) => setEditGrade(Number(e.target.value))} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="hours">Weekly Study Hours</Label>
                    <Input id="hours" type="number" min={0} value={editHours} onChange={(e) => setEditHours(Number(e.target.value))} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </div>

            {/* Appearance */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Appearance</h3>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-2">
                  {theme === "dark" ? <Moon className="size-4" /> : <Sun className="size-4" />}
                  <div>
                    <div className="text-sm font-medium">Dark Mode</div>
                    <div className="text-xs text-muted-foreground">Toggle the application theme</div>
                  </div>
                </div>
                <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
    /* END: Sidebar layout wrapper */
  );
}