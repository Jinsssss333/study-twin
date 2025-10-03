import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { SUBJECTS } from "./schema";

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
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
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
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
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
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
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
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!teacher) {
      return [];
    }

    const classrooms = await ctx.db
      .query("classrooms")
      .withIndex("by_teacherId", (q) => q.eq("teacherId", teacher._id))
      .collect();

    // Get student counts for each classroom
    const classroomsWithCounts = await Promise.all(
      classrooms.map(async (classroom) => {
        const studentCount = await ctx.db
          .query("classroomStudents")
          .withIndex("by_classroomId", (q) => q.eq("classroomId", classroom._id))
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
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!teacher) {
      throw new Error("Teacher profile not found");
    }

    // Verify classroom ownership
    const classroom = await ctx.db.get(args.classroomId);
    if (!classroom) {
      throw new Error("Classroom not found");
    }
    if (classroom.teacherId !== teacher._id) {
      throw new Error("Unauthorized");
    }

    const memberships = await ctx.db
      .query("classroomStudents")
      .withIndex("by_classroomId", (q) => q.eq("classroomId", args.classroomId))
      .collect();

    // Add per-subject progress details for each student
    const subjectKeys = ["math", "science", "english", "history", "foreign_language"] as const;

    const students = await Promise.all(
      memberships.map(async (membership) => {
        const student = await ctx.db.get(membership.studentId);
        if (!student) return null;

        // Recent (overall) quiz performance snapshot
        const recentQuizzes = await ctx.db
          .query("quizzes")
          .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
          .order("desc")
          .take(5);

        const recentAvgScore =
          recentQuizzes.length > 0
            ? recentQuizzes.reduce((sum, quiz) => sum + quiz.score, 0) / recentQuizzes.length
            : 0;

        // Overall aggregates (all quizzes)
        const allQuizzes = await ctx.db
          .query("quizzes")
          .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
          .collect();

        const overallQuizCount = allQuizzes.length;
        const overallAverage =
          overallQuizCount > 0
            ? Math.round(allQuizzes.reduce((sum, q) => sum + q.score, 0) / overallQuizCount)
            : 0;

        // Subject-level aggregates
        const subjectAverages: Record<
          (typeof subjectKeys)[number],
          { avg: number; count: number }
        > = {
          math: { avg: 0, count: 0 },
          science: { avg: 0, count: 0 },
          english: { avg: 0, count: 0 },
          history: { avg: 0, count: 0 },
          foreign_language: { avg: 0, count: 0 },
        };

        for (const s of subjectKeys) {
          const subjectQuizzes = await ctx.db
            .query("quizzes")
            .withIndex("by_student_and_subject", (q) =>
              q.eq("studentId", student._id).eq("subject", s),
            )
            .collect();

          const count = subjectQuizzes.length;
          const avg =
            count > 0
              ? Math.round(subjectQuizzes.reduce((sum, q) => sum + q.score, 0) / count)
              : 0;
          subjectAverages[s] = { avg, count };
        }

        return {
          ...student,
          joinedAt: membership.joinedAt,
          // Backwards-compatible fields
          recentAvgScore: Math.round(recentAvgScore),
          quizCount: recentQuizzes.length,
          // New progress details
          progress: {
            overallAverage,
            overallQuizCount,
            subjectAverages,
            mastery: student.mastery,
          },
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
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
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

export const updateProfile = mutation({
  args: {
    name: v.string(),
    school: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user || user.role !== "teacher") {
      throw new Error("Unauthorized");
    }

    const teacher = await ctx.db
      .query("teachers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (!teacher) {
      throw new Error("Teacher profile not found");
    }

    await ctx.db.patch(teacher._id, {
      name: args.name,
      school: args.school,
    });

    return teacher._id;
  },
});

// Generate at-risk alerts for a classroom
export const generateAtRiskAlerts = mutation({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user || user.role !== "teacher") throw new Error("Not a teacher");

    const teacher = await ctx.db
      .query("teachers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    if (!teacher) throw new Error("Teacher profile not found");

    // Verify classroom ownership
    const classroom = await ctx.db.get(args.classroomId);
    if (!classroom || classroom.teacherId !== teacher._id) {
      throw new Error("Classroom not found or unauthorized");
    }

    // Get all students in classroom
    const memberships = await ctx.db
      .query("classroomStudents")
      .withIndex("by_classroomId", (q) => q.eq("classroomId", args.classroomId))
      .collect();

    let alertCount = 0;

    for (const membership of memberships) {
      const student = await ctx.db.get(membership.studentId);
      if (!student) continue;

      // Check for low study hours
      if (student.weeklyStudyHours < 5) {
        await ctx.db.insert("alerts", {
          studentId: student._id,
          classroomId: args.classroomId,
          type: "low_hours",
          createdAt: Date.now(),
        });
        alertCount++;
      }

      // Check for low mastery in any subject
      const subjects = ["math", "science", "english", "history", "foreign_language"] as const;
      for (const subject of subjects) {
        if (student.mastery[subject] < 40) {
          await ctx.db.insert("alerts", {
            studentId: student._id,
            classroomId: args.classroomId,
            type: `low_mastery:${subject}`,
            createdAt: Date.now(),
          });
          alertCount++;
        }
      }
    }

    return alertCount;
  },
});

// Bulk add feedback to multiple students
export const bulkAddFeedback = mutation({
  args: {
    classroomId: v.id("classrooms"),
    studentIds: v.array(v.id("students")),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user || user.role !== "teacher") throw new Error("Not a teacher");

    const teacher = await ctx.db
      .query("teachers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    if (!teacher) throw new Error("Teacher profile not found");

    // Verify classroom ownership
    const classroom = await ctx.db.get(args.classroomId);
    if (!classroom || classroom.teacherId !== teacher._id) {
      throw new Error("Classroom not found or unauthorized");
    }

    let count = 0;
    for (const studentId of args.studentIds) {
      await ctx.db.insert("feedback", {
        teacherId: teacher._id,
        studentId,
        classroomId: args.classroomId,
        message: args.message,
        isRead: false,
      });
      count++;
    }

    return count;
  },
});

// Create custom quiz
export const createCustomQuiz = mutation({
  args: {
    classroomId: v.id("classrooms"),
    subject: SUBJECTS,
    questions: v.array(
      v.object({
        prompt: v.string(),
        options: v.array(v.string()),
        correctIndex: v.number(),
      })
    ),
    assignedToAll: v.boolean(),
    studentIds: v.optional(v.array(v.id("students"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user || user.role !== "teacher") throw new Error("Not a teacher");

    const teacher = await ctx.db
      .query("teachers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    if (!teacher) throw new Error("Teacher profile not found");

    // Verify classroom ownership
    const classroom = await ctx.db.get(args.classroomId);
    if (!classroom || classroom.teacherId !== teacher._id) {
      throw new Error("Classroom not found or unauthorized");
    }

    const quizId = await ctx.db.insert("quizzes_custom", {
      classroomId: args.classroomId,
      teacherId: teacher._id,
      subject: args.subject,
      questions: args.questions,
      assignedAt: Date.now(),
      assignedToAll: args.assignedToAll,
      assignedStudentIds: args.studentIds,
    });

    return quizId;
  },
});

// Assign challenge
export const assignChallenge = mutation({
  args: {
    classroomId: v.id("classrooms"),
    description: v.string(),
    dueDate: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user || user.role !== "teacher") throw new Error("Not a teacher");

    const teacher = await ctx.db
      .query("teachers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    if (!teacher) throw new Error("Teacher profile not found");

    // Verify classroom ownership
    const classroom = await ctx.db.get(args.classroomId);
    if (!classroom || classroom.teacherId !== teacher._id) {
      throw new Error("Classroom not found or unauthorized");
    }

    const challengeId = await ctx.db.insert("challenges", {
      classroomId: args.classroomId,
      teacherId: teacher._id,
      description: args.description,
      dueDate: args.dueDate,
      completions: [],
    });

    return challengeId;
  },
});

// Mark challenge complete (for students)
export const markChallengeComplete = mutation({
  args: { challengeId: v.id("challenges") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user || user.role !== "student") throw new Error("Not a student");

    const student = await ctx.db
      .query("students")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    if (!student) throw new Error("Student profile not found");

    const challenge = await ctx.db.get(args.challengeId);
    if (!challenge) throw new Error("Challenge not found");

    // Verify student is in the classroom
    const membership = await ctx.db
      .query("classroomStudents")
      .withIndex("by_classroom_and_student", (q) =>
        q.eq("classroomId", challenge.classroomId).eq("studentId", student._id)
      )
      .first();
    if (!membership) throw new Error("Not a member of this classroom");

    // Add student to completions if not already there
    if (!challenge.completions.includes(student._id)) {
      await ctx.db.patch(args.challengeId, {
        completions: [...challenge.completions, student._id],
      });
    }

    return true;
  },
});

// Add teacher note
export const addTeacherNote = mutation({
  args: {
    studentId: v.id("students"),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), identity.email))
      .first();
    if (!user || user.role !== "teacher") throw new Error("Not a teacher");

    const teacher = await ctx.db
      .query("teachers")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .first();
    if (!teacher) throw new Error("Teacher profile not found");

    const noteId = await ctx.db.insert("teacherNotes", {
      studentId: args.studentId,
      teacherId: teacher._id,
      note: args.note,
      createdAt: Date.now(),
    });

    return noteId;
  },
});

// Get feedback log for a student
export const getFeedbackLog = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const feedbackList = await ctx.db
      .query("feedback")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .collect();

    return feedbackList;
  },
});

