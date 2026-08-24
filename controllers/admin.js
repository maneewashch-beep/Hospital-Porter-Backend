const db = require("../config/db");
const bcrypt = require("bcrypt");


exports.getProfile = async (req, res) => {
  try {
    const [profile] = await db.query(
      `SELECT
        profile_id,
        user_id,
        prename,
        first_name,
        last_name,
        image_url,
        phone_number
       FROM user_profiles
       WHERE user_id = ?`,
      [req.user.id],
    );

    if (profile.length === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลผู้ใช้งาน",
      });
    }

    return res.status(200).json({
      success: true,
      data: profile[0],
    });
  } catch (error) {
    console.error("Get Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
    });
  }
};


exports.createProfile = async (req, res) => {
  try {
    const { prename, fname, lname, img, phone } = req.body;

    // ตรวจสอบว่ามี Profile อยู่แล้วหรือไม่
    const [U_profile] = await db.query(
      "SELECT profile_id FROM user_profiles WHERE user_id = ?",
      [req.user.id],
    );

    if (U_profile.length > 0) {
      return res.status(400).json({
        success: false,
        message: "คุณสร้างข้อมูลไปแล้ว",
      });
    }

    // สร้าง Profile ID
    const profileId = Date.now().toString();

    // เพิ่มข้อมูล Profile
    await db.query(
      `INSERT INTO user_profiles
       (
         profile_id,
         user_id,
         prename,
         first_name,
         last_name,
         image_url,
         phone_number
       )
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [profileId, req.user.id, prename, fname, lname, img, phone],
    );

    return res.status(201).json({
      success: true,
      message: "สร้างข้อมูลสำเร็จ",
      data: {
        profile_id: profileId,
      },
    });
  } catch (error) {
    console.error("Create Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
    });
  }
};


exports.updateProfile = async (req, res) => {
  try {
    const { prename, fname, lname, img, phone } = req.body;

    // ตรวจสอบว่ามี Profile หรือไม่
    const [U_profile] = await db.query(
      "SELECT profile_id FROM user_profiles WHERE user_id = ?",
      [req.user.id],
    );

    if (U_profile.length === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบข้อมูลผู้ใช้งาน",
      });
    }

    // อัปเดตข้อมูล Profile
    await db.query(
      `UPDATE user_profiles
       SET
         prename = ?,
         first_name = ?,
         last_name = ?,
         image_url = ?,
         phone_number = ?
       WHERE user_id = ?`,
      [prename, fname, lname, img, phone, req.user.id],
    );

    return res.status(200).json({
      success: true,
      message: "บันทึกข้อมูลสำเร็จ",
    });
  } catch (error) {
    console.error("Update Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
    });
  }
};

// ======================================================
// USERS
// ======================================================

// GET /api/users
// แสดงข้อมูลผู้ใช้งานทั้งหมด
exports.getUsers = async (req, res) => {
  try {
    const [users] = await db.query(
      `SELECT
        u.user_id,
        u.username,
        u.role,
        u.password_reset_count,
        u.created_at,
        u.updated_at,

        p.profile_id,
        p.prename,
        p.first_name,
        p.last_name,
        p.image_url,
        p.phone_number

       FROM users u

       LEFT JOIN user_profiles p
         ON u.user_id = p.user_id

       ORDER BY u.user_id ASC`,
    );

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Get Users Error:", error);

    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
    });
  }
};


// สร้างข้อมูลผู้ใช้งาน
exports.createUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "กรุณากรอกข้อมูลให้ครบถ้วน",
      });
    }

    // ตรวจสอบ Username ซ้ำ
    const [existingUser] = await db.query(
      "SELECT user_id FROM users WHERE username = ?",
      [username],
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Username นี้มีอยู่แล้ว",
      });
    }

    // Hash Password
    const passwordHash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO users
       (
         username,
         password_hash,
         role
       )
       VALUES (?, ?, ?)`,
      [username, passwordHash, role],
    );

    return res.status(201).json({
      success: true,
      message: "สร้างข้อมูลผู้ใช้งานสำเร็จ",
      data: {
        user_id: result.insertId,
        username,
        role,
      },
    });
  } catch (error) {
    console.error("Create User Error:", error);

    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
    });
  }
};


