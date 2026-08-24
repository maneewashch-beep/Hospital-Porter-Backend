const express = require('express');
const router = express.Router()
const ManagerCtrl = require('../controllers/manager');
const { verifyToken , authorize } = require('../middleware/auth');

const isManager = authorize(['manager'])
router.get('/profile', verifyToken, isManager, ManagerCtrl.getProfile)
router.post('/profile', verifyToken, isManager, ManagerCtrl.createProfile)
router.put('/profile', verifyToken, isManager, ManagerCtrl.updateProfile)
router.get('/manager/history', verifyToken, isManager, ManagerCtrl.getManagerHistory)
router.get('/employee', verifyToken, isManager, ManagerCtrl.getEmployees)
router.get('/employee/history', verifyToken, isManager, ManagerCtrl.getEmployeeHistory)
router.post('/works', verifyToken, isManager, ManagerCtrl.createWork)
router.put('/works/:id', verifyToken, isManager, ManagerCtrl.updateWork)
router.get('/works', verifyToken, isManager,ManagerCtrl.getWorks)
router.post('/works/:id/assign', verifyToken, isManager, ManagerCtrl.assignWork)
router.get('/status', verifyToken, isManager, ManagerCtrl.getWorkStatus)
router.put('works/:id/cancel', verifyToken, isManager, ManagerCtrl.cancelWork)
router.put('password/maanager', verifyToken, isManager, ManagerCtrl.updateManagerPassword)
router.get('notify', verifyToken, isManager, ManagerCtrl.getNotifications)

module.exports = router