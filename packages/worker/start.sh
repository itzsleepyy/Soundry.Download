#!/bin/sh
set -e

echo "Waiting for database to be ready..."
sleep 2

echo "Starting worker..."
exec node src/index.js
