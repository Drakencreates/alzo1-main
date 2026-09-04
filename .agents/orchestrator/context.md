# Context — Alzo Orchestrator

## Overview
Alzo application project health check, bug fixing, and Vercel serverless deployment verification.

## Target Paths
- Project Root: `d:\ALZO`
- Backend: `d:\ALZO\backend`
- Server Entry: `d:\ALZO\backend\server.js`
- Deployment Configs: `d:\ALZO\vercel.json`, `d:\ALZO\package.json`
- State Folder: `d:\ALZO\.agents\orchestrator`

## Key Requirements & Acceptance Criteria
1. Node backend route/dependency load test: `node -e "require('./backend/server.js')"`
2. Structural validation of `package.json` and `vercel.json` rewrites
3. Frontend static HTML endpoints and Pusher setup audit
