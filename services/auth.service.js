const UserModel = require('../database/models/user.model');
const ActiveTokenModel = require('../database/models/active-token.model');

class AuthService {

  /**
  * Get current user login
  */
  static async user(req){
    // Init
    let token = req.headers.authorization;
    token = token.split('Bearer ')[1];

    const token_data = await ActiveTokenModel.findOne({ where: { token: token } });
    if(!token_data){
      return false;
    }
    const user = await UserModel.findById(token_data.user_id);
    return user;
  }
}

module.exports = AuthService;
