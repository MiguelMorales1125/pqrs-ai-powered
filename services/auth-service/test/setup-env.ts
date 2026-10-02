// Deterministic environment for tests; no real database is used.
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_SECRET = 'test_jwt_secret';
process.env.JWT_ALGORITHM = 'HS256';
process.env.ACCESS_TOKEN_EXPIRE_MINUTES = '60';
