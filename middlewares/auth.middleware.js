const passport = require('passport');
const Middleware = require('./middleware');
const FieldsMiddleware = require('./fields.middleware');
const UserModel = require('../database/models/user.model');
const bcrypt = require('bcryptjs');
const validator = require('validator');

/**
 * This middleware validates authenticate user by JWT header.
 */
exports.accessToken = passport.authenticate('jwt', { session: false });

class AuthMiddleware extends Middleware {
  static async login(req, res, next) {
    const { email, password } = req.body;
    const errors = {};
    const required = FieldsMiddleware.checkRequired({ email, password }, [
      'email',
      'password',
    ]);

    if (required) {
      return this.sendRequestError(required, res);
    }

    if (!validator.isEmail(email)) {
      errors.email = this.buildError(errors, 'email', 'Invalid email format!');
    }else{
      const user = await UserModel.findOne({ where: { email } });
      if(user && user.status == 'Banned'){
        return res.status(403).send({ 'message' : "Can't login. Your account is banned!" });
      }

      if(user && user.status == 'Inactive'){
        return res.status(403).send({ 'message' : "Can't login. You didn't confirm mail registration yet!" })
      }

      if (!user) {
        errors.email = this.buildError(errors, 'email', 'Email does not exist!');
      }

      if (user && !(await bcrypt.compare(password, user.password))) {
        errors.password = this.buildError(errors, 'password', 'Passwords did not match!');
      }
    }

    if (this.isError(errors)) {
      return this.sendRequestError(errors, res);
    }

    next();
  }

  static async register(req, res, next) {
    const { email, password = '', username, 'password-c': confirmPassword } = req.body;
    const errors = {};
    const required = FieldsMiddleware.checkRequired(
      { email, password, username, 'password-c': confirmPassword },
      ['email', 'password', 'username', 'password-c']
    );

    if (required) {
      return this.sendRequestError(required, res);
    }

    if (!validator.isEmail(email)) {
      errors.email = this.buildError(errors, 'email', 'Invalid email format!');
    }else{
      const userByEmail = await UserModel.findOne({ where: { email } });
      const userByUsername = await UserModel.findOne({ where: { username } });

      if (userByEmail) {
        errors.email = this.buildError(errors, 'email', 'Email existed!');
      }

      if (userByUsername) {
        errors.username = this.buildError(errors, 'username', 'Username existed!');
      }
    }

    if (password !== confirmPassword) {
      errors.password = this.buildError(
        errors,
        'password',
        "Password and Re-Type Password don't match!"
      );
    }

    if (!validator.isLength(password, { min: 6 })) {
      errors.password = this.buildError(
        errors,
        'password',
        'Invalid password length. Min value must have 6 letter!'
      );
    }

    if (this.isError(errors)) {
      return this.sendRequestError(errors, res);
    }

    next();
  }

  /**
  * Validate forgot password request
  */
  static async forgotPassword(req, res, next){
    const { email, url, password, c_password, token } = req.body;
    const errors = {};

    if(!token){
      const required = FieldsMiddleware.checkRequired({ email }, [
        'email',
      ]);

      if (required) {
        return this.sendRequestError(required, res);
      }

      if (!validator.isEmail(email)) {
        errors.email = this.buildError(errors, 'email', 'Invalid email format!');
      }else{
        const user = await UserModel.findOne({ where: { email: email } });
        if (!user) {
          errors.email = this.buildError(errors, 'email', 'Email does not exist!');
        }
      }      
    }
    if(password){
      const required = FieldsMiddleware.checkRequired({ password, c_password }, [
        'password',
        'c_password',
      ]);

      if (required) {
        return this.sendRequestError(required, res);
      }

      if (password !== c_password) {
        errors.password = this.buildError(
          errors,
          'password',
          "Password and Re-Type Password don't match!"
        );
      }

      if (!validator.isLength(password, { min: 6 })) {
        errors.password = this.buildError(
          errors,
          'password',
          'Invalid password length. Min value must have 6 letter!'
        );
      }
    }

    if (this.isError(errors)) {
      return this.sendRequestError(errors, res);
    }
    next();
  }
}

exports.AuthMiddleware = AuthMiddleware;
