const express = require('express');
const forexRouter = express.Router();
const ForexController = require('../controllers/forex.controller');

/**
 * Forex endpoint middleware list.
 */

/**
 * Forex endpoint list.
 */
forexRouter.get('/symbols', (req, res) => ForexController.getSymbols(req, res));

module.exports = forexRouter;
