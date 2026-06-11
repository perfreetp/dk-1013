export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'annotator' | 'reviewer';
  createdAt: string;
  updatedAt: string;
}

export interface Batch {
  id: string;
  name: string;
  section: string;
  collectionDate: string;
  description: string;
  imageCount: number;
  createdAt: string;
  createdBy: string;
}

export interface Image {
  id: string;
  batchId: string;
  fileName: string;
  storagePath: string;
  width: number;
  height: number;
  createdAt: string;
}

export interface Task {
  id: string;
  batchId: string;
  assigneeId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'reviewing';
  deadline: string;
  createdAt: string;
  updatedAt: string;
  batch?: Batch;
  assignee?: User;
}

export interface Box {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  category: string;
  categoryName: string;
  properties: Record<string, string>;
}

export interface Annotation {
  id: string;
  taskId: string;
  imageId: string;
  boxes: Box[];
  status: 'draft' | 'submitted' | 'reviewed' | 'rejected';
  createdAt: string;
  updatedAt: string;
  image?: Image;
  task?: Task;
}

export interface Category {
  id: string;
  code: string;
  name: string;
  description: string;
  properties: Property[];
  createdAt: string;
}

export interface Property {
  name: string;
  type: 'text' | 'enum';
  options?: string[];
}

export interface Review {
  id: string;
  annotationId: string;
  reviewerId: string;
  result: 'approved' | 'rejected';
  comments: string;
  createdAt: string;
  annotation?: Annotation;
  reviewer?: User;
}

export interface StatItem {
  label: string;
  value: number;
  color: string;
}

export interface CategoryStat {
  category: string;
  count: number;
}
