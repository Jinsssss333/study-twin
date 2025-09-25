import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import { GraduationCap, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface RoleSelectionProps {
  onRoleSelected: () => void;
}

export default function RoleSelection({ onRoleSelected }: RoleSelectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const setUserRole = useMutation(api.users.setRole);

  const handleRoleSelect = async (role: "student" | "teacher") => {
    setIsLoading(true);
    try {
      await setUserRole({ role });
      toast.success(`Welcome! You're now registered as a ${role}.`);
      onRoleSelected();
    } catch (error) {
      toast.error("Failed to set role. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Welcome to Study Twin! 🎓
          </h1>
          <p className="text-lg text-gray-600">
            Choose your role to get started with your personalized learning experience
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Student Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="h-full cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-100 to-blue-200 rounded-full flex items-center justify-center mb-4">
                  <GraduationCap className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl text-blue-900">I'm a Student</CardTitle>
                <CardDescription className="text-base">
                  Create your virtual study twin and track your academic progress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Generate AI study companions</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Take adaptive quizzes</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Track progress across subjects</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Join teacher classrooms</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  onClick={() => handleRoleSelect("student")}
                  disabled={isLoading}
                >
                  Continue as Student
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Teacher Card */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="h-full cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-green-300">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mb-4">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-green-900">I'm a Teacher</CardTitle>
                <CardDescription className="text-base">
                  Create classrooms and monitor your students' learning progress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Create and manage classrooms</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Track student progress</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Provide personalized feedback</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">Export detailed reports</span>
                  </div>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  onClick={() => handleRoleSelect("teacher")}
                  disabled={isLoading}
                >
                  Continue as Teacher
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            You can always change your role later in your account settings
          </p>
        </div>
      </motion.div>
    </div>
  );
}