import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { motion } from "framer-motion";
import { 
  Plus, 
  Users, 
  BookOpen, 
  BarChart3,
  Copy,
  Settings,
  GraduationCap
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import TeacherSidebar from "@/components/teacher/TeacherSidebar";

export default function TeacherDashboard() {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  
  const teacher = useQuery(api.teachers.getCurrentProfile);
  const classrooms = useQuery(api.teachers.getMyClassrooms);
  const createClassroom = useMutation(api.teachers.createClassroom);
  const updateTeacher = useMutation(api.teachers.updateProfile);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newClassroom, setNewClassroom] = useState({
    name: "",
    description: "",
  });
  const [showStudentsDialog, setShowStudentsDialog] = useState(false);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string | null>(null);
  const [feedbackDrafts, setFeedbackDrafts] = useState<Record<string, string>>({});
  const studentsInSelected = useQuery(
    api.teachers.getClassroomStudents,
    selectedClassroomId ? { classroomId: selectedClassroomId as any } : "skip"
  );
  const addFeedback = useMutation(api.teachers.addFeedback);

  // Ensure a non-null list before mapping to avoid TS 'possibly null' errors
  const studentsSafe = (studentsInSelected ?? []).filter(
    (s): s is NonNullable<typeof s> => Boolean(s)
  );

  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  // Add settings state for profile form
  const [profileDraft, setProfileDraft] = useState({ name: "", school: "" });

  // Theme state and persistence (light default)
  const [theme, setTheme] = useState<string>(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    return stored ?? "light";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Initialize profile form when teacher loads or dialog opens
  useEffect(() => {
    if (teacher) {
      setProfileDraft({
        name: teacher.name ?? "",
        school: teacher.school ?? "",
      });
    }
  }, [teacher, showSettings]);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "teacher")) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  // Redirect to setup only when the teacher profile is definitively missing (null), not while loading (undefined)
  useEffect(() => {
    if (!isLoading && user && user.role === "teacher" && teacher === null) {
      navigate("/teacher/setup", { replace: true });
    }
  }, [teacher, isLoading, user, navigate]);

  if (isLoading || !user || teacher === undefined) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Guard against null teacher while redirecting to setup in the useEffect above
  if (teacher === null) {
    return <div className="min-h-screen flex items-center justify-center">Redirecting...</div>;
  }

  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassroom.name.trim()) {
      toast.error("Please enter a classroom name");
      return;
    }

    try {
      await createClassroom({
        name: newClassroom.name,
        description: newClassroom.description || undefined,
      });
      toast.success("Classroom created successfully!");
      setShowCreateDialog(false);
      setNewClassroom({ name: "", description: "" });
    } catch (error) {
      toast.error("Failed to create classroom");
    }
  };

  const copyClassroomCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Classroom code copied to clipboard!");
  };

  const openStudents = (classroomId: string) => {
    setSelectedClassroomId(classroomId);
    setShowStudentsDialog(true);
  };

  const handleSendFeedback = async (studentId: string) => {
    if (!selectedClassroomId) return;
    const message = feedbackDrafts[studentId]?.trim();
    if (!message) {
      toast.error("Please enter a feedback message");
      return;
    }
    try {
      await addFeedback({
        studentId: studentId as any,
        classroomId: selectedClassroomId as any,
        message,
      });
      toast.success("Feedback sent");
      setFeedbackDrafts((prev) => ({ ...prev, [studentId]: "" }));
    } catch {
      toast.error("Failed to send feedback");
    }
  };

  const totalStudents =
    classrooms?.reduce((sum, classroom) => sum + classroom.studentCount, 0) || 0;

  const handleSaveProfile = async () => {
    const name = profileDraft.name.trim();
    if (!name) {
      toast.error("Name is required");
      return;
    }
    try {
      await updateTeacher({
        name,
        school: profileDraft.school?.trim() || undefined,
      } as any);
      toast.success("Profile updated");
      setShowSettings(false);
    } catch {
      toast.error("Failed to update profile");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <header className="bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b border-white/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img src="/logo.svg" alt="Study Twin" className="h-8 w-8" />
              <h1 className="text-xl font-bold dark:text-gray-100">Study Twin - Teacher</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-300">Welcome, {teacher.name}!</span>
            </div>
          </div>
        </div>
      </header>

      {/* Layout with collapsible sidebar */}
      <div className="flex">
        <TeacherSidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
          onOpenSettings={() => setShowSettings(true)}
          onSignOut={signOut}
        />
        <div className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Welcome back, {teacher.name}! 👨‍🏫
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Manage your classrooms and track your students' progress.
              </p>
            </motion.div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Classrooms</CardTitle>
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{classrooms?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">
                      Active classrooms
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{totalStudents}</div>
                    <p className="text-xs text-muted-foreground">
                      Across all classrooms
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">School</CardTitle>
                    <Settings className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {teacher.school ? teacher.school.substring(0, 10) + (teacher.school.length > 10 ? "..." : "") : "N/A"}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Institution
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Classrooms Section */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold dark:text-gray-100">My Classrooms</h3>
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-green-600 to-green-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Classroom
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Classroom</DialogTitle>
                      <DialogDescription>
                        Set up a new classroom for your students to join
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateClassroom} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="classroom-name">Classroom Name *</Label>
                        <Input
                          id="classroom-name"
                          value={newClassroom.name}
                          onChange={(e) => setNewClassroom({ ...newClassroom, name: e.target.value })}
                          placeholder="e.g., Math 101, Biology A, etc."
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="classroom-description">Description (Optional)</Label>
                        <Input
                          id="classroom-description"
                          value={newClassroom.description}
                          onChange={(e) => setNewClassroom({ ...newClassroom, description: e.target.value })}
                          placeholder="Brief description of the classroom"
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        Create Classroom
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {classrooms && classrooms.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classrooms.map((classroom, index) => (
                    <motion.div
                      key={classroom._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>{classroom.name}</span>
                            <div className="flex items-center space-x-1 text-sm text-gray-500">
                              <Users className="h-4 w-4" />
                              <span>{classroom.studentCount}</span>
                            </div>
                          </CardTitle>
                          {classroom.description && (
                            <CardDescription>{classroom.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="text-sm font-medium">Classroom Code</p>
                              <p className="text-lg font-mono font-bold text-green-600">
                                {classroom.code}
                              </p>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyClassroomCode(classroom.code)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button variant="outline" className="flex-1" size="sm">
                              <BarChart3 className="h-4 w-4 mr-2" />
                              View Reports
                            </Button>
                            <Button
                              variant="outline"
                              className="flex-1"
                              size="sm"
                              onClick={() => openStudents(classroom._id)}
                            >
                              <Users className="h-4 w-4 mr-2" />
                              Students
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No classrooms yet</h3>
                    <p className="text-gray-600 mb-4">
                      Create your first classroom to start managing students
                    </p>
                    <Button onClick={() => setShowCreateDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Classroom
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <Dialog open={showStudentsDialog} onOpenChange={setShowStudentsDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Classroom Students</DialogTitle>
                <DialogDescription>
                  View recent performance and send quick feedback
                </DialogDescription>
              </DialogHeader>

              {selectedClassroomId ? (
                <div className="space-y-4">
                  {!studentsInSelected ? (
                    <div className="text-sm text-gray-500">Loading...</div>
                  ) : studentsSafe.length === 0 ? (
                    <div className="text-sm text-gray-500">No students in this classroom yet.</div>
                  ) : (
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                      {studentsSafe.map((s) => (
                        <Card key={s._id}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-base">{s.name}</CardTitle>
                            <CardDescription>
                              Joined: {new Date(s.joinedAt).toLocaleDateString()} • Recent Avg: {s.recentAvgScore}% • Quizzes: {s.quizCount}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="space-y-3 rounded-md border p-3 bg-gray-50">
                              <div className="text-sm font-semibold">Progress Overview</div>
                              <div className="text-xs text-gray-600">
                                Overall Average: {s.progress?.overallAverage ?? 0}% • Total Quizzes: {s.progress?.overallQuizCount ?? s.quizCount}
                              </div>

                              <div className="space-y-3">
                                {/* Math */}
                                <div>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>Math (Mastery)</span>
                                    <span>{s.progress?.mastery.math ?? 0}%</span>
                                  </div>
                                  <Progress value={s.progress?.mastery.math ?? 0} />
                                  <div className="text-[11px] text-gray-500 mt-1">
                                    Quiz Avg: {s.progress?.subjectAverages.math.avg ?? 0}% ({s.progress?.subjectAverages.math.count ?? 0})
                                  </div>
                                </div>

                                {/* Science */}
                                <div>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>Science (Mastery)</span>
                                    <span>{s.progress?.mastery.science ?? 0}%</span>
                                  </div>
                                  <Progress value={s.progress?.mastery.science ?? 0} />
                                  <div className="text-[11px] text-gray-500 mt-1">
                                    Quiz Avg: {s.progress?.subjectAverages.science.avg ?? 0}% ({s.progress?.subjectAverages.science.count ?? 0})
                                  </div>
                                </div>

                                {/* English */}
                                <div>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>English (Mastery)</span>
                                    <span>{s.progress?.mastery.english ?? 0}%</span>
                                  </div>
                                  <Progress value={s.progress?.mastery.english ?? 0} />
                                  <div className="text-[11px] text-gray-500 mt-1">
                                    Quiz Avg: {s.progress?.subjectAverages.english.avg ?? 0}% ({s.progress?.subjectAverages.english.count ?? 0})
                                  </div>
                                </div>

                                {/* History */}
                                <div>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>History (Mastery)</span>
                                    <span>{s.progress?.mastery.history ?? 0}%</span>
                                  </div>
                                  <Progress value={s.progress?.mastery.history ?? 0} />
                                  <div className="text-[11px] text-gray-500 mt-1">
                                    Quiz Avg: {s.progress?.subjectAverages.history.avg ?? 0}% ({s.progress?.subjectAverages.history.count ?? 0})
                                  </div>
                                </div>

                                {/* Foreign Language */}
                                <div>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>Foreign Language (Mastery)</span>
                                    <span>{s.progress?.mastery.foreign_language ?? 0}%</span>
                                  </div>
                                  <Progress value={s.progress?.mastery.foreign_language ?? 0} />
                                  <div className="text-[11px] text-gray-500 mt-1">
                                    Quiz Avg: {s.progress?.subjectAverages.foreign_language.avg ?? 0}% ({s.progress?.subjectAverages.foreign_language.count ?? 0})
                                  </div>
                                </div>
                              </div>
                            </div>

                            <input
                              type="text"
                              value={feedbackDrafts[s._id] ?? ""}
                              onChange={(e) =>
                                setFeedbackDrafts((prev) => ({ ...prev, [s._id]: e.target.value }))
                              }
                              placeholder="Write feedback..."
                              className="w-full rounded-md border px-3 py-2 text-sm"
                            />
                            <div className="flex justify-end">
                              <Button
                                size="sm"
                                onClick={() => handleSendFeedback(s._id)}
                              >
                                Send Feedback
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  <div className="flex justify-end">
                    <DialogClose asChild>
                      <Button variant="outline">Close</Button>
                    </DialogClose>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No classroom selected.</div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Settings</DialogTitle>
                <DialogDescription>Manage account preferences.</DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                {/* Profile Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Profile</h4>
                  <div className="space-y-2">
                    <Label htmlFor="teacher-name">Name</Label>
                    <Input
                      id="teacher-name"
                      value={profileDraft.name}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Your name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="teacher-school">School</Label>
                    <Input
                      id="teacher-school"
                      value={profileDraft.school}
                      onChange={(e) => setProfileDraft((p) => ({ ...p, school: e.target.value }))}
                      placeholder="Your school (optional)"
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveProfile}>Save changes</Button>
                  </div>
                </div>

                {/* Appearance Section */}
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Appearance</h4>
                  <div className="flex items-center justify-between rounded-md border p-3 bg-card/60">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">Dark mode</div>
                      <div className="text-xs text-gray-600 dark:text-gray-300">Toggle between light and dark themes</div>
                    </div>
                    <Switch
                      checked={theme === "dark"}
                      onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                      aria-label="Toggle dark mode"
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowSettings(false)}>Close</Button>
                  <Button variant="destructive" onClick={signOut}>Sign out</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}