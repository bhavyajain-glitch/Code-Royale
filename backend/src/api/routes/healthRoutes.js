// This file defines the routes for health checks.
const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

// Route: GET /api/health
// Desc:  Checks the health of the server
router.get('/health', healthController.checkHealth);

module.exports = router;