'use strict';

const axios = require('axios');
const ApiError = require('../utils/ApiError');

const clients = {
  site: axios.create({
    baseURL: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba',
    timeout: 10000,
    headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
  }),
  web: axios.create({
    baseURL: 'https://site.web.api.espn.com/apis/common/v3/sports/basketball/nba',
    timeout: 10000,
    headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
  }),
  v2: axios.create({
    baseURL: 'https://site.web.api.espn.com/apis/v2/sports/basketball/nba',
    timeout: 10000,
    headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
  }),
};

// clientName: 'site' | 'web' | 'v2'
async function fetchEspn(path, params = {}, clientName = 'site') {
  const client = clients[clientName] || clients.site;
  try {
    const { data } = await client.get(path, { params });
    return data;
  } catch (err) {
    if (err.response?.status === 404) {
      throw ApiError.notFound(`ESPN: recurso no encontrado en ${path}`, 'NOT_FOUND');
    }
    throw ApiError.serviceUnavailable(`ESPN API error: ${err.message}`);
  }
}

module.exports = { fetchEspn };
