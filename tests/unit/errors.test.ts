import { describe, it, expect } from 'vitest';
import { AppError, NotFoundError, ValidationError, DatabaseError } from '../../src/shared/errors';

describe('Error Classes', () => {
    describe('AppError', () => {
        it('should create error with all properties', () => {
            const error = new AppError('Test error', 500, 'TEST_ERROR', { detail: 'test' });

            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(500);
            expect(error.code).toBe('TEST_ERROR');
            expect(error.details).toEqual({ detail: 'test' });
            expect(error instanceof Error).toBe(true);
        });

        it('should create error without details', () => {
            const error = new AppError('Test error', 500, 'TEST_ERROR');

            expect(error.message).toBe('Test error');
            expect(error.statusCode).toBe(500);
            expect(error.code).toBe('TEST_ERROR');
            expect(error.details).toBeUndefined();
        });
    });

    describe('NotFoundError', () => {
        it('should create 404 error with correct message', () => {
            const error = new NotFoundError('Indicator', 'abc-123');

            expect(error.message).toBe("Indicator with id 'abc-123' not found");
            expect(error.statusCode).toBe(404);
            expect(error.code).toBe('NOT_FOUND');
            expect(error instanceof AppError).toBe(true);
        });

        it('should work with different resource types', () => {
            const error1 = new NotFoundError('Campaign', 'xyz-789');
            expect(error1.message).toBe("Campaign with id 'xyz-789' not found");

            const error2 = new NotFoundError('ThreatActor', 'uuid-456');
            expect(error2.message).toBe("ThreatActor with id 'uuid-456' not found");
        });
    });

    describe('ValidationError', () => {
        it('should create 400 error with correct message', () => {
            const error = new ValidationError('Invalid input');

            expect(error.message).toBe('Invalid input');
            expect(error.statusCode).toBe(400);
            expect(error.code).toBe('VALIDATION_ERROR');
            expect(error instanceof AppError).toBe(true);
        });

        it('should include details when provided', () => {
            const details = [
                { field: 'email', message: 'Invalid email format' },
                { field: 'age', message: 'Must be a number' },
            ];
            const error = new ValidationError('Validation failed', details);

            expect(error.message).toBe('Validation failed');
            expect(error.details).toEqual(details);
        });
    });

    describe('DatabaseError', () => {
        it('should create 500 error with correct message', () => {
            const error = new DatabaseError('Connection failed');

            expect(error.message).toBe('Connection failed');
            expect(error.statusCode).toBe(500);
            expect(error.code).toBe('DATABASE_ERROR');
            expect(error instanceof AppError).toBe(true);
        });

        it('should include original error as details', () => {
            const originalError = new Error('SQLITE_ERROR');
            const error = new DatabaseError('Query failed', originalError);

            expect(error.message).toBe('Query failed');
            expect(error.details).toBe(originalError);
        });
    });
});
