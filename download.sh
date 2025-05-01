#!/bin/bash

# Shell script to download and install prerequisites on Linux/Ubuntu.

echo
echo "Starting prerequisite download and installation..."
echo "Please ensure you have an active internet connection."
echo

# 1. Check for Node.js and npm
echo "Checking for Node.js and npm..."
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found. Please install it first (e.g., via nvm or your package manager)." >&2
    exit 1
fi
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm not found. Please ensure Node.js installation includes npm." >&2
    exit 1
fi
echo "Node.js and npm found."

# 2. Run npm setup script
echo
echo "Running project setup (installing dependencies and browsers via 'npm run setup')..."
echo "This might take a while..."
if npm run setup; then
    echo
echo "**************************************************"
    echo " Prerequisite installation process completed successfully."
    echo " You should now be able to run the application using './start.sh' or 'npm run start:dev'."
echo "**************************************************"
    echo
else
    echo
echo "**************************************************"
    echo " ERROR: Project setup failed during 'npm run setup'."
    echo " Please check the output above for errors (network issues, missing build tools?)."
echo "**************************************************"
    echo
    exit 1
fi

exit 0 