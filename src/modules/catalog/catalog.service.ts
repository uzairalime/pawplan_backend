import { prisma } from "../../db/prisma.js";
import { ApiError } from "../../utils/api-error.js";

type CatalogItemInput = {
  title: string;
  icon?: string;
  shortDescription?: string;
};

export async function listBreeds() {
  return listBreedPage({});
}

export async function listTrainingGoals() {
  return listTrainingGoalPage({});
}

export async function listBreedPage(input: { page?: number; limit?: number; search?: string }) {
  const page = input.page ?? 1;
  const limit = input.limit ?? 50;
  const where = {
    isActive: true,
    deletedAt: null,
    ...(input.search ? { title: { contains: input.search } } : {})
  };
  const [breeds, total] = await Promise.all([
    prisma.breed.findMany({
      where,
      orderBy: { title: "asc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.breed.count({ where })
  ]);
  return { breeds, total };
}

export async function listTrainingGoalPage(input: { page?: number; limit?: number; search?: string }) {
  const page = input.page ?? 1;
  const limit = input.limit ?? 50;
  const where = {
    isActive: true,
    deletedAt: null,
    ...(input.search ? { title: { contains: input.search } } : {})
  };
  const [trainingGoals, total] = await Promise.all([
    prisma.trainingGoal.findMany({
      where,
      orderBy: { title: "asc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.trainingGoal.count({ where })
  ]);
  return { trainingGoals, total };
}

export async function createBreed(input: CatalogItemInput) {
  const existingBreed = await prisma.breed.findUnique({ where: { title: input.title } });

  if (existingBreed) {
    throw new ApiError(409, "Catalog title already exists");
  }

  return prisma.breed.create({ data: input });
}

export async function deleteBreed(breedId: string) {
  const breed = await prisma.breed.findUnique({ where: { id: breedId } });

  if (!breed) {
    throw new ApiError(404, "Breed not found");
  }

  await prisma.breed.update({
    where: { id: breedId },
    data: { isActive: false, deletedAt: new Date() }
  });
}

export async function createTrainingGoal(input: CatalogItemInput) {
  const existingGoal = await prisma.trainingGoal.findUnique({ where: { title: input.title } });

  if (existingGoal) {
    throw new ApiError(409, "Catalog title already exists");
  }

  return prisma.trainingGoal.create({ data: input });
}

export async function deleteTrainingGoal(trainingGoalId: string) {
  const trainingGoal = await prisma.trainingGoal.findUnique({ where: { id: trainingGoalId } });

  if (!trainingGoal) {
    throw new ApiError(404, "Training goal not found");
  }

  await prisma.trainingGoal.update({
    where: { id: trainingGoalId },
    data: { isActive: false, deletedAt: new Date() }
  });
}
