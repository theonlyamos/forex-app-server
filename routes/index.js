const router = require('express').Router();
const authRoutes = require('./auth.routes');
const userRouter = require('./user.routes');
const forexRouter = require('./forex.routes');
const paymentRouter = require('./payment.routes');
const settingRouter = require('./setting.routes');
const { accessToken } = require('../middlewares/auth.middleware');

/**
 * Registers of the api routes.
 * @module routes
 */

router.use('/auth', authRoutes);
router.use('/me', accessToken, userRouter);
router.use('/forex', accessToken, forexRouter);
router.use('/payments', accessToken, paymentRouter);
router.use('/settings', accessToken, settingRouter);

module.exports = router;
