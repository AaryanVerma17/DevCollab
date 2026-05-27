# DevCollab

A real-time project collaboration platform built for developer teams. Combines task management, documentation, and code tools in one place - with AI assistance built in.

Teams can create workspaces, invite members, and manage projects through a Kanban board with live drag-and-drop that syncs across every open browser tab instantly. Tasks support assignees, priorities, due dates, labels, comments with @mentions, and file attachments.

Each project has a wiki for documentation - a rich text editor with heading formatting, code blocks, tables, and image uploads. Pages can link to each other, and every edit is versioned so any previous state can be restored. There is also a code snippet manager where teams save reusable blocks of code with syntax highlighting across JavaScript, TypeScript, Python, Java, C++, and Go.

The AI assistant can summarize a project's current state, generate a daily standup report from recent task movement, break a feature description down into a list of concrete subtasks, flag tasks that have been stuck in progress too long, and review a pasted code snippet for bugs, performance issues, and security concerns - giving it a quality score with actionable comments.

Activity across the entire workspace is logged in a live feed. Users see who else is currently viewing the same board through presence indicators. Notifications are delivered in real time for @mentions and task assignments.

The platform has two plans. The free plan supports one workspace, three projects, and five members. The Pro plan removes all limits and unlocks AI features.

## Tech Stack

**Frontend** - Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Zustand, TanStack Query, Socket.IO, Tiptap, CodeMirror 6, dnd-kit

**Backend** - Node.js, Express, TypeScript, Prisma, PostgreSQL, Socket.IO, Redis, BullMQ

**AI** - Anthropic Claude API (claude-sonnet-4-20250514)

**Infrastructure** - Cloudflare R2 (file storage), Stripe (payments), Docker, Turborepo, pnpm workspaces