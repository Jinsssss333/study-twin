import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Enums
export const ROLES = v.union(v.literal("student"), v.literal("teacher"));

export const SUBJECTS = v.union(
  v.literal("math"),
  v.literal("science"),
  v.literal("english"),
  v.literal("history"),
  v.literal("foreign_language")
);

export default defineSchema({
  users: defineTable({
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(ROLES),
  })
    .index("email", ["email"])
    .index("phone", ["phone"]),

  students: defineTable({
    userId: v.id("users"),
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
    twinData: v.optional(
      v.object({
        targetWeeklyHours: v.number(),
        targetMastery: v.object({
          math: v.number(),
          science: v.number(),
          english: v.number(),
          history: v.number(),
          foreign_language: v.number(),
        }),
        microHabits: v.array(v.string()),
        generatedAt: v.optional(v.number()),
      })
    ),
  }).index("by_userId", ["userId"]),

  teachers: defineTable({
    userId: v.id("users"),
    name: v.string(),
    school: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  classrooms: defineTable({
    teacherId: v.id("teachers"),
    name: v.string(),
    code: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
  })
    .index("by_teacherId", ["teacherId"])
    .index("by_code", ["code"]),

  classroomStudents: defineTable({
    classroomId: v.id("classrooms"),
    studentId: v.id("students"),
    joinedAt: v.number(),
  })
    .index("by_classroomId", ["classroomId"])
    .index("by_studentId", ["studentId"])
    .index("by_classroom_and_student", ["classroomId", "studentId"]),

  quizzes: defineTable({
    studentId: v.id("students"),
    subject: SUBJECTS,
    questions: v.array(
      v.union(
        v.object({
          prompt: v.string(),
          options: v.array(v.string()),
          correctIndex: v.number(),
          // accept optional student answer for new format
          studentAnswer: v.optional(v.number()),
        }),
        v.object({
          question: v.string(),
          options: v.array(v.string()),
          correctAnswer: v.number(),
          // accept optional student answer for old format
          studentAnswer: v.optional(v.number()),
        }),
      )
    ),
    // keep optional answers to be backward compatible
    answers: v.optional(v.array(v.number())),
    score: v.number(),
    // make completedAt optional for legacy docs
    completedAt: v.optional(v.number()),
    // add optional timeSpent for newer docs
    timeSpent: v.optional(v.number()),
  })
    .index("by_studentId", ["studentId"])
    .index("by_student_and_subject", ["studentId", "subject"]),

  feedback: defineTable({
    teacherId: v.id("teachers"),
    studentId: v.id("students"),
    classroomId: v.id("classrooms"),
    message: v.string(),
    isRead: v.boolean(),
  })
    .index("by_studentId", ["studentId"])
    .index("by_teacherId", ["teacherId"])
    .index("by_classroomId", ["classroomId"]),

  actionPlans: defineTable({
    studentId: v.id("students"),
    subject: SUBJECTS,
    actions: v.array(v.string()),
    createdAt: v.number(),
  }).index("by_studentId", ["studentId"]),

  // New tables for teacher dashboard expansion
  alerts: defineTable({
    studentId: v.id("students"),
    classroomId: v.id("classrooms"),
    type: v.string(),
    createdAt: v.number(),
  })
    .index("by_studentId", ["studentId"])
    .index("by_classroomId", ["classroomId"]),

  quizzes_custom: defineTable({
    classroomId: v.id("classrooms"),
    teacherId: v.id("teachers"),
    subject: SUBJECTS,
    questions: v.array(
      v.object({
        prompt: v.string(),
        options: v.array(v.string()),
        correctIndex: v.number(),
      })
    ),
    assignedAt: v.number(),
    assignedToAll: v.boolean(),
    assignedStudentIds: v.optional(v.array(v.id("students"))),
  })
    .index("by_classroomId", ["classroomId"])
    .index("by_teacherId", ["teacherId"])
    .index("by_classroom_and_subject", ["classroomId", "subject"]),

  challenges: defineTable({
    classroomId: v.id("classrooms"),
    teacherId: v.id("teachers"),
    description: v.string(),
    dueDate: v.number(),
    completions: v.array(v.id("students")),
  })
    .index("by_classroomId", ["classroomId"])
    .index("by_teacherId", ["teacherId"]),

  teacherNotes: defineTable({
    studentId: v.id("students"),
    teacherId: v.id("teachers"),
    note: v.string(),
    createdAt: v.number(),
  })
    .index("by_studentId", ["studentId"])
    .index("by_teacherId", ["teacherId"]),
});