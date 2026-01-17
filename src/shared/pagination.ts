import { PaginationMeta } from './response';

export interface PaginationParams {
    page: number;
    limit: number;
}

export interface PaginationResult {
    limit: number;
    offset: number;
}

export function calculatePagination(page: number, limit: number): PaginationResult {
    const offset = (page - 1) * limit;
    return { limit, offset };
}

export function createPaginationMeta(
    page: number,
    limit: number,
    total: number
): PaginationMeta {
    const totalPages = Math.ceil(total / limit);
    return {
        page,
        limit,
        total,
        totalPages,
    };
}

export function paginationSql(limit: number, offset: number): string {
    return `LIMIT ${limit} OFFSET ${offset}`;
}