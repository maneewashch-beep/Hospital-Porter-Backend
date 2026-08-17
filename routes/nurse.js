const express = require('express');
const router = express.Router()
const Nctrl = require('../controllers/nurse');
const { verifyToken , authorize } = require('../middleware/auth');

const isNurse = authorize(['nurse'])
router.get('/profile', verifyToken, isNurse, Nctrl.getProfile)
router.post('/profile', verifyToken, isNurse, Nctrl.createProfile)
router.put('/profile', verifyToken, isNurse, Nctrl.updateProfile)
router.get('/nurse/history', verifyToken, isNurse, Nctrl.getHistory)
router.get('/nurse/total_history', verifyToken, isNurse, Nctrl.getTotalHistory)
router.post('/works', verifyToken, isNurse, Nctrl.createWorks)
router.put('/works/:id', verifyToken, isNurse, Nctrl.updateWork)
router.get('/works', verifyToken, isNurse, Nctrl.getWorks)
router.get('/status', verifyToken, isNurse, Nctrl.getWorkStatus)
router.put('/works/:id/cancel', verifyToken, isNurse, Nctrl.cancelWork)
router.put('/password/nurse', verifyToken, isNurse, Nctrl.ResetPassword)
router.get('/notify', verifyToken, isNurse, Nctrl.getNotifications)

module.exports = router;
