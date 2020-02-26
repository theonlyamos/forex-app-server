const UserModel = require('../database/models/user.model');
const TransferModel = require('../database/models/transfer.model');
const ActiveTokenModel = require('../database/models/active-token.model');
const PaymentModel = require('../database/models/payment.model');
const TransactionModel = require('../database/models/transaction.model');
const AuthService = require('../services/auth.service');
const moment = require('moment');
const { sequelize, Sequelize } = require('sequelize');
const Op = Sequelize.Op;

class UserController {
  /**
   * GetReferralList gets all referrall user by session user
   *
   * @param {object} req
   * @param {object} res
   * @returns {void}
   */
  static async getReferralList(req, res) {
    const {
      user: { id },
    } = req;

    // find all referrals by user session id
    const referralCollection = await UserModel.findAll({ where: { referrer_uid: id } });

    // transfor referral list
    const referralList = referralCollection.map(
      ({ id, email, username, referral_token }) => ({
        id,
        email,
        username,
        referral_token,
        share: 0,
      }),
    );
    // send respons data of transform referral list
    res.send(referralList);
  }

  /**
  * Process Transfer From A User Login To Another User
  * @param {object} req
  * @param {object} res
  * @return {void}
  */
  static async transferFunds(req, res) {
    // Init
    const { to_user_name, password, amount } = req.body;
    if(await AuthService.user(req)){
      var from_user = await AuthService.user(req); 
    }else{
      res.status(401).send({ 'error' : { 'token' : 'Token is expired!' } });
    }
    from_user.update({ 
      balance: (parseInt(await from_user.balance) - parseInt(amount)) 
    });

    // Find to user and update balance
    const to_user = await UserModel.findOne({ where: { username: to_user_name } });
    to_user.update({ 
      balance: (parseInt(await to_user.balance) + parseInt(amount)) 
    });

    let date = moment();
    TransferModel.create({
      from_user_id: from_user.id,
      to_user_id: to_user.id,
      amount,
      transfer_date: moment(date).format('YYYY-MM-DD HH:mm:ss'),
      action: 'Transfer',
    });
    res.send({ 'message' :  'Transfer success', 'data' : { 'to_user_id' : from_user.id, 'from_user_id' : to_user.id  } });
  }

  /**
  * Get Transfer History
  * @param {object} req
  * @param {object} res
  * @return {void}
  */
  static async transferHistory(req, res) {
    // Init
    const { type, username, from, to } = req.query;
    if(await AuthService.user(req)){
      var user = await AuthService.user(req);  
    }else{
      res.status(401).send({ 'error' : { 'token' : 'Token is expired!' } });
    }

    let transfer_history = [];
    if(type == 'Transfer'){
      if(username || from || to){
        let user_id = [];
        // Find user by query
        const users = username ? await UserModel.findAll({ where: { username: {[Op.like]: '%' +  username + '%'} } }) : [];
        for(let i in users){
          user_id.push(users[i].id);
        }
        const from_date = from ? moment(from + ' 00:01:00').toDate() : moment('1990-01-01 00:01:00').toDate();
        const to_date = to ? moment(to + ' 23:59:59').toDate() : moment().toDate();
        if(!username){
          transfer_history = await TransferModel.findAll(
            { where: { 
              action: type,
              transfer_date: {
                [Op.between]: [from_date, to_date],
              },
            },
            order: [['id', 'DESC']] },
          );
        }else{
          transfer_history = await TransferModel.findAll(
            { where: { 
              action: type,
              transfer_date: {
                [Op.between]: [from_date, to_date],
              },
              [Op.or]: [{ from_user_id: user_id }, { to_user_id: user_id }],
            },
            order: [['id', 'DESC']] },
          );
        }
      }
      else{
        // Find user login and get transfer history
        transfer_history = await TransferModel.findAll(
          { where: { 
            action: type, 
            [Op.or]: [{from_user_id: user.id}, {to_user_id: user.id}],
          }, 
          order: [['id', 'DESC']] },
        );
      }
      let total_sent = 0;
      let total_received = 0;
      if(transfer_history){
        for(let i in transfer_history){
          let transfer = transfer_history[i];
          if(transfer_history[i].from_user_id == user.id){
            let to_user = await UserModel.findOne({ where: { id: transfer_history[i].to_user_id } });
            let username = to_user ? to_user.username : '';
            var user_transfer = {name: username, 'status': 'send'};
            total_sent += parseInt(transfer_history[i].amount);
          }
          if(transfer_history[i].to_user_id == user.id){
            let from_user = await UserModel.findOne({ where: { id: transfer_history[i].from_user_id } });
            let username = from_user ? from_user.username : '';
            var user_transfer = {name: username, 'status': 'receive'};
            total_received += parseInt(transfer_history[i].amount);
          }
          transfer_history[i] = {transfer, user_transfer};
        }
      }
      const transfer = {
        total_sent,
        total_received,
      }
      const data = {transfer_history, transfer};
      res.send({ 'message' :  'Get transfer history success', 'data' : data });
    }else{
      res.send({ 'message' :  'Type not found', 'data' : transfer_history }); 
    }
  }

