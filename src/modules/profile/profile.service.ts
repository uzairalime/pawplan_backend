import { prisma } from "../../db/prisma.js";
import { ApiError } from "../../utils/api-error.js";

type UpdateProfileInput = {
  profilePicture?: string;
  dogName?: string;
  dogAge?: number;
  gender?: "MALE" | "FEMALE";
  breedId?: string;
  trainingGoalIds?: string[];
};

const userInclude = {
  breed: true,
  trainingGoals: {
    include: {
      trainingGoal: true
    }
  }
};

function hasCompletedProfile(user: {
  dogName: string | null;
  dogAge: number | null;
  gender: string | null;
  breedId: string | null;
  trainingGoals: unknown[];
}) {
  return Boolean(
    user.dogName &&
      user.dogAge !== null &&
      user.gender &&
      user.breedId &&
      user.trainingGoals.length > 0
  );
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: userInclude
  });

  if (!user || user.deletedAt) {
    throw new ApiError(404, "User not found");
  }

  return user;
}

export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, deletedAt: true, isBlocked: true }
  });

  if (!existingUser || existingUser.deletedAt) {
    throw new ApiError(404, "User not found");
  }

  if (existingUser.isBlocked) {
    throw new ApiError(403, "User account is blocked");
  }

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

  const user = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        profilePicture: input.profilePicture,
        dogName: input.dogName,
        dogAge: input.dogAge,
        gender: input.gender,
        breedId: input.breedId
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

    const updatedUser = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      include: userInclude
    });

    const isProfileCompleted = hasCompletedProfile(updatedUser);

    return tx.user.update({
      where: { id: userId },
      data: { isProfileCompleted },
      include: userInclude
    });
  });

  return user;
}
