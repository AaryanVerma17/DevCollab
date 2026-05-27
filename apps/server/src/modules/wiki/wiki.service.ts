import { prisma } from "../../db/prisma";
import { AppError } from "../../middleware/error-handler";
import { emitToRoom } from "../../socket";
import { SOCKET_EVENTS } from "@devcollab/types";
import { createActivity } from "../activity/activity.service";

const MAX_VERSIONS = 20;

const PAGE_SELECT = {
  id: true, title: true, content: true, projectId: true,
  parentPageId: true, createdById: true, lastEditedById: true,
  createdAt: true, updatedAt: true,
  createdBy: { select: { id: true, name: true, avatar: true } },
  lastEditedBy: { select: { id: true, name: true, avatar: true } },
};

export async function createPage(
  projectId: string,
  userId: string,
  actor: { name: string; avatar: string | null },
  data: { title: string; content?: string; parentPageId?: string }
) {
  const page = await prisma.wikiPage.create({
    data: {
      title: data.title,
      content: data.content ?? "",
      projectId,
      parentPageId: data.parentPageId ?? null,
      createdById: userId,
      lastEditedById: userId,
    },
    select: PAGE_SELECT,
  });

  await createActivity({
    action: "created wiki page",
    resourceType: "wiki",
    resourceId: page.id,
    resourceTitle: page.title,
    projectId,
    actorId: userId,
    actorName: actor.name,
    actorAvatar: actor.avatar,
  });

  return page;
}

export async function listPages(projectId: string) {
  const pages = await prisma.wikiPage.findMany({
    where: { projectId },
    select: {
      id: true, title: true, parentPageId: true, createdAt: true, updatedAt: true,
      lastEditedBy: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Build tree
  const map = new Map<string, any>();
  const roots: any[] = [];

  for (const page of pages) {
    map.set(page.id, { ...page, children: [] });
  }
  for (const page of pages) {
    if (page.parentPageId && map.has(page.parentPageId)) {
      map.get(page.parentPageId).children.push(map.get(page.id));
    } else {
      roots.push(map.get(page.id));
    }
  }

  return roots;
}

export async function getPage(pageId: string) {
  const page = await prisma.wikiPage.findUnique({
    where: { id: pageId },
    select: PAGE_SELECT,
  });
  if (!page) throw new AppError(404, "Wiki page not found");
  return page;
}

export async function savePage(
  pageId: string,
  userId: string,
  actor: { name: string; avatar: string | null },
  data: { title?: string; content: string }
) {
  const page = await prisma.wikiPage.findUnique({
    where: { id: pageId },
    select: { projectId: true, title: true, versions: { select: { version: true }, orderBy: { version: "desc" }, take: 1 } },
  });
  if (!page) throw new AppError(404, "Wiki page not found");

  const nextVersion = (page.versions[0]?.version ?? 0) + 1;

  const [updated] = await prisma.$transaction([
    prisma.wikiPage.update({
      where: { id: pageId },
      data: {
        content: data.content,
        title: data.title ?? undefined,
        lastEditedById: userId,
      },
      select: PAGE_SELECT,
    }),
    prisma.wikiVersion.create({
      data: {
        pageId,
        content: data.content,
        title: data.title ?? page.title,
        version: nextVersion,
        editedById: userId,
      },
    }),
  ]);

  // Prune old versions
  const oldVersions = await prisma.wikiVersion.findMany({
    where: { pageId },
    select: { id: true },
    orderBy: { version: "desc" },
    skip: MAX_VERSIONS,
  });

  if (oldVersions.length > 0) {
    await prisma.wikiVersion.deleteMany({
      where: { id: { in: oldVersions.map((v) => v.id) } },
    });
  }

  emitToRoom(`project:${page.projectId}`, SOCKET_EVENTS.WIKI_PAGE_UPDATED, {
    projectId: page.projectId,
    pageId,
    title: updated.title,
    updatedById: userId,
    updatedAt: updated.updatedAt.toISOString(),
  });

  await createActivity({
    action: "updated wiki page",
    resourceType: "wiki",
    resourceId: pageId,
    resourceTitle: updated.title,
    projectId: page.projectId,
    actorId: userId,
    actorName: actor.name,
    actorAvatar: actor.avatar,
  });

  return updated;
}

export async function getPageHistory(pageId: string) {
  const versions = await prisma.wikiVersion.findMany({
    where: { pageId },
    select: {
      id: true, version: true, title: true, createdAt: true,
      editedBy: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { version: "desc" },
  });
  return versions;
}

export async function getVersion(pageId: string, versionId: string) {
  const version = await prisma.wikiVersion.findFirst({
    where: { id: versionId, pageId },
    select: {
      id: true, version: true, title: true, content: true, createdAt: true,
      editedBy: { select: { id: true, name: true, avatar: true } },
    },
  });
  if (!version) throw new AppError(404, "Version not found");
  return version;
}