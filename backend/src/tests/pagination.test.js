'use strict';

const { parsePagination, buildMeta, paginate } = require('../utils/pagination');

describe('parsePagination', () => {
  it('returns defaults when query is empty', () => {
    const result = parsePagination({});
    expect(result).toEqual({ page: 1, limit: 20, offset: 0 });
  });

  it('parses page and limit from query string', () => {
    const result = parsePagination({ page: '3', limit: '10' });
    expect(result).toEqual({ page: 3, limit: 10, offset: 20 });
  });

  it('clamps page to minimum 1', () => {
    expect(parsePagination({ page: '0' }).page).toBe(1);
    expect(parsePagination({ page: '-5' }).page).toBe(1);
  });

  it('clamps limit to maximum (default 82)', () => {
    expect(parsePagination({ limit: '100' }).limit).toBe(82);
  });

  it('falls back to defaultLimit when limit is 0 (falsy)', () => {
    // parseInt('0') is falsy so || defaultLimit kicks in, giving 20
    expect(parsePagination({ limit: '0' }).limit).toBe(20);
  });

  it('clamps negative limit to minimum 1', () => {
    // parseInt('-1') = -1, Math.max(1,-1) = 1
    expect(parsePagination({ limit: '-1' }).limit).toBe(1);
  });

  it('respects custom defaultLimit', () => {
    expect(parsePagination({}, 50).limit).toBe(50);
  });

  it('respects custom maxLimit', () => {
    expect(parsePagination({ limit: '200' }, 20, 100).limit).toBe(100);
  });

  it('calculates correct offset', () => {
    expect(parsePagination({ page: '2', limit: '10' }).offset).toBe(10);
    expect(parsePagination({ page: '5', limit: '20' }).offset).toBe(80);
  });

  it('treats non-numeric values as defaults', () => {
    const result = parsePagination({ page: 'abc', limit: 'xyz' });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });
});

describe('buildMeta', () => {
  it('returns correct meta object', () => {
    expect(buildMeta(1, 20, 100)).toEqual({ page: 1, limit: 20, total: 100, totalPages: 5 });
  });

  it('rounds up totalPages', () => {
    expect(buildMeta(1, 20, 101).totalPages).toBe(6);
  });

  it('returns totalPages 0 when total is 0', () => {
    expect(buildMeta(1, 20, 0).totalPages).toBe(0);
  });
});

describe('paginate', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it('returns correct slice for first page', () => {
    expect(paginate(items, 0, 3)).toEqual([1, 2, 3]);
  });

  it('returns correct slice for second page', () => {
    expect(paginate(items, 3, 3)).toEqual([4, 5, 6]);
  });

  it('returns remaining items when last page is partial', () => {
    expect(paginate(items, 9, 5)).toEqual([10]);
  });

  it('returns empty array when offset exceeds length', () => {
    expect(paginate(items, 20, 5)).toEqual([]);
  });

  it('returns all items when limit is larger than array', () => {
    expect(paginate(items, 0, 100)).toEqual(items);
  });
});
