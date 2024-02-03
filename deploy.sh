#!/bin/bash

function check_env_file {
  if ! grep -q "OPENAI_API_KEY" backend/.env; then
    echo "Environment variable OPENAI_API_KEY not set."
    read -p "Enter OPENAI_API_KEY: " openai_api_key
    echo "OPENAI_API_KEY=$openai_api_key" > backend/.env
  fi
  if ! grep -q "MONGO_URI" backend/.env; then
    echo "Setting default MONGO_URI in .env"
    echo "MONGO_URI=mongodb://localhost:27017/idetic" >> backend/.env
  fi
}

    read -p "Enter OPENAI_API_KEY: " openai_api_key
    echo "MONGO_URI=$mongo_uri" > backend/.env
    echo "OPENAI_API_KEY=$openai_api_key" >> backend/.env
  fi
}

function start_mongodb {
  if ! pgrep -x "mongod" > /dev/null; then
    echo "Starting MongoDB service..."
    if ! service mongod start; then
      echo "MongoDB service could not be started. Please ensure MongoDB is installed."
      exit 1
    fi
    echo "Creating 'idetic' database if it doesn't exist..."
    mongo idetic --eval "db.createCollection('books')"
  fi
}

function install_dependencies {
  echo "Installing backend dependencies..."
  cd backend && npm install && cd ..
  echo "Installing client dependencies..."
  cd client && npm install && cd ..
}

function run_app {
  echo "Running backend..."
  cd backend && npm start &
  BACKEND_PID=$!
  echo "Running client..."
  cd ../client && npm start &
  CLIENT_PID=$!
  echo "Backend PID: $BACKEND_PID, Client PID: $CLIENT_PID"
  echo "App is now running in the background."
}

function kill_app {
  echo "Killing backend and client processes..."
  kill $(lsof -t -i:3001) 2> /dev/null
  kill $(lsof -t -i:3000) 2> /dev/null
  echo "Processes killed."
}

case "$1" in
  run)
    check_env_file
    start_mongodb
    install_dependencies
    run_app
    ;;
  kill)
    kill_app
    ;;
  *)
    echo "Usage: $0 {run|kill}"
    exit 1
esac