  /**
  * Get User Profile
  * @param {object} req
  * @param {object} res
  * @return {void}
  */
  static async getProfile(req, res) {
    const { type } = req.query;
    if(await AuthService.user(req)){
      var user = await AuthService.user(req);  
    }else{
      res.status(401).send({ 'error' : { 'token' : 'Token is expired!' } });
    }
    if(type && type == 'balance'){
      res.send({ 'message' :  'Get profile success', 'data' : { 'balance': user.balance, 'affiliate_balance' : user.affiliate_balance } });
    }
    else if (type && type == 'storage') {
      res.send({ 'message' :  'Get profile success', 'data' : { 'user_id' : user.id, 'user_type' : user.account_type } });
    }
    else{
      res.send({ 'message' :  'Get profile success', 'data' : user });  
    }
  }

  /**
  * Make transaction
  * @param {object} req
  * @param {object} res
  * @return {void}
  */
  static async makeTransactions(req, res){
    // Init
    const { type, payment_id, credit_number, credit_name, payment_address, country, amount, transaction_ID } = req.body;
    if(await AuthService.user(req)){
      var user = await AuthService.user(req);  
    }else{
      res.status(401).send({ 'error' : { 'token' : 'Token is expired!' } });
    }
    if(type == 'Withdraw'){
      // Find to user and update balance
      user.update(
        { balance: (parseInt(user.balance) - parseInt(amount)) }
      );
    }

    // Create new transaction for now
    var date = moment();
    TransactionModel.create({
      payment_id,
      user_id: user.id,
      transaction_date: moment(date).format('YYYY-MM-DD HH:mm:ss'),
      credit_number,
      credit_name,
      payment_address,
      country,
      type,
      amount,
      'status' : 'Pending',
      transaction_ID,
    });
    res.send({ 'message' : 'Make transaction success', 'data' : { 'user_id' : user.id } });
  }

  /**
  * Make transaction
  * @param {object} req
  * @param {object} res
  * @return {void}
  */
  static async transactionHistory(req, res){
    // Init
    if(await AuthService.user(req)){
      var user = await AuthService.user(req);
    }else{
      res.status(401).send({ 'error' : { 'token' : 'Token is expired!' } });
    }

    // Get transaction histories and total funds
    const transaction_histories = user.account_type != 'ADMIN' 
      ? await TransactionModel.findAll(
        { where: { user_id: user.id },
        order: [['id', 'DESC']] }
      )
      : await TransactionModel.findAll(
        { order: [['id', 'DESC']] }
      );

    let total_deposit = 0;
    let total_withdraw = 0;
    let total_affiliate = 0;
    for(let i in transaction_histories){
      let transaction = transaction_histories[i];
      let type = transaction.type;
      let status = transaction.status;
      if(type == 'Deposit' && status == 'Success'){      
        total_deposit += parseInt(transaction.amount);
      }
      if(type == 'Withdraw' && status == 'Success'){
        total_withdraw += parseInt(transaction.amount);
      }
      if(type == 'Affiliate' && status == 'Success'){
        total_affiliate += parseInt(transaction.amount);
      }

      // Get User Transfer Info
      let user_transfer = await UserModel.findOne({ where: { id: transaction.user_id } });
      let user_name = user_transfer ? user_transfer.username : '';
      user_transfer = {name: user_name, 'type': type};

      // Get Payment Info
      let payment = await PaymentModel.findOne({ where: { id: transaction.payment_id} });

      // Merge All Datas
      transaction_histories[i] = {transaction, user_transfer, payment};
    }
    const transactions = {
      total_deposit,
      total_withdraw,
      total_affiliate,
    }
    const data = {transaction_histories, transactions};
    res.send({ 'message' :  'Get transaction history success', 'data' : data });
  }

