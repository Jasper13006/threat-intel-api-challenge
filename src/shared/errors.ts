export class AppError extends Error {
    constructor(
        message: string,
        public statusCode: number,
        public code: string,
        public details?: unknown
    ) {
        super(message);
        this.name = 'AppError';
        Error.captureStackTrace(this, this.constructor);
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string, id: string) {
        super(`${resource} with id '${id}' not found`, 404, 'NOT_FOUND');
        this.name = 'NotFoundError';
    }
}

export class ValidationError extends AppError {
    constructor(message: string, details?: unknown) {
        super(message, 400, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}

export class DatabaseError extends AppError {
    constructor(message: string, details?: unknown) {
        super(message, 500, 'DATABASE_ERROR', details);
        this.name = 'DatabaseError';
    }
}