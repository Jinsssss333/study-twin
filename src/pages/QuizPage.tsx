import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, CheckCircle, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

export default function QuizPage() {
  const { subject } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [quizId, setQuizId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);

  const generateQuiz = useMutation(api.quizzes.generateQuiz);
  const submitQuiz = useMutation(api.quizzes.submitQuiz);
  const updateMastery = useMutation(api.students.updateMasteryFromQuiz);
  
  const quiz = useQuery(api.quizzes.getQuiz, quizId ? { quizId: quizId as any } : "skip");

  useEffect(() => {
    if (!user || user.role !== "student") {
      navigate("/auth");
      return;
    }

    if (!subject) {
      navigate("/student/dashboard");
      return;
    }

    // Generate quiz when component mounts
    const initQuiz = async () => {
      try {
        const newQuizId = await generateQuiz({ subject: subject as any });
        setQuizId(newQuizId);
        setStartTime(Date.now());
      } catch (error) {
        toast.error("Failed to generate quiz");
        navigate("/student/dashboard");
      }
    };

    initQuiz();
  }, [subject, user, navigate, generateQuiz]);

  const handleAnswerSelect = (questionIndex: number, answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[questionIndex] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < (quiz?.questions.length || 0) - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (!quiz || !quizId) return;

    try {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      const result = await submitQuiz({
        quizId: quizId as any,
        answers,
        timeSpent,
      });

      // Update mastery based on quiz performance
      await updateMastery({
        subject: subject as any,
        score: result.score,
      });

      setResults(result);
      setShowResults(true);
      toast.success(`Quiz completed! Score: ${result.score}%`);
    } catch (error) {
      toast.error("Failed to submit quiz");
    }
  };

  if (!quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (showResults && results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Quiz Complete!</CardTitle>
                <CardDescription>
                  Here are your results for {subject?.replace('_', ' ')} quiz
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {results.score}%
                  </div>
                  <p className="text-gray-600">
                    You got {results.correct} out of {results.total} questions correct
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Question Review:</h3>
                  {quiz.questions.map((question, index) => {
                    const isCorrect = question.studentAnswer === question.correctAnswer;
                    return (
                      <div key={index} className={`p-4 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-start space-x-3">
                          {isCorrect ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium mb-2">{question.question}</p>
                            <p className="text-sm text-gray-600">
                              Your answer: {question.options[question.studentAnswer || 0]}
                            </p>
                            {!isCorrect && (
                              <p className="text-sm text-green-600">
                                Correct answer: {question.options[question.correctAnswer]}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex space-x-4">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/student/dashboard")}
                    className="flex-1"
                  >
                    Back to Dashboard
                  </Button>
                  <Button 
                    onClick={() => window.location.reload()}
                    className="flex-1"
                  >
                    Take Another Quiz
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;
  const question = quiz.questions[currentQuestion];
  const allAnswered = answers.length === quiz.questions.length && answers.every(a => a !== undefined);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/student/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{Math.round((Date.now() - startTime) / 1000 / 60)} min</span>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-gray-600">
              {currentQuestion + 1} of {quiz.questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Question {currentQuestion + 1}
              </CardTitle>
              <CardDescription className="text-base">
                {question.question}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[currentQuestion]?.toString()}
                onValueChange={(value) => handleAnswerSelect(currentQuestion, parseInt(value))}
              >
                {question.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>

          <div className="flex space-x-2">
            {quiz.questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentQuestion(index)}
                className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                  index === currentQuestion
                    ? 'bg-blue-600 text-white'
                    : answers[index] !== undefined
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentQuestion === quiz.questions.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered}
              className="bg-gradient-to-r from-blue-600 to-green-600"
            >
              Submit Quiz
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={answers[currentQuestion] === undefined}
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