// แก้ไขข้อมูลผู้ใช้งาน
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const { username, role } = req.body;

    // ตรวจสอบ User
    const [users] = await db.query(
      "SELECT user_id FROM users WHERE user_id = ?",
      [id],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบผู้ใช้งาน",
      });
    }

    // ตรวจสอบ Username ซ้ำ
    if (username) {
      const [duplicate] = await db.query(
        `SELECT user_id
         FROM users
         WHERE username = ?
         AND user_id != ?`,
        [username, id],
      );

      if (duplicate.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Username นี้มีอยู่แล้ว",
        });
      }
    }

    await db.query(
      `UPDATE users
       SET
         username = COALESCE(?, username),
         role = COALESCE(?, role)
       WHERE user_id = ?`,
      [username, role, id],
    );

    return res.status(200).json({
      success: true,
      message: "บันทึกข้อมูลผู้ใช้งานสำเร็จ",
    });
  } catch (error) {
    console.error("Update User Error:", error);

    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
    });
  }
};


// เปลี่ยนรหัสผ่านผู้ใช้งาน
exports.updatePassword = async (req, res) => {
  try {
    const { user_id, password } = req.body;

    if (!user_id || !password) {
      return res.status(400).json({
        success: false,
        message: "กรุณาระบุ User ID และ Password",
      });
    }

    // ตรวจสอบ User
    const [users] = await db.query(
      "SELECT user_id FROM users WHERE user_id = ?",
      [user_id],
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "ไม่พบผู้ใช้งาน",
      });
    }

    // Hash Password
    const passwordHash = await bcrypt.hash(password, 10);

    await db.query(
      `UPDATE users
       SET
         password_hash = ?,
         password_reset_count = password_reset_count + 1
       WHERE user_id = ?`,
      [passwordHash, user_id],
    );

    return res.status(200).json({
      success: true,
      message: "เปลี่ยนรหัสผ่านสำเร็จ",
    });
  } catch (error) {
    console.error("Update Password Error:", error);

    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
    });
  }
};


// แสดงข้อมูลงานทั้งหมด
exports.getWorks = async (req, res) => {
  try {
    const [works] = await db.query(
      `SELECT
        w.work_id,
        w.title,
        w.description,
        w.work_date,
        w.created_by,
        w.created_at,
        w.updated_at,

        u.username AS creator_username,

        p.prename AS creator_prename,
        p.first_name AS creator_first_name,
        p.last_name AS creator_last_name

       FROM works w

       LEFT JOIN users u
         ON w.created_by = u.user_id

       LEFT JOIN user_profiles p
         ON u.user_id = p.user_id

       ORDER BY w.work_date DESC, w.work_id DESC`,
    );

    return res.status(200).json({
      success: true,
      data: works,
    });
  } catch (error) {
    console.error("Get Works Error:", error);

    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
    });
  }
};


// แสดงประวัติการรับงานทั้งหมด
exports.getTotalHistory = async (req, res) => {
  try {
    const [history] = await db.query(
      `SELECT
        wa.assignment_id,
        wa.work_id,
        wa.employee_id,
        wa.status,
        wa.assigned_at,
        wa.updated_at,

        w.title,
        w.description,
        w.work_date,

        u.username AS employee_username,

        p.prename,
        p.first_name,
        p.last_name,
        p.image_url,
        p.phone_number

       FROM work_assignments wa

       INNER JOIN works w
         ON wa.work_id = w.work_id

       INNER JOIN users u
         ON wa.employee_id = u.user_id

       LEFT JOIN user_profiles p
         ON u.user_id = p.user_id

       ORDER BY wa.updated_at DESC`,
    );

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Get Total History Error:", error);

    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
    });
  }
};


// แสดงสถานะงาน
exports.getStatus = async (req, res) => {
  try {
    const [status] = await db.query(
      `SELECT
        status,
        COUNT(*) AS total
       FROM work_assignments
       GROUP BY status
       ORDER BY status`,
    );

    return res.status(200).json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Get Status Error:", error);

    return res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
    });
  }
};