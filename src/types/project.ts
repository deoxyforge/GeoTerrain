// Project data model — extended with description + last_opened
export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  lastOpened: string | null;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
}

export interface RenameProjectInput {
  id: string;
  name: string;
}

export interface UpdateProjectInput {
  id: string;
  name: string;
  description: string;
}