// Get classroom overview with analytics
export const getClassroomOverview = query({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const memberships = await ctx.db
      .query("classroomStudents")
      .withIndex("by_classroomId", (q) => q.eq("classroomId", args.classroomId))
      .collect();

    let totalStudyHours = 0;
    let totalTwinHours = 0;
    let twinCount = 0;
    const subjectTotals = {
      math: 0,
      science: 0,
      english: 0,
      history: 0,
      foreign_language: 0,
    };

    const students = [];
    for (const membership of memberships) {
      const student = await ctx.db.get(membership.studentId);
      if (!student) continue;

      students.push(student);
      totalStudyHours += student.weeklyStudyHours;

      if (student.twinData) {
        totalTwinHours += student.twinData.targetWeeklyHours;
        twinCount++;
      }

      for (const subject of Object.keys(subjectTotals) as Array<keyof typeof subjectTotals>) {
        subjectTotals[subject] += student.mastery[subject];
      }
    }

    const studentCount = students.length;
    const avgStudyHours = studentCount > 0 ? totalStudyHours / studentCount : 0;
    const avgTwinHours = twinCount > 0 ? totalTwinHours / twinCount : 0;

    const avgMastery: Record<string, number> = {};
    for (const subject of Object.keys(subjectTotals)) {
      avgMastery[subject] = studentCount > 0 ? subjectTotals[subject as keyof typeof subjectTotals] / studentCount : 0;
    }

    // Get at-risk alerts
    const alerts = await ctx.db
      .query("alerts")
      .withIndex("by_classroomId", (q) => q.eq("classroomId", args.classroomId))
      .collect();

    // Calculate improvement percentage (simplified: students with recent quiz avg > older quiz avg)
    let improvingCount = 0;
    for (const student of students) {
      const quizzes = await ctx.db
        .query("quizzes")
        .withIndex("by_studentId", (q) => q.eq("studentId", student._id))
        .order("desc")
        .take(6);

      if (quizzes.length >= 6) {
        const recent = quizzes.slice(0, 3);
        const older = quizzes.slice(3, 6);
        const recentAvg = recent.reduce((sum, q) => sum + q.score, 0) / 3;
        const olderAvg = older.reduce((sum, q) => sum + q.score, 0) / 3;
        if (recentAvg > olderAvg) improvingCount++;
      }
    }

    const improvingPercent = studentCount > 0 ? (improvingCount / studentCount) * 100 : 0;

    return {
      avgStudyHours,
      avgTwinHours,
      avgMastery,
      improvingPercent,
      atRisk: alerts,
    };
  },
});

// Get challenges for a classroom
export const getChallenges = query({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    const challenges = await ctx.db
      .query("challenges")
      .withIndex("by_classroomId", (q) => q.eq("classroomId", args.classroomId))
      .collect();

    // Get student count for completion percentage
    const memberships = await ctx.db
      .query("classroomStudents")
      .withIndex("by_classroomId", (q) => q.eq("classroomId", args.classroomId))
      .collect();

    const studentCount = memberships.length;

    return challenges.map((c) => ({
      ...c,
      completionPercent: studentCount > 0 ? (c.completions.length / studentCount) * 100 : 0,
    }));
  },
});

// Get teacher notes for a student
export const getTeacherNotes = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("teacherNotes")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .collect();

    return notes;
  },
});