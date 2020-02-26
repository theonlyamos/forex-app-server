const passport = require('passport');
const Middleware = require('./middleware');
const FieldsMiddleware = require('./fields.middleware');
const PaymentModel = require('../database/models/payment.model');
const validator = require('validator');

/**
 * This middleware validates authenticate user by JWT header.
 */
exports.accessToken = passport.authenticate('jwt', { session: false });

class PaymentMiddleware extends Middleware {
  /**
  * Middleware Validate Request Transfer
  */
  static async createPayment(req, res, next) {
    const { payment_method, account_address, account_name } = req.body;
    const errors = {};
    const required = FieldsMiddleware.checkRequired({ payment_method, account_address, account_name }, [
      'payment_method',
      'account_address',
      'account_name',
    ]);

    if (required) {
      return this.sendRequestError(required, res);
    }

    // Check payment method existed
    const payment = await PaymentModel.findOne({ where: {title: payment_method} });
    if(payment){
      errors.payment_method = this.buildError(errors, 'payment_method', 'This payment method already existed!');
    }
    next();
  }
}

exports.PaymentMiddleware = PaymentMiddleware;
