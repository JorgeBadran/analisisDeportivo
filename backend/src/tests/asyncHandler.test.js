'use strict';

const asyncHandler = require('../utils/asyncHandler');

describe('asyncHandler', () => {
  it('calls the wrapped function with req, res, next', async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    const req = {}, res = {}, next = jest.fn();
    await asyncHandler(fn)(req, res, next);
    expect(fn).toHaveBeenCalledWith(req, res, next);
  });

  it('calls next with error when the wrapped function rejects', async () => {
    const err = new Error('async error');
    const fn = jest.fn().mockRejectedValue(err);
    const next = jest.fn();
    await asyncHandler(fn)({}, {}, next);
    expect(next).toHaveBeenCalledWith(err);
  });

  it('does not call next when the wrapped function resolves', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const next = jest.fn();
    await asyncHandler(fn)({}, {}, next);
    expect(next).not.toHaveBeenCalled();
  });
});
