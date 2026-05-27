export type SnippetLanguage =
  | "javascript"
  | "typescript"
  | "python"
  | "java"
  | "cpp"
  | "go"
  | "rust"
  | "bash"
  | "sql"
  | "json"
  | "yaml"
  | "markdown"
  | "html"
  | "css"
  | "other";

export interface Snippet {
  id: string;
  title: string;
  description: string | null;
  code: string;
  language: SnippetLanguage;
  tags: string[];
  projectId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: import("./user").User;
}

export interface CreateSnippetInput {
  title: string;
  description?: string;
  code: string;
  language: SnippetLanguage;
  tags?: string[];
}

export interface UpdateSnippetInput {
  title?: string;
  description?: string;
  code?: string;
  language?: SnippetLanguage;
  tags?: string[];
}