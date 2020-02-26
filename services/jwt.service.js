const jwt = require('jsonwebtoken');
const passportJWT = require('passport-jwt');
const UserModel = require('../database/models/user.model');

const ExtractJwt = passportJWT.ExtractJwt;
const JwtStrategy = passportJWT.Strategy;

/**
 * Initial jwt auth by header.
 */
const jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();

require('dotenv').config();

const { JWT_SECRET: secretOrKey } = process.env;

/**
 * This service describes jwt strategy.
 */
class JWTService {
  /**
   * This method generates access token by user model.
   *
   * @param {object} userModel
   */
  static generateTokenByUser(userModel) {
    if (!userModel) {
      return false;
    }

    const { account_type, id, referral_token, referrer_uid, email, username, balance, affiliate_balance } = userModel;

    return jwt.sign(
      { account_type, id, referral_token, referrer_uid, username, email, balance, affiliate_balance },
      secretOrKey,
    );
  }

  /**
   * This method returns jwr strategy.
   * Jwt strategy uses Authorization header.
   *
   * @example {header} Authorization: JWT access token.
   */
  static get JWTStrategy() {
    return new JwtStrategy(
      { jwtFromRequest, secretOrKey, passReqToCallback: true },
      async (req, jwtPayload, next) => {
        const { id } = jwtPayload;

        try {
          const userModel = await UserModel.findOne({ where: { id } });

          next(null, userModel || false);
        } catch (e) {
          next(null, false);
        }
      },
    );
  }
}

module.exports = JWTService;
