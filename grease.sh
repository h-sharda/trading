#!/usr/bin/env bash
set -euo pipefail

git pull

npx prisma generate
npx prisma migrate deploy

npm run build
npm start
