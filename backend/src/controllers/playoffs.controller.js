'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { getPlayoffBracket } = require('../services/playoffs.service');

const getBracket = asyncHandler(async (req, res) => {
  const data = await getPlayoffBracket();
  res.json({ status: 'success', data });
});

module.exports = { getBracket };
