const express = require('express');
const authRouter = express.Router();
const AuthController = require('../controllers/auth.controller');
const { AuthMiddleware } = require('../middlewares/auth.middleware');

/**
 * Auth endpoint middleware list.
 */
authRouter.post('/login', (req, res, next) => AuthMiddleware.login(req, res, next));
authRouter.post('/register', (req, res, next) => AuthMiddleware.register(req, res, next));
authRouter.post('/forgot-pass', (req, res, next) => AuthMiddleware.forgotPassword(req, res, next));

/**
 * Auth endpoint list.
 */
authRouter.post('/login', (req, res) => AuthController.login(req, res));
authRouter.post('/register', (req, res) => AuthController.register(req, res));
authRouter.post('/confirm-register', (req, res) => AuthController.confirmRegister(req, res));
authRouter.post('/forgot-pass', (req, res) => AuthController.forgotPassword(req, res));

module.exports = authRouter;
