# Virtual Workspace Platform Backend

Enterprise multi‑organization virtual workspace platform with Node.js, Express, MongoDB, Redis, and RabbitMQ.

## Setup

1. Copy `.env.example` to `.env` and fill in the values.
2. Install dependencies: `npm install`
3. Start Docker services: `docker-compose up -d`
4. Run the server: `npm run dev`
5. Seed database (optional): `npm run seed`