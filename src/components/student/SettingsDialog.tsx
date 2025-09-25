import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: {
    name: string;
    grade: number;
    weeklyStudyHours: number;
  };
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
};

export default function SettingsDialog({ open, onOpenChange, student, theme, setTheme }: SettingsDialogProps) {
  const updateProfile = useMutation(api.students.updateProfile);

  const [name, setName] = useState(student.name);
  const [grade, setGrade] = useState<number>(student.grade);
  const [hours, setHours] = useState<number>(student.weeklyStudyHours);
  const [darkMode, setDarkMode] = useState(theme === "dark");

  useEffect(() => {
    setName(student.name);
    setGrade(student.grade);
    setHours(student.weeklyStudyHours);
  }, [student]);

  useEffect(() => {
    setDarkMode(theme === "dark");
  }, [theme]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        name,
        grade: Number(grade),
        weeklyStudyHours: Number(hours),
      });
      toast.success("Profile updated");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const handleToggleDark = (value: boolean) => {
    const next = value ? "dark" : "light";
    setDarkMode(value);
    setTheme(next);
    toast(`Theme set to ${next}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage your profile and appearance.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <div className="text-sm font-semibold mb-3">Profile</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="grade">Grade</Label>
                <Input
                  id="grade"
                  type="number"
                  min={1}
                  max={12}
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="hours">Weekly Study Hours</Label>
                <Input
                  id="hours"
                  type="number"
                  min={0}
                  max={80}
                  value={hours}
                  onChange={(e) => setHours(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="mt-4">
              <Button onClick={handleSaveProfile} className="w-full sm:w-auto">Save changes</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-3">Appearance</div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div>
                <div className="text-sm font-medium">Dark mode</div>
                <div className="text-xs text-muted-foreground">Switch between light and dark themes</div>
              </div>
              <Switch checked={darkMode} onCheckedChange={handleToggleDark} />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
