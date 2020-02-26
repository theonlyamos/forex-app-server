const UserModel = require('../database/models/user.model');
const ActiveTokenModel = require('../database/models/active-token.model');
const PaymentModel = require('../database/models/payment.model');
const AuthService = require('../services/auth.service');
const { sequelize, Sequelize } = require('sequelize');
const Op = Sequelize.Op;

class PaymentController {
  /**
  * Get Payments List
  * @param {object} req
  * @param {object} res
  * @return {void}
  */
  static async getPaymentsList(req, res){
    const payments = await PaymentModel.findAll({ where: {status: 'Active'}, order: [['id', 'DESC']] });
    res.send({ 'message' : 'Get payments success', 'data' : payments });
  }

  /**
  * Create New Payment Method
  * @param {object} req
  * @param {object} res
  * @return {void}
  */
  static async createPayment(req, res){
    // Init
    const { payment_method, account_name, account_address, country } = req.body;
    const user = await AuthService.user(req);
    if(user.account_type != 'ADMIN'){
      res.status(403).send({ 'error' : 'You are not allowed to do this action!' });
    }else{
      PaymentModel.create({
        title: payment_method,
        account_name, 
        account_address, 
        country,
        status: 'Active',
      });
      res.send({ 'message' : 'Create new payment method success!' });
    }
  }
}

module.exports = PaymentController;
