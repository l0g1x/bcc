/**
 * API response envelope for typed fetch operations.
 * All API calls return this shape for consistent error handling.
 */
export type ApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: ApiError }

export interface ApiError {
  code: string
  message: string
  details?: unknown
}

/**
 * Typed fetch wrapper that handles connection errors globally.
 * Returns ApiResponse<T> envelope for consistent error handling.
 */
export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      return {
        ok: false,
        error: {
          code: `HTTP_${response.status}`,
          message: errorBody.message || response.statusText,
          details: errorBody,
        },
      }
    }

    const data = await response.json()
    return { ok: true, data }
  } catch (error) {
    // Handle network errors, connection refused, etc.
    return {
      ok: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error instanceof Error ? error.message : 'Network error',
        details: error,
      },
    }
  }
}

/**
 * GET request helper
 */
export function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  return apiFetch<T>(path, { method: 'GET' })
}

/**
 * POST request helper
 */
export function apiPost<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  return apiFetch<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/**
 * PUT request helper
 */
export function apiPut<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  return apiFetch<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

/**
 * DELETE request helper
 */
export function apiDelete<T>(path: string): Promise<ApiResponse<T>> {
  return apiFetch<T>(path, { method: 'DELETE' })
}
