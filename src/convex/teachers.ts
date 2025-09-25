import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Create teacher profile
export const createProfile = mutation({
  args: {
    name: v.string(),
    school: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "teacher") {
      throw new Error("Unauthorized");
    }

    // Check if profile already exists
    const existing = await ctx.db
      .query("teachers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (existing) {
      throw new Error("Teacher profile already exists");
    }

    return await ctx.db.insert("teachers", {
      userId: user._id,
      name: args.name,
      school: args.school,
    });
  },
});

// Get current teacher profile
export const getCurrentProfile = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "teacher") {
      return null;
    }

    return await ctx.db
      .query("teachers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
  },
});

// Generate unique classroom code
const generateClassroomCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Create classroom
export const createClassroom = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "teacher") {
      throw new Error("Unauthorized");
    }

    const teacher = await ctx.db
      .query("teachers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!teacher) {
      throw new Error("Teacher profile not found");
    }

    // Generate unique code
    let code = generateClassroomCode();
    let existing = await ctx.db
      .query("classrooms")
      .withIndex("by_code", (q) => q.eq("code", code))
      .unique();

    while (existing) {
      code = generateClassroomCode();
      existing = await ctx.db
        .query("classrooms")
        .withIndex("by_code", (q) => q.eq("code", code))
        .unique();
    }

    return await ctx.db.insert("classrooms", {
      teacherId: teacher._id,
      name: args.name,
      code,
      description: args.description,
      isActive: true,
    });
  },
});

// Get teacher's classrooms
export const getMyClassrooms = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "teacher") {
      return [];
    }

    const teacher = await ctx.db
      .query("teachers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!teacher) {
      return [];
    }

    const classrooms = await ctx.db
      .query("classrooms")
      .withIndex("by_teacher", (q) => q.eq("teacherId", teacher._id))
      .collect();

    // Get student counts for each classroom
    const classroomsWithCounts = await Promise.all(
      classrooms.map(async (classroom) => {
        const studentCount = await ctx.db
          .query("classroomStudents")
          .withIndex("by_classroom", (q) => q.eq("classroomId", classroom._id))
          .collect();

        return {
          ...classroom,
          studentCount: studentCount.length,
        };
      })
    );

    return classroomsWithCounts;
  },
});

// Get students in classroom
export const getClassroomStudents = query({
  args: {
    classroomId: v.id("classrooms"),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "teacher") {
      throw new Error("Unauthorized");
    }

    const teacher = await ctx.db
      .query("teachers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!teacher) {
      throw new Error("Teacher profile not found");
    }

    // Verify teacher owns this classroom
    const classroom = await ctx.db.get(args.classroomId);
    if (!classroom || classroom.teacherId !== teacher._id) {
      throw new Error("Classroom not found or unauthorized");
    }

    const memberships = await ctx.db
      .query("classroomStudents")
      .withIndex("by_classroom", (q) => q.eq("classroomId", args.classroomId))
      .collect();

    const students = await Promise.all(
      memberships.map(async (membership) => {
        const student = await ctx.db.get(membership.studentId);
        if (!student) return null;

        // Get recent quiz performance
        const recentQuizzes = await ctx.db
          .query("quizzes")
          .withIndex("by_student", (q) => q.eq("studentId", student._id))
          .order("desc")
          .take(5);

        const avgScore = recentQuizzes.length > 0 
          ? recentQuizzes.reduce((sum, quiz) => sum + quiz.score, 0) / recentQuizzes.length
          : 0;

        return {
          ...student,
          joinedAt: membership.joinedAt,
          recentAvgScore: Math.round(avgScore),
          quizCount: recentQuizzes.length,
        };
      })
    );

    return students.filter(Boolean);
  },
});

// Add feedback for student
export const addFeedback = mutation({
  args: {
    studentId: v.id("students"),
    classroomId: v.id("classrooms"),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "teacher") {
      throw new Error("Unauthorized");
    }

    const teacher = await ctx.db
      .query("teachers")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();

    if (!teacher) {
      throw new Error("Teacher profile not found");
    }

    // Verify teacher owns this classroom
    const classroom = await ctx.db.get(args.classroomId);
    if (!classroom || classroom.teacherId !== teacher._id) {
      throw new Error("Classroom not found or unauthorized");
    }

    return await ctx.db.insert("feedback", {
      teacherId: teacher._id,
      studentId: args.studentId,
      classroomId: args.classroomId,
      message: args.message,
      isRead: false,
    });
  },
});
