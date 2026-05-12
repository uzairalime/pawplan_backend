export const swaggerSpec = {
  openapi: "3.0.3",
  info: {
    title: "PawPlan API",
    version: "0.1.0",
    description:
      "Email OTP auth, onboarding profile, courses, moderation, and admin APIs. `/api/v1` is the versioned path for forward clients; `/api` remains available for compatibility."
  },
  servers: [
    { url: "http://localhost:4000", description: "Local development host" },
    { url: "http://localhost:4000/api/v1", description: "Recommended versioned API base" },
    { url: "http://localhost:4000/api", description: "Legacy compatibility API base" }
  ],
  tags: [
    { name: "Health", description: "Service status" },
    { name: "Auth", description: "Email OTP login and current user" },
    { name: "Profile", description: "User onboarding profile" },
    { name: "Uploads", description: "Image upload APIs" },
    { name: "Quotes", description: "Daily quote for dog lovers" },
    { name: "Courses", description: "Training course discovery and user progress" },
    { name: "Catalog", description: "Public catalog lists" },
    { name: "Admin", description: "Admin catalog management" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
      adminApiKey: { type: "apiKey", in: "header", name: "x-admin-key" }
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          statusCode: { type: "integer", example: 400 },
          message: { type: "string", example: "Validation failed" },
          details: { nullable: true }
        }
      },
      ValidationError: {
        type: "object",
        properties: {
          statusCode: { type: "integer", example: 400 },
          message: { type: "string", example: "Validation failed" },
          issues: { type: "object" }
        }
      },
      PaginationMeta: {
        type: "object",
        properties: {
          total: { type: "integer", example: 125 },
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 20 },
          totalPages: { type: "integer", example: 7 },
          hasNextPage: { type: "boolean", example: true },
          hasPreviousPage: { type: "boolean", example: false }
        }
      },
      Quote: {
        type: "object",
        properties: {
          id: { type: "string", example: "daily-dog-quote" },
          quoteId: { type: "string", nullable: true },
          text: {
            type: "string",
            example: "Small training moments become big trust over time."
          },
          author: { type: "string", nullable: true, example: "PawPlan" },
          source: { type: "string", example: "admin" },
          expiresAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      CreateQuoteInput: {
        type: "object",
        required: ["text"],
        properties: {
          text: {
            type: "string",
            example: "A patient trainer builds a confident dog."
          },
          author: { type: "string", example: "PawPlan" },
          isActive: { type: "boolean", example: true }
        }
      },
      RequestOtpInput: {
        type: "object",
        required: ["email"],
        properties: {
          email: { type: "string", format: "email", example: "user@pawplan.app" }
        }
      },
      RequestOtpResponse: {
        type: "object",
        properties: {
          message: { type: "string", example: "OTP sent successfully" },
          email: { type: "string", format: "email", example: "user@pawplan.app" },
          expiresInSeconds: { type: "integer", example: 60 },
          otp: {
            type: "string",
            example: "1122",
            description: "Returned only outside production while OTP service is not implemented."
          }
        }
      },
      VerifyOtpInput: {
        type: "object",
        required: ["email", "otp"],
        properties: {
          email: { type: "string", format: "email", example: "user@pawplan.app" },
          otp: { type: "string", minLength: 4, maxLength: 4, example: "1122" }
        }
      },
      AuthResponse: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/User" },
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
          isNewUser: { type: "boolean", example: true }
        }
      },
      AdminLoginInput: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email", example: "admin@pawplan.com" },
          password: { type: "string", example: "Password@123" }
        }
      },
      AdminLoginResponse: {
        type: "object",
        properties: {
          admin: {
            type: "object",
            properties: {
              id: { type: "string", example: "clx123admin" },
              email: { type: "string", format: "email", example: "admin@pawplan.com" },
              role: { type: "string", enum: ["SUPER_ADMIN", "ADMIN"], example: "SUPER_ADMIN" },
              name: { type: "string", nullable: true, example: "Ava Khan" },
              profilePicture: { type: "string", nullable: true },
              bio: { type: "string", nullable: true },
              expertise: { type: "string", nullable: true, example: "Puppy training" },
              experienceYears: { type: "integer", nullable: true, example: 6 }
            }
          },
          token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
        }
      },
      AdminUser: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["SUPER_ADMIN", "ADMIN"] },
          name: { type: "string", nullable: true },
          profilePicture: { type: "string", nullable: true },
          bio: { type: "string", nullable: true },
          expertise: { type: "string", nullable: true },
          experienceYears: { type: "integer", nullable: true },
          isActive: { type: "boolean" },
          isFrozen: { type: "boolean" },
          freezeReason: { type: "string", nullable: true },
          frozenAt: { type: "string", format: "date-time", nullable: true },
          lastLoginAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      CourseAnalytics: {
        type: "object",
        properties: {
          enrollmentCount: { type: "integer", example: 12 },
          averageProgress: { type: "integer", example: 48 },
          completionRate: { type: "integer", example: 25 },
          completedCount: { type: "integer", example: 3 },
          activeStreakUsers: { type: "integer", example: 7 },
          longestStreak: { type: "integer", example: 14 },
          stepCount: { type: "integer", example: 10 },
          taskCount: { type: "integer", example: 7 },
          reportCount: { type: "integer", example: 2 },
          openReportCount: { type: "integer", example: 1 },
          viewCount: { type: "integer", example: 128 }
        }
      },
      CourseReport: {
        type: "object",
        properties: {
          id: { type: "string" },
          reason: { type: "string", example: "UNSAFE_TRAINING" },
          details: { type: "string", nullable: true },
          status: { type: "string", example: "OPEN" },
          reviewNote: { type: "string", nullable: true },
          reviewedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      AuditLog: {
        type: "object",
        properties: {
          id: { type: "string" },
          actorType: { type: "string", example: "ADMIN" },
          actorId: { type: "string", nullable: true },
          actorEmail: { type: "string", nullable: true, example: "admin@pawplan.com" },
          action: { type: "string", example: "USER_BLOCK" },
          targetType: { type: "string", example: "USER" },
          targetId: { type: "string", nullable: true },
          metadata: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" }
        }
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string", example: "clx123abc0000user" },
          email: { type: "string", format: "email", example: "user@pawplan.app" },
          profilePicture: {
            type: "string",
            nullable: true,
            example: "https://cdn.pawplan.app/profiles/user.png"
          },
          dogName: { type: "string", nullable: true, example: "Milo" },
          dogAge: { type: "integer", nullable: true, example: 2 },
          gender: { type: "string", enum: ["MALE", "FEMALE"], nullable: true, example: "MALE" },
          bio: { type: "string", nullable: true },
          isFrozen: { type: "boolean", example: false },
          freezeReason: { type: "string", nullable: true },
          isBlocked: { type: "boolean", example: false },
          blockReason: { type: "string", nullable: true },
          breedId: { type: "string", nullable: true, example: "clx123abc0000breed" },
          isProfileCompleted: { type: "boolean", example: false },
          breed: {
            allOf: [{ $ref: "#/components/schemas/Breed" }],
            nullable: true
          },
          trainingGoals: {
            type: "array",
            items: {
              type: "object",
              properties: {
                userId: { type: "string" },
                trainingGoalId: { type: "string" },
                trainingGoal: { $ref: "#/components/schemas/TrainingGoal" }
              }
            }
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      Breed: {
        type: "object",
        properties: {
          id: { type: "string", example: "clx123abc0000breed" },
          title: { type: "string", example: "Golden Retriever" },
          icon: { type: "string", nullable: true, example: "golden-retriever" },
          shortDescription: {
            type: "string",
            nullable: true,
            example: "Friendly, social, and eager to learn."
          },
          isActive: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      TrainingGoal: {
        type: "object",
        properties: {
          id: { type: "string", example: "clx123abc0000goal" },
          title: { type: "string", example: "Recall" },
          icon: { type: "string", nullable: true, example: "recall" },
          shortDescription: {
            type: "string",
            nullable: true,
            example: "Help your dog come back reliably when called."
          },
          isActive: { type: "boolean", example: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        }
      },
      CatalogItemInput: {
        type: "object",
        required: ["title"],
        properties: {
          title: { type: "string", example: "Crate Training" },
          icon: { type: "string", example: "crate" },
          shortDescription: {
            type: "string",
            example: "Help the dog settle comfortably in a crate."
          }
        }
      },
      UpdateProfileInput: {
        type: "object",
        properties: {
          profilePicture: {
            type: "string",
            format: "uri",
            example: "https://cdn.pawplan.app/profiles/user.png"
          },
          dogName: { type: "string", example: "Milo" },
          dogAge: { type: "integer", minimum: 0, maximum: 40, example: 2 },
          gender: { type: "string", enum: ["MALE", "FEMALE"], example: "MALE" },
          breedId: { type: "string", example: "paste-breed-id-here" },
          trainingGoalIds: {
            type: "array",
            items: { type: "string" },
            example: ["paste-goal-id-here"]
          }
        }
      },
      UploadResponse: {
        type: "object",
        properties: {
          url: {
            type: "string",
            example: "http://localhost:4000/uploads/profile-images/1710000000000-image.png"
          },
          key: {
            type: "string",
            example: "profile-images/1710000000000-image.png"
          }
        }
      },
      TrainingCourse: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string", example: "Loose Leash Walking" },
          description: { type: "string", nullable: true },
          category: { type: "string", nullable: true, example: "Leash Skills" },
          level: { type: "string", enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"] },
          estimatedDays: { type: "integer", nullable: true, example: 14 },
          estimatedMinutes: { type: "integer", nullable: true, example: 120 },
          isPremium: { type: "boolean", example: false },
          priceAmount: { type: "integer", nullable: true, example: 1499 },
          currencyCode: { type: "string", nullable: true, example: "USD" },
          thumbnailUrl: { type: "string", nullable: true },
          thumbnailKey: { type: "string", nullable: true },
          isPublished: { type: "boolean", example: true },
          isFrozen: { type: "boolean", example: false },
          freezeReason: { type: "string", nullable: true },
          lectures: {
            type: "array",
            items: { $ref: "#/components/schemas/TrainingCourseLecture" }
          },
          dailyTasks: {
            type: "array",
            items: { $ref: "#/components/schemas/CourseDailyTask" }
          }
        }
      },
      TrainingCourseLecture: {
        type: "object",
        properties: {
          id: { type: "string" },
          courseId: { type: "string" },
          title: { type: "string", example: "Getting Started" },
          description: { type: "string", nullable: true },
          videoUrl: { type: "string", nullable: true },
          videoKey: { type: "string", nullable: true },
          sortOrder: { type: "integer", example: 1 },
          steps: {
            type: "array",
            items: { $ref: "#/components/schemas/TrainingCourseStep" }
          }
        }
      },
      TrainingCourseStep: {
        type: "object",
        properties: {
          id: { type: "string" },
          lectureId: { type: "string" },
          title: { type: "string", example: "Practice heel position" },
          description: { type: "string", nullable: true },
          sortOrder: { type: "integer", example: 1 }
        }
      },
      CourseDailyTask: {
        type: "object",
        properties: {
          id: { type: "string" },
          courseId: { type: "string" },
          title: { type: "string", example: "Practice 10 minutes today" },
          description: { type: "string", nullable: true },
          dayNumber: { type: "integer", example: 1 }
        }
      },
      CourseEnrollment: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          courseId: { type: "string" },
          progressPercent: { type: "integer", example: 40 },
          completedStepsCount: { type: "integer", example: 2 },
          totalStepsCount: { type: "integer", example: 5 },
          currentStreak: { type: "integer", example: 3 },
          longestStreak: { type: "integer", example: 7 },
          lastTaskCompletedDate: { type: "string", format: "date-time", nullable: true },
          joinedAt: { type: "string", format: "date-time" },
          completedAt: { type: "string", format: "date-time", nullable: true }
        }
      },
      CourseResume: {
        type: "object",
        properties: {
          enrollment: { $ref: "#/components/schemas/CourseEnrollment" },
          nextLecture: {
            allOf: [{ $ref: "#/components/schemas/TrainingCourseLecture" }],
            nullable: true
          },
          nextStep: {
            allOf: [{ $ref: "#/components/schemas/TrainingCourseStep" }],
            nullable: true
          },
          todaysTask: {
            allOf: [{ $ref: "#/components/schemas/CourseDailyTask" }],
            nullable: true
          }
        }
      }
    }
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Check API health",
        responses: {
          "200": {
            description: "API is healthy",
            content: {
              "application/json": {
                example: { status: "ok", service: "pawplan" }
              }
            }
          }
        }
      }
    },
    "/ready": {
      get: {
        tags: ["Health"],
        summary: "Check API readiness",
        description: "Verifies database connectivity and storage configuration/readiness.",
        responses: {
          "200": { description: "Readiness result" },
          "500": { description: "Readiness failed" }
        }
      }
    },
    "/api/daily-quote": {
      get: {
        tags: ["Quotes"],
        summary: "Get current daily quote",
        description:
          "Returns the cached quote for dog lovers. Admin quotes are preferred; otherwise the API tries a public quote API, then falls back to built-in PawPlan quotes. Quote refreshes every 12 hours.",
        responses: {
          "200": {
            description: "Current quote",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { quote: { $ref: "#/components/schemas/Quote" } }
                }
              }
            }
          },
          "500": { description: "Server error" }
        }
      }
    },
    "/api/auth/request-otp": {
      post: {
        tags: ["Auth"],
        summary: "Request email OTP",
        description: "For now the static OTP is 1122. OTP is valid for 1 minute.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RequestOtpInput" }
            }
          }
        },
        responses: {
          "200": {
            description: "OTP sent",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RequestOtpResponse" }
              }
            }
          },
          "400": {
            description: "Validation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationError" },
                example: { statusCode: 400, message: "Validation failed", issues: {} }
              }
            }
          },
          "429": {
            description: "Too many OTP requests",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { statusCode: 500, message: "Something went wrong" }
              }
            }
          }
        }
      }
    },
    "/api/auth/resend-otp": {
      post: {
        tags: ["Auth"],
        summary: "Resend email OTP",
        description: "Resends the static OTP 1122 and resets validity to 1 minute.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RequestOtpInput" }
            }
          }
        },
        responses: {
          "200": {
            description: "OTP resent",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RequestOtpResponse" },
                example: {
                  message: "OTP resent successfully",
                  email: "user@pawplan.app",
                  expiresInSeconds: 60,
                  otp: "1122"
                }
              }
            }
          },
          "400": {
            description: "Validation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationError" },
                example: { statusCode: 400, message: "Validation failed", issues: {} }
              }
            }
          },
          "429": {
            description: "Too many OTP requests",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { statusCode: 500, message: "Something went wrong" }
              }
            }
          }
        }
      }
    },
    "/api/auth/verify-otp": {
      post: {
        tags: ["Auth"],
        summary: "Verify OTP and login",
        description:
          "OTP must be verified within 1 minute. If the email does not exist, this endpoint creates the user and returns isProfileCompleted as false.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/VerifyOtpInput" }
            }
          }
        },
        responses: {
          "200": {
            description: "Authenticated user and JWT token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AuthResponse" }
              }
            }
          },
          "400": {
            description: "Invalid, expired, missing OTP request, or validation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                examples: {
                  invalidOtp: {
                    value: { statusCode: 400, message: "Invalid OTP" }
                  },
                  expiredOtp: {
                    value: { statusCode: 400, message: "OTP expired" }
                  },
                  otpNotRequested: {
                    value: { statusCode: 400, message: "OTP not requested" }
                  },
                  validationFailed: {
                    value: { statusCode: 400, message: "Validation failed", issues: {} }
                  }
                }
              }
            }
          },
          "403": {
            description: "User account blocked, frozen, or deleted",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "429": {
            description: "Too many OTP verification attempts",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { statusCode: 500, message: "Something went wrong" }
              }
            }
          }
        }
      }
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current user",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Current user",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { user: { $ref: "#/components/schemas/User" } }
                }
              }
            }
          },
          "401": {
            description: "Missing or invalid bearer token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { statusCode: 401, message: "Missing bearer token" }
              }
            }
          },
          "404": {
            description: "User not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { statusCode: 404, message: "User not found" }
              }
            }
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { statusCode: 500, message: "Something went wrong" }
              }
            }
          }
        }
      }
    },
    "/api/admin/login": {
      post: {
        tags: ["Admin"],
        summary: "Admin login",
        description: "Database-backed admin login. Seeded super admin: admin@pawplan.com / Password@123.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/AdminLoginInput" }
            }
          }
        },
        responses: {
          "200": {
            description: "Admin authenticated",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AdminLoginResponse" }
              }
            }
          },
          "400": {
            description: "Validation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationError" },
                example: { statusCode: 400, message: "Validation failed", issues: {} }
              }
            }
          },
          "401": {
            description: "Invalid admin credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { statusCode: 401, message: "Invalid admin credentials" }
              }
            }
          },
          "429": {
            description: "Too many admin login attempts",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { statusCode: 500, message: "Something went wrong" }
              }
            }
          }
        }
      }
    },
    "/api/admin/trainers": {
      get: {
        tags: ["Admin"],
        summary: "List trainers",
        description: "Supports `page`, `limit`, `search`, and `status` query params.",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        responses: {
          "200": {
            description: "Trainer users",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    admins: { type: "array", items: { $ref: "#/components/schemas/AdminUser" } },
                    meta: { $ref: "#/components/schemas/PaginationMeta" }
                  }
                }
              }
            }
          },
          "403": { description: "Super admin access required" }
        }
      },
      post: {
        tags: ["Admin"],
        summary: "Create trainer",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string", minLength: 8 },
                  role: { type: "string", enum: ["SUPER_ADMIN", "ADMIN"] },
                  name: { type: "string" },
                  profilePicture: { type: "string" },
                  bio: { type: "string" },
                  expertise: { type: "string" },
                  experienceYears: { type: "integer" }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "Trainer created" },
          "400": { description: "Validation failed" },
          "403": { description: "Super admin access required" }
        }
      }
    },
    "/api/admin/trainers/{adminId}/activate": {
      patch: {
        tags: ["Admin"],
        summary: "Activate trainer",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "adminId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Trainer activated" },
          "403": { description: "Super admin access required" },
          "404": { description: "Trainer not found" }
        }
      }
    },
    "/api/admin/trainers/{adminId}/deactivate": {
      patch: {
        tags: ["Admin"],
        summary: "Deactivate trainer",
        description: "Marks the trainer inactive and automatically hides their courses from the user app.",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "adminId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Trainer deactivated" },
          "403": { description: "Super admin access required" },
          "404": { description: "Trainer not found" }
        }
      }
    },
    "/api/admin/trainers/{adminId}": {
      get: {
        tags: ["Admin"],
        summary: "Get trainer detail",
        description: "Returns trainer profile, their courses, and aggregate performance metrics.",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "adminId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Trainer detail" },
          "403": { description: "Super admin access required" },
          "404": { description: "Trainer not found" }
        }
      }
    },
    "/api/admin/trainers/{adminId}/profile": {
      patch: {
        tags: ["Admin"],
        summary: "Update trainer profile",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "adminId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Trainer profile updated" },
          "400": { description: "Validation failed" },
          "403": { description: "Super admin access required" },
          "404": { description: "Trainer not found" }
        }
      }
    },
    "/api/admin/trainers/{adminId}/credentials": {
      patch: {
        tags: ["Admin"],
        summary: "Update trainer email or password",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "adminId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Trainer credentials updated" },
          "400": { description: "Validation failed" },
          "403": { description: "Super admin access required" },
          "404": { description: "Trainer not found" }
        }
      }
    },
    "/api/admin/dashboard-stats": {
      get: {
        tags: ["Admin"],
        summary: "Get super admin dashboard stats",
        description:
          "Returns total platform counts, 7-day trend metrics, top trainers, and top active courses for the dashboard.",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        responses: {
          "200": { description: "Dashboard stats" },
          "403": { description: "Super admin access required" }
        }
      }
    },
    "/api/admin/audit-logs": {
      get: {
        tags: ["Admin"],
        summary: "List audit logs",
        description: "Supports `page`, `limit`, `search`, `action`, and `targetType` query params.",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        responses: {
          "200": {
            description: "Audit log list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    logs: {
                      type: "array",
                      items: { $ref: "#/components/schemas/AuditLog" }
                    },
                    meta: { $ref: "#/components/schemas/PaginationMeta" }
                  }
                }
              }
            }
          },
          "403": { description: "Super admin access required" }
        }
      }
    },
    "/api/admin/exports/users.csv": {
      get: {
        tags: ["Admin"],
        summary: "Export users CSV",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        responses: {
          "200": { description: "CSV export" },
          "403": { description: "Super admin access required" }
        }
      }
    },
    "/api/admin/exports/trainers.csv": {
      get: {
        tags: ["Admin"],
        summary: "Export trainers CSV",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        responses: {
          "200": { description: "CSV export" },
          "403": { description: "Super admin access required" }
        }
      }
    },
    "/api/admin/exports/courses.csv": {
      get: {
        tags: ["Admin"],
        summary: "Export courses CSV",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        responses: {
          "200": { description: "CSV export" },
          "403": { description: "Super admin access required" }
        }
      }
    },
    "/api/admin/exports/reports.csv": {
      get: {
        tags: ["Admin"],
        summary: "Export reports CSV",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        responses: {
          "200": { description: "CSV export" },
          "403": { description: "Super admin access required" }
        }
      }
    },
    "/api/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "List app users",
        description: "Supports `page`, `limit`, `search`, and `status` query params.",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        responses: {
          "200": {
            description: "User list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    users: { type: "array", items: { $ref: "#/components/schemas/User" } },
                    meta: { $ref: "#/components/schemas/PaginationMeta" }
                  }
                }
              }
            }
          },
          "403": { description: "Super admin access required" }
        }
      }
    },
    "/api/admin/users/{userId}": {
      get: {
        tags: ["Admin"],
        summary: "Get app user detail",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "User detail" },
          "403": { description: "Super admin access required" },
          "404": { description: "User not found" }
        }
      },
      patch: {
        tags: ["Admin"],
        summary: "Update app user",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "User updated" },
          "400": { description: "Validation failed" },
          "403": { description: "Super admin access required" },
          "404": { description: "User not found" }
        }
      },
      delete: {
        tags: ["Admin"],
        summary: "Soft delete app user",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "204": { description: "User deleted" },
          "403": { description: "Super admin access required" },
          "404": { description: "User not found" }
        }
      }
    },
    "/api/admin/users/{userId}/freeze": {
      patch: {
        tags: ["Admin"],
        summary: "Freeze app user",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "User frozen" },
          "403": { description: "Super admin access required" }
        }
      }
    },
    "/api/admin/users/{userId}/unfreeze": {
      patch: {
        tags: ["Admin"],
        summary: "Unfreeze app user",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "User unfrozen" },
          "403": { description: "Super admin access required" }
        }
      }
    },
    "/api/admin/users/{userId}/block": {
      patch: {
        tags: ["Admin"],
        summary: "Block app user",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "User blocked" },
          "403": { description: "Super admin access required" }
        }
      }
    },
    "/api/admin/users/{userId}/unblock": {
      patch: {
        tags: ["Admin"],
        summary: "Unblock app user",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "userId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "User unblocked" },
          "403": { description: "Super admin access required" }
        }
      }
    },
    "/api/profile": {
      get: {
        tags: ["Profile"],
        summary: "Get onboarding profile",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": {
            description: "Profile data",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { user: { $ref: "#/components/schemas/User" } }
                }
              }
            }
          },
          "401": {
            description: "Missing or invalid bearer token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { statusCode: 401, message: "Missing bearer token" }
              }
            }
          },
          "403": {
            description: "User account is blocked",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "User not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { statusCode: 404, message: "User not found" }
              }
            }
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { statusCode: 500, message: "Something went wrong" }
              }
            }
          }
        }
      },
      patch: {
        tags: ["Profile"],
        summary: "Update profile in parts",
        description:
          "Send any subset of fields. isProfileCompleted becomes true when dogName, dogAge, gender, breedId, and at least one trainingGoalId are saved.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UpdateProfileInput" }
            }
          }
        },
        responses: {
          "200": {
            description: "Updated profile",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { user: { $ref: "#/components/schemas/User" } }
                }
              }
            }
          },
          "400": {
            description: "Validation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationError" },
                example: { statusCode: 400, message: "Validation failed", issues: {} }
              }
            }
          },
          "401": {
            description: "Missing or invalid bearer token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { statusCode: 401, message: "Missing bearer token" }
              }
            }
          },
          "403": {
            description: "User account is blocked",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "404": {
            description: "Breed or training goal not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                examples: {
                  breedNotFound: { value: { statusCode: 404, message: "Breed not found" } },
                  goalNotFound: {
                    value: { statusCode: 404, message: "One or more training goals were not found" }
                  }
                }
              }
            }
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { statusCode: 500, message: "Something went wrong" }
              }
            }
          }
        }
      }
    },
    "/api/uploads/profile-image": {
      post: {
        tags: ["Uploads"],
        summary: "Upload profile image",
        description:
          "Uploads one image using multipart/form-data. The form field name must be image. Returns the public image URL and storage key. Uses local storage by default, or S3 when STORAGE_DRIVER=s3.",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["image"],
                properties: {
                  image: {
                    type: "string",
                    format: "binary"
                  }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Image uploaded",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UploadResponse" }
              }
            }
          },
          "400": {
            description: "Missing file, invalid file, or validation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                examples: {
                  missingFile: { value: { statusCode: 400, message: "Profile image is required" } },
                  invalidFile: { value: { statusCode: 400, message: "Only image files are allowed" } }
                }
              }
            }
          },
          "401": {
            description: "Missing or invalid bearer token",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { statusCode: 401, message: "Missing bearer token" }
              }
            }
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { statusCode: 500, message: "Something went wrong" }
              }
            }
          }
        }
      }
    },
    "/api/uploads/course-video": {
      post: {
        tags: ["Uploads"],
        summary: "Upload course lecture video",
        description:
          "Admin-only multipart upload. The form field name must be video. Returns video URL and storage key for use as lecture videoUrl/videoKey.",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["video"],
                properties: {
                  video: { type: "string", format: "binary" }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Video uploaded",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UploadResponse" }
              }
            }
          },
          "400": { description: "Missing file, invalid file, or file too large" },
          "401": { description: "Missing or invalid admin credentials" },
          "500": { description: "Server error" }
        }
      }
    },
    "/api/uploads/course-thumbnail": {
      post: {
        tags: ["Uploads"],
        summary: "Upload course thumbnail",
        description:
          "Admin-only multipart upload. The form field name must be image. Returns thumbnail URL and storage key for use as course thumbnailUrl/thumbnailKey.",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["image"],
                properties: {
                  image: { type: "string", format: "binary" }
                }
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Thumbnail uploaded",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UploadResponse" }
              }
            }
          },
          "400": { description: "Missing file, invalid file, or file too large" },
          "401": { description: "Missing or invalid admin credentials" },
          "500": { description: "Server error" }
        }
      }
    },
    "/api/courses/my-courses": {
      get: {
        tags: ["Courses"],
        summary: "List my joined courses",
        description: "Supports `page` and `limit` query params.",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Joined course enrollments with course details" },
          "401": { description: "Missing or invalid bearer token" }
        }
      }
    },
    "/api/courses": {
      get: {
        tags: ["Courses"],
        summary: "List published training courses",
        description: "Supports `page`, `limit`, `search`, `category`, and `level` query params.",
        responses: {
          "200": {
            description: "Course list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    courses: {
                      type: "array",
                      items: { $ref: "#/components/schemas/TrainingCourse" }
                    },
                    meta: { $ref: "#/components/schemas/PaginationMeta" }
                  }
                }
              }
            }
          }
        }
      }
    },
    "/api/courses/{courseId}": {
      get: {
        tags: ["Courses"],
        summary: "Get course with lectures, steps, and daily tasks",
        parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Course detail",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { course: { $ref: "#/components/schemas/TrainingCourse" } }
                }
              }
            }
          },
          "404": { description: "Training course not found" }
        }
      }
    },
    "/api/courses/{courseId}/join": {
      post: {
        tags: ["Courses"],
        summary: "Join a course",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "201": {
            description: "Course enrollment",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { enrollment: { $ref: "#/components/schemas/CourseEnrollment" } }
                }
              }
            }
          },
          "401": { description: "Missing or invalid bearer token" },
          "404": { description: "Training course not found" }
        }
      }
    },
    "/api/courses/{courseId}/report": {
      post: {
        tags: ["Courses"],
        summary: "Report a course",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["reason"],
                properties: {
                  reason: {
                    type: "string",
                    enum: ["WRONG_INFO", "UNSAFE_TRAINING", "BAD_VIDEO", "SPAM", "OTHER"]
                  },
                  details: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "Course report submitted" },
          "401": { description: "Missing or invalid bearer token" },
          "404": { description: "Training course not found" }
        }
      }
    },
    "/api/courses/{courseId}/progress": {
      get: {
        tags: ["Courses"],
        summary: "Get my course progress",
        description:
          "Returns enrollment progress, completed step IDs, today's daily task, and streak fields.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Course progress" },
          "401": { description: "Missing or invalid bearer token" },
          "404": { description: "Course enrollment not found" }
        }
      }
    },
    "/api/courses/{courseId}/resume": {
      get: {
        tags: ["Courses"],
        summary: "Resume course",
        description: "Returns the next incomplete lecture/step and today's task for the joined course.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Course resume state",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CourseResume" }
              }
            }
          },
          "401": { description: "Missing or invalid bearer token" },
          "404": { description: "Course enrollment not found" }
        }
      }
    },
    "/api/courses/{courseId}/daily-task-history": {
      get: {
        tags: ["Courses"],
        summary: "Get my course daily task history",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Daily task completion history" },
          "401": { description: "Missing or invalid bearer token" },
          "404": { description: "Course enrollment not found" }
        }
      }
    },
    "/api/courses/steps/{stepId}/complete": {
      post: {
        tags: ["Courses"],
        summary: "Mark a course step complete",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "stepId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Updated enrollment progress" },
          "401": { description: "Missing or invalid bearer token" },
          "404": { description: "Step not found or user has not joined course" }
        }
      }
    },
    "/api/courses/daily-tasks/{taskId}/complete": {
      post: {
        tags: ["Courses"],
        summary: "Complete daily task and update streak",
        description:
          "Daily task day is calculated from the user's course joinedAt date. User can only complete today's task for their course day. Consecutive UTC days increment currentStreak; missing a day resets the next completion to 1.",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "taskId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Updated enrollment with streak" },
          "400": { description: "Task does not match today's course day" },
          "401": { description: "Missing or invalid bearer token" },
          "404": { description: "Task not found or user has not joined course" }
        }
      }
    },
    "/api/admin/courses": {
      get: {
        tags: ["Admin"],
        summary: "List admin courses",
        description:
          "Super admin receives all courses. Trainer receives only their own courses, including draft, unpublished, and soft-deleted items. Supports `page`, `limit`, `search`, `status`, and `level` query params.",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        responses: {
          "200": {
            description: "Admin course list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    courses: { type: "array", items: { $ref: "#/components/schemas/Course" } },
                    meta: { $ref: "#/components/schemas/PaginationMeta" }
                  }
                }
              }
            }
          },
          "401": { description: "Missing or invalid admin credentials" }
        }
      },
      post: {
        tags: ["Admin"],
        summary: "Create training course",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string" },
                  level: { type: "string", enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED"] },
                  estimatedDays: { type: "integer" },
                  estimatedMinutes: { type: "integer" },
                  thumbnailUrl: { type: "string", format: "uri" },
                  thumbnailKey: { type: "string" },
                  isPublished: { type: "boolean" },
                  lectures: {
                    type: "array",
                    description: "Optional lectures with steps to create in the same course request.",
                    items: {
                      type: "object",
                      required: ["title"],
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        videoUrl: { type: "string", format: "uri" },
                        videoKey: { type: "string" },
                        sortOrder: { type: "integer" },
                        steps: {
                          type: "array",
                          items: {
                            type: "object",
                            required: ["title"],
                            properties: {
                              title: { type: "string" },
                              description: { type: "string" },
                              sortOrder: { type: "integer" }
                            }
                          }
                        }
                      }
                    }
                  },
                  dailyTasks: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["title", "dayNumber"],
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        dayNumber: { type: "integer", minimum: 1 }
                      }
                    }
                  }
                }
              },
              example: {
                title: "Loose Leash Walking",
                description: "Teach calmer walks with daily practice.",
                category: "Leash Skills",
                level: "BEGINNER",
                estimatedDays: 14,
                estimatedMinutes: 120,
                thumbnailUrl: "https://example.com/course.png",
                thumbnailKey: "profile-images/example.png",
                isPublished: true,
                lectures: [
                  {
                    title: "Getting Started",
                    description: "Prepare rewards and choose a quiet walking area.",
                    videoUrl: "https://example.com/video.mp4",
                    videoKey: "course-videos/video.mp4",
                    sortOrder: 1,
                    steps: [
                      {
                        title: "Stand with your dog on your left side",
                        description: "Reward calm focus before moving.",
                        sortOrder: 1
                      }
                    ]
                  }
                ],
                dailyTasks: [
                  {
                    title: "Practice loose leash walking for 10 minutes",
                    description: "Reward calm check-ins.",
                    dayNumber: 1
                  }
                ]
              }
            }
          }
        },
        responses: {
          "201": { description: "Course created" },
          "400": { description: "Validation failed" },
          "401": { description: "Missing or invalid admin credentials" }
        }
      }
    },
    "/api/admin/courses-pending-approval": {
      get: {
        tags: ["Admin"],
        summary: "List pending approval courses",
        description: "Supports `page`, `limit`, and `search` query params.",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        responses: {
          "200": {
            description: "Pending review course list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    courses: { type: "array", items: { $ref: "#/components/schemas/Course" } },
                    meta: { $ref: "#/components/schemas/PaginationMeta" }
                  }
                }
              }
            }
          },
          "403": { description: "Super admin access required" }
        }
      }
    },
    "/api/admin/courses/{courseId}": {
      get: {
        tags: ["Admin"],
        summary: "Get admin course detail",
        description: "Includes draft, unpublished, and soft-deleted course details.",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Admin course detail" },
          "401": { description: "Missing or invalid admin credentials" },
          "404": { description: "Training course not found" }
        }
      },
      patch: {
        tags: ["Admin"],
        summary: "Update training course",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Course updated" },
          "400": { description: "Validation failed" },
          "401": { description: "Missing or invalid admin credentials" },
          "404": { description: "Training course not found" }
        }
      },
      delete: {
        tags: ["Admin"],
        summary: "Soft delete training course",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "204": { description: "Course soft deleted" },
          "401": { description: "Missing or invalid admin credentials" },
          "404": { description: "Training course not found" }
        }
      }
    },
    "/api/admin/courses/{courseId}/online": {
      patch: {
        tags: ["Admin"],
        summary: "Publish course online",
        description:
          "Sets isPublished to true. Requires thumbnail, at least one lecture, at least one step, and at least one daily task.",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Course is online" },
          "400": { description: "Course is missing required publish content" },
          "401": { description: "Missing or invalid admin credentials" },
          "404": { description: "Training course not found" }
        }
      }
    },
    "/api/admin/courses/{courseId}/freeze": {
      patch: {
        tags: ["Admin"],
        summary: "Freeze course",
        description: "Freezes the course, hides it from users, and stores a moderation reason.",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Course frozen" },
          "400": { description: "Validation failed" },
          "403": { description: "Super admin access required" }
        }
      }
    },
    "/api/admin/courses/{courseId}/unfreeze": {
      patch: {
        tags: ["Admin"],
        summary: "Unfreeze course",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Course unfrozen" },
          "403": { description: "Super admin access required" }
        }
      }
    },
    "/api/admin/courses/{courseId}/analytics": {
      get: {
        tags: ["Admin"],
        summary: "Get course analytics",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": {
            description: "Course analytics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    analytics: { $ref: "#/components/schemas/CourseAnalytics" }
                  }
                }
              }
            }
          },
          "401": { description: "Missing or invalid admin credentials" },
          "404": { description: "Training course not found" }
        }
      }
    },
    "/api/admin/courses/{courseId}/offline": {
      patch: {
        tags: ["Admin"],
        summary: "Take course offline",
        description: "Sets isPublished to false. User app cannot view offline courses.",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Course is offline" },
          "401": { description: "Missing or invalid admin credentials" },
          "404": { description: "Training course not found" }
        }
      }
    },
    "/api/admin/courses/{courseId}/lectures": {
      post: {
        tags: ["Admin"],
        summary: "Add lecture to course",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  videoUrl: { type: "string", format: "uri" },
                  videoKey: { type: "string" },
                  sortOrder: { type: "integer" },
                  steps: {
                    type: "array",
                    items: {
                      type: "object",
                      required: ["title"],
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        sortOrder: { type: "integer" }
                      }
                    }
                  },
                  dailyTasks: {
                    type: "array",
                    description: "Optional course daily tasks to create while adding this lecture.",
                    items: {
                      type: "object",
                      required: ["title", "dayNumber"],
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        dayNumber: { type: "integer", minimum: 1 }
                      }
                    }
                  }
                }
              },
              example: {
                title: "Getting Started",
                description: "Prepare rewards and choose a quiet walking area.",
                videoUrl: "https://example.com/video.mp4",
                videoKey: "course-videos/video.mp4",
                sortOrder: 1,
                steps: [
                  {
                    title: "Stand with your dog on your left side",
                    description: "Reward calm focus before moving.",
                    sortOrder: 1
                  }
                ],
                dailyTasks: [
                  {
                    title: "Practice 10 minutes after this lecture",
                    description: "Keep it short and positive.",
                    dayNumber: 1
                  }
                ]
              }
            }
          }
        },
        responses: {
          "201": { description: "Lecture created" },
          "400": { description: "Validation failed" },
          "401": { description: "Missing or invalid admin credentials" },
          "404": { description: "Training course not found" }
        }
      }
    },
    "/api/admin/lectures/{lectureId}/steps": {
      post: {
        tags: ["Admin"],
        summary: "Add step to lecture",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "lectureId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title"],
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  sortOrder: { type: "integer" }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "Step created" },
          "400": { description: "Validation failed" },
          "401": { description: "Missing or invalid admin credentials" },
          "404": { description: "Lecture not found" }
        }
      }
    },
    "/api/admin/lectures/{lectureId}": {
      patch: {
        tags: ["Admin"],
        summary: "Update lecture",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "lectureId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Lecture updated" },
          "400": { description: "Validation failed" },
          "401": { description: "Missing or invalid admin credentials" },
          "404": { description: "Lecture not found" }
        }
      },
      delete: {
        tags: ["Admin"],
        summary: "Soft delete lecture",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "lectureId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "204": { description: "Lecture soft deleted" },
          "401": { description: "Missing or invalid admin credentials" },
          "404": { description: "Lecture not found" }
        }
      }
    },
    "/api/admin/steps/{stepId}": {
      patch: {
        tags: ["Admin"],
        summary: "Update step",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "stepId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Step updated" },
          "400": { description: "Validation failed" },
          "401": { description: "Missing or invalid admin credentials" },
          "404": { description: "Training step not found" }
        }
      },
      delete: {
        tags: ["Admin"],
        summary: "Soft delete step",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "stepId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "204": { description: "Step soft deleted" },
          "401": { description: "Missing or invalid admin credentials" },
          "404": { description: "Training step not found" }
        }
      }
    },
    "/api/admin/courses/{courseId}/daily-tasks": {
      post: {
        tags: ["Admin"],
        summary: "Create course daily task",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "courseId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["title", "dayNumber"],
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  dayNumber: { type: "integer", minimum: 1 }
                }
              }
            }
          }
        },
        responses: {
          "201": { description: "Daily task created" },
          "400": { description: "Validation failed" },
          "401": { description: "Missing or invalid admin credentials" },
          "404": { description: "Training course not found" }
        }
      }
    },
    "/api/admin/daily-tasks/{taskId}": {
      patch: {
        tags: ["Admin"],
        summary: "Update course daily task",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "taskId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string", nullable: true },
                  dayNumber: { type: "integer", minimum: 1 }
                }
              }
            }
          }
        },
        responses: {
          "200": { description: "Daily task updated" },
          "400": { description: "Validation failed" },
          "401": { description: "Missing or invalid admin credentials" },
          "404": { description: "Daily task not found" }
        }
      },
      delete: {
        tags: ["Admin"],
        summary: "Delete course daily task",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "taskId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "204": { description: "Daily task deleted" },
          "401": { description: "Missing or invalid admin credentials" },
          "404": { description: "Daily task not found" }
        }
      }
    },
    "/api/admin/course-reports": {
      get: {
        tags: ["Admin"],
        summary: "List course reports",
        description: "Supports `page`, `limit`, `search`, and `status` query params.",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        responses: {
          "200": {
            description: "Course report list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    reports: {
                      type: "array",
                      items: { $ref: "#/components/schemas/CourseReport" }
                    },
                    meta: { $ref: "#/components/schemas/PaginationMeta" }
                  }
                }
              }
            }
          },
          "403": { description: "Super admin access required" }
        }
      }
    },
    "/api/admin/course-reports/{reportId}/resolve": {
      patch: {
        tags: ["Admin"],
        summary: "Resolve course report",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "reportId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Course report resolved" },
          "403": { description: "Super admin access required" },
          "404": { description: "Course report not found" }
        }
      }
    },
    "/api/admin/course-reports/{reportId}/dismiss": {
      patch: {
        tags: ["Admin"],
        summary: "Dismiss course report",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "reportId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Course report dismissed" },
          "403": { description: "Super admin access required" },
          "404": { description: "Course report not found" }
        }
      }
    },
    "/api/breeds": {
      get: {
        tags: ["Catalog"],
        summary: "List active breeds",
        description: "Supports `page`, `limit`, and `search` query params.",
        responses: {
          "200": {
            description: "Breed list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    breeds: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Breed" }
                    },
                    meta: { $ref: "#/components/schemas/PaginationMeta" }
                  }
                }
              }
            }
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { statusCode: 500, message: "Something went wrong" }
              }
            }
          }
        }
      }
    },
    "/api/training-goals": {
      get: {
        tags: ["Catalog"],
        summary: "List active training goals",
        description: "Supports `page`, `limit`, and `search` query params.",
        responses: {
          "200": {
            description: "Training goal list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    trainingGoals: {
                      type: "array",
                      items: { $ref: "#/components/schemas/TrainingGoal" }
                    },
                    meta: { $ref: "#/components/schemas/PaginationMeta" }
                  }
                }
              }
            }
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { statusCode: 500, message: "Something went wrong" }
              }
            }
          }
        }
      }
    },
    "/api/admin/breeds": {
      post: {
        tags: ["Admin"],
        summary: "Create breed",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CatalogItemInput" },
              example: {
                title: "Border Collie",
                icon: "border-collie",
                shortDescription: "Smart, energetic, and focused."
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Breed created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { breed: { $ref: "#/components/schemas/Breed" } }
                }
              }
            }
          },
          "400": {
            description: "Validation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationError" },
                example: { statusCode: 400, message: "Validation failed", issues: {} }
              }
            }
          },
          "401": {
            description: "Missing or invalid admin credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                examples: {
                  missingCredentials: {
                    value: { statusCode: 401, message: "Missing admin credentials" }
                  },
                  invalidToken: { value: { statusCode: 401, message: "Invalid admin token" } },
                  invalidApiKey: { value: { statusCode: 401, message: "Invalid admin API key" } }
                }
              }
            }
          },
          "409": {
            description: "Catalog title already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { statusCode: 409, message: "Catalog title already exists" }
              }
            }
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { statusCode: 500, message: "Something went wrong" }
              }
            }
          }
        }
      }
    },
    "/api/admin/breeds/{id}": {
      delete: {
        tags: ["Admin"],
        summary: "Delete breed",
        description: "Soft-deactivates the breed by setting isActive to false. User app will no longer list it.",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "204": { description: "Breed deactivated" },
          "401": { description: "Missing or invalid admin credentials" },
          "404": { description: "Breed not found" }
        }
      }
    },
    "/api/admin/training-goals": {
      post: {
        tags: ["Admin"],
        summary: "Create training goal",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CatalogItemInput" },
              example: {
                title: "Crate Training",
                icon: "crate",
                shortDescription: "Help the dog settle comfortably in a crate."
              }
            }
          }
        },
        responses: {
          "201": {
            description: "Training goal created",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { trainingGoal: { $ref: "#/components/schemas/TrainingGoal" } }
                }
              }
            }
          },
          "400": {
            description: "Validation failed",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ValidationError" },
                example: { statusCode: 400, message: "Validation failed", issues: {} }
              }
            }
          },
          "401": {
            description: "Missing or invalid admin credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                examples: {
                  missingCredentials: {
                    value: { statusCode: 401, message: "Missing admin credentials" }
                  },
                  invalidToken: { value: { statusCode: 401, message: "Invalid admin token" } },
                  invalidApiKey: { value: { statusCode: 401, message: "Invalid admin API key" } }
                }
              }
            }
          },
          "409": {
            description: "Catalog title already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { statusCode: 409, message: "Catalog title already exists" }
              }
            }
          },
          "500": {
            description: "Server error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
                example: { statusCode: 500, message: "Something went wrong" }
              }
            }
          }
        }
      }
    },
    "/api/admin/training-goals/{id}": {
      delete: {
        tags: ["Admin"],
        summary: "Delete training goal",
        description:
          "Soft-deactivates the training goal by setting isActive to false. User app will no longer list it.",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "204": { description: "Training goal deactivated" },
          "401": { description: "Missing or invalid admin credentials" },
          "404": { description: "Training goal not found" }
        }
      }
    },
    "/api/admin/quotes": {
      get: {
        tags: ["Admin"],
        summary: "List admin quotes",
        description: "Supports `page`, `limit`, and `search` query params.",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        responses: {
          "200": {
            description: "Quote list",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    quotes: { type: "array", items: { $ref: "#/components/schemas/Quote" } },
                    meta: { $ref: "#/components/schemas/PaginationMeta" }
                  }
                }
              }
            }
          },
          "401": { description: "Missing or invalid admin credentials" }
        }
      },
      post: {
        tags: ["Admin"],
        summary: "Create admin quote",
        description: "Admin quotes are preferred by /api/daily-quote.",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateQuoteInput" }
            }
          }
        },
        responses: {
          "201": { description: "Quote created" },
          "400": { description: "Validation failed" },
          "401": { description: "Missing or invalid admin credentials" }
        }
      }
    },
    "/api/admin/quotes/refresh": {
      post: {
        tags: ["Admin"],
        summary: "Refresh daily quote now",
        description: "Manually refreshes the 12-hour quote cache.",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        responses: {
          "200": { description: "Quote refreshed" },
          "401": { description: "Missing or invalid admin credentials" }
        }
      }
    },
    "/api/admin/quotes/{quoteId}": {
      delete: {
        tags: ["Admin"],
        summary: "Delete admin quote",
        description: "Soft-deactivates the quote by setting isActive to false.",
        security: [{ bearerAuth: [] }, { adminApiKey: [] }],
        parameters: [{ name: "quoteId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "204": { description: "Quote deactivated" },
          "401": { description: "Missing or invalid admin credentials" },
          "404": { description: "Quote not found" }
        }
      }
    }
  }
};
