#!/bin/bash

# Fix all relation names to PascalCase in API routes
find app/api -name "*.ts" -type f -exec sed -i \
  -e 's/tasks:/Task:/g' \
  -e 's/payments:/Payment:/g' \
  -e 's/clientAccess:/ClientAccess:/g' \
  -e 's/taskRequests:/TaskRequest:/g' \
  -e 's/client:/Client:/g' \
  -e 's/assignedWriter:/assignedWriter:/g' \
  -e 's/user:/User:/g' \
  {} +

echo "Fixed relation names in API routes"
