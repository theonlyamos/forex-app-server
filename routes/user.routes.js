const express = require('express');
const userRouter = express.Router();
const UserController = require('../controllers/user.controller');
const { TransferMiddleware } = require('../middlewares/transfer.middleware');

/**
 * User endpoint middleware list.
 */
userRouter.post('/transfer', (req, res, next) => TransferMiddleware.transferFunds(req, res, next));
userRouter.post('/transactions', (req, res, next) => TransferMiddleware.makeTransactions(req, res, next));
userRouter.post('/withdraw-affiliate', (req, res, next) => TransferMiddleware.withdrawAffiliate(req, res, next));

/**
 * User endpoint list.
 */
userRouter.get('/referrals', (req, res) =>
  UserController.getReferralList(req, res),
);
userRouter.get('/profile', (req, res) => UserController.getProfile(req, res));
userRouter.post('/transfer', (req, res) => UserController.transferFunds(req, res));
userRouter.get('/transfer-history', (req, res) => UserController.transferHistory(req, res));
userRouter.post('/transactions', (req, res) => UserController.makeTransactions(req, res));
userRouter.get('/transaction-history', (req, res) => UserController.transactionHistory(req, res));
userRouter.post('/process-transaction', (req, res) => UserController.processTransaction(req, res));
userRouter.get('/list-users', (req, res) => UserController.getListUsers(req, res));
userRouter.post('/process-user', (req, res) => UserController.processUser(req, res));
userRouter.post('/withdraw-affiliate', (req, res) => UserController.withdrawAffiliate(req, res));

module.exports = userRouter;
