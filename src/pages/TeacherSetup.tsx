import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import { ArrowRight, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function TeacherSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createProfile = useMutation(api.teachers.createProfile);

  const [formData, setFormData] = useState({
    name: "",
    school: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setIsSubmitting(true);
    try {
      await createProfile({
        name: formData.name,
        school: formData.school || undefined,
      });
      toast.success("Profile created successfully!");
      // Ensure immediate redirect and prevent back navigation
      navigate("/teacher/dashboard", { replace: true });
    } catch (error) {
      toast.error("Failed to create profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Set Up Your Teacher Profile</CardTitle>
            <CardDescription>
              Create your profile to start managing classrooms and students
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="school">School/Institution (Optional)</Label>
                <Input
                  id="school"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  placeholder="Enter your school name"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
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