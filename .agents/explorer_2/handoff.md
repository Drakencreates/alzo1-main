# Handoff Report: Vercel Deployment & Serverless Integration Audit

## 1. Observation

### vercel.json Inspection
- **Location**: `d:\ALZO\vercel.json` (lines 1-10)
- **Verbatim Content**:
```json
{
  "version": 2,
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/backend/server.js"
    }
  ]
}
```
- **Findings**:
  - `vercel.json` is syntactically valid JSON.
  - `rewrites` points `/api/(.*)` to `/backend/server.js`.
  - There is NO `/api` directory in `d:\ALZO` (only `backend/`, `caregiver/`, `doctor/`, `patient/`, static `.html` files).
  - No `cleanUrls`, static rewrites, or routes are configured for non-`/api` paths (`/`, `/login`, `/signup`, `/role`).

### Package Configuration (package.json)
- **Root `package.json` (`d:\ALZO\package.json`)**:
  - Main: `"backend/server.js"`
  - Scripts: `"start": "node backend/server.js"`, `"dev": "nodemon backend/server.js"`
  - Missing: `"build"` script, `"test"` script.
  - Dependencies (14): `bcryptjs`, `body-parser`, `cloudinary`, `cors`, `dotenv`, `express`, `express-validator`, `jsonwebtoken`, `mongoose`, `nanoid`, `nodemon`, `pusher`, `socket.io`, `uuid`.
- **Backend `package.json` (`d:\ALZO\backend\package.json`)**:
  - Main: `"server.js"`
  - Duplicate dependencies identical to root `package.json`.

### Serverless Export & Execution (backend/server.js)
- **Location**: `d:\ALZO\backend\server.js`
- **Verbatim Export (line 87-94)**:
```javascript
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
```
- **DB Connection Middleware (lines 18-39)**:
  - Caches connection using `mongoose.connection.readyState === 1`.
  - Catches connection errors internally without re-throwing, causing downstream API handlers to execute on broken connections.

### Environment Variable Audit
- **Referenced Variables**:
  - `MONGO_URI` (`backend/server.js:25`)
  - `JWT_SECRET` (`backend/routes/auth.js:23,68,105`)
  - `PORT` (`backend/server.js:88`)
  - `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER` (`backend/config/pusher.js:6-9`)
  - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (`backend/routes/auth.js:1231-1233`)
- **Findings**:
  - `.env.example` lists all 10 environment variables.
  - `backend/.env` line 1 contains placeholder password: `MONGO_URI=mongodb+srv://ALZO:<fuck_you>@alzo.vrww7xl.mongodb.net/?appName=ALZO`.

---

## 2. Logic Chain

1. **Vercel Serverless Function Resolution Failure**:
   - Vercel's zero-config deployment engine auto-detects Node.js serverless functions located inside an `/api` directory (e.g., `/api/index.js` or `/api/server.js`).
   - Because `backend/server.js` resides in `backend/` and not `/api/`, and `vercel.json` lacks explicit `functions` or `@vercel/node` builder definitions, Vercel treats `backend/server.js` as a static file rather than an executable serverless function.
   - Consequently, requests matching `/api/(.*)` rewritten to `/backend/server.js` will serve raw JS source code to the client instead of executing the Express app.

2. **Frontend Routing & Static Page 404s**:
   - The landing page is `land1.html` in the root directory.
   - Standard navigation links in `login.html`, `signup.html`, `role.html`, and `land1.html` point to `/`, `/login`, `/signup`, `/role`.
   - Without `cleanUrls: true` or explicit static rewrites in `vercel.json` (such as rewriting `/` to `/land1.html`), visiting `https://<app>.vercel.app/` or `https://<app>.vercel.app/login` returns a **Vercel 404 Not Found** error.

3. **Missing Build Scripts & Dual Package Overhead**:
   - Vercel build process checks `package.json` for a `"build"` script. Root `package.json` lacks `"build"`.
   - Maintaining duplicate `package.json` files in root and `backend/` creates dependency version drift risk and dual `node_modules` overhead.

4. **Serverless MongoDB Resilience**:
   - In `backend/server.js`, `connectDB()` logs errors on failed connections but allows request processing (`next()`) to proceed, leading to unhandled Mongoose query failures when `MONGO_URI` is unconfigured or invalid.

---

## 3. Caveats

- Runtime execution of Vercel build was verified through static configuration audit and standard Vercel platform specifications; live Vercel deployment CLI commands were not executed due to read-only explorer mandate and network restrictions.
- No other caveats.

---

## 4. Conclusion

The Vercel deployment setup currently requires remediation across 4 critical areas:
1. **Create `/api/index.js` serverless entrypoint**:
   Add `api/index.js` that imports and exports `backend/server.js` (`const app = require('../backend/server'); module.exports = app;`).
2. **Update `vercel.json`**:
   Set `"cleanUrls": true` and configure rewrites for `/` -> `/land1.html` and `/api/(.*)` -> `/api/index.js`.
3. **Root `package.json` Scripts**:
   Add `"build": "echo 'No build step required'"` and `"test"` script to root `package.json`.
4. **Environment Variables**:
   Ensure all 9 non-PORT environment variables (`MONGO_URI`, `JWT_SECRET`, `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) are declared in Vercel project environment configuration with valid values.

---

## 5. Verification Method

To verify the audit findings and future fix:
1. **JSON Syntax Verification**:
   - Run: `node -e "JSON.parse(require('fs').readFileSync('vercel.json'))"`
   - Run: `node -e "JSON.parse(require('fs').readFileSync('package.json'))"`
2. **Backend Entrypoint Execution**:
   - Run: `node -e "const app = require('./backend/server'); console.log(typeof app);"` (Expected output: `'function'`).
3. **Vercel Route Resolution Check**:
   - Inspect `vercel.json` to confirm `/` resolves to `/land1.html`, `/api/(.*)` resolves to `/api/index.js` or `/api/server.js`, and `cleanUrls: true` is enabled.
