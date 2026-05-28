#!/bin/bash
echo "Installing dependencies..."
npm install
echo "Starting Docker services..."
docker-compose up -d
echo "Seed database..."
npm run seed
echo "Development environment ready."