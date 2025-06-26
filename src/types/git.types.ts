export interface Commit {
  id: string;
  message: string;
  author: string;
  timestamp: number;
}

export interface Branch {
  name: string;
  commit: string; // ID du dernier commit
}

export interface FileStatus {
  path: string;
  status: 'untracked' | 'modified' | 'staged' | 'deleted';
}

export interface GitRepositoryState {
  commits: Commit[];
  branches: Branch[];
  head: string; // Nom de la branche ou ID du commit
  files: FileStatus[];
}
