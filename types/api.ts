export interface ApiOk<T> {
  ok: true;
  data: T;
}

export interface ApiPaginated<T> {
  ok: true;
  data: T[];
  pagination: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export interface ApiError {
  ok: false;
  error: string;
  code: string;
  details?: unknown;
}

export type ApiResponse<T> = ApiOk<T> | ApiError;
export type ApiPaginatedResponse<T> = ApiPaginated<T> | ApiError;
