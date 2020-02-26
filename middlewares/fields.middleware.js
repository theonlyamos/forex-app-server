const Middleware = require('./middleware');
const validator = require('validator');

/**
 * @module FieldsMiddleware
 * @requires module:Middleware
 */
/**
 * @class
 * @classdesc FieldsMiddleware class describes methods to check fields
 * @hideconstructor
 * @extends module:Middleware
 */
class FieldsMiddleware extends Middleware {
  /**
   * @summary Messages getter method
   * @static
   * @return {object} Returns error messages
   */
  static get messages() {
    return {
      required: 'field is required!',
      types: {
        string: 'field must be string!',
        array: 'field must be array!',
        number: 'field must be number!',
        boolean: 'field must be boolean!',
        email: 'Invalid email address!',
      },
    };
  }
  /**
   * @summary CheckRequired method checks required field.
   * @static
   * @param {object} data Object to check
   * @param {string[] | null} fields Field list for the check fields of request
   * @return {object | void} If all fields of the data was passed returned void or object with error messages.
   */
  static checkRequired(data, fields = []) {
    let errors = {};

    fields.forEach(field => {
      const { [field]: item } = data;
      if (!item) {
        errors[field] = this.buildError(
          errors,
          field,
          `This ${this.messages.required}`
        );
      }
    });

    if (this.isError(errors)) {
      return errors;
    }
  }

  /**
   * @summary CheckType method check type of the fields
   * @static
   * @param {object} data Object to check
   * @param {string} type
   * @param {string[] | null} fields Field list for the check fields of request
   * @since soon
   */
  static checkType(data, type, fields = []) {
    let errors = {};

    fields.forEach(field => {
      const { [field]: item } = data;
      if (type === 'email') {
        return (
          !validator.isEmail(item) &&
          (errors[field] = this.buildError(
            errors,
            field,
            `${field} ${this.messages[type]}`
          ))
        );
      }
      typeof item !== type &&
        (errors[field] = this.buildError(
          errors,
          field,
          `${field} ${this.messages[type]}`
        ));
    });

    if (this.isError(errors)) {
      return errors;
    }
  }
}

module.exports = FieldsMiddleware;
