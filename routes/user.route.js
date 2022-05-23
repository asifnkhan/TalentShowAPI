const express = require('express');
const userController = require('../controllers/user.controller');
const router = express.Router();
const verify = require('../middlewares/check-auth');

router.get('/', verify, userController.getAllUsers);
router.post('/register', userController.register);
router.post('/login', userController.login);
router.post('/apply', verify, userController.apply);
router.get('/view', verify, userController.getVideo);
router.post('/logout', verify, userController.logout);
router.post('/refresh-token', verify, userController.refreshToken);

module.exports = router;