#!/bin/bash

# Shell script to start the backend and frontend concurrently on Linux/Ubuntu.

echo "Starting Flowchart Editor..."
echo

# Check if concurrently is installed
if ! npm list concurrently --depth=0 &> /dev/null; then
  echo "WARNING: 'concurrently' package not found in node_modules. It's needed to run services together." >&2
  echo "Attempting to install it locally..."
  if ! npm install concurrently --save-dev; then
      echo "ERROR: Failed to install 'concurrently'. Please install it manually ('npm install concurrently --save-dev') and try again." >&2
      exit 1
  fi
fi

echo "Attempting to start backend and frontend using 'npm run start:dev'..."
echo "(Press Ctrl+C to stop both services)"
echo
npm run start:dev

# Check the exit code of the concurrently command
if [ $? -ne 0 ]; then
    echo
    echo "WARN: 'npm run start:dev' finished with a non-zero exit code. Check output above for errors." >&2
fi

echo "Services stopped."
exit 0 