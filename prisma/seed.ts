import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/modules/admin/admin.service.js";

const prisma = new PrismaClient();

const breeds = [
  {
    title: "Golden Retriever",
    icon: "golden-retriever",
    shortDescription: "Friendly, social, and eager to learn."
  },
  {
    title: "German Shepherd",
    icon: "german-shepherd",
    shortDescription: "Confident, loyal, and highly trainable."
  },
  {
    title: "Labrador Retriever",
    icon: "labrador",
    shortDescription: "Playful, food-motivated, and family friendly."
  },
  {
    title: "Beagle",
    icon: "beagle",
    shortDescription: "Curious, scent-driven, and cheerful."
  },
  {
    title: "Mixed Breed",
    icon: "mixed-breed",
    shortDescription: "Unique personality with a custom training path."
  }
];

const trainingGoals = [
  {
    title: "Basic Obedience",
    icon: "obedience",
    shortDescription: "Sit, stay, down, and polite everyday manners."
  },
  {
    title: "Recall",
    icon: "recall",
    shortDescription: "Help your dog come back reliably when called."
  },
  {
    title: "Leash Walking",
    icon: "leash",
    shortDescription: "Build calmer walks with less pulling."
  },
  {
    title: "Socialization",
    icon: "socialization",
    shortDescription: "Practice calm behavior around people and dogs."
  },
  {
    title: "House Training",
    icon: "house-training",
    shortDescription: "Create consistent potty and home routines."
  }
];

const demoQuote = {
  text: "Consistency is what turns a training plan into a trusted habit.",
  author: "PawPlan",
  source: "admin",
  isActive: true
};

