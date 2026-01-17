export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface SuccessResponse<T> {
    success: true;
    data: T;
    meta?: {
        pagination?: PaginationMeta;
        [key: string]: unknown;
    };
}

export interface ErrorResponse {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}

export function createSuccessResponse<T>(data: T, meta?: SuccessResponse<T>['meta']): SuccessResponse<T> {
    return {
        success: true,
        data,
        ...(meta && { meta }),
    };
}

export function createErrorResponse(code: string, message: string, details?: unknown): ErrorResponse {
    const error: ErrorResponse['error'] = {
        code,
        message,
    };

    if (details !== undefined) {
        error.details = details;
    }

    return {
        success: false,
        error,
    };
}