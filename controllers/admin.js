const db = require("../config/db");
const bcrypt = require("bcrypt");

exports.getProfileAdmin = async (req, res) => {
  try {
    const [profile] = await db.query('SELECT * FROM user_profiles WHERE user_id = ?', [req.user.id])
    if (profile.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้งาน' })
    }

    res.status(200).json({ success: true, data: profile[0] })
  } catch (error) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

exports.createProfileAdmin = async (req, res) => {
  try {
    const { prename, fname, lname, img, phone } = req.body
    if (!prename || !fname || !lname) {
      return res.status(400).json({success: false, message: 'กรุณากรอกข้อมูลให้ครบ' })
    }
    const [profile] = await db.query('SELECT * FROM user_profiles WHERE user_id = ?', [req.user.id])
    if (uProfile.length > 0) {
      return res.status(400).json({ success: false, message: 'คุณสร้างโปรไฟล์ไปแล้ว' })
    }

    const profileId = crypto.randomUUID();
    await db.query(
      'INSERT INTO user_profiles (profile_id, user_id, prename, first_name, last_name, image_url, phone_number) VALUE (?, ?, ?, ?, ?, ?, ?)',
      [profileId, req.user.id, prename, fname, lname, img || null, phone || null]
    )

    res.status(201).json({ success: true, message: 'เพิ่มข้อมูลสำเร็จ' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message })
  }
}

exports.updateProfileAdmin = async (req, res) => {
  try {
    const { prename, fname, lname, img, phone } = req.body
    const [uProfile] = await db.query('SELECT * FROM user_profiles WHERE user_id', [req.user.id])
    if (!uProfile.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใข้งาน' })
    }

    await db.query(
      'UPDATE user_profiles SET prename = ?, first_name = ?, last_name = ?, image_url = ?, phone_number = ? WHERE user_id = ?',
      [prename, fname, lname, img, phone, req.user.id]
    );  
        
    res.status(200).json({ success: true, message: 'บันทึกข้อมูลสำเร็จ' })
  } catch (error) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด' , error: error.message})
  }
}

exports.getWardTotalHistory = async (req, res) => {
  try {
      const query = `
          SELECT w.*, u.username as creator_username, p.first_name as creator_first_name, p.last_name as creator_last_name, u.role as creator_role, wa.status, wa.employee_id
          FROM works w
          JOIN users u ON w.created_by = u.user_id
          LEFT JOIN user_profiles p ON u.user_id = p.user_id
          LEFT JOIN work_assignments wa ON w.work_id = wa.work_id
          WHERE u.role = 'nurse'
          ORDER BY w.created_at DESC
      `;
      const [history] = await db.query(query);
      res.status(200).json({ success: true, total: history.length, data: history });
  } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
};

exports.getWardHistory = async (req, res) => {
  try {
      const { user_id } = req.query;
      const query = `
          SELECT w.*, wa.status, wa.employee_id
          FROM works w
          JOIN users u ON w.created_by = u.user_id
          LEFT JOIN work_assignments wa ON w.work_id = wa.work_id
          WHERE u.role = 'nurse' AND w.created_by = ?
          ORDER BY w.created_at DESC
      `;
      const [history] = await db.query(query, [user_id]);
      res.status(200).json({ success: true, total: history.length, data: history });
  } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
};

exports.getEmployeeTotalHistory = async (req, res) => {
  try {
      const query = `
          SELECT w.*, wa.status, wa.employee_id, emp_p.first_name as employee_first_name, emp_p.last_name as employee_last_name
          FROM work_assignments wa
          JOIN works w ON wa.work_id = w.work_id
          LEFT JOIN user_profiles emp_p ON wa.employee_id = emp_p.user_id
          ORDER BY wa.assigned_at DESC
      `;
      const [history] = await db.query(query);
      res.status(200).json({ success: true, total: history.length, data: history });
  } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
};

