import { prisma } from "../../db/prisma.js";
import { ApiError } from "../../utils/api-error.js";

const QUOTE_CACHE_ID = "daily-dog-quote";
const QUOTE_REFRESH_MS = 12 * 60 * 60 * 1000;

const fallbackQuotes = [
  {
    text: "Every walk is a chance to understand your dog a little better.",
    author: "PawPlan"
  },
  {
    text: "Small training moments become big trust over time.",
    author: "PawPlan"
  },
  {
    text: "A patient trainer builds a confident dog.",
    author: "PawPlan"
  },
  {
    text: "Progress is not one perfect session. It is showing up again tomorrow.",
    author: "PawPlan"
  },
  {
    text: "Your dog learns best when training feels safe, clear, and kind.",
    author: "PawPlan"
  }
];

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

async function fetchPublicQuote() {
  try {
    const response = await fetch("https://api.quotable.io/random?tags=inspirational|motivational", {
      signal: AbortSignal.timeout(3000)
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as { content?: string; author?: string };

    if (!data.content) {
      return null;
    }

    return {
      text: data.content,
      author: data.author,
      source: "public-api"
    };
  } catch {
    return null;
  }
}

export async function createQuote(input: { text: string; author?: string; isActive?: boolean }) {
  return prisma.quote.create({
    data: {
      text: input.text,
      author: input.author,
      isActive: input.isActive ?? true,
      source: "admin"
    }
  });
}

export async function listAdminQuotes() {
  return listAdminQuotePage({});
}

export async function listAdminQuotePage(input: { page?: number; limit?: number; search?: string }) {
  const page = input.page ?? 1;
  const limit = input.limit ?? 20;
  const where = {
    deletedAt: null,
    ...(input.search
      ? {
          OR: [
            { text: { contains: input.search } },
            { author: { contains: input.search } }
          ]
        }
      : {})
  };
  const [quotes, total] = await Promise.all([
    prisma.quote.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.quote.count({ where })
  ]);
  return { quotes, total };
}

export async function deleteQuote(quoteId: string) {
  const quote = await prisma.quote.findUnique({ where: { id: quoteId } });

  if (!quote) {
    throw new ApiError(404, "Quote not found");
  }

  await prisma.quote.update({
    where: { id: quoteId },
    data: { isActive: false, deletedAt: new Date() }
  });
}

export async function refreshQuote() {
  const activeAdminQuotes = await prisma.quote.findMany({
    where: { isActive: true, deletedAt: null },
    orderBy: { createdAt: "desc" }
  });

  const adminQuote = activeAdminQuotes.length > 0 ? pickRandom(activeAdminQuotes) : null;
  const publicQuote = adminQuote ? null : await fetchPublicQuote();
  const fallbackQuote = pickRandom(fallbackQuotes);

  const selected = adminQuote
    ? {
        quoteId: adminQuote.id,
        text: adminQuote.text,
        author: adminQuote.author,
        source: "admin"
      }
    : publicQuote
      ? {
          quoteId: null,
          ...publicQuote
        }
      : {
          quoteId: null,
          text: fallbackQuote.text,
          author: fallbackQuote.author,
          source: "fallback"
        };

  return prisma.quoteCache.upsert({
    where: { id: QUOTE_CACHE_ID },
    update: {
      ...selected,
      expiresAt: new Date(Date.now() + QUOTE_REFRESH_MS)
    },
    create: {
      id: QUOTE_CACHE_ID,
      ...selected,
      expiresAt: new Date(Date.now() + QUOTE_REFRESH_MS)
    }
  });
}

export async function getCurrentQuote() {
  const cached = await prisma.quoteCache.findUnique({ where: { id: QUOTE_CACHE_ID } });

  if (!cached || cached.expiresAt.getTime() <= Date.now()) {
    return refreshQuote();
  }

  return cached;
}
