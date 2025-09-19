#!/bin/bash

# First, login to get token
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"0501234567","password":"Admin123!"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r .data.accessToken)

echo "Token obtained successfully"
echo ""

# Test 1: Get all users
echo "1. Getting all users..."
curl -X GET http://localhost:5001/api/users \
  -H "Authorization: Bearer $TOKEN" | jq
echo ""

# Test 2: Search users
echo "2. Searching for users..."
curl -X GET "http://localhost:5001/api/users/search?q=מנהל" \
  -H "Authorization: Bearer $TOKEN" | jq
echo ""

# Test 3: Create new user
echo "3. Creating new user..."
curl -X POST http://localhost:5001/api/users \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0509876543",
    "fullName": "משתמש חדש",
    "role": "EMPLOYEE",
    "level": "JUNIOR",
    "position": "SERVER"
  }' | jq
echo ""

echo "All tests completed!"