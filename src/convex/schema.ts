import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// User roles
export const ROLES = {
  ADMIN: "admin",
  STUDENT: "student", 
  TEACHER: "teacher",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.STUDENT),
  v.literal(ROLES.TEACHER),
);
export type Role = Infer<typeof roleValidator>;

// Subject types
export const SUBJECTS = {
  MATH: "math",
  SCIENCE: "science", 
  ENGLISH: "english",
  HISTORY: "history",
  FOREIGN_LANGUAGE: "foreign_language",
} as const;

export const subjectValidator = v.union(
  v.literal(SUBJECTS.MATH),
  v.literal(SUBJECTS.SCIENCE),
  v.literal(SUBJECTS.ENGLISH),
  v.literal(SUBJECTS.HISTORY),
  v.literal(SUBJECTS.FOREIGN_LANGUAGE),
);
export type Subject = Infer<typeof subjectValidator>;

const schema = defineSchema(
  {
    ...authTables,

    users: defineTable({
      name: v.optional(v.string()),
      image: v.optional(v.string()),
      email: v.optional(v.string()),
      emailVerificationTime: v.optional(v.number()),
      isAnonymous: v.optional(v.boolean()),
      role: v.optional(roleValidator),
    }).index("email", ["email"]),

    // Student profiles
    students: defineTable({
      userId: v.id("users"),
      name: v.string(),
      grade: v.number(), // 6-12
      weeklyStudyHours: v.number(),
      mastery: v.object({
        math: v.number(), // 0-100
        science: v.number(),
        english: v.number(), 
        history: v.number(),
        foreign_language: v.number(),
      }),
      twinData: v.optional(v.object({
        targetWeeklyHours: v.number(),
        targetMastery: v.object({
          math: v.number(),
          science: v.number(),
          english: v.number(),
          history: v.number(),
          foreign_language: v.number(),
        }),
        microHabits: v.array(v.string()),
        generatedAt: v.number(),
      })),
    }).index("by_user", ["userId"]),

    // Teacher profiles
    teachers: defineTable({
      userId: v.id("users"),
      name: v.string(),
      school: v.optional(v.string()),
    }).index("by_user", ["userId"]),

    // Classrooms
    classrooms: defineTable({
      teacherId: v.id("teachers"),
      name: v.string(),
      code: v.string(), // 6-digit unique code
      description: v.optional(v.string()),
      isActive: v.boolean(),
    }).index("by_teacher", ["teacherId"])
      .index("by_code", ["code"]),

    // Classroom memberships
    classroomStudents: defineTable({
      classroomId: v.id("classrooms"),
      studentId: v.id("students"),
      joinedAt: v.number(),
    }).index("by_classroom", ["classroomId"])
      .index("by_student", ["studentId"])
      .index("by_classroom_and_student", ["classroomId", "studentId"]),

    // Quiz results
    quizzes: defineTable({
      studentId: v.id("students"),
      subject: subjectValidator,
      questions: v.array(v.object({
        question: v.string(),
        options: v.array(v.string()),
        correctAnswer: v.number(),
        studentAnswer: v.optional(v.number()),
      })),
      score: v.number(), // 0-100
      completedAt: v.optional(v.number()),
      timeSpent: v.optional(v.number()), // seconds
    }).index("by_student", ["studentId"])
      .index("by_student_and_subject", ["studentId", "subject"]),

    // Teacher feedback
    feedback: defineTable({
      teacherId: v.id("teachers"),
      studentId: v.id("students"),
      classroomId: v.id("classrooms"),
      message: v.string(),
      isRead: v.boolean(),
    }).index("by_student", ["studentId"])
      .index("by_teacher", ["teacherId"])
      .index("by_classroom", ["classroomId"]),

    // Action plans
    actionPlans: defineTable({
      studentId: v.id("students"),
      weeklyGoals: v.array(v.object({
        subject: subjectValidator,
        hoursAllocated: v.number(),
        targetImprovement: v.number(),
      })),
      microHabits: v.array(v.string()),
      generatedAt: v.number(),
      isActive: v.boolean(),
    }).index("by_student", ["studentId"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;