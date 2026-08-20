#!/usr/bin/env bash
set -euo pipefail

git pull
npm run build
npm start
