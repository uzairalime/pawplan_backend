import { prisma } from "../../db/prisma.js";
import { ApiError } from "../../utils/api-error.js";

const userInclude = {
  breed: true,
  trainingGoals: {
    include: {
      trainingGoal: true
    }
  },
  _count: {
    select: {
      courseEnrollments: true,
      courseReports: true
    }
  }
};

function ensureVisibleUser<T extends { deletedAt: Date | null } | null>(user: T) {
  if (!user || user.deletedAt) {
    throw new ApiError(404, "User not found");
  }

  return user;
}

export async function listUsers() {
  return listUserPage({});
}

export async function listUserPage(input: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}) {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const where = {
    deletedAt: null,
    ...(input.search
      ? {
          OR: [
            { email: { contains: input.search } },
            { dogName: { contains: input.search } }
          ]
        }
      : {}),
    ...(input.status === "BLOCKED"
      ? { isBlocked: true }
      : input.status === "FROZEN"
        ? { isFrozen: true }
        : input.status === "ACTIVE"
          ? { isBlocked: false, isFrozen: false }
          : {})
  };
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: userInclude,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.user.count({ where })
  ]);
  return { users, total };
}

export async function getUserDetail(userId: string) {
  const user = ensureVisibleUser(
    await prisma.user.findUnique({
      where: { id: userId },
      include: {
        ...userInclude,
        courseEnrollments: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                isPublished: true,
                isFrozen: true,
                approvalStatus: true
              }
            }
          },
          orderBy: { joinedAt: "desc" }
        },
        courseReports: {
          include: {
            course: {
              select: {
                id: true,
                title: true
              }
            }
          },
          orderBy: { createdAt: "desc" }
        }
      }
    })
  );

  return user;
}

export async function updateUser(
  userId: string,
  input: Partial<{
    email: string;
    profilePicture: string | null;
    dogName: string | null;
    dogAge: number | null;
    gender: "MALE" | "FEMALE" | null;
    bio: string | null;
    breedId: string | null;
    trainingGoalIds: string[];
    isProfileCompleted: boolean;
  }>
) {
  const user = ensureVisibleUser(
    await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, deletedAt: true }
    })
  );

  if (input.breedId) {
    const breed = await prisma.breed.findFirst({
      where: { id: input.breedId, isActive: true }
    });

    if (!breed) {
      throw new ApiError(404, "Breed not found");
    }
  }

  if (input.trainingGoalIds) {
    const uniqueGoalIds = [...new Set(input.trainingGoalIds)];
    const goals = await prisma.trainingGoal.findMany({
      where: { id: { in: uniqueGoalIds }, isActive: true },
      select: { id: true }
    });

    if (goals.length !== uniqueGoalIds.length) {
      throw new ApiError(404, "One or more training goals were not found");
    }
  }

  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: {
        email: input.email,
        profilePicture: input.profilePicture,
        dogName: input.dogName,
        dogAge: input.dogAge,
        gender: input.gender,
        bio: input.bio,
        breedId: input.breedId,
        isProfileCompleted: input.isProfileCompleted
      }
    });

    if (input.trainingGoalIds) {
      const uniqueGoalIds = [...new Set(input.trainingGoalIds)];
      await tx.userTrainingGoal.deleteMany({ where: { userId } });
      await tx.userTrainingGoal.createMany({
        data: uniqueGoalIds.map((trainingGoalId) => ({
          userId,
          trainingGoalId
        }))
      });
    }

    return tx.user.findUniqueOrThrow({
      where: { id: user.id },
      include: userInclude
    });
  });
}

export async function freezeUser(userId: string, reason?: string) {
  ensureVisibleUser(
    await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, deletedAt: true }
    })
  );

  return prisma.user.update({
    where: { id: userId },
    data: {
      isFrozen: true,
      freezeReason: reason ?? "Frozen by super admin",
      frozenAt: new Date()
    },
    include: userInclude
  });
}

export async function blockUser(userId: string, reason?: string) {
  ensureVisibleUser(
    await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, deletedAt: true }
    })
  );

  return prisma.user.update({
    where: { id: userId },
    data: {
      isBlocked: true,
      blockReason: reason ?? "Blocked by super admin",
      blockedAt: new Date()
    },
    include: userInclude
  });
}

export async function unfreezeUser(userId: string) {
  ensureVisibleUser(
    await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, deletedAt: true }
    })
  );

  return prisma.user.update({
    where: { id: userId },
    data: {
      isFrozen: false,
      freezeReason: null,
      frozenAt: null
    },
    include: userInclude
  });
}

export async function unblockUser(userId: string) {
  ensureVisibleUser(
    await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, deletedAt: true }
    })
  );

  return prisma.user.update({
    where: { id: userId },
    data: {
      isBlocked: false,
      blockReason: null,
      blockedAt: null
    },
    include: userInclude
  });
}

export async function deleteUser(userId: string) {
  ensureVisibleUser(
    await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, deletedAt: true }
    })
  );

  await prisma.user.update({
    where: { id: userId },
    data: {
      deletedAt: new Date(),
      isBlocked: true,
      blockReason: "Deleted by super admin",
      blockedAt: new Date()
    }
  });
}
