import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import { ArrowRight, User, Clock, BookOpen } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useEffect } from "react";
import { useQuery } from "convex/react";

export default function StudentSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createProfile = useMutation(api.students.createProfile);
  const setRole = useMutation(api.users.setRole);

  const [formData, setFormData] = useState({
    name: "",
    grade: 9,
    weeklyStudyHours: 10,
    mastery: {
      math: 50,
      science: 50,
      english: 50,
      history: 50,
      foreign_language: 50,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Add: watch for existing profile and redirect
  const existingProfile = useQuery(api.students.getCurrentProfile, {});
  useEffect(() => {
    if (existingProfile) {
      navigate("/student/dashboard", { replace: true });
    }
  }, [existingProfile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setIsSubmitting(true);
    try {
      // Ensure the current user has the "student" role before creating the profile
      if (!user || user.role !== "student") {
        await setRole({ role: "student" as any });
      }

      await createProfile(formData);
      toast.success("Profile created successfully!");
      navigate("/student/dashboard", { replace: true });
    } catch (error) {
      toast.error("Failed to create profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const subjects = [
    { key: "math", name: "Mathematics" },
    { key: "science", name: "Science" },
    { key: "english", name: "English" },
    { key: "history", name: "History" },
    { key: "foreign_language", name: "Foreign Language" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-100 to-green-100 rounded-full flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Set Up Your Student Profile</CardTitle>
            <CardDescription>
              Tell us about yourself so we can create your personalized study twin
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Basic Information</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Enter your full name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="grade">Grade Level</Label>
                    <Select
                      value={formData.grade.toString()}
                      onValueChange={(value) => setFormData({ ...formData, grade: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {[6, 7, 8, 9, 10, 11, 12].map((grade) => (
                          <SelectItem key={grade} value={grade.toString()}>
                            Grade {grade}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Study Hours */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span>Study Schedule</span>
                </h3>
                
                <div className="space-y-3">
                  <Label>Weekly Study Hours: {formData.weeklyStudyHours} hours</Label>
                  <Slider
                    value={[formData.weeklyStudyHours]}
                    onValueChange={(value) => setFormData({ ...formData, weeklyStudyHours: value[0] })}
                    max={40}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>1 hour</span>
                    <span>40 hours</span>
                  </div>
                </div>
              </div>

              {/* Subject Mastery */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <BookOpen className="h-5 w-5" />
                  <span>Current Subject Mastery</span>
                </h3>
                <p className="text-sm text-gray-600">
                  Rate your current confidence level in each subject (0-100%)
                </p>
                
                <div className="space-y-4">
                  {subjects.map((subject) => (
                    <div key={subject.key} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>{subject.name}</Label>
                        <span className="text-sm font-medium">
                          {formData.mastery[subject.key as keyof typeof formData.mastery]}%
                        </span>
                      </div>
                      <Slider
                        value={[formData.mastery[subject.key as keyof typeof formData.mastery]]}
                        onValueChange={(value) => 
                          setFormData({
                            ...formData,
                            mastery: {
                              ...formData.mastery,
                              [subject.key]: value[0]
                            }
                          })
                        }
                        max={100}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating Profile..." : "Create My Profile"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}