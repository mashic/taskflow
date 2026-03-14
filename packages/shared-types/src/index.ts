// User types
export interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

// API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

// Board types
export interface Board {
  id: string;
  title: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CreateBoardDto {
  title: string;
  description?: string;
}

export interface UpdateBoardDto {
  title?: string;
  description?: string;
}

// List types (columns in Kanban)
export interface List {
  id: string;
  title: string;
  boardId: string;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateListDto {
  title: string;
  boardId: string;
}

export interface UpdateListDto {
  title?: string;
  position?: number;
}

// Task types
export interface Task {
  id: string;
  title: string;
  description?: string;
  listId: string;
  boardId: string;
  position: number;
  assigneeId?: string;
  dueDate?: Date;
  priority?: TaskPriority;
  labels?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface CreateTaskDto {
  title: string;
  description?: string;
  listId: string;
  boardId: string;
  assigneeId?: string;
  dueDate?: Date;
  priority?: TaskPriority;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  assigneeId?: string;
  dueDate?: Date;
  priority?: TaskPriority;
  labels?: string[];
}

export interface MoveTaskDto {
  listId: string;
  position: number;
}

// Comment types
export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  author?: User;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCommentDto {
  content: string;
  taskId: string;
}

// Activity types
export interface Activity {
  id: string;
  type: ActivityType;
  entityType: 'board' | 'list' | 'task' | 'comment';
  entityId: string;
  userId: string;
  user?: User;
  data: Record<string, unknown>;
  createdAt: Date;
}

export type ActivityType =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'moved'
  | 'assigned'
  | 'commented';

// Board member / team types
export interface BoardMember {
  id: string;
  boardId: string;
  userId: string;
  user?: User;
  role: BoardRole;
  joinedAt: Date;
}

export type BoardRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface InviteMemberDto {
  email: string;
  role: BoardRole;
}

// WebSocket event types
export interface WsEvent<T = unknown> {
  type: string;
  payload: T;
  boardId: string;
  userId: string;
  timestamp: Date;
}

export type WsEventType =
  | 'task.created'
  | 'task.updated'
  | 'task.deleted'
  | 'task.moved'
  | 'list.created'
  | 'list.updated'
  | 'list.deleted'
  | 'list.reordered'
  | 'board.updated'
  | 'member.joined'
  | 'member.left'
  | 'comment.created';

// API response wrapper
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}
