const express = require('express');
const settingRouter = express.Router();
const SettingController = require('../controllers/setting.controller');
const { SettingMiddleware } = require('../middlewares/setting.middleware');

/**
 * Setting endpoint middleware list.
 */
settingRouter.post('/update', (req, res, next) => SettingMiddleware.updateSetting(req, res, next));

/**
 * Setting endpoint list.
 */
settingRouter.get('/', (req, res) => SettingController.getSetting(req, res));
settingRouter.post('/update', (req, res) => SettingController.updateSetting(req, res));

module.exports = settingRouter;
