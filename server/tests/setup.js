/**
 * Test setup – starts in‑memory MongoDB and configures environment.
 */
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
  // other env overrides if needed
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});