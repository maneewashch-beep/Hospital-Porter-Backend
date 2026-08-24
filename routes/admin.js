const express = require("express");
const router = express.Router();

const adminCtrl = require("../controllers/admin_ctrl");
const Actr = require("../middleware/auth");

router.use(Actr);

router.get("/profile", adminCtrl.getProfile);
router.post("/profile", adminCtrl.createProfile);
router.put("/profile", adminCtrl.updateProfile);
router.get("/users", adminCtrl.getUsers);
router.post("/users", adminCtrl.createUser);
router.put("/users/:id", adminCtrl.updateUser);
router.put("/password/users", adminCtrl.updatePassword);
router.get("/works", adminCtrl.getWorks);
router.get("/employee/total_history", adminCtrl.getTotalHistory);
router.get("/status", adminCtrl.getStatus);

module.exports = router;