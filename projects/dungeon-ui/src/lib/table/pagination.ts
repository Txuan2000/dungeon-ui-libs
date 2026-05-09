export type DgPaginationMode = 'none' | 'client' | 'server' | 'cursor';

export interface DgPageChangeEvent {
  page: number;
  pageSize: number;
  first: number;
}

export interface DgCursorChangeEvent {
  cursor: unknown | null;
  pageSize: number;
  direction: 'first' | 'prev' | 'next';
}