  /**
  * Process transaction by Admin
  * @param {object} req
  * @param {object} res
  * @return {void}
  */
  static async processTransaction(req, res){
    if(await AuthService.user(req)){
      var user = await AuthService.user(req);
    }else{
      res.status(401).send({ 'error' : { 'token' : 'Token is expired!' } });
    }
    const { transaction, status } = req.body;
    if(user.account_type != 'ADMIN'){
      res.status(403).send({ 'error' : 'You are not allowed to do this action!' });
    }else if(transaction.status != 'Pending'){
      res.status(403).send({ 'error' : 'The transaction don`t need this action!' });
    }else{
      const update_transaction = await TransactionModel.findOne({ where: { id: transaction.id } });
      update_transaction.update({ status: status });

      const user_transfer = await UserModel.findOne({ where: { id: transaction.user_id } });
      if((status == 'Success' && transaction.type == 'Deposit') || (status == 'Cancel' && transaction.type == 'Withdraw') || (status == 'Success' && transaction.type == 'Affiliate')){
        user_transfer.update({ balance: (parseInt(user_transfer.balance) + parseInt(transaction.amount)) });
      }
      if(status == 'Cancel' && transaction.type == 'Affiliate'){
        user_transfer.update({ affiliate_balance: (parseInt(user_transfer.affiliate_balance) + parseInt(transaction.amount)) });
      }
      res.send({ 'message' : 'Process request success!', 'data' : { 'user_id' : transaction.user_id } });
    }
  }

  /**
  * Get List Users
  * @param {object} req
  * @param {object} res
  * @return {void}
  */
  static async getListUsers(req, res){
    const users = await UserModel.findAll(
      { where: { account_type: 'USER' },
        order: [['id', 'DESC']] }
    );
    res.send({ 'message' : 'Get list users success', 'data' : users });
  }

  /**
  * Process User Status
  * @param {object} req
  * @param {object} res
  * @return {void}
  */
  static async processUser(req, res){
    // Init
    const { user_process, status } = req.body;
    if(await AuthService.user(req)){
      var user = await AuthService.user(req);
    }else{
      res.status(401).send({ 'error' : { 'token' : 'Token is expired!' } });
    }
    
    if(user.account_type != 'ADMIN'){
      res.status(403).send({ 'error' : 'You are not allowed to do this action!' });
    }else{
      const user_update = await UserModel.findOne({ where: { id: user_process.id } });
      user_update.update({ status: status });
      res.send({ 'message' : 'Process user success', 'data' : { user_id: user_process.id } });
    }
  }

  /**
  * Withdraw Affiliate Balance
  * @return {void} json
  */
  static async withdrawAffiliate(req, res){
    // Init
    const { amount, password, type } = req.body;
    if(await AuthService.user(req)){
      var user = await AuthService.user(req);
    }else{
      res.status(401).send({ 'error' : { 'token' : 'Token is expired!' } });
    }

    user.update(
      { affiliate_balance: (parseInt(user.affiliate_balance) - parseInt(amount)) }
    );
    // Create new transaction for now
    var date = moment();
    TransactionModel.create({
      user_id: user.id,
      transaction_date: moment(date).format('YYYY-MM-DD HH:mm:ss'),
      type,
      amount,
      status: 'Pending',
    });
    res.send({ 'message' : 'Make transaction success', 'data' : { 'user_id' : user.id } });
  }
}

module.exports = UserController;
