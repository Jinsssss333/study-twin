import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { SUBJECTS } from "./schema";

// Sample quiz questions by subject
const QUIZ_QUESTIONS = {
  math: [
    {
      question: "What is 15% of 80?",
      options: ["10", "12", "15", "20"],
      correctAnswer: 1,
    },
    {
      question: "Solve for x: 2x + 5 = 13",
      options: ["3", "4", "5", "6"],
      correctAnswer: 1,
    },
    {
      question: "What is the area of a circle with radius 5?",
      options: ["25π", "10π", "15π", "20π"],
      correctAnswer: 0,
    },
    {
      question: "What is the slope of the line y = 3x + 2?",
      options: ["2", "3", "5", "1"],
      correctAnswer: 1,
    },
    {
      question: "Simplify: (x²)(x³)",
      options: ["x⁵", "x⁶", "x⁸", "2x⁵"],
      correctAnswer: 0,
    },
  ],
  science: [
    {
      question: "What is the chemical symbol for gold?",
      options: ["Go", "Gd", "Au", "Ag"],
      correctAnswer: 2,
    },
    {
      question: "Which planet is closest to the Sun?",
      options: ["Venus", "Mercury", "Earth", "Mars"],
      correctAnswer: 1,
    },
    {
      question: "What is the powerhouse of the cell?",
      options: ["Nucleus", "Ribosome", "Mitochondria", "Cytoplasm"],
      correctAnswer: 2,
    },
    {
      question: "What gas do plants absorb during photosynthesis?",
      options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
      correctAnswer: 2,
    },
    {
      question: "What is the speed of light in a vacuum?",
      options: ["300,000 km/s", "150,000 km/s", "450,000 km/s", "200,000 km/s"],
      correctAnswer: 0,
    },
  ],
  english: [
    {
      question: "Which is a proper noun?",
      options: ["city", "London", "building", "person"],
      correctAnswer: 1,
    },
    {
      question: "What is the past tense of 'run'?",
      options: ["runned", "ran", "running", "runs"],
      correctAnswer: 1,
    },
    {
      question: "Which sentence uses correct punctuation?",
      options: ["Hello, how are you", "Hello how are you?", "Hello, how are you?", "Hello; how are you"],
      correctAnswer: 2,
    },
    {
      question: "What is a synonym for 'happy'?",
      options: ["sad", "angry", "joyful", "tired"],
      correctAnswer: 2,
    },
    {
      question: "Which is an example of alliteration?",
      options: ["The cat sat", "Big blue balloon", "Running quickly", "Very nice day"],
      correctAnswer: 1,
    },
  ],
  history: [
    {
      question: "In which year did World War II end?",
      options: ["1944", "1945", "1946", "1947"],
      correctAnswer: 1,
    },
    {
      question: "Who was the first President of the United States?",
      options: ["Thomas Jefferson", "John Adams", "George Washington", "Benjamin Franklin"],
      correctAnswer: 2,
    },
    {
      question: "The Renaissance began in which country?",
      options: ["France", "Germany", "Italy", "Spain"],
      correctAnswer: 2,
    },
    {
      question: "Which empire was ruled by Julius Caesar?",
      options: ["Greek", "Roman", "Egyptian", "Persian"],
      correctAnswer: 1,
    },
    {
      question: "The Declaration of Independence was signed in which year?",
      options: ["1775", "1776", "1777", "1778"],
      correctAnswer: 1,
    },
  ],
  foreign_language: [
    {
      question: "What does 'Hola' mean in Spanish?",
      options: ["Goodbye", "Hello", "Thank you", "Please"],
      correctAnswer: 1,
    },
    {
      question: "How do you say 'cat' in French?",
      options: ["chien", "chat", "oiseau", "poisson"],
      correctAnswer: 1,
    },
    {
      question: "What does 'Guten Tag' mean in German?",
      options: ["Good night", "Good morning", "Good day", "Good evening"],
      correctAnswer: 2,
    },
    {
      question: "How do you say 'water' in Spanish?",
      options: ["agua", "fuego", "tierra", "aire"],
      correctAnswer: 0,
    },
    {
      question: "What does 'Merci' mean in French?",
      options: ["Hello", "Goodbye", "Please", "Thank you"],
      correctAnswer: 3,
    },
  ],
};

