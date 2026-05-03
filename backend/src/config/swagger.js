'use strict';

const config = require('./index');

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'NBA Statistics API',
    version: '1.0.0',
    description:
      'REST API que extrae estadísticas de la NBA desde stats.nba.com en tiempo real. ' +
      'Incluye partidos, boxscores, jugadores, equipos, clasificaciones y control del scraper.',
    contact: {
      name: 'Análisis Deportivo',
      email: 'jorgebadran08@gmail.com',
    },
    license: { name: 'MIT' },
  },
  servers: [
    {
      url: `http://localhost:${config.port}${config.apiPrefix}`,
      description: 'Servidor de desarrollo',
    },
  ],
  tags: [
    { name: 'Discovery', description: 'Información y estado de la API' },
    { name: 'Games', description: 'Partidos del día y resultados' },
    { name: 'Schedule', description: 'Calendario de la temporada' },
    { name: 'Players', description: 'Estadísticas individuales de jugadores' },
    { name: 'Teams', description: 'Equipos y plantillas' },
    { name: 'Standings', description: 'Clasificación por conferencia y división' },
    { name: 'Scraper', description: 'Control manual del scraper y logs' },
  ],
  components: {
    parameters: {
      season: {
        name: 'season',
        in: 'query',
        description: 'Temporada NBA (formato YYYY-YY)',
        schema: { type: 'string', example: '2024-25' },
      },
      seasonType: {
        name: 'seasonType',
        in: 'query',
        description: 'Tipo de temporada',
        schema: {
          type: 'string',
          enum: ['Regular Season', 'Playoffs', 'Pre Season'],
          default: 'Regular Season',
        },
      },
      page: {
        name: 'page',
        in: 'query',
        description: 'Número de página (empieza en 1)',
        schema: { type: 'integer', minimum: 1, default: 1, example: 1 },
      },
      limit: {
        name: 'limit',
        in: 'query',
        description: 'Resultados por página',
        schema: { type: 'integer', minimum: 1, maximum: 100, default: 20, example: 20 },
      },
    },
    schemas: {
      SuccessEnvelope: {
        type: 'object',
        required: ['status', 'data'],
        properties: {
          status: { type: 'string', enum: ['success'], example: 'success' },
          meta: { type: 'object', description: 'Metadatos opcionales (paginación, totales, etc.)' },
          data: { description: 'Payload de la respuesta' },
        },
      },
      ErrorEnvelope: {
        type: 'object',
        required: ['status', 'code', 'message'],
        properties: {
          status: { type: 'string', enum: ['error'], example: 'error' },
          code: { type: 'string', example: 'BAD_REQUEST' },
          message: { type: 'string', example: 'date must be YYYY-MM-DD' },
          details: { description: 'Información adicional de diagnóstico' },
        },
      },
      Game: {
        type: 'object',
        properties: {
          gameId: { type: 'string', example: '0022401001' },
          date: { type: 'string', format: 'date', example: '2025-01-15' },
          status: { type: 'string', enum: ['live', 'final', 'upcoming'], example: 'final' },
          homeTeam: { $ref: '#/components/schemas/TeamScore' },
          awayTeam: { $ref: '#/components/schemas/TeamScore' },
          arena: { type: 'string', example: 'Crypto.com Arena' },
          gameTime: { type: 'string', example: '7:30 PM ET' },
        },
      },
      TeamScore: {
        type: 'object',
        properties: {
          teamId: { type: 'integer', example: 1610612747 },
          teamName: { type: 'string', example: 'Los Angeles Lakers' },
          teamTricode: { type: 'string', example: 'LAL' },
          score: { type: 'integer', example: 112 },
          record: { type: 'string', example: '28-19' },
        },
      },
      Boxscore: {
        type: 'object',
        properties: {
          gameId: { type: 'string', example: '0022401001' },
          status: { type: 'string', enum: ['live', 'final', 'upcoming'] },
          period: { type: 'integer', example: 4 },
          clock: { type: 'string', example: 'PT00M00.00S' },
          homeTeam: { $ref: '#/components/schemas/TeamBoxscore' },
          awayTeam: { $ref: '#/components/schemas/TeamBoxscore' },
        },
      },
      TeamBoxscore: {
        type: 'object',
        properties: {
          teamId: { type: 'integer', example: 1610612747 },
          teamName: { type: 'string', example: 'Los Angeles Lakers' },
          teamTricode: { type: 'string', example: 'LAL' },
          score: { type: 'integer', example: 112 },
          players: {
            type: 'array',
            items: { $ref: '#/components/schemas/PlayerBoxscoreRow' },
          },
          totals: { $ref: '#/components/schemas/StatLine' },
        },
      },
      PlayerBoxscoreRow: {
        type: 'object',
        properties: {
          playerId: { type: 'integer', example: 2544 },
          name: { type: 'string', example: 'LeBron James' },
          position: { type: 'string', example: 'F' },
          starter: { type: 'boolean', example: true },
          minutes: { type: 'string', example: '35:22' },
          stats: { $ref: '#/components/schemas/StatLine' },
        },
      },
      StatLine: {
        type: 'object',
        properties: {
          points: { type: 'number', example: 28 },
          rebounds: { type: 'number', example: 8 },
          assists: { type: 'number', example: 6 },
          steals: { type: 'number', example: 1 },
          blocks: { type: 'number', example: 0 },
          turnovers: { type: 'number', example: 3 },
          fieldGoalsMade: { type: 'number', example: 11 },
          fieldGoalsAttempted: { type: 'number', example: 20 },
          fieldGoalPercentage: { type: 'number', format: 'float', example: 0.55 },
          threePointersMade: { type: 'number', example: 2 },
          threePointersAttempted: { type: 'number', example: 5 },
          threePointPercentage: { type: 'number', format: 'float', example: 0.4 },
          freeThrowsMade: { type: 'number', example: 4 },
          freeThrowsAttempted: { type: 'number', example: 5 },
          freeThrowPercentage: { type: 'number', format: 'float', example: 0.8 },
          plusMinus: { type: 'number', example: 12 },
        },
      },
      ScheduleGame: {
        type: 'object',
        properties: {
          gameId: { type: 'string', example: '0022401001' },
          date: { type: 'string', format: 'date', example: '2025-01-15' },
          gameTime: { type: 'string', example: '7:30 PM ET' },
          homeTeam: { type: 'string', example: 'Los Angeles Lakers' },
          awayTeam: { type: 'string', example: 'Golden State Warriors' },
          arena: { type: 'string', example: 'Crypto.com Arena' },
          city: { type: 'string', example: 'Los Angeles' },
          status: { type: 'string', enum: ['upcoming', 'live', 'final'], example: 'upcoming' },
        },
      },
      PlayerStatGame: {
        type: 'object',
        properties: {
          gameId: { type: 'string', example: '0022401001' },
          date: { type: 'string', format: 'date', example: '2025-01-15' },
          opponent: { type: 'string', example: 'GSW' },
          homeAway: { type: 'string', enum: ['home', 'away'], example: 'home' },
          result: { type: 'string', example: 'W 112-98' },
          minutes: { type: 'string', example: '35:22' },
          stats: { $ref: '#/components/schemas/StatLine' },
        },
      },
      PlayerAverages: {
        type: 'object',
        properties: {
          playerId: { type: 'integer', example: 2544 },
          playerName: { type: 'string', example: 'LeBron James' },
          team: { type: 'string', example: 'LAL' },
          season: { type: 'string', example: '2024-25' },
          seasonType: { type: 'string', example: 'Regular Season' },
          gamesPlayed: { type: 'integer', example: 47 },
          minutesPerGame: { type: 'number', format: 'float', example: 35.2 },
          stats: { $ref: '#/components/schemas/StatLine' },
        },
      },
      Team: {
        type: 'object',
        properties: {
          teamId: { type: 'integer', example: 1610612747 },
          teamName: { type: 'string', example: 'Los Angeles Lakers' },
          teamTricode: { type: 'string', example: 'LAL' },
          conference: { type: 'string', enum: ['East', 'West'], example: 'West' },
          division: { type: 'string', example: 'Pacific' },
          city: { type: 'string', example: 'Los Angeles' },
          record: { type: 'string', example: '28-19' },
          wins: { type: 'integer', example: 28 },
          losses: { type: 'integer', example: 19 },
          winPct: { type: 'number', format: 'float', example: 0.596 },
        },
      },
      TeamDetail: {
        allOf: [
          { $ref: '#/components/schemas/Team' },
          {
            type: 'object',
            properties: {
              roster: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    playerId: { type: 'integer', example: 2544 },
                    name: { type: 'string', example: 'LeBron James' },
                    number: { type: 'string', example: '23' },
                    position: { type: 'string', example: 'F' },
                    height: { type: 'string', example: '6-9' },
                    weight: { type: 'string', example: '250' },
                    age: { type: 'integer', example: 40 },
                    experience: { type: 'integer', example: 21 },
                  },
                },
              },
            },
          },
        ],
      },
      Standing: {
        type: 'object',
        properties: {
          rank: { type: 'integer', example: 1 },
          teamId: { type: 'integer', example: 1610612738 },
          teamName: { type: 'string', example: 'Boston Celtics' },
          teamTricode: { type: 'string', example: 'BOS' },
          conference: { type: 'string', enum: ['East', 'West'], example: 'East' },
          division: { type: 'string', example: 'Atlantic' },
          wins: { type: 'integer', example: 42 },
          losses: { type: 'integer', example: 14 },
          winPct: { type: 'number', format: 'float', example: 0.75 },
          gamesBehind: { type: 'number', format: 'float', example: 0 },
          homeRecord: { type: 'string', example: '22-5' },
          awayRecord: { type: 'string', example: '20-9' },
          lastTen: { type: 'string', example: '8-2' },
          streak: { type: 'string', example: 'W3' },
          clinched: { type: 'string', example: 'x' },
        },
      },
      ScrapeLog: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 42 },
          type: { type: 'string', example: 'daily_scrape' },
          status: { type: 'string', enum: ['started', 'success', 'error'], example: 'success' },
          startedAt: { type: 'string', format: 'date-time', example: '2025-01-15T06:00:00.000Z' },
          finishedAt: { type: 'string', format: 'date-time', example: '2025-01-15T06:03:42.000Z' },
          durationMs: { type: 'integer', example: 222000 },
          details: { type: 'object', description: 'Detalles adicionales del proceso' },
        },
      },
      PaginationMeta: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 1 },
          limit: { type: 'integer', example: 20 },
          total: { type: 'integer', example: 47 },
          totalPages: { type: 'integer', example: 3 },
          hasNextPage: { type: 'boolean', example: true },
          hasPrevPage: { type: 'boolean', example: false },
        },
      },
    },
    responses: {
      BadRequest: {
        description: 'Parámetros inválidos',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorEnvelope' },
            example: { status: 'error', code: 'BAD_REQUEST', message: 'date must be YYYY-MM-DD' },
          },
        },
      },
      NotFound: {
        description: 'Recurso no encontrado',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorEnvelope' },
            example: { status: 'error', code: 'NOT_FOUND', message: 'Resource not found' },
          },
        },
      },
      RateLimit: {
        description: 'Límite de peticiones excedido (100 req/min)',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorEnvelope' },
            example: { status: 'error', code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests' },
          },
        },
      },
      ServerError: {
        description: 'Error interno del servidor',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorEnvelope' },
            example: { status: 'error', code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
          },
        },
      },
      ScraperUnavailable: {
        description: 'El scraper no pudo obtener los datos',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ErrorEnvelope' },
            example: { status: 'error', code: 'SCRAPER_UNAVAILABLE', message: 'Could not fetch data from NBA Stats' },
          },
        },
      },
    },
  },
  paths: {
    '/': {
      get: {
        tags: ['Discovery'],
        summary: 'Información de la API',
        description: 'Retorna la versión, estado y lista de todos los endpoints disponibles.',
        operationId: 'getApiInfo',
        responses: {
          200: {
            description: 'Información de la API',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'success' },
                    message: { type: 'string', example: 'NBA Statistics API' },
                    version: { type: 'string', example: '1.0.0' },
                    endpoints: { type: 'object' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/games': {
      get: {
        tags: ['Games'],
        summary: 'Listar partidos por fecha',
        description:
          'Retorna los partidos de una fecha específica. Si no se indica fecha, devuelve los de hoy. ' +
          'Los datos de partidos en vivo se cachean por 30 segundos; los finalizados, 1 hora.',
        operationId: 'listGames',
        parameters: [
          {
            name: 'date',
            in: 'query',
            description: 'Fecha de los partidos (formato YYYY-MM-DD). Por defecto: hoy.',
            schema: { type: 'string', format: 'date', example: '2025-01-15' },
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filtrar partidos por estado.',
            schema: { type: 'string', enum: ['live', 'final', 'upcoming'] },
          },
        ],
        responses: {
          200: {
            description: 'Lista de partidos',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    {
                      properties: {
                        meta: {
                          type: 'object',
                          properties: {
                            date: { type: 'string', format: 'date', example: '2025-01-15' },
                            count: { type: 'integer', example: 8 },
                          },
                        },
                        data: { type: 'array', items: { $ref: '#/components/schemas/Game' } },
                      },
                    },
                  ],
                },
                example: {
                  status: 'success',
                  meta: { date: '2025-01-15', count: 2 },
                  data: [
                    {
                      gameId: '0022401001',
                      date: '2025-01-15',
                      status: 'final',
                      homeTeam: { teamId: 1610612747, teamName: 'Los Angeles Lakers', teamTricode: 'LAL', score: 112, record: '28-19' },
                      awayTeam: { teamId: 1610612744, teamName: 'Golden State Warriors', teamTricode: 'GSW', score: 98, record: '25-22' },
                      arena: 'Crypto.com Arena',
                      gameTime: '7:30 PM ET',
                    },
                  ],
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          429: { $ref: '#/components/responses/RateLimit' },
          503: { $ref: '#/components/responses/ScraperUnavailable' },
        },
      },
    },
    '/games/{gameId}/boxscore': {
      get: {
        tags: ['Games'],
        summary: 'Boxscore de un partido',
        description:
          'Retorna el boxscore completo con estadísticas de todos los jugadores. ' +
          'En vivo: cache de 30s. Finalizado: cache de 6 horas.',
        operationId: 'getBoxscore',
        parameters: [
          {
            name: 'gameId',
            in: 'path',
            required: true,
            description: 'ID del partido NBA (10 dígitos)',
            schema: { type: 'string', pattern: '^\\d{10}$', example: '0022401001' },
          },
        ],
        responses: {
          200: {
            description: 'Boxscore del partido',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/Boxscore' } } },
                  ],
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
          429: { $ref: '#/components/responses/RateLimit' },
          503: { $ref: '#/components/responses/ScraperUnavailable' },
        },
      },
    },
    '/schedule': {
      get: {
        tags: ['Schedule'],
        summary: 'Calendario de la temporada',
        description: 'Retorna el calendario completo de la temporada. Cache de 24 horas.',
        operationId: 'listSchedule',
        parameters: [
          { $ref: '#/components/parameters/season' },
          { $ref: '#/components/parameters/seasonType' },
          {
            name: 'team',
            in: 'query',
            description: 'Filtrar por tricode del equipo (ej: LAL, BOS)',
            schema: { type: 'string', example: 'LAL' },
          },
          {
            name: 'from',
            in: 'query',
            description: 'Fecha de inicio del rango (YYYY-MM-DD)',
            schema: { type: 'string', format: 'date', example: '2025-01-01' },
          },
          {
            name: 'to',
            in: 'query',
            description: 'Fecha de fin del rango (YYYY-MM-DD)',
            schema: { type: 'string', format: 'date', example: '2025-01-31' },
          },
        ],
        responses: {
          200: {
            description: 'Calendario de partidos',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    {
                      properties: {
                        meta: {
                          type: 'object',
                          properties: {
                            season: { type: 'string', example: '2024-25' },
                            count: { type: 'integer', example: 1230 },
                          },
                        },
                        data: { type: 'array', items: { $ref: '#/components/schemas/ScheduleGame' } },
                      },
                    },
                  ],
                },
              },
            },
          },
          429: { $ref: '#/components/responses/RateLimit' },
          503: { $ref: '#/components/responses/ScraperUnavailable' },
        },
      },
    },
    '/players/{playerId}/stats': {
      get: {
        tags: ['Players'],
        summary: 'Estadísticas partido a partido',
        description:
          'Retorna el log de partidos de un jugador para la temporada indicada, ordenado del más reciente al más antiguo. ' +
          'Los resultados están paginados. Cache de 5 minutos.',
        operationId: 'listPlayerStats',
        parameters: [
          {
            name: 'playerId',
            in: 'path',
            required: true,
            description: 'ID del jugador NBA. Ej: 2544 (LeBron James), 203954 (Joel Embiid)',
            schema: { type: 'integer', example: 2544 },
          },
          { $ref: '#/components/parameters/season' },
          { $ref: '#/components/parameters/seasonType' },
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/limit' },
        ],
        responses: {
          200: {
            description: 'Log de partidos del jugador',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    {
                      properties: {
                        meta: {
                          allOf: [
                            { $ref: '#/components/schemas/PaginationMeta' },
                            {
                              type: 'object',
                              properties: {
                                playerId: { type: 'integer', example: 2544 },
                                season: { type: 'string', example: '2024-25' },
                              },
                            },
                          ],
                        },
                        data: { type: 'array', items: { $ref: '#/components/schemas/PlayerStatGame' } },
                      },
                    },
                  ],
                },
                example: {
                  status: 'success',
                  meta: { playerId: 2544, season: '2024-25', page: 1, limit: 20, total: 47, totalPages: 3, hasNextPage: true, hasPrevPage: false },
                  data: [
                    {
                      gameId: '0022401001',
                      date: '2025-01-15',
                      opponent: 'GSW',
                      homeAway: 'home',
                      result: 'W 112-98',
                      minutes: '35:22',
                      stats: { points: 28, rebounds: 8, assists: 6, steals: 1, blocks: 0, turnovers: 3, fieldGoalsMade: 11, fieldGoalsAttempted: 20, fieldGoalPercentage: 0.55, threePointersMade: 2, threePointersAttempted: 5, threePointPercentage: 0.4, freeThrowsMade: 4, freeThrowsAttempted: 5, freeThrowPercentage: 0.8, plusMinus: 12 },
                    },
                  ],
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
          429: { $ref: '#/components/responses/RateLimit' },
          503: { $ref: '#/components/responses/ScraperUnavailable' },
        },
      },
    },
    '/players/{playerId}/averages': {
      get: {
        tags: ['Players'],
        summary: 'Promedios de temporada',
        description:
          'Retorna los promedios estadísticos por partido del jugador en la temporada. ' +
          'Snapshot diario; cache de 15 minutos.',
        operationId: 'getPlayerAverages',
        parameters: [
          {
            name: 'playerId',
            in: 'path',
            required: true,
            description: 'ID del jugador NBA',
            schema: { type: 'integer', example: 2544 },
          },
          { $ref: '#/components/parameters/season' },
          { $ref: '#/components/parameters/seasonType' },
        ],
        responses: {
          200: {
            description: 'Promedios del jugador',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/PlayerAverages' } } },
                  ],
                },
                example: {
                  status: 'success',
                  data: {
                    playerId: 2544,
                    playerName: 'LeBron James',
                    team: 'LAL',
                    season: '2024-25',
                    seasonType: 'Regular Season',
                    gamesPlayed: 47,
                    minutesPerGame: 35.2,
                    stats: { points: 23.4, rebounds: 8.1, assists: 9.3, steals: 1.2, blocks: 0.5, turnovers: 3.1, fieldGoalsMade: 9.8, fieldGoalsAttempted: 18.4, fieldGoalPercentage: 0.533, threePointersMade: 1.6, threePointersAttempted: 4.5, threePointPercentage: 0.362, freeThrowsMade: 2.3, freeThrowsAttempted: 3.4, freeThrowPercentage: 0.745, plusMinus: 4.2 },
                  },
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
          429: { $ref: '#/components/responses/RateLimit' },
          503: { $ref: '#/components/responses/ScraperUnavailable' },
        },
      },
    },
    '/teams': {
      get: {
        tags: ['Teams'],
        summary: 'Listar todos los equipos',
        description: 'Retorna los 30 equipos de la NBA con su récord de la temporada. Cache de 1 hora.',
        operationId: 'listTeams',
        parameters: [
          { $ref: '#/components/parameters/season' },
          { $ref: '#/components/parameters/seasonType' },
          {
            name: 'conference',
            in: 'query',
            description: 'Filtrar por conferencia',
            schema: { type: 'string', enum: ['East', 'West'] },
          },
          {
            name: 'division',
            in: 'query',
            description: 'Filtrar por división (ej: Pacific, Atlantic, Southeast…)',
            schema: {
              type: 'string',
              enum: ['Atlantic', 'Central', 'Southeast', 'Northwest', 'Pacific', 'Southwest'],
            },
          },
        ],
        responses: {
          200: {
            description: 'Lista de equipos',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    {
                      properties: {
                        meta: {
                          type: 'object',
                          properties: { count: { type: 'integer', example: 30 } },
                        },
                        data: { type: 'array', items: { $ref: '#/components/schemas/Team' } },
                      },
                    },
                  ],
                },
              },
            },
          },
          429: { $ref: '#/components/responses/RateLimit' },
          503: { $ref: '#/components/responses/ScraperUnavailable' },
        },
      },
    },
    '/teams/{teamId}': {
      get: {
        tags: ['Teams'],
        summary: 'Detalle de un equipo',
        description: 'Retorna el perfil completo del equipo incluyendo plantilla actual. Cache de 1 hora.',
        operationId: 'getTeam',
        parameters: [
          {
            name: 'teamId',
            in: 'path',
            required: true,
            description: 'ID del equipo NBA. Ej: 1610612747 (Lakers), 1610612738 (Celtics)',
            schema: { type: 'integer', example: 1610612747 },
          },
          { $ref: '#/components/parameters/season' },
          { $ref: '#/components/parameters/seasonType' },
        ],
        responses: {
          200: {
            description: 'Detalle del equipo',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { $ref: '#/components/schemas/TeamDetail' } } },
                  ],
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
          429: { $ref: '#/components/responses/RateLimit' },
          503: { $ref: '#/components/responses/ScraperUnavailable' },
        },
      },
    },
    '/standings': {
      get: {
        tags: ['Standings'],
        summary: 'Clasificación NBA',
        description:
          'Retorna la clasificación completa de la NBA ordenada por porcentaje de victorias. ' +
          'Puede filtrarse por conferencia o división. Cache de 5 minutos.',
        operationId: 'listStandings',
        parameters: [
          { $ref: '#/components/parameters/season' },
          { $ref: '#/components/parameters/seasonType' },
          {
            name: 'conference',
            in: 'query',
            description: 'Filtrar por conferencia',
            schema: { type: 'string', enum: ['East', 'West'] },
          },
          {
            name: 'division',
            in: 'query',
            description: 'Filtrar por división',
            schema: {
              type: 'string',
              enum: ['Atlantic', 'Central', 'Southeast', 'Northwest', 'Pacific', 'Southwest'],
            },
          },
        ],
        responses: {
          200: {
            description: 'Clasificación de equipos',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    {
                      properties: {
                        meta: {
                          type: 'object',
                          properties: {
                            season: { type: 'string', example: '2024-25' },
                            count: { type: 'integer', example: 30 },
                          },
                        },
                        data: { type: 'array', items: { $ref: '#/components/schemas/Standing' } },
                      },
                    },
                  ],
                },
                example: {
                  status: 'success',
                  meta: { season: '2024-25', count: 30 },
                  data: [
                    { rank: 1, teamId: 1610612738, teamName: 'Boston Celtics', teamTricode: 'BOS', conference: 'East', division: 'Atlantic', wins: 42, losses: 14, winPct: 0.75, gamesBehind: 0, homeRecord: '22-5', awayRecord: '20-9', lastTen: '8-2', streak: 'W3', clinched: 'x' },
                  ],
                },
              },
            },
          },
          429: { $ref: '#/components/responses/RateLimit' },
          503: { $ref: '#/components/responses/ScraperUnavailable' },
        },
      },
    },
    '/scrape/logs': {
      get: {
        tags: ['Scraper'],
        summary: 'Logs del scraper',
        description: 'Retorna los registros de las últimas ejecuciones del scraper, útil para monitoreo.',
        operationId: 'getScrapeLogs',
        parameters: [
          {
            name: 'type',
            in: 'query',
            description: 'Filtrar por tipo de scrape',
            schema: { type: 'string', example: 'daily_scrape' },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Número de logs a retornar',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 20, example: 20 },
          },
        ],
        responses: {
          200: {
            description: 'Lista de logs',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessEnvelope' },
                    { properties: { data: { type: 'array', items: { $ref: '#/components/schemas/ScrapeLog' } } } },
                  ],
                },
              },
            },
          },
          429: { $ref: '#/components/responses/RateLimit' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
    '/scrape/run': {
      post: {
        tags: ['Scraper'],
        summary: 'Ejecutar scrape manual',
        description:
          'Dispara un scrape completo de forma manual (fire-and-forget). ' +
          'La respuesta es inmediata; el proceso continúa en segundo plano. ' +
          'Útil para forzar actualización de datos sin esperar al cron de las 06:00 UTC.',
        operationId: 'runScrape',
        requestBody: {
          required: false,
          content: {
            'application/json': {
              schema: { type: 'object', description: 'Body opcional — no se utiliza actualmente.' },
            },
          },
        },
        responses: {
          200: {
            description: 'Scrape iniciado en segundo plano',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessEnvelope' },
                example: { status: 'success', message: 'Scrape job started.' },
              },
            },
          },
          429: { $ref: '#/components/responses/RateLimit' },
          500: { $ref: '#/components/responses/ServerError' },
        },
      },
    },
  },
};

const swaggerOptions = {
  definition: swaggerDefinition,
  apis: [],
};

module.exports = { swaggerOptions, swaggerDefinition };
