const passport = require('passport');
const Middleware = require('./middleware');
const FieldsMiddleware = require('./fields.middleware');
const validator = require('validator');

/**
 * This middleware validates authenticate user by JWT header.
 */
exports.accessToken = passport.authenticate('jwt', { session: false });

class SettingMiddleware extends Middleware {
  /**
  * Middleware Validate Request Transfer
  */
  static async updateSetting(req, res, next) {
  const { type } = req.query;
  if(type == 'mail'){
    const { mail_host, mail_port, mail_username, mail_password } = req.body;
    const errors = {};
    const required = FieldsMiddleware.checkRequired({ mail_host, mail_port, mail_username, mail_password }, [
      'mail_host',
      'mail_port',
      'mail_username',
      'mail_password',
    ]);

    if (required) {
      return this.sendRequestError(required, res);
    }
  }
  next();
  }
}

exports.SettingMiddleware = SettingMiddleware;
