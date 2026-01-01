#!/bin/sh
set -e

echo "Waiting for database to be ready..."
sleep 2

# Create cookies directory if it doesn't exist
mkdir -p /app/cookies

# Parse cookie environment variables and write to files
# Supports YOUTUBE_COOKIE_1, YOUTUBE_COOKIE_2, etc.
for i in 1 2 3 4 5; do
    cookie_var="YOUTUBE_COOKIE_$i"
    cookie_value=$(eval echo \$$cookie_var)
    
    if [ ! -z "$cookie_value" ]; then
        echo "Writing cookie file from $cookie_var..."
        echo "$cookie_value" > "/app/cookies/cookie-$i.txt"
        echo "Created /app/cookies/cookie-$i.txt"
    fi
done

echo "Starting worker..."
exec node src/index.js
