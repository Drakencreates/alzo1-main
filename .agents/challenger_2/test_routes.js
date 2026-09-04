const express = require('express');
const authRouter = require('../../backend/routes/auth');
const serverApp = require('../../backend/server');

console.log('--- Express Route Inspection ---');

// Extract routes from authRouter
const authRoutes = [];
authRouter.stack.forEach(layer => {
  if (layer.route) {
    const path = layer.route.path;
    const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
    authRoutes.push({ path: `/api/auth${path}`, methods });
  }
});

console.log(`Total auth routes defined: ${authRoutes.length}`);
authRoutes.forEach(r => console.log(`  ${r.methods.join(', ')} -> ${r.path}`));

// Check frontend fetch targets from the 3 specified files
const expectedTargets = [
  { file: 'patient/games/tests.html', method: 'GET', path: '/api/auth/me' },
  { file: 'patient/games/tests.html', method: 'POST', path: '/api/auth/patient/sos' },
  { file: 'patient/games/tests.html', method: 'POST', path: '/api/auth/patient/games' },
  { file: 'role.html', method: 'GET', path: '/api/auth/me' },
  { file: 'role.html', method: 'POST', path: '/api/auth/select-role' },
  { file: 'patient/game-records.html', method: 'GET', path: '/api/auth/me' }
];

console.log('\n--- Frontend API Alignment Verification ---');
let allMatched = true;
expectedTargets.forEach(target => {
  const match = authRoutes.find(r => r.path === target.path && r.methods.includes(target.method));
  if (match) {
    console.log(`[PASS] ${target.file}: ${target.method} ${target.path} -> Matched`);
  } else {
    console.log(`[FAIL] ${target.file}: ${target.method} ${target.path} -> NOT FOUND`);
    allMatched = false;
  }
});

if (allMatched) {
  console.log('\nALL Frontend fetch targets match backend routes!');
} else {
  console.error('\nMismatch detected!');
  process.exit(1);
}
