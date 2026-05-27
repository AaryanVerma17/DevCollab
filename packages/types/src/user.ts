export interface User {
  id: string;
  clerkId: string;
  email: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  skills: string[];
  githubUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  workspaces?: import("./workspace").WorkspaceMember[];
}

export interface UpdateProfileInput {
  name?: string;
  bio?: string;
  skills?: string[];
  githubUrl?: string | null;
  avatar?: string | null;
}