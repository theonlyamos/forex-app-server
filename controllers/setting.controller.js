const UserModel = require('../database/models/user.model');
const ActiveTokenModel = require('../database/models/active-token.model');
const SettingModel = require('../database/models/setting.model');
const AuthService = require('../services/auth.service');
const { sequelize, Sequelize } = require('sequelize');
const Op = Sequelize.Op;

class SettingController {
  /**
  * Get Setting Data By Type
  * @param {object} req
  * @param {object} res
  * @return {void}
  */
  static async getSetting(req, res){
    const { type } = req.query;
    const user = await AuthService.user(req);
    if(user.account_type != 'ADMIN'){
      return res.status(403).send({ 'error' : 'You are not allowed to view this!' });
    }
    let data = {};
    if(type == 'mail'){
      data.mail_host = await this.getSettingValueByKey('mail_host');
      data.mail_port = await this.getSettingValueByKey('mail_port');
      data.mail_username = await this.getSettingValueByKey('mail_username');
      data.mail_password = await this.getSettingValueByKey('mail_password');
      res.send({'message' : 'Get Mail Smtp setting success', data});
    }else{
      res.send({'message' : 'Setting type is not found'});  
    }
  }

  /**
  * Update Mail Smtp Setting
  * @param {object} req
  * @param {object} res
  * @return {void}
  */
  static async updateSetting(req, res){
    const { type } = req.query;
    const user = await AuthService.user(req);
    if(user.account_type != 'ADMIN'){
      res.status(403).send({ 'error' : 'You are not allowed to do this action!' });
    }
    if(type == 'mail'){
      const { mail_host, mail_port, mail_username, mail_password } = req.body;
      await this.updateSettingByKey('mail_host', mail_host);
      await this.updateSettingByKey('mail_port', mail_port);
      await this.updateSettingByKey('mail_username', mail_username);
      await this.updateSettingByKey('mail_password', mail_password);
      res.send({'message' : 'Update Mail Smtp setting success'});
    }else{
      res.send({'message' : 'Setting type is not found'}); 
    }
  }

  /**
  * Get Setting Value By Key
  * @return setting value
  */
  static async getSettingValueByKey(key){
    const setting = await SettingModel.findOne({ where: {key: key} });
    if(setting){
      return setting.value;
    }
    return '';
  }

  /**
  * Update Setting Value By Key
  * @param {string} value
  * @return create or edit
  */
  static async updateSettingByKey(key , value){
    const setting = await SettingModel.findOne({ where: {key: key} });
    if(setting){
      setting.update({ 
        value: value 
      });
    }else{
      SettingModel.create({
        key: key, 
        value: value,
      });
    }
    return true;
  }
}

module.exports = SettingController;
