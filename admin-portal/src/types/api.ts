export type AdminSession = {
  admin: {
    id: string;
    email: string;
    role: "SUPER_ADMIN" | "ADMIN";
    name: string | null;
    profilePicture: string | null;
    bio: string | null;
    expertise: string | null;
    experienceYears: number | null;
  };
  token: string;
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type PaginatedResponse<T, K extends string> = {
  meta: PaginationMeta;
} & Record<K, T[]>;

export type Trainer = {
  id: string;
  name: string | null;
  email: string;
  profilePicture: string | null;
  bio: string | null;
  expertise: string | null;
  experienceYears: number | null;
  isFrozen?: boolean;
};

export type DashboardStats = {
  userCount: number;
  trainerCount: number;
  activeTrainerCount: number;
  frozenTrainerCount: number;
  courseCount: number;
  frozenCourseCount: number;
  premiumCourseCount: number;
  pendingApprovalCount: number;
  enrollmentCount: number;
  completionCount: number;
  openReportCount: number;
  newUsersLast7Days: number;
  newEnrollmentsLast7Days: number;
  newReportsLast7Days: number;
  newCoursesLast7Days: number;
  topTrainers: Array<{
    id: string;
    name: string | null;
    email: string;
    profilePicture: string | null;
    expertise: string | null;
    isActive: boolean;
    isFrozen: boolean;
    courseCount: number;
    enrollmentCount: number;
    reportCount: number;
    totalViews: number;
  }>;
  topCoursesLast7Days: Array<{
    id: string;
    title: string;
    category: string | null;
    trainerName: string;
    viewCount: number;
    enrollmentCount: number;
    reportCount: number;
  }>;
};

export type Course = {
  id: string;
  trainerId: string | null;
  trainer: Trainer | null;
  title: string;
  description: string | null;
  category: string | null;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  estimatedDays: number | null;
  estimatedMinutes: number | null;
  isPremium?: boolean;
  priceAmount?: number | null;
  currencyCode?: string | null;
  thumbnailUrl: string | null;
  thumbnailKey: string | null;
  isPublished: boolean;
  isFrozen?: boolean;
  freezeReason?: string | null;
  frozenAt?: string | null;
  approvalStatus: "DRAFT" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  rejectionReason: string | null;
  reviewedAt?: string | null;
  reviewedById?: string | null;
  viewCount?: number;
  openReportCount?: number;
  deletedAt?: string | null;
  lectures?: Lecture[];
  dailyTasks?: DailyTask[];
  _count?: {
    lectures?: number;
    dailyTasks?: number;
    enrollments?: number;
    reports?: number;
  };
};

export type Lecture = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  videoUrl: string | null;
  videoKey: string | null;
  sortOrder: number;
  deletedAt?: string | null;
  steps?: Step[];
};

export type Step = {
  id: string;
  lectureId: string;
  title: string;
  description: string | null;
  sortOrder: number;
  deletedAt?: string | null;
};

export type DailyTask = {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  dayNumber: number;
};

export type CatalogItem = {
  id: string;
  title: string;
  icon: string | null;
  shortDescription: string | null;
  isActive: boolean;
};

export type Quote = {
  id: string;
  quoteId?: string | null;
  text: string;
  author: string | null;
  source: string;
  isActive?: boolean;
  expiresAt?: string;
  updatedAt?: string;
};

export type AdminUser = {
  id: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN";
  name: string | null;
  profilePicture: string | null;
  bio: string | null;
  expertise: string | null;
  experienceYears: number | null;
  isActive: boolean;
  isFrozen: boolean;
  freezeReason?: string | null;
  frozenAt?: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type UserApp = {
  id: string;
  email: string;
  profilePicture: string | null;
  dogName: string | null;
  dogAge: number | null;
  gender: "MALE" | "FEMALE" | null;
  bio?: string | null;
  isProfileCompleted: boolean;
  isFrozen: boolean;
  freezeReason: string | null;
  frozenAt: string | null;
  isBlocked: boolean;
  blockReason: string | null;
  blockedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  breed?: {
    id: string;
    title: string;
  } | null;
  trainingGoals?: Array<{
    trainingGoalId: string;
    trainingGoal: {
      id: string;
      title: string;
    };
  }>;
  _count?: {
    courseEnrollments?: number;
    courseReports?: number;
  };
  courseEnrollments?: Array<{
    id: string;
    joinedAt: string;
    progressPercent: number;
    completedAt: string | null;
    course: {
      id: string;
      title: string;
      isPublished: boolean;
      isFrozen: boolean;
      approvalStatus: string;
    };
  }>;
  courseReports?: Array<{
    id: string;
    reason: string;
    status: string;
    createdAt: string;
    course: {
      id: string;
      title: string;
    };
  }>;
};

export type CourseAnalytics = {
  enrollmentCount: number;
  averageProgress: number;
  completionRate: number;
  completedCount: number;
  activeStreakUsers: number;
  longestStreak: number;
  stepCount: number;
  taskCount: number;
  reportCount: number;
  openReportCount: number;
  viewCount: number;
};

export type TrainerDetail = {
  trainer: AdminUser & { courses: Course[] };
  stats: {
    courseCount: number;
    activeCourseCount: number;
    frozenCourseCount: number;
    totalEnrollments: number;
    totalReports: number;
    openReportCount: number;
    totalViews: number;
    totalCompletions: number;
  };
};

export type CourseReport = {
  id: string;
  reason: string;
  details: string | null;
  status: "OPEN" | "RESOLVED" | "DISMISSED";
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    dogName: string | null;
    profilePicture: string | null;
  };
  course: {
    id: string;
    title: string;
    trainerId: string | null;
    isFrozen: boolean;
    freezeReason: string | null;
    trainer: Trainer | null;
  };
  reviewedBy?: {
    id: string;
    email: string;
    name: string | null;
  } | null;
};

export type AuditLog = {
  id: string;
  actorType: string;
  actorId: string | null;
  actorEmail: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: string | null;
  createdAt: string;
};
