import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import { ArrowLeft, Users, KeyRound } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function JoinClassroom() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const joinClassroom = useMutation(api.students.joinClassroom);

  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Please enter a classroom code");
      return;
    }

    setIsSubmitting(true);
    try {
      await joinClassroom({ code: code.toUpperCase() });
      toast.success("Successfully joined classroom!");
      navigate("/student/dashboard");
    } catch (error) {
      toast.error("Invalid classroom code or already joined");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user || user.role !== "student") {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/student/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-100 to-green-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Join a Classroom</CardTitle>
              <CardDescription>
                Enter the classroom code provided by your teacher
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="code" className="flex items-center space-x-2">
                    <KeyRound className="w-4 h-4" />
                    <span>Classroom Code</span>
                  </Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit code (e.g., ABC123)"
                    maxLength={6}
                    className="text-center text-lg font-mono tracking-wider"
                    required
                  />
                  <p className="text-xs text-gray-500 text-center">
                    Ask your teacher for the classroom code
                  </p>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                  disabled={isSubmitting || code.length !== 6}
                >
                  {isSubmitting ? "Joining..." : "Join Classroom"}
                </Button>

                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Don't have a classroom code?{" "}
                    <button
                      type="button"
                      className="text-blue-600 hover:underline"
                      onClick={() => navigate("/student/dashboard")}
                    >
                      Go back to dashboard
                    </button>
                  </p>
                </div>
              </CardContent>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
