const express = require("express");
const router = express.Router();

const adminCtrl = require("../controllers/admin_ctrl");
const Actr = require("../middleware/auth");

router.use(Actr);

// 1. แสดงข้อมูลส่วนตัวของ Admin
router.get("/profile", adminCtrl.getProfile);

// 2. สร้างข้อมูลส่วนตัวของ Admin
router.post("/profile", adminCtrl.createProfile);

// 3. แก้ไขข้อมูลส่วนตัวของ Admin
router.put("/profile", adminCtrl.updateProfile);


// 4. แสดงข้อมูลผู้ใช้งานทั้งหมด
router.get("/users", adminCtrl.getUsers);

// 5. สร้างผู้ใช้งาน
router.post("/users", adminCtrl.createUser);

// 6. แก้ไขข้อมูลผู้ใช้งาน
router.put("/users/:id", adminCtrl.updateUser);

// 7. เปลี่ยนรหัสผ่านผู้ใช้งาน
router.put("/password/users", adminCtrl.updatePassword);

// 8. แสดงข้อมูลผู้ใช้งานตาม ID
router.get("/users/:id", adminCtrl.getUserById);

// 9. ลบผู้ใช้งาน
router.delete("/users/:id", adminCtrl.deleteUser);


// 10. แสดงข้อมูลงานทั้งหมด
router.get("/works", adminCtrl.getWorks);

// 11. แสดงข้อมูลงานตาม ID
router.get("/works/:id", adminCtrl.getWorkById);

// 12. สร้างงาน
router.post("/works", adminCtrl.createWork);

// 13. แก้ไขงาน
router.put("/works/:id", adminCtrl.updateWork);

// 14. ลบงาน
router.delete("/works/:id", adminCtrl.deleteWork);



// 15. แสดงประวัติการรับงานทั้งหมดของพนักงาน
router.get(
  "/employee/total_history",
  adminCtrl.getTotalHistory
);

// 16. แสดงประวัติการรับงานตามพนักงาน
router.get(
  "/employee/:id/history",
  adminCtrl.getEmployeeHistory
);

// 17. แสดงงานที่กำลังดำเนินการ
router.get(
  "/employee/active",
  adminCtrl.getActiveAssignments
);


// 18. แสดงสถานะงาน
router.get("/status", adminCtrl.getStatus);

// 19. แสดงสรุปจำนวนงาน
router.get("/dashboard/summary", adminCtrl.getSummary);

// 20. แสดงสถิติการทำงาน
router.get("/dashboard/statistics", adminCtrl.getStatistics);


module.exports = router;
