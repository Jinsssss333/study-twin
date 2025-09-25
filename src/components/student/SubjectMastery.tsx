import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp } from "lucide-react";

type SubjectDef = { key: string; name: string; color?: string };

interface SubjectMasteryProps {
  mastery: {
    math: number;
    science: number;
    english: number;
    history: number;
    foreign_language: number;
  };
  subjects: Array<SubjectDef>;
}

export default function SubjectMastery({ mastery, subjects }: SubjectMasteryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span>Subject Mastery</span>
        </CardTitle>
        <CardDescription>Your current progress across all subjects</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subjects.map((subject) => (
          <div key={subject.key} className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{subject.name}</span>
              <span className="text-sm text-gray-500">
                {mastery[subject.key as keyof typeof mastery]}%
              </span>
            </div>
            <Progress value={mastery[subject.key as keyof typeof mastery]} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}