exports.getEmployeeHistory = async (req, res) => {
  try {
      const { emp_id } = req.query;
      const query = `
          SELECT w.*, wa.status, wa.employee_id
          FROM work_assignments wa
          JOIN works w ON wa.work_id = w.work_id
          WHERE wa.employee_id = ?
          ORDER BY wa.assigned_at DESC
      `;
      const [history] = await db.query(query, [emp_id]);
      res.status(200).json({ success: true, total: history.length, data: history });
  } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
};

exports.getManagerTotalHistory = async (req, res) => {
  try {
      const query = `
          SELECT w.*, u.username as creator_username, p.first_name as creator_first_name, p.last_name as creator_last_name, u.role as creator_role, wa.status, wa.employee_id
          FROM works w
          JOIN users u ON w.created_by = u.user_id
          LEFT JOIN user_profiles p ON u.user_id = p.user_id
          LEFT JOIN work_assignments wa ON w.work_id = wa.work_id
          WHERE u.role = 'manager'
          ORDER BY w.created_at DESC
      `;
      const [history] = await db.query(query);
      res.status(200).json({ success: true, total: history.length, data: history });
  } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
};

exports.getManagerHistory = async (req, res) => {
  try {
      const { manager_id } = req.query;
      const query = `
          SELECT w.*, wa.status, wa.employee_id
          FROM works w
          JOIN users u ON w.created_by = u.user_id
          LEFT JOIN work_assignments wa ON w.work_id = wa.work_id
          WHERE u.role = 'manager' AND w.created_by = ?
          ORDER BY w.created_at DESC
      `;
      const [history] = await db.query(query, [manager_id]);
      res.status(200).json({ success: true, total: history.length, data: history });
  } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
};

exports.getWorks = async (req, res) => {
  try {
      const query = `
          SELECT w.*, wa.status, wa.employee_id, u.username as creator_username, u.role as creator_role
          FROM works w
          LEFT JOIN work_assignments wa ON w.work_id = wa.work_id
          LEFT JOIN users u ON w.created_by = u.user_id
          ORDER BY w.created_at DESC
      `;
      const [works] = await db.query(query);
      res.status(200).json({ success: true, data: works });
  } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
};

exports.createWork = async (req, res) => {
  try {
      const { title, origin, destination, equipment_type, work_date, work_time, description } = req.body;
      const workId = crypto.randomUUID();
      
      await db.query(
          'INSERT INTO works (work_id, title, origin, destination, equipment_type, work_date, work_time, description, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [workId, title, origin, destination, equipment_type, work_date, work_time, description, req.user.id]
      );
      
      // สร้างสถานะเริ่มต้น
      const assignmentId = crypto.randomUUID();
      await db.query(
          'INSERT INTO work_assignments (assignment_id, work_id, status) VALUES (?, ?, ?)',
          [assignmentId, workId, 'pending']
      );

      res.status(201).json({ success: true, message: 'สร้างงานสำเร็จ', work_id: workId });
  } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
};

exports.updateWork = async (req, res) => {
  try {
      const { id } = req.params;
      const { title, origin, destination, equipment_type, work_date, work_time, description } = req.body;
      
      await db.query(
          'UPDATE works SET title=?, origin=?, destination=?, equipment_type=?, work_date=?, work_time=?, description=? WHERE work_id=?',
          [title, origin, destination, equipment_type, work_date, work_time, description, id]
      );
      
      res.status(200).json({ success: true, message: 'แก้ไขข้อมูลงานสำเร็จ' });
  } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
};

exports.assignWork = async (req, res) => {
  try {
      const { id } = req.params;
      const { employee_id } = req.body;
      
      await db.query(
          'UPDATE work_assignments SET employee_id = ?, status = "pending", assigned_at = NOW() WHERE work_id = ?',
          [employee_id, id]
      );
      
      res.status(200).json({ success: true, message: 'มอบหมายงานสำเร็จ' });
  } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
};

exports.cancelWork = async (req, res) => {
  try {
      const { id } = req.params;
      const { reason } = req.body;
      
      await db.query(
          'UPDATE work_assignments SET status = "cancelled", cancel_reason = ? WHERE work_id = ?',
          [reason || 'แอดมินเป็นผู้ยกเลิก', id]
      );
      
      res.status(200).json({ success: true, message: 'ยกเลิกงานสำเร็จ' });
  } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
};

