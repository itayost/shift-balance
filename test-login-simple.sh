#!/bin/bash

echo "Testing login endpoint..."
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0501234567","password":"Admin123!"}' \
  -w "\n"