const UserModel = require('../database/models/user.model');
const JWTService = require('../services/jwt.service');
const ActiveTokenModel = require('../database/models/active-token.model');
const bcrypt = require('bcryptjs');
const SocketService = require('../modules/socket/socket-server');
const MailService = require('../services/mail.service');

class AuthController {
  static async login(req, res) {

    try {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ where: { email } });
    const token = JWTService.generateTokenByUser(user);

    const activeToken = await user.getActiveToken();

    (activeToken && (await activeToken.update({ token }))) ||
      (await ActiveTokenModel.create({ token, user_id: user.id }));

    // !SocketService.isInitialed && (SocketService.init() || SocketService.run());

    res.send({ token });
  }catch(e){
    console.log(e)
    res.send(e).status(203);
  }

}

  static async register(req, res) {
    const { email, password, username, referrer_uid, url } = req.body;
    const { USER_PASSWORD_SALT_ROUNDS: saltRounds = 10 } = process.env;
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';
    let referralToken = '';

    for (let i = 0; i < 12; i++) {
      let random = (Math.random() * (charset.length - 1 - 0) + 0) | 0;

      referralToken += charset[random];
    }

    let referralId = 0;

    if (referrer_uid) {
      ({ id: referralId } = (await UserModel.findOne({ where: { referral_token: referrer_uid  } })) || {});
    }

    const passwordHash = await bcrypt.hash(password, +saltRounds);

    let mail_token = '';
    for (let i = 0; i < 15; i++) {
      let random = (Math.random() * (charset.length - 1 - 0) + 0) | 0;

      mail_token += charset[random];
    }
    const user = await UserModel.create({
      email,
      password: passwordHash,
      username,
      referrer_uid: referralId,
      referral_token: referralToken,
      status: 'Inactive',
      mail_token: mail_token,
    });
    const token = JWTService.generateTokenByUser(user);
    const msg = {
      reciver: email,
      subject: 'Confirm registration!',
    }
    const template = {
      data: {
        username,
        url,
        mail_token,
      },
      type: 'register',
    }
    await MailService.sendMail(msg, template);

    await ActiveTokenModel.create({token, user_id: user.id });

    // !SocketService.isInitialed && (SocketService.init() || SocketService.run());

    res.send({ 'message' : 'Register success please check your mail to confirm' });
  }

  /**
  * Confirm User Registration after they click link in mail
  * @param: token
  * @return: {void} json
  */
  static async confirmRegister(req, res){
    const { mail_token } = req.body;
    const user = await UserModel.findOne({ where: { mail_token: mail_token } });
    if(!user || (user && user.status == 'Active') || !mail_token){
      res.status(403).send({ 'message' : "You have been already confirmed! Login to continue." });
    }else{
      const token = JWTService.generateTokenByUser(user);

      const activeToken = await user.getActiveToken();

      (activeToken && (await activeToken.update({ token }))) ||
        (await ActiveTokenModel.create({ token, user_id: user.id }));

      user.update({ 
        status: 'Active',
        mail_token: null,
      });

      res.send({ 'message' : 'Confirm registration success! Stand by, account is login', 'token' : token });
    }
  }

  /**
  * Request forgot password or confirm action
  * @return: {voide} json
  */
  static async forgotPassword(req, res){
    // Init
    const { email, url, password, token } = req.body;
    const { USER_PASSWORD_SALT_ROUNDS: saltRounds = 10 } = process.env;

    if(!token){
      const user = await UserModel.findOne({ where: { email: email } });
      const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_';
      let forgot_token = '';
      for (let i = 0; i < 15; i++) {
        let random = (Math.random() * (charset.length - 1 - 0) + 0) | 0;

        forgot_token += charset[random];
      }
      user.update({
        forgot_token: forgot_token
      });
      const msg = {
        reciver: email,
        subject: 'Reset password!',
      }
      const template = {
        data: {
          username: user.username,
          url,
          forgot_token,
        },
        type: 'forgot password',
      }
      await MailService.sendMail(msg, template);
      res.send({'message' : 'Request success! Please check email to confirm'});
    }else{
      const user = await UserModel.findOne({ where: { forgot_token: token } });
      if(!user){
        return res.status(404).send({ 'message': 'This url is not found or expired' })
      }
      if(!password){
        return res.send({ 'message' : 'Confirm reset password' });
      }else{
        const passwordHash = await bcrypt.hash(password, +saltRounds);
        user.update({
          password: passwordHash,
          forgot_token: null,
        });
        return res.send({ 'message' : 'Change password success' });
      }
    }
  }
}

module.exports = AuthController;