exports.getStatus = async (req, res) => {
  try {
      // ดึงข้อมูลสถานะทั้งหมดของงานในระบบ
      const [statuses] = await db.query('SELECT status, COUNT(*) as count FROM work_assignments GROUP BY status');
      res.status(200).json({ success: true, data: statuses });
  } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
      const query = `
          SELECT u.user_id, u.username, u.role, u.is_active, p.prename, p.first_name, p.last_name, p.phone_number 
          FROM users u 
          LEFT JOIN user_profiles p ON u.user_id = p.user_id
          ORDER BY u.created_at DESC
      `;
      const [users] = await db.query(query);
      res.status(200).json({ success: true, data: users });
  } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
};

exports.createUser = async (req, res) => {
  try {
      const { username, password, role } = req.body;
      if (!username || !password || !role) {
          return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
      }

      // เช็ค User ซ้ำ
      const [existing] = await db.query('SELECT user_id FROM users WHERE username = ?', [username]);
      if (existing.length > 0) {
          return res.status(400).json({ success: false, message: 'ชื่อผู้ใช้งานนี้มีในระบบแล้ว' });
      }

      const userId = crypto.randomUUID();
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      await db.query(
          'INSERT INTO users (user_id, username, password_hash, role) VALUES (?, ?, ?, ?)',
          [userId, username, hashedPassword, role]
      );

      res.status(201).json({ success: true, message: 'สร้างผู้ใช้งานสำเร็จ' });
  } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
};

exports.updateUser = async (req, res) => {
  try {
      const { id } = req.params;
      const { role, is_active } = req.body;
      
      await db.query(
          'UPDATE users SET role = ?, is_active = ? WHERE user_id = ?',
          [role, is_active, id]
      );
      
      res.status(200).json({ success: true, message: 'อัปเดตข้อมูลผู้ใช้งานสำเร็จ' });
  } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
};

exports.resetUserPassword = async (req, res) => {
  try {
      const { target_user_id, new_password } = req.body; // รับ ID ของคนที่ต้องการเปลี่ยนรหัส
      if (!target_user_id || !new_password) {
          return res.status(400).json({ success: false, message: 'กรุณาระบุผู้ใช้งานและรหัสผ่านใหม่' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(new_password, salt);

      await db.query(
          'UPDATE users SET password_hash = ?, password_reset_count = password_reset_count + 1 WHERE user_id = ?',
          [hashedPassword, target_user_id]
      );

      res.status(200).json({ success: true, message: 'เปลี่ยนรหัสผ่านผู้ใช้งานสำเร็จ' });
  } catch (error) {
      res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
  }
};

exports.getNotifyByStatus = async (req, res) => {
    try {
        const query = `
            SELECT 
                -- นับรวมทั้งงานที่สถานะเป็น NULL (ยังไม่แจกจ่าย) หรือ 'pending' (รอรับงาน)
                SUM(CASE WHEN wa.status IS NULL OR wa.status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
                SUM(CASE WHEN wa.status = 'accepted' THEN 1 ELSE 0 END) AS accepted_count,
                SUM(CASE WHEN wa.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_count,
                SUM(CASE WHEN wa.status = 'completed' THEN 1 ELSE 0 END) AS completed_count,
                SUM(CASE WHEN wa.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_count
            FROM works w
            LEFT JOIN work_assignments wa ON w.work_id = wa.work_id
        `;
        const [stats] = await db.query(query);
        
        const data = {
            pending: Number(stats[0].pending_count) || 0,
            accepted: Number(stats[0].accepted_count) || 0,
            in_progress: Number(stats[0].in_progress_count) || 0,
            completed: Number(stats[0].completed_count) || 0,
            cancelled: Number(stats[0].cancelled_count) || 0,
        };

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแจ้งเตือน', error: error.message });
    }
};
