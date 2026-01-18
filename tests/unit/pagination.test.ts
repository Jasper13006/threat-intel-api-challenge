import { describe, it, expect } from 'vitest';
import { calculatePagination, createPaginationMeta } from '../../src/shared/pagination';

describe('Pagination Utils', () => {
    describe('calculatePagination', () => {
        it('should calculate offset for page 1', () => {
            const result = calculatePagination(1, 20);
            expect(result).toEqual({ limit: 20, offset: 0 });
        });

        it('should calculate offset for page 2', () => {
            const result = calculatePagination(2, 20);
            expect(result).toEqual({ limit: 20, offset: 20 });
        });

        it('should calculate offset for page 3', () => {
            const result = calculatePagination(3, 10);
            expect(result).toEqual({ limit: 10, offset: 20 });
        });

        it('should handle page 1 with different limit', () => {
            const result = calculatePagination(1, 50);
            expect(result).toEqual({ limit: 50, offset: 0 });
        });

        it('should calculate offset for high page numbers', () => {
            const result = calculatePagination(100, 20);
            expect(result).toEqual({ limit: 20, offset: 1980 });
        });
    });

    describe('createPaginationMeta', () => {
        it('should create pagination meta for first page', () => {
            const meta = createPaginationMeta(1, 20, 100);
            expect(meta).toEqual({
                page: 1,
                limit: 20,
                total: 100,
                totalPages: 5,
            });
        });

        it('should calculate totalPages correctly with exact division', () => {
            const meta = createPaginationMeta(1, 20, 100);
            expect(meta.totalPages).toBe(5);
        });

        it('should round up totalPages when not exact division', () => {
            const meta = createPaginationMeta(1, 20, 95);
            expect(meta.totalPages).toBe(5); // Math.ceil(95/20) = 5
        });

        it('should handle single page', () => {
            const meta = createPaginationMeta(1, 20, 10);
            expect(meta).toEqual({
                page: 1,
                limit: 20,
                total: 10,
                totalPages: 1,
            });
        });

        it('should handle empty results', () => {
            const meta = createPaginationMeta(1, 20, 0);
            expect(meta).toEqual({
                page: 1,
                limit: 20,
                total: 0,
                totalPages: 0,
            });
        });

        it('should handle last page with partial results', () => {
            const meta = createPaginationMeta(5, 20, 95);
            expect(meta).toEqual({
                page: 5,
                limit: 20,
                total: 95,
                totalPages: 5,
            });
        });
    });
});
