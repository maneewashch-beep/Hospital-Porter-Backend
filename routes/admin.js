const express = require("express");
const router = express.Router();
const adminCtrl = require("../controllers/admin");
const { verifyToken , authorize } = require("../middleware/auth");


const IsAdmin = authorize(['admin'])
router.get('/profile', verifyToken, IsAdmin, adminCtrl.getProfileAdmin)
router.post('/profile', verifyToken, IsAdmin, adminCtrl.createProfileAdmin)
router.put('/profile', verifyToken, IsAdmin, adminCtrl.updateProfileAdmin)
router.get('/nurse/total_history', verifyToken, IsAdmin, adminCtrl.getWardTotalHistory)
router.get('/nurse/history',verifyToken, IsAdmin, adminCtrl.getWardHistory)
router.get('/employee/history', verifyToken, IsAdmin, adminCtrl.getEmployeeHistory)
router.get('/employee/total_history', verifyToken, IsAdmin, adminCtrl.getEmployeeTotalHistory)
router.get('/manager/history', verifyToken, IsAdmin, adminCtrl.getManagerHistory)
router.get('/manager/total_history', verifyToken, IsAdmin, adminCtrl.getManagerTotalHistory)
router.post('/works', verifyToken, IsAdmin, adminCtrl.createWork)
router.post('/works/:id/assign', verifyToken, IsAdmin, adminCtrl.assignWork)
router.put('/works/:id', verifyToken, IsAdmin, adminCtrl.updateWork)
router.get('/works', verifyToken, IsAdmin, adminCtrl.getWorks)
router.put('/works/:id/cancel', verifyToken, IsAdmin, adminCtrl.cancelWork)
router.get('/users', verifyToken, IsAdmin, adminCtrl.getUsers)
router.post('/users', verifyToken, IsAdmin, adminCtrl.createUser)
router.put('/users/:id', verifyToken, IsAdmin, adminCtrl.updateUser)
router.put('/password/users', verifyToken, IsAdmin, adminCtrl.resetUserPassword)
router.get('/notify', verifyToken, IsAdmin, adminCtrl.getNotifyByStatus)

module.exports = router;
