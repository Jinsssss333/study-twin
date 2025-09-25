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
  Zap
} from "lucide-react";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { toast } from "sonner";

export default function StudentDashboard() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Pass empty args object to satisfy typing for queries with optional args
  const student = useQuery(api.students.getCurrentProfile, {});
  const quizzes = useQuery(api.quizzes.getMyQuizzes, {});
  const classrooms = useQuery(api.students.getMyClassrooms, {});

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40">
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
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="twin">Study Twin</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            <TabsTrigger value="classrooms">Classrooms</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Subject Mastery</span>
                </CardTitle>
                <CardDescription>
                  Your current progress across all subjects
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {subjects.map((subject) => (
                  <div key={subject.key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{subject.name}</span>
                      <span className="text-sm text-gray-500">
                        {student.mastery[subject.key as keyof typeof student.mastery]}%
                      </span>
                    </div>
                    <Progress 
                      value={student.mastery[subject.key as keyof typeof student.mastery]} 
                      className="h-2"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                    {/* Subject Mastery Comparison */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Subject Mastery Comparison</h4>
                      {subjects.map((subject) => {
                        const current = student.mastery[subject.key as keyof typeof student.mastery];
                        const target = student.twinData!.targetMastery[subject.key as keyof typeof student.twinData.targetMastery];
                        return (
                          <div key={subject.key} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">{subject.name}</span>
                              <span className="text-sm text-gray-500">{current}% → {target}%</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Progress value={current} className="h-2" />
                              <Progress value={target} className="h-2" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Micro Habits */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5" />
                      <span>Recommended Micro-Habits</span>
                    </CardTitle>
                    <CardDescription>
                      Small daily actions to reach your twin's level
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {student.twinData.microHabits.map((habit, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Zap className="h-4 w-4 text-yellow-500 mt-0.5" />
                          <span className="text-sm">{habit}</span>
                        </div>
                      ))}
                    </div>
                    <Button className="w-full mt-4" onClick={handleGenerateTwin}>
                      Regenerate Twin
                    </Button>
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
                <CardTitle>Progress Analytics</CardTitle>
                <CardDescription>Track your learning journey over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Detailed analytics coming soon!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}