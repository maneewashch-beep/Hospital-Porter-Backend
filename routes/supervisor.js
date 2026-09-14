const express = require('express');
const router = express.Router()
const Sctrl = require('../controllers/supervisor');
const { verifyToken , authorize } = require('../middleware/auth');

const isSuperVisor = authorize(['supervisor'])
router.put('/password/supervisor', verifyToken, isSuperVisor, Sctrl.resetPasswordSupervisor)
router.get('/profile', verifyToken, isSuperVisor, Sctrl.getProfileSupervisor)
router.post('/profile', verifyToken, isSuperVisor, Sctrl.createProfileSuperVisor)
router.put('/profile', verifyToken, isSuperVisor, Sctrl.updateProfileSuperVisor)
router.get('/nurse/total_history', verifyToken, isSuperVisor, Sctrl.getNurseTotalHistory)
router.get('/nurse/history', verifyToken, isSuperVisor, Sctrl.getNurseHistory)
router.get('/employee/history', verifyToken, isSuperVisor, Sctrl.getEmployeeHistory)
router.get('/employee/total_history', verifyToken, isSuperVisor, Sctrl.getEmployeeTotalHistory)
router.get('/manager/history', verifyToken, isSuperVisor, Sctrl.getManagerHistory)
router.get('/manager/total_history', verifyToken, isSuperVisor, Sctrl.getManagerTotalHistory)
router.get('/notify', verifyToken, isSuperVisor, Sctrl.getNotifyByStatus)
router.get('/employee', verifyToken, isSuperVisor, Sctrl.getEmployee)

module.exports = router