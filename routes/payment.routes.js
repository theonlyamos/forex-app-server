const express = require('express');
const paymentRouter = express.Router();
const PaymentController = require('../controllers/payment.controller');
const { PaymentMiddleware } = require('../middlewares/payment.middleware');

/**
 * Payment endpoint middleware list.
 */
paymentRouter.post('/create', (req, res, next) => PaymentMiddleware.createPayment(req, res, next));

/**
 * Payment endpoint list.
 */
paymentRouter.get('/', (req, res) => PaymentController.getPaymentsList(req, res));
paymentRouter.post('/create', (req, res) => PaymentController.createPayment(req, res));

module.exports = paymentRouter;