// Generate quiz for subject
export const generateQuiz = mutation({
  args: {
    subject: SUBJECTS,
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "student") {
      throw new Error("Unauthorized");
    }

    const student = await ctx.db
      .query("students")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!student) {
      throw new Error("Student profile not found");
    }

    // Get random 5 questions from the subject
    const allQuestions = QUIZ_QUESTIONS[args.subject as keyof typeof QUIZ_QUESTIONS] || [];
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    const selectedQuestions = shuffled.slice(0, 5).map(q => ({
      prompt: q.question,
      options: q.options,
      correctIndex: q.correctAnswer,
    }));

    return await ctx.db.insert("quizzes", {
      studentId: student._id,
      subject: args.subject,
      questions: selectedQuestions,
      answers: [],
      score: 0,
      completedAt: Date.now(),
    });
  },
});

// Submit quiz answers
export const submitQuiz = mutation({
  args: {
    quizId: v.id("quizzes"),
    answers: v.array(v.number()),
    timeSpent: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "student") {
      throw new Error("Unauthorized");
    }

    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) {
      throw new Error("Quiz not found");
    }

    // Calculate score - handle both old and new question formats
    let correct = 0;
    quiz.questions.forEach((question, index) => {
      const studentAnswer = args.answers[index];
      // Handle both formats: new (correctIndex) and old (correctAnswer)
      const correctAnswer = 'correctIndex' in question ? question.correctIndex : (question as any).correctAnswer;
      if (studentAnswer === correctAnswer) {
        correct++;
      }
    });

    const score = Math.round((correct / quiz.questions.length) * 100);

    await ctx.db.patch(args.quizId, {
      answers: args.answers,
      score,
      completedAt: Date.now(),
    });

    // Update mastery inline to avoid deep type instantiation issues
    const studentDoc = await ctx.db.get(quiz.studentId);
    if (studentDoc) {
      const key = quiz.subject as keyof typeof studentDoc.mastery;
      const currentMastery = studentDoc.mastery[key];

      let masteryChange = 0;
      if (score >= 90) masteryChange = 8;
      else if (score >= 80) masteryChange = 5;
      else if (score >= 70) masteryChange = 2;
      else if (score >= 60) masteryChange = 0;
      else if (score >= 50) masteryChange = -2;
      else masteryChange = -5;

      const newMastery = Math.max(0, Math.min(100, currentMastery + masteryChange));

      await ctx.db.patch(studentDoc._id, {
        mastery: {
          ...studentDoc.mastery,
          [key]: newMastery,
        },
      });
    }

    return { score, correct, total: quiz.questions.length };
  },
});

// Get student's quiz history
export const getMyQuizzes = query({
  args: {
    subject: v.optional(SUBJECTS),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "student") {
      return [];
    }

    const student = await ctx.db
      .query("students")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!student) {
      return [];
    }

    // Narrow subject type to non-undefined before querying by subject
    if (args.subject !== undefined) {
      const s = args.subject as NonNullable<typeof args.subject>;
      const subjectQuery = ctx.db
        .query("quizzes")
        .withIndex("by_student_and_subject", (q) =>
          q.eq("studentId", student._id).eq("subject", s),
        );
      return await subjectQuery.order("desc").collect();
    }

    const allQuery = ctx.db
      .query("quizzes")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id));
    
    return await allQuery.order("desc").collect();
  },
});

// Get quiz by ID
export const getQuiz = query({
  args: {
    quizId: v.id("quizzes"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Unauthorized");
    }

    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) {
      return null;
    }

    // Students can only see their own quizzes
    if (user.role === "student") {
      const student = await ctx.db
        .query("students")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .unique();

      if (!student || quiz.studentId !== student._id) {
        throw new Error("Unauthorized");
      }
    }

    return quiz;
  },
});