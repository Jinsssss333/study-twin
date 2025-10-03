import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { SUBJECTS } from "./schema";

// Create student profile
export const createProfile = mutation({
  args: {
    name: v.string(),
    grade: v.number(),
    weeklyStudyHours: v.number(),
    mastery: v.object({
      math: v.number(),
      science: v.number(),
      english: v.number(),
      history: v.number(),
      foreign_language: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "student") {
      throw new Error("Unauthorized");
    }

    // Check if profile already exists
    const existing = await ctx.db
      .query("students")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (existing) {
      throw new Error("Student profile already exists");
    }

    return await ctx.db.insert("students", {
      userId: user._id,
      name: args.name,
      grade: args.grade,
      weeklyStudyHours: args.weeklyStudyHours,
      mastery: args.mastery,
    });
  },
});

// Get current student profile
export const getCurrentProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "student") {
      return null;
    }

    return await ctx.db
      .query("students")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();
  },
});

// Update student profile
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    grade: v.optional(v.number()),
    weeklyStudyHours: v.optional(v.number()),
    mastery: v.optional(v.object({
      math: v.number(),
      science: v.number(),
      english: v.number(),
      history: v.number(),
      foreign_language: v.number(),
    })),
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

    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.grade !== undefined) updates.grade = args.grade;
    if (args.weeklyStudyHours !== undefined) updates.weeklyStudyHours = args.weeklyStudyHours;
    if (args.mastery !== undefined) updates.mastery = args.mastery;

    await ctx.db.patch(student._id, updates);
    return student._id;
  },
});

// Generate virtual twin using heuristics
export const generateTwin = mutation({
  args: {},
  handler: async (ctx) => {
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

    // Heuristic twin generation
    const currentMastery = student.mastery;
    const currentHours = student.weeklyStudyHours;

    // Target 20-30% improvement in study hours
    const targetWeeklyHours = Math.min(currentHours * 1.25, 40);

    // Target 15-25 point improvement in each subject (capped at 100)
    const targetMastery = {
      math: Math.min(currentMastery.math + 20, 100),
      science: Math.min(currentMastery.science + 20, 100),
      english: Math.min(currentMastery.english + 20, 100),
      history: Math.min(currentMastery.history + 20, 100),
      foreign_language: Math.min(currentMastery.foreign_language + 20, 100),
    };

    // Generate micro-habits based on current performance
    const microHabits = [
      "Review notes for 15 minutes daily",
      "Complete practice problems 3x per week",
      "Use Pomodoro technique (25min focus, 5min break)",
      "Weekly subject review sessions",
      "Create flashcards for difficult concepts",
    ];

    const twinData = {
      targetWeeklyHours,
      targetMastery,
      microHabits,
      generatedAt: Date.now(),
    };

    await ctx.db.patch(student._id, { twinData });
    return twinData;
  },
});

// Join classroom with code
export const joinClassroom = mutation({
  args: {
    code: v.string(),
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

    // Find classroom by code
    const classroom = await ctx.db
      .query("classrooms")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();

    if (!classroom || !classroom.isActive) {
      throw new Error("Invalid classroom code");
    }

    // Check if already joined
    const existing = await ctx.db
      .query("classroomStudents")
      .withIndex("by_classroom_and_student", (q) => 
        q.eq("classroomId", classroom._id).eq("studentId", student._id))
      .unique();

    if (existing) {
      throw new Error("Already joined this classroom");
    }

    return await ctx.db.insert("classroomStudents", {
      classroomId: classroom._id,
      studentId: student._id,
      joinedAt: Date.now(),
    });
  },
});

// Get student's classrooms
export const getMyClassrooms = query({
  args: {},
  handler: async (ctx) => {
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

    const memberships = await ctx.db
      .query("classroomStudents")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .collect();

    const classrooms = await Promise.all(
      memberships.map(async (membership) => {
        const classroom = await ctx.db.get(membership.classroomId);
        if (!classroom) return null;
        
        const teacher = await ctx.db.get(classroom.teacherId);
        return {
          ...classroom,
          teacherName: teacher?.name || "Unknown Teacher",
          joinedAt: membership.joinedAt,
        };
      })
    );

    return classrooms.filter(Boolean);
  },
});

// Update mastery after quiz
export const updateMasteryFromQuiz = mutation({
  args: {
    subject: SUBJECTS,
    score: v.number(),
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

    // Update mastery based on quiz performance
    const currentMastery = student.mastery[args.subject as keyof typeof student.mastery];
    let masteryChange = 0;

    if (args.score >= 90) masteryChange = 8;
    else if (args.score >= 80) masteryChange = 5;
    else if (args.score >= 70) masteryChange = 2;
    else if (args.score >= 60) masteryChange = 0;
    else if (args.score >= 50) masteryChange = -2;
    else masteryChange = -5;

    const newMastery = Math.max(0, Math.min(100, currentMastery + masteryChange));

    await ctx.db.patch(student._id, {
      mastery: {
        ...student.mastery,
        [args.subject]: newMastery,
      },
    });

    return { oldMastery: currentMastery, newMastery, change: masteryChange };
  },
});

export const getMyFeedback = query({
  args: {},
  handler: async (ctx) => {
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

    const feedback = await ctx.db
      .query("feedback")
      .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
      .order("desc")
      .collect();

    return feedback;
  },
});

export const markFeedbackRead = mutation({
  args: {
    feedbackId: v.id("feedback"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "student") {
      throw new Error("Unauthorized");
    }

    const fb = await ctx.db.get(args.feedbackId);
    if (!fb) {
      throw new Error("Feedback not found");
    }

    const student = await ctx.db
      .query("students")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!student || fb.studentId !== student._id) {
      throw new Error("Unauthorized");
    }

    if (fb.isRead) return args.feedbackId;

    await ctx.db.patch(args.feedbackId, { isRead: true });
    return args.feedbackId;
  },
});