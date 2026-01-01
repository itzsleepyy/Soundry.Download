#!/bin/sh
set -e

echo "Waiting for database to be ready..."
sleep 2

# Create cookies directory if it doesn't exist
mkdir -p /app/cookies

# Parse cookie environment variables and write to files
# Supports YOUTUBE_COOKIE_1, YOUTUBE_COOKIE_2, etc.
echo "Checking for YouTube cookie environment variables..."
for i in 1 2 3 4 5; do
    cookie_var="YOUTUBE_COOKIE_$i"
    
    # Check if variable exists and is not empty
    if [ ! -z "$(printenv $cookie_var)" ]; then
        echo "Found $cookie_var, writing to file..."
        
        # Use printf to preserve newlines and special characters
        printenv "$cookie_var" > "/app/cookies/cookie-$i.txt"
        
        # Validate cookie file
        if [ -s "/app/cookies/cookie-$i.txt" ]; then
            line_count=$(wc -l < "/app/cookies/cookie-$i.txt")
            echo "✓ Created /app/cookies/cookie-$i.txt ($line_count lines)"
            
            # Check if it looks like a valid Netscape cookie file
            if head -n 1 "/app/cookies/cookie-$i.txt" | grep -q "Netscape HTTP Cookie File"; then
                echo "✓ Valid Netscape cookie format detected"
            else
                echo "⚠ Warning: Cookie file may not be in Netscape format"
                echo "  First line should be: # Netscape HTTP Cookie File"
            fi
        else
            echo "✗ Failed to create cookie file (empty or write failed)"
            rm -f "/app/cookies/cookie-$i.txt"
        fi
    fi
done

echo "Starting worker..."
exec node src/index.js
