const express = require('express');
const userController = require('../controllers/user.controller');
const router = express.Router();
const verify = require('../middlewares/check-auth');
const validator = require('../helpers/validator');

router.get('/', verify, userController.getAllUsers);
router.post('/register', validator.registerSchema, userController.register);
router.post('/login', validator.loginSchema, userController.login);
router.post('/apply', verify, userController.apply);
router.get('/view', verify, userController.getVideo);
router.post('/logout', verify, userController.logout);
router.post('/refresh-token', verify, userController.refreshToken);

module.exports = router;