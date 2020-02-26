const passport = require('passport');
const Middleware = require('./middleware');
const FieldsMiddleware = require('./fields.middleware');
const UserModel = require('../database/models/user.model');
const ActiveTokenModel = require('../database/models/active-token.model');
const AuthService = require('../services/auth.service');
const bcrypt = require('bcryptjs');
const validator = require('validator');

/**
 * This middleware validates authenticate user by JWT header.
 */
exports.accessToken = passport.authenticate('jwt', { session: false });

class TransferMiddleware extends Middleware {
  /**
  * Middleware Validate Request Transfer
  */
  static async transferFunds(req, res, next) {
    // Init
    const { to_user_name, password, amount } = req.body;
    const errors = {};

    // Check some field required req data
    const required = FieldsMiddleware.checkRequired({ to_user_name, password, amount }, [
      'to_user_name',
      'password',
      'amount',
    ]);
    if (required) {
      return this.sendRequestError(required, res);
    }

    // Find from user and validate its data
    if(await AuthService.user(req)){
      var from_user = await AuthService.user(req);
    }else{
      res.status(401).send({ 'error' : { 'token' : 'Token is expired!' } });
    }

    if (from_user && !(await bcrypt.compare(password, from_user.password))) {
      errors.password = this.buildError(errors, 'password', 'Passwords did not match!');
    }

    // Find to user and validate its data
    const to_user = await UserModel.findOne({ where: { username: to_user_name } });
    if(!to_user){
      errors.to_user_name = this.buildError(errors, 'to_user_name', 'Username transfer is not exists!');
    }
    if(to_user.id == from_user.id){
      errors.to_user_name = this.buildError(errors, 'to_user_name', 'You can not transfer to yourself!');
    }

    // Validate balance amount
    if(from_user && from_user.balance < amount){
      errors.amount = this.buildError(errors, 'amount', 'Not enough balance to make transfer!');
    }
    if(isNaN(amount)){
      errors.amount = this.buildError(errors, 'amount', 'Amount must be a number!');
    }
    if(amount <= 0){
      errors.amount = this.buildError(errors, 'amount', 'Amount must be larger than 0!');
    }

    if (this.isError(errors)) {
      return this.sendRequestError(errors, res);
    }

    next();
  }

  /**
  * Middleware Validate Make Transaction
  */
  static async makeTransactions(req, res, next) {
    // Init
    const { type, payment_id, credit_number, credit_name, payment_address, country, amount, password, transaction_ID } = req.body;
    const errors = {};

    // Check some field required req data
    const required = FieldsMiddleware.checkRequired({ type, payment_id, credit_number, credit_name, amount, password, transaction_ID }, [
      'type',
      'payment_id',
      'credit_number',
      'credit_name',
      'amount',
      'password',
      'transaction_ID',
    ]);
    if (required) {
      return this.sendRequestError(required, res);
    }

    // Check user login and validate its data
    if(await AuthService.user(req)){
      var user = await AuthService.user(req);
    }else{
      res.status(401).send({ 'error' : { 'token' : 'Token is expired!' } });
    }

    if (user && !(await bcrypt.compare(password, user.password))) {
      errors.password = this.buildError(errors, 'password', 'Passwords did not match!');
    }

    // Validate balance amount
    if(user && user.balance < amount){
      errors.amount = this.buildError(errors, 'amount', 'Not enough balance to make transaction!');
    }
    if(isNaN(amount)){
      errors.amount = this.buildError(errors, 'amount', 'Amount must be a number!');
    }
    if(amount <= 0){
      errors.amount = this.buildError(errors, 'amount', 'Amount must be larger than 0!');
    }

    // Validate credit info
    if(isNaN(credit_number)){
      errors.amount = this.buildError(errors, 'credit_number', 'Credit number must be a number!');
    }

    if (this.isError(errors)) {
      return this.sendRequestError(errors, res);
    }

    next();
  }

  /**
  * Validate withdraw affiliate balance
  */
  static async withdrawAffiliate(req, res, next){
    // Init
    const { amount, password } = req.body;
    const errors = {};

    // Check some field required req data
    const required = FieldsMiddleware.checkRequired({ amount, password }, [
      'amount',
      'password',
    ]);
    if (required) {
      return this.sendRequestError(required, res);
    }

    // Check user login and validate its data
    if(await AuthService.user(req)){
      var user = await AuthService.user(req);
    }else{
      res.status(401).send({ 'error' : { 'token' : 'Token is expired!' } });
    }

    if (user && !(await bcrypt.compare(password, user.password))) {
      errors.password = this.buildError(errors, 'password', 'Passwords did not match!');
    }

    // Validate balance amount
    if(user && user.affiliate_balance < amount){
      errors.amount = this.buildError(errors, 'amount', 'Not enough Affiliate balance to make transaction!');
    }
    if(isNaN(amount)){
      errors.amount = this.buildError(errors, 'amount', 'Amount must be a number!');
    }
    if(amount <= 0){
      errors.amount = this.buildError(errors, 'amount', 'Amount must be larger than 0!');
    }

    if (this.isError(errors)) {
      return this.sendRequestError(errors, res);
    }
    next();
  }
}

exports.TransferMiddleware = TransferMiddleware;
