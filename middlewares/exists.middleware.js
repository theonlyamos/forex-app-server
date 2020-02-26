/**
 * @module ExistsMiddleware
 */
/**
 * @summary ExistsMiddleware function checks model by id in the params of the request or the 'ID' argument
 * @function ExistsMiddleware
 * @param {object} model Sequelize model instance @see {@link http://docs.sequelizejs.com/class/lib/model.js~Model.html}
 * @param {object} req Express request object @see {@link http://expressjs.com/en/api.html#req}
 * @param {object} res Express response object @see {@link http://expressjs.com/en/api.html#res}
 * @param {function} next Express next middleware function @see {@link http://expressjs.com/en/guide/using-middleware.html}
 * @param {string | null} ID Identifier for checking
 * @return {Promise<void>}
 */
const ExistsMiddleware = async (model, req, res, next, ID) => {
  const { id = ID } = req.params;

  if (!await model.findById(id)) {
    res.status(404).send();

    return;
  }

  next();
};

module.exports = ExistsMiddleware;
