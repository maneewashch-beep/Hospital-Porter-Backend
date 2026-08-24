const express = require('express');
const router = express.Router();
const EmpCtrl = require('../controllers/employee');
const { verifyToken , authorize } = require('../middleware/auth');

const isEmployee = authorize(['employee'])
router.get('/profile', verifyToken, isEmployee, EmpCtrl.getProfile )
router.post('/profile', verifyToken, isEmployee, EmpCtrl.createProfile)
router.put('/profile', verifyToken, isEmployee, EmpCtrl.updateProfile)
router.get('/employee/history', verifyToken, isEmployee, EmpCtrl.getEmployeeHistory)
router.get('/employee/assign', verifyToken, isEmployee, EmpCtrl.getEmployeeAssign)
router.get('/works',verifyToken, isEmployee, EmpCtrl.getDailyWorks)
router.put('/works/assign/:id/status', verifyToken, isEmployee, EmpCtrl.updateWorkStatus)
router.get('/status', verifyToken, isEmployee, EmpCtrl.getWorkStatuses)
router.put('/password/employee', verifyToken, isEmployee, EmpCtrl.updateEmployeePassword)
router.get('/notify', verifyToken, isEmployee, EmpCtrl.getNotifications)

module.exports = router