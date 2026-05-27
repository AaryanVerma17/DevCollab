import { prisma } from "../../db/prisma";
import { AppError } from "../../middleware/error-handler";
import { createActivity } from "../activity/activity.service";

const SNIPPET_SELECT = {
  id: true, title: true, description: true, code: true, language: true,
  tags: true, projectId: true, createdById: true, createdAt: true, updatedAt: true,
  createdBy: { select: { id: true, name: true, avatar: true } },
};

export async function createSnippet(
  projectId: string,
  userId: string,
  actor: { name: string; avatar: string | null },
  data: { title: string; description?: string; code: string; language: string; tags?: string[] }
) {
  const snippet = await prisma.snippet.create({
    data: { ...data, tags: data.tags ?? [], projectId, createdById: userId },
    select: SNIPPET_SELECT,
  });

  await createActivity({
    action: "created snippet",
    resourceType: "snippet",
    resourceId: snippet.id,
    resourceTitle: snippet.title,
    projectId,
    actorId: userId,
    actorName: actor.name,
    actorAvatar: actor.avatar,
  });

  return snippet;
}

export async function listSnippets(projectId: string, search?: string, tag?: string) {
  return prisma.snippet.findMany({
    where: {
      projectId,
      ...(search ? {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { tags: { has: search } },
        ],
      } : {}),
      ...(tag ? { tags: { has: tag } } : {}),
    },
    select: SNIPPET_SELECT,
    orderBy: { createdAt: "desc" },
  });
}

export async function getSnippet(snippetId: string) {
  const snippet = await prisma.snippet.findUnique({ where: { id: snippetId }, select: SNIPPET_SELECT });
  if (!snippet) throw new AppError(404, "Snippet not found");
  return snippet;
}

export async function updateSnippet(
  snippetId: string,
  data: { title?: string; description?: string; code?: string; language?: string; tags?: string[] }
) {
  const snippet = await prisma.snippet.findUnique({ where: { id: snippetId } });
  if (!snippet) throw new AppError(404, "Snippet not found");
  return prisma.snippet.update({ where: { id: snippetId }, data, select: SNIPPET_SELECT });
}

export async function deleteSnippet(snippetId: string) {
  const snippet = await prisma.snippet.findUnique({ where: { id: snippetId } });
  if (!snippet) throw new AppError(404, "Snippet not found");
  await prisma.snippet.delete({ where: { id: snippetId } });
}