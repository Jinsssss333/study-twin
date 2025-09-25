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
  CheckCircle
} from "lucide-react";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import SubjectMastery from "@/components/student/SubjectMastery";
import jsPDF from "jspdf";

export default function StudentDashboard() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Pass empty args object to satisfy typing for queries with optional args
  const student = useQuery(api.students.getCurrentProfile, {});
  const quizzes = useQuery(api.quizzes.getMyQuizzes, {});
  const classrooms = useQuery(api.students.getMyClassrooms, {});
  const feedbacks = useQuery(api.students.getMyFeedback, {});
  const markFeedbackRead = useMutation(api.students.markFeedbackRead);

  // Ensure classrooms are non-null for mapping
  const classroomsSafe = (classrooms ?? []).filter(
    (c): c is NonNullable<typeof c> => Boolean(c)
  );

  const generateTwin = useMutation(api.students.generateTwin);

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "student")) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  if (isLoading || !user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!student) {
    navigate("/student/setup");
    return null;
  }

  const handleGenerateTwin = async () => {
    try {
      await generateTwin();
      toast.success("Your study twin has been generated!");
    } catch (error) {
      toast.error("Failed to generate twin");
    }
  };

  const subjects = [
    { key: "math", name: "Mathematics", color: "bg-blue-500" },
    { key: "science", name: "Science", color: "bg-green-500" },
    { key: "english", name: "English", color: "bg-purple-500" },
    { key: "history", name: "History", color: "bg-orange-500" },
    { key: "foreign_language", name: "Foreign Language", color: "bg-pink-500" },
  ];

  const recentQuizzes = quizzes?.slice(0, 5) || [];
  const avgScore = quizzes?.length ? 
    Math.round(quizzes.reduce((sum, quiz) => sum + quiz.score, 0) / quizzes.length) : 0;

  // Add computed helpers for progress/summary
  const masteryValues = [
    student?.mastery?.math ?? 0,
    student?.mastery?.science ?? 0,
    student?.mastery?.english ?? 0,
    student?.mastery?.history ?? 0,
    student?.mastery?.foreign_language ?? 0,
  ];
  const overallMasteryAvg = Math.round(
    masteryValues.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0) /
      (masteryValues.length || 1)
  );

  const twinAvg =
    student?.twinData
      ? Math.round(
          [
            student.twinData.targetMastery.math,
            student.twinData.targetMastery.science,
            student.twinData.targetMastery.english,
            student.twinData.targetMastery.history,
            student.twinData.targetMastery.foreign_language,
          ].reduce((a, b) => a + b, 0) / 5
        )
      : null;

  const improvementPotential =
    twinAvg != null ? Math.max(0, twinAvg - overallMasteryAvg) : null;

  // Predicted grade: simple blend of quiz avg and mastery
  const predictedGrade = Math.min(
    100,
    Math.max(0, Math.round(0.6 * (avgScore || 0) + 0.4 * overallMasteryAvg))
  );

  // PDF export: compact, dependency-free aside from jsPDF
  const handleDownloadPdf = () => {
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 40;
      let y = margin;

      const addHeading = (text: string, size = 18) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(size);
        doc.text(text, margin, y);
        y += 24;
        doc.setFont("helvetica", "normal");
      };

      const addDivider = () => {
        doc.setDrawColor(200);
        doc.line(margin, y, doc.internal.pageSize.getWidth() - margin, y);
        y += 16;
      };

      const addKeyValue = (label: string, value: string) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, margin, y);
        doc.setFont("helvetica", "normal");
        doc.text(value, margin + 180, y);
        y += 18;
      };

      const addBar = (label: string, current: number, target?: number) => {
        const pageWidth = doc.internal.pageSize.getWidth();
        const barX = margin;
        const barW = pageWidth - margin * 2;
        const barH = 10;

        doc.setFont("helvetica", "bold");
        doc.text(label, barX, y);
        y += 12;

        // background
        doc.setDrawColor(225);
        doc.setFillColor(245, 246, 250);
        doc.roundedRect(barX, y, barW, barH, 4, 4, "F");

        // current (blue)
        const curW = Math.max(0, Math.min(barW, (current / 100) * barW));
        doc.setFillColor(59, 130, 246);
        doc.roundedRect(barX, y, curW, barH, 4, 4, "F");

        if (typeof target === "number") {
          // target overlay (green) behind a thin line indicator
          const tarW = Math.max(0, Math.min(barW, (target / 100) * barW));
          doc.setFillColor(16, 185, 129);
          doc.roundedRect(barX, y + 14, tarW, 6, 3, 3, "F");
          y += 28;
          doc.setFontSize(10);
          doc.setTextColor(90);
          doc.text(`Current: ${Math.round(current)}%   Twin: ${Math.round(target)}%`, barX, y);
          doc.setTextColor(0);
          doc.setFontSize(12);
        } else {
          y += 22;
          doc.setFontSize(10);
          doc.setTextColor(90);
          doc.text(`Current: ${Math.round(current)}%`, barX, y);
          doc.setTextColor(0);
          doc.setFontSize(12);
        }
        y += 10;
      };

      // Header
      addHeading("Study Twin - Progress Report", 20);
      doc.setFontSize(12);
      doc.text(`Student: ${student.name}`, margin, y);
      y += 16;
      doc.text(`Grade: ${student.grade}`, margin, y);
      y += 16;
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
      y += 16;
      addDivider();

      // Summary section
      addHeading("Summary");
      addKeyValue("Overall Progress (Avg Mastery)", `${overallMasteryAvg}%`);
      addKeyValue("Average Quiz Score", `${avgScore}%`);
      if (twinAvg != null) {
        addKeyValue("Twin Average Target", `${twinAvg}%`);
        addKeyValue("Improvement Potential", `+${improvementPotential}%`);
      }
      y += 6;
      addDivider();

      // Subject marks (quiz averages)
      if (Array.isArray(quizzes) && quizzes.length > 0) {
        addHeading("Subject Marks (Quiz Averages)");
        const subjectsList = [
          { key: "math", name: "Mathematics" },
          { key: "science", name: "Science" },
          { key: "english", name: "English" },
          { key: "history", name: "History" },
          { key: "foreign_language", name: "Foreign Language" },
        ];
        for (const s of subjectsList) {
          const items = (quizzes as any[]).filter((q: any) => q.subject === s.key);
          const count = items.length;
          const avg = count
            ? Math.round(items.reduce((sum: number, q: any) => sum + (q.score ?? 0), 0) / count)
            : 0;
          addKeyValue(`${s.name}`, count ? `${avg}% (n=${count})` : "—");
        }
        addDivider();
      }

      // Subject performance
      addHeading("Subject Performance");
      const subjMap: Array<{ label: string; cur: number; tar?: number }> = [
        { label: "Mathematics", cur: student.mastery.math, tar: student.twinData?.targetMastery.math },
        { label: "Science", cur: student.mastery.science, tar: student.twinData?.targetMastery.science },
        { label: "English", cur: student.mastery.english, tar: student.twinData?.targetMastery.english },
        { label: "History", cur: student.mastery.history, tar: student.twinData?.targetMastery.history },
        { label: "Foreign Language", cur: student.mastery.foreign_language, tar: student.twinData?.targetMastery.foreign_language },
      ];
      for (const s of subjMap) {
        if (y > doc.internal.pageSize.getHeight() - 120) {
          doc.addPage();
          y = margin;
        }
        addBar(s.label, s.cur ?? 0, s.tar);
      }
      addDivider();

      // Opportunities (top gaps)
      if (student.twinData) {
        addHeading("Improvement Opportunities");
        const gaps = subjMap
          .map((s) => ({
            label: s.label,
            gap: Math.max(0, Math.round((s.tar ?? 0) - (s.cur ?? 0))),
          }))
          .sort((a, b) => b.gap - a.gap)
          .slice(0, 3);

        gaps.forEach((g, idx) => {
          addKeyValue(`${idx + 1}. ${g.label}`, `+${g.gap} pts to reach twin`);
        });
        addDivider();

        // Success plans / micro habits
        addHeading("Success Plans & Micro-Habits");
        const habits = student.twinData.microHabits;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        for (const h of habits) {
          if (y > doc.internal.pageSize.getHeight() - 60) {
            doc.addPage();
            y = margin;
          }
          doc.circle(margin + 2, y - 3, 2, "F");
          doc.text(h, margin + 12, y);
          y += 18;
        }
        addDivider();

        // Personalized Strategy
        addHeading("Personalized Strategy");
        const tip =
          "Focus first on the biggest gaps. Start sessions with your toughest subject, use short Pomodoro cycles, and review notes within 24 hours. Aim for consistent daily practice to steadily reach your twin.";
        const wrapped = doc.splitTextToSize(tip, doc.internal.pageSize.getWidth() - margin * 2);
        doc.text(wrapped, margin, y);
        y += wrapped.length * 14 + 10;
      }

      // Save
      doc.save(`study-twin-report-${student.name.replace(/\\s+/g, "_")}.pdf`);
      toast.success("PDF report downloaded");
    } catch (e) {
      toast.error("Failed to generate PDF");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-white/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <img src="/logo.svg" alt="Study Twin" className="h-8 w-8" />
              <h1 className="text-xl font-bold">Study Twin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {student.name}!</span>
              <Button variant="outline" onClick={() => navigate("/")}>
                Home
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {student.name}! 👋
          </h2>
          <p className="text-gray-600">
            Ready to continue your learning journey? Let's see how you're progressing.
          </p>
        </motion.div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="twin">Study Twin</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            <TabsTrigger value="classrooms">Classrooms</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="feedback">Feedback</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Study Hours/Week</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{student.weeklyStudyHours}h</div>
                    <p className="text-xs text-muted-foreground">
                      {student.twinData ? `Target: ${student.twinData.targetWeeklyHours}h` : "Generate twin for target"}
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
                    <CardTitle className="text-sm font-medium">Average Score</CardTitle>
                    <Award className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{avgScore}%</div>
                    <p className="text-xs text-muted-foreground">
                      From {quizzes?.length || 0} quizzes
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
                    <CardTitle className="text-sm font-medium">Classrooms</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
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
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Grade Level</CardTitle>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Grade {student.grade}</div>
                    <p className="text-xs text-muted-foreground">
                      Current level
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Subject Mastery */}
            <SubjectMastery mastery={student.mastery} subjects={subjects} />

            {/* Twin Comparison - Overview */}
            {student.twinData && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Twin Comparison
                  </CardTitle>
                  <CardDescription>
                    See how you compare to your Study Twin's targets
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Weekly hours comparison */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Weekly Study Hours</span>
                      <span className="text-sm text-gray-600">
                        {student.weeklyStudyHours}h → {student.twinData.targetWeeklyHours}h
                      </span>
                    </div>
                    {/* Animated bars */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500">Current</div>
                        <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${Math.min(100, Math.round((student.weeklyStudyHours / Math.max(student.twinData.targetWeeklyHours, 1)) * 100))}%`,
                            }}
                            transition={{ type: "spring", stiffness: 120, damping: 18 }}
                            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-green-500"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500">Twin Target</div>
                        <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "100%" }}
                            transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.05 }}
                            className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Subject mastery comparisons */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Subject Mastery</h4>
                    {subjects.map((subject, i) => {
                      const current = student.mastery[subject.key as keyof typeof student.mastery];
                      const target = student.twinData!.targetMastery[subject.key as keyof typeof student.twinData.targetMastery];
                      const pct = Math.min(100, Math.max(0, current));
                      const targetPct = Math.min(100, Math.max(0, target));
                      return (
                        <motion.div
                          key={subject.key}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.05 * i }}
                          className="space-y-2"
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-sm">{subject.name}</span>
                            <span className="text-xs text-gray-500">{pct}% → {targetPct}%</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ type: "spring", stiffness: 120, damping: 18 }}
                                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                              />
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${targetPct}%` }}
                                transition={{ type: "spring", stiffness: 120, damping: 18 }}
                                className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                              />
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/student/quiz")}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <span>Take a Quiz</span>
                  </CardTitle>
                  <CardDescription>
                    Test your knowledge and improve your mastery
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate("/student/join-classroom")}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="h-5 w-5 text-green-600" />
                    <span>Join Classroom</span>
                  </CardTitle>
                  <CardDescription>
                    Enter a classroom code to join your teacher's class
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleGenerateTwin}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    <span>Generate Twin</span>
                  </CardTitle>
                  <CardDescription>
                    Create or update your AI study companion
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </TabsContent>

          {/* Study Twin Tab */}
          <TabsContent value="twin" className="space-y-6">
            {student.twinData ? (
              <div className="grid grid-cols-1 gap-6">
                {/* Current vs Twin Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle>You vs Your Study Twin</CardTitle>
                    <CardDescription>
                      Compare your current progress with your ideal twin
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Study Hours Comparison */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Weekly Study Hours</span>
                        <span className="text-sm text-gray-600">
                          {student.weeklyStudyHours}h → {student.twinData.targetWeeklyHours}h
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{student.weeklyStudyHours}h</div>
                          <div className="text-xs text-gray-600">Current</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{student.twinData.targetWeeklyHours}h</div>
                          <div className="text-xs text-gray-600">Twin Target</div>
                        </div>
                      </div>
                    </div>

                    {/* Subject Mastery Comparison (compact + delta) */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Subject Mastery Comparison</h4>
                      {subjects.map((subject, i) => {
                        const current = student.mastery[subject.key as keyof typeof student.mastery];
                        const target = student.twinData!.targetMastery[subject.key as keyof typeof student.twinData.targetMastery];
                        const delta = Math.max(0, Math.round(target - current));
                        return (
                          <motion.div
                            key={subject.key}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * i }}
                            className="space-y-2 rounded-lg p-3 bg-white/50"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{subject.name}</span>
                                <span className="text-xs text-blue-600">Current: {Math.max(0, Math.min(100, Math.round(current)))}%</span>
                                <span className="text-xs text-green-600">Twin: {Math.max(0, Math.min(100, Math.round(target)))}%</span>
                              </div>
                              {delta > 0 ? (
                                <span className="text-xs text-orange-600">+{delta} points to reach twin level</span>
                              ) : (
                                <span className="text-xs text-green-600 flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" /> On track
                                </span>
                              )}
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, Math.max(0, current))}%` }}
                                transition={{ type: "spring", stiffness: 120, damping: 18 }}
                                className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600"
                              />
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, Math.max(0, target))}%` }}
                                transition={{ type: "spring", stiffness: 120, damping: 18 }}
                                className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                              />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Micro Habits - pill style like reference */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      <span>Your Twin's Success Habits</span>
                    </CardTitle>
                    <CardDescription>Small daily actions to reach your twin's level</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {student.twinData.microHabits.map((habit, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.03 * index }}
                          className="flex items-center gap-3 rounded-xl bg-blue-50/70 border border-blue-100 px-4 py-3 text-sm text-gray-800 shadow-sm"
                        >
                          <span className="text-yellow-600">✨</span>
                          <span>{habit}</span>
                        </motion.div>
                      ))}
                    </div>
                    <Button className="w-full mt-5" onClick={handleGenerateTwin}>
                      Regenerate Twin
                    </Button>
                  </CardContent>
                </Card>

                {/* Weekly Study Schedule derived from twin targets */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      <span>Your Weekly Study Schedule</span>
                    </CardTitle>
                    <CardDescription>Estimated hours per subject based on your twin's targets</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(() => {
                      const targets = student.twinData!.targetMastery;
                      const total = subjects.reduce((s, sub) => s + Math.max(1, targets[sub.key as keyof typeof targets]), 0);
                      return subjects.map((sub) => {
                        const t = targets[sub.key as keyof typeof targets];
                        const weight = Math.max(1, t) / total;
                        const hours = Math.round(student.twinData!.targetWeeklyHours * weight * 10) / 10;
                        const daily = Math.round((hours / 7) * 10) / 10;
                        const pct = Math.min(100, Math.max(6, Math.round((hours / Math.max(1, student.twinData!.targetWeeklyHours)) * 100)));
                        const color =
                          sub.key === "math"
                            ? "from-blue-500 to-blue-600"
                            : sub.key === "science"
                            ? "from-green-500 to-emerald-600"
                            : "from-purple-500 to-violet-600";
                        return (
                          <div key={sub.key} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{sub.name}</span>
                                <span className="text-xs text-gray-600">{hours}h/week</span>
                              </div>
                              <span className="text-xs text-gray-500">~{daily} hours per day</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ type: "spring", stiffness: 120, damping: 18 }}
                                className={`h-2 rounded-full bg-gradient-to-r ${color}`}
                              />
                            </div>
                          </div>
                        );
                      });
                    })()}
                    <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50/70 p-3 text-sm text-blue-800">
                      💡 Pro tip: Start with your weakest subject when your mind is fresh!
                    </div>
                  </CardContent>
                </Card>

                {/* Priority Focus Areas (top gaps) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      <span>Your Priority Focus Areas</span>
                    </CardTitle>
                    <CardDescription>These subjects show the biggest opportunity for improvement</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {(() => {
                      const gaps = subjects
                        .map((s) => {
                          const cur = student.mastery[s.key as keyof typeof student.mastery];
                          const tar = student.twinData!.targetMastery[s.key as keyof typeof student.twinData.targetMastery];
                          return { key: s.key, name: s.name, gap: Math.max(0, Math.round(tar - cur)) };
                        })
                        .sort((a, b) => b.gap - a.gap)
                        .slice(0, 3);
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {gaps.map((g, i) => (
                            <div
                              key={g.key}
                              className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50/70 px-4 py-3"
                            >
                              <span className="text-sm font-medium text-green-900">{g.name}</span>
                              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-green-600 text-white text-xs">
                                {i + 1}
                              </span>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardHeader className="text-center">
                  <CardTitle>Generate Your Study Twin</CardTitle>
                  <CardDescription>
                    Create an AI-powered study companion that will help you reach your academic goals
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-6">
                    <Brain className="h-16 w-16 text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600 mb-6">
                      Your study twin will analyze your current performance and create personalized targets 
                      and micro-habits to help you improve across all subjects.
                    </p>
                  </div>
                  <Button size="lg" onClick={handleGenerateTwin} className="bg-gradient-to-r from-blue-600 to-green-600">
                    Generate My Study Twin
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Other tabs would be implemented similarly */}
          <TabsContent value="quizzes">
            <Card>
              <CardHeader>
                <CardTitle>Quiz Center</CardTitle>
                <CardDescription>Take quizzes to test your knowledge and improve your mastery</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjects.map((subject) => (
                    <Card key={subject.key} className="cursor-pointer hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <CardTitle className="text-lg">{subject.name}</CardTitle>
                        <CardDescription>
                          Current mastery: {student.mastery[subject.key as keyof typeof student.mastery]}%
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Button 
                          className="w-full" 
                          onClick={() => navigate(`/student/quiz/${subject.key}`)}
                        >
                          Start Quiz
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classrooms">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-2xl font-bold">My Classrooms</h3>
                <Button onClick={() => navigate("/student/join-classroom")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Join Classroom
                </Button>
              </div>
              
              {classroomsSafe.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {classroomsSafe.map((classroom) => (
                    <Card key={classroom._id}>
                      <CardHeader>
                        <CardTitle>{classroom.name}</CardTitle>
                        <CardDescription>
                          Teacher: {classroom.teacherName}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-600 mb-4">
                          Joined: {new Date(classroom.joinedAt).toLocaleDateString()}
                        </p>
                        <Button variant="outline" className="w-full">
                          View Classroom
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No classrooms yet</h3>
                    <p className="text-gray-600 mb-4">
                      Ask your teacher for a classroom code to get started
                    </p>
                    <Button onClick={() => navigate("/student/join-classroom")}>
                      Join Your First Classroom
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Progress Analytics</span>
                  <Button onClick={handleDownloadPdf} className="bg-gradient-to-r from-blue-600 to-green-600">
                    Download PDF Report
                  </Button>
                </CardTitle>
                <CardDescription>Total progress so far and key insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-600">Overall Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-600">{overallMasteryAvg}%</div>
                      <div className="mt-3 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${overallMasteryAvg}%` }}
                          transition={{ type: "spring", stiffness: 120, damping: 18 }}
                          className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-700"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-600">Average Quiz Score</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-600">{avgScore}%</div>
                      <p className="text-xs text-muted-foreground mt-1">From {quizzes?.length || 0} quizzes</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-600">Improvement Potential</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-600">
                        {improvementPotential != null ? `+${improvementPotential}%` : "—"}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {twinAvg != null ? `Twin avg target ${twinAvg}%` : "Generate a Twin to see targets"}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-gray-600">Predicted Grade</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-orange-600">{predictedGrade}%</div>
                      <p className="text-xs text-muted-foreground mt-1">Based on mastery and quiz trends</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Subject bars with twin comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle>Subject Breakdown</CardTitle>
                    <CardDescription>Current vs Twin target per subject</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { key: "math", name: "Mathematics" },
                      { key: "science", name: "Science" },
                      { key: "english", name: "English" },
                      { key: "history", name: "History" },
                      { key: "foreign_language", name: "Foreign Language" },
                    ].map((s, i) => {
                      const cur = student.mastery[s.key as keyof typeof student.mastery] as number;
                      const tar =
                        student.twinData?.targetMastery[s.key as keyof typeof student.twinData.targetMastery];
                      const gap = tar != null ? Math.max(0, Math.round(tar - cur)) : null;
                      return (
                        <motion.div
                          key={s.key}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.04 * i }}
                          className="space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{s.name}</span>
                            <span className="text-xs text-gray-500">
                              {Math.round(cur)}% {tar != null && <>→ {Math.round(tar)}%</>}
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, Math.max(0, cur))}%` }}
                              transition={{ type: "spring", stiffness: 120, damping: 18 }}
                              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-700"
                            />
                          </div>
                          {tar != null && (
                            <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, Math.max(0, tar))}%` }}
                                transition={{ type: "spring", stiffness: 120, damping: 18 }}
                                className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                              />
                            </div>
                          )}
                          {gap != null && gap > 0 && (
                            <div className="text-xs text-orange-600">+{gap} points to reach twin level</div>
                          )}
                        </motion.div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Subject Quiz Averages */}
                <Card>
                  <CardHeader>
                    <CardTitle>Subject Quiz Averages</CardTitle>
                    <CardDescription>Average marks from your quizzes per subject</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {subjects.map((s) => {
                      const items = (quizzes ?? []).filter((q) => q.subject === s.key);
                      const count = items.length;
                      const avg =
                        count ? Math.round(items.reduce((sum, q) => sum + (q.score ?? 0), 0) / count) : null;
                      return (
                        <div key={s.key} className="rounded-lg border bg-white/60 p-4">
                          <div className="text-sm text-gray-600">{s.name}</div>
                          <div className="mt-1 text-2xl font-bold">{avg != null ? `${avg}%` : "—"}</div>
                          <div className="text-xs text-gray-500">
                            {count} quiz{count === 1 ? "" : "zes"}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Strategy & Micro-habits (from Twin) */}
                {student.twinData && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Improvement Opportunities</CardTitle>
                        <CardDescription>Top gaps to close next</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {(() => {
                          const subjectsList = [
                            { key: "math", name: "Mathematics" },
                            { key: "science", name: "Science" },
                            { key: "english", name: "English" },
                            { key: "history", name: "History" },
                            { key: "foreign_language", name: "Foreign Language" },
                          ];
                          const gaps = subjectsList
                            .map((s) => {
                              const cur = student.mastery[s.key as keyof typeof student.mastery] as number;
                              const tar =
                                student.twinData!.targetMastery[
                                  s.key as keyof typeof student.twinData.targetMastery
                                ] as number;
                              return { name: s.name, gap: Math.max(0, Math.round(tar - cur)) };
                            })
                            .sort((a, b) => b.gap - a.gap)
                            .slice(0, 3);
                          return gaps.map((g, idx) => (
                            <div
                              key={g.name}
                              className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50/70 px-4 py-2"
                            >
                              <span className="text-sm font-medium text-green-900">{g.name}</span>
                              <span className="text-xs text-green-700">+{g.gap} pts</span>
                            </div>
                          ));
                        })()}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Personalized Strategy</CardTitle>
                        <CardDescription>Daily success plan and micro-habits</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3 text-sm text-blue-800">
                          💡 Start with the toughest subject when your mind is fresh. Use 25m focus + 5m
                          breaks and review notes within 24 hours.
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                          {student.twinData.microHabits.map((h, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.03 * i }}
                              className="flex items-center gap-2 rounded-xl bg-purple-50/70 border border-purple-100 px-3 py-2 text-sm text-gray-800"
                            >
                              <span className="text-yellow-600">✨</span>
                              <span>{h}</span>
                            </motion.div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <CardTitle>Feedback</CardTitle>
                <CardDescription>Messages sent by your teachers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!feedbacks ? (
                  <div className="text-sm text-gray-500">Loading...</div>
                ) : (feedbacks ?? []).length === 0 ? (
                  <div className="text-center py-12 text-gray-600">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    No feedback yet. Your teacher's messages will appear here.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(feedbacks ?? []).map((f) => (
                      <div key={f._id} className="border rounded-lg p-4 flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Message</span>
                            {f.isRead ? (
                              <span className="inline-flex items-center text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded">
                                <CheckCircle className="h-3 w-3 mr-1" /> Read
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                                <MessageSquare className="h-3 w-3 mr-1" /> New
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-800">{f.message}</p>
                        </div>
                        <div className="ml-4">
                          {!f.isRead && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await markFeedbackRead({ feedbackId: f._id as any });
                                  toast.success("Marked as read");
                                } catch {
                                  toast.error("Failed to mark as read");
                                }
                              }}
                            >
                              Mark as read
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}