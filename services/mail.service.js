const nodemailer =  require('nodemailer');
const SettingController = require('../controllers/setting.controller');

/**
* Mail smtp setting
*/
class MailService {

  /**
  * Send Mail function
  * @return send mail
  */
  static async sendMail(msg, template){
    const config = {
      host: await SettingController.getSettingValueByKey('mail_host'),
      port: await SettingController.getSettingValueByKey('mail_port'),
      auth: {
        user: await SettingController.getSettingValueByKey('mail_username'),
        pass: await SettingController.getSettingValueByKey('mail_password'),
      },
    };
    try{
      const transporter = nodemailer.createTransport(config);

      const mailOptions = {
        from: config.auth.user,
        to: msg.reciver,
        subject: msg.subject,
        text: 'You recieved message from ' + config.auth.user,
        html: await this.mailTemplate(template),
      }
      transporter.sendMail(mailOptions);
    }catch(err){

    }
  }

  /**
  * Get MailTemplate by type
  * @params {string} template
  * @return {string} mail_template
  */
  static async mailTemplate(template){
    let mail_template = '';
    if(template.type == 'register'){
      mail_template = `
      <h1>Hello `+ template.data.username +`! </h1>
      <p>You have been registered success from our website.</p>
      <p>Please click <a style="color: red;" href="`+ template.data.url +`/confirm-register/`+ template.data.mail_token +`">HERE</a> to confirm your registration!</p>
      `
    }
    if(template.type == 'forgot password'){
      mail_template = `
      <h1>Hello `+ template.data.username +`! </h1>
      <p>You have requested new password from our website.</p>
      <p>Please click <a style="color: red;" href="`+ template.data.url +`/forgot-pass/`+ template.data.forgot_token +`">HERE</a> to confirm!</p>
      `
    }
    return mail_template;
  }
}

module.exports = MailService;
