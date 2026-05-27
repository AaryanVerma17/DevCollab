export interface WikiPage {
  id: string;
  title: string;
  content: string;
  projectId: string;
  parentPageId: string | null;
  createdById: string;
  lastEditedById: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: import("./user").User;
  lastEditedBy?: import("./user").User;
  parentPage?: WikiPage | null;
  children?: WikiPage[];
  versions?: WikiVersion[];
}

export interface WikiVersion {
  id: string;
  pageId: string;
  content: string;
  title: string;
  version: number;
  editedById: string;
  createdAt: string;
  editedBy?: import("./user").User;
}

export interface WikiPageTree extends WikiPage {
  children: WikiPageTree[];
}

export interface CreateWikiPageInput {
  title: string;
  content?: string;
  parentPageId?: string;
}

export interface UpdateWikiPageInput {
  title?: string;
  content: string;
}