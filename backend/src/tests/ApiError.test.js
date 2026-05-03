'use strict';

const ApiError = require('../utils/ApiError');

describe('ApiError', () => {
  describe('constructor', () => {
    it('sets statusCode, message, code and details', () => {
      const err = new ApiError(400, 'bad input', 'CUSTOM_CODE', { field: 'name' });
      expect(err).toBeInstanceOf(Error);
      expect(err.statusCode).toBe(400);
      expect(err.message).toBe('bad input');
      expect(err.code).toBe('CUSTOM_CODE');
      expect(err.details).toEqual({ field: 'name' });
    });

    it('defaults code to INTERNAL_ERROR when omitted', () => {
      const err = new ApiError(500, 'oops');
      expect(err.code).toBe('INTERNAL_ERROR');
    });

    it('defaults details to null when omitted', () => {
      const err = new ApiError(500, 'oops');
      expect(err.details).toBeNull();
    });

    it('has a stack trace', () => {
      const err = new ApiError(500, 'oops');
      expect(err.stack).toBeDefined();
    });
  });

  describe('badRequest', () => {
    it('returns status 400 with default BAD_REQUEST code', () => {
      const err = ApiError.badRequest('invalid param');
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('BAD_REQUEST');
      expect(err.message).toBe('invalid param');
    });

    it('accepts custom code and details', () => {
      const err = ApiError.badRequest('msg', 'CUSTOM', { x: 1 });
      expect(err.code).toBe('CUSTOM');
      expect(err.details).toEqual({ x: 1 });
    });
  });

  describe('notFound', () => {
    it('returns status 404 with default NOT_FOUND code', () => {
      const err = ApiError.notFound('game not found');
      expect(err.statusCode).toBe(404);
      expect(err.code).toBe('NOT_FOUND');
    });

    it('accepts custom code', () => {
      const err = ApiError.notFound('not found', 'GAME_NOT_FOUND');
      expect(err.code).toBe('GAME_NOT_FOUND');
    });
  });

  describe('serviceUnavailable', () => {
    it('returns status 503 with SCRAPER_UNAVAILABLE code', () => {
      const err = ApiError.serviceUnavailable('scraper failed');
      expect(err.statusCode).toBe(503);
      expect(err.code).toBe('SCRAPER_UNAVAILABLE');
      expect(err.message).toBe('scraper failed');
    });
  });

  describe('tooManyRequests', () => {
    it('returns status 429 with RATE_LIMIT_EXCEEDED code', () => {
      const err = ApiError.tooManyRequests();
      expect(err.statusCode).toBe(429);
      expect(err.code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });
});
