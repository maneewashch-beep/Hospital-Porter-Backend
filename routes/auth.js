const express = require('express')
const router = express.Router()
const Actrl = require('../controllers/auth');

router.post('/login', Actrl.login)
router.post('/logout', Actrl.logout)

module.exports = router;