async function main() {
  const superAdmin = await prisma.adminUser.upsert({
    where: { email: "admin@pawplan.com" },
    update: {
      passwordHash: hashPassword("Password@123"),
      role: "SUPER_ADMIN",
      name: "PawPlan Super Admin",
      isActive: true
    },
    create: {
      email: "admin@pawplan.com",
      passwordHash: hashPassword("Password@123"),
      role: "SUPER_ADMIN",
      name: "PawPlan Super Admin"
    }
  });

  const trainer = await prisma.adminUser.upsert({
    where: { email: "trainer.demo@pawplan.com" },
    update: {
      passwordHash: hashPassword("Password@123"),
      role: "ADMIN",
      name: "Ava Trainer",
      expertise: "Recall, leash skills, confidence building",
      experienceYears: 6,
      isActive: true,
      isFrozen: false
    },
    create: {
      email: "trainer.demo@pawplan.com",
      passwordHash: hashPassword("Password@123"),
      role: "ADMIN",
      name: "Ava Trainer",
      expertise: "Recall, leash skills, confidence building",
      experienceYears: 6
    }
  });

  const seededBreeds = await Promise.all(
    breeds.map((breed) =>
      prisma.breed.upsert({
        where: { title: breed.title },
        update: breed,
        create: breed
      })
    )
  );

  const seededGoals = await Promise.all(
    trainingGoals.map((goal) =>
      prisma.trainingGoal.upsert({
        where: { title: goal.title },
        update: goal,
        create: goal
      })
    )
  );

  await prisma.quote.upsert({
    where: { id: "seed-demo-quote" },
    update: demoQuote,
    create: {
      id: "seed-demo-quote",
      ...demoQuote
    }
  });

  const [userOne, userTwo] = await Promise.all([
    prisma.user.upsert({
      where: { email: "user.demo1@pawplan.com" },
      update: {
        dogName: "Milo",
        dogAge: 2,
        gender: "MALE",
        breedId: seededBreeds[0]?.id,
        isProfileCompleted: true
      },
      create: {
        email: "user.demo1@pawplan.com",
        dogName: "Milo",
        dogAge: 2,
        gender: "MALE",
        breedId: seededBreeds[0]?.id,
        isProfileCompleted: true
      }
    }),
    prisma.user.upsert({
      where: { email: "user.demo2@pawplan.com" },
      update: {
        dogName: "Luna",
        dogAge: 1,
        gender: "FEMALE",
        breedId: seededBreeds[2]?.id,
        isProfileCompleted: true
      },
      create: {
        email: "user.demo2@pawplan.com",
        dogName: "Luna",
        dogAge: 1,
        gender: "FEMALE",
        breedId: seededBreeds[2]?.id,
        isProfileCompleted: true
      }
    })
  ]);

  if (seededGoals[0]) {
    await prisma.userTrainingGoal.upsert({
      where: {
        userId_trainingGoalId: {
          userId: userOne.id,
          trainingGoalId: seededGoals[0].id
        }
      },
      update: {},
      create: {
        userId: userOne.id,
        trainingGoalId: seededGoals[0].id
      }
    });
  }

  const recallCourse = await prisma.trainingCourse.upsert({
    where: { id: "seed-course-recall" },
    update: {
      trainerId: trainer.id,
      title: "Recall Foundations",
      description: "Build a reliable recall with short daily reps.",
      category: "Obedience",
      level: "BEGINNER",
      thumbnailUrl: "https://images.pawplan.app/demo/recall.png",
      thumbnailKey: "demo/recall.png",
      approvalStatus: "APPROVED",
      isPublished: true
    },
    create: {
      id: "seed-course-recall",
      trainerId: trainer.id,
      title: "Recall Foundations",
      description: "Build a reliable recall with short daily reps.",
      category: "Obedience",
      level: "BEGINNER",
      thumbnailUrl: "https://images.pawplan.app/demo/recall.png",
      thumbnailKey: "demo/recall.png",
      approvalStatus: "APPROVED",
      isPublished: true
    }
  });

  await prisma.trainingCourseLecture.upsert({
    where: { id: "seed-lecture-recall-1" },
    update: {
      courseId: recallCourse.id,
      title: "Start in a quiet space",
      description: "Use a high-value reward and a clear cue.",
      videoUrl: "https://videos.pawplan.app/demo/recall-1.mp4"
    },
    create: {
      id: "seed-lecture-recall-1",
      courseId: recallCourse.id,
      title: "Start in a quiet space",
      description: "Use a high-value reward and a clear cue.",
      videoUrl: "https://videos.pawplan.app/demo/recall-1.mp4"
    }
  });

  await prisma.trainingCourseStep.upsert({
    where: { id: "seed-step-recall-1" },
    update: {
      lectureId: "seed-lecture-recall-1",
      title: "Say your dog's name once",
      description: "Reward the instant your dog turns to you."
    },
    create: {
      id: "seed-step-recall-1",
      lectureId: "seed-lecture-recall-1",
      title: "Say your dog's name once",
      description: "Reward the instant your dog turns to you."
    }
  });

  await prisma.courseDailyTask.upsert({
    where: {
      courseId_dayNumber: {
        courseId: recallCourse.id,
        dayNumber: 1
      }
    },
    update: {
      title: "Practice 5 recall reps",
      description: "Keep sessions upbeat and short."
    },
    create: {
      courseId: recallCourse.id,
      dayNumber: 1,
      title: "Practice 5 recall reps",
      description: "Keep sessions upbeat and short."
    }
  });

  await prisma.userCourseEnrollment.upsert({
    where: {
      userId_courseId: {
        userId: userOne.id,
        courseId: recallCourse.id
      }
    },
    update: {
      progressPercent: 40,
      completedStepsCount: 1,
      totalStepsCount: 1,
      currentStreak: 2,
      longestStreak: 3
    },
    create: {
      userId: userOne.id,
      courseId: recallCourse.id,
      progressPercent: 40,
      completedStepsCount: 1,
      totalStepsCount: 1,
      currentStreak: 2,
      longestStreak: 3
    }
  });

  await prisma.courseReport.upsert({
    where: { id: "seed-report-1" },
    update: {
      userId: userTwo.id,
      courseId: recallCourse.id,
      reason: "wrong_info",
      details: "Demo report for moderation flow"
    },
    create: {
      id: "seed-report-1",
      userId: userTwo.id,
      courseId: recallCourse.id,
      reason: "wrong_info",
      details: "Demo report for moderation flow"
    }
  });

  console.log("Seeded admin user, trainer, demo users, catalog, course, quote, and report");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
