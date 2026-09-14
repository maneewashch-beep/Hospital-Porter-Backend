const db = require('../config/db')
const bcrypt = require('bcrypt')

exports.resetPasswordSupervisor = async (req, res) => {
    try {
        const { newPass } = req.body
        if (!newPass) {
            return res.status(400).json({ success: false, message: 'กรุณากรอกรหัสผ่านใหม่' })
        }
        
        // รับค่ามาเป็น users
        const [users] = await db.query('SELECT password_reset_count FROM users WHERE user_id = ?', [req.user.id])
        
        // เช็คตัวแปรต้องเป็น users.length
        if (users.length === 0) { 
            return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งาน' })
        }

        // แก้เป็น genSalt
        const salt = await bcrypt.genSalt(10) 
        const newPasswordHash = await bcrypt.hash(newPass, salt)

        await db.query(
            'UPDATE users SET password_hash = ? , password_reset_count = password_reset_count + 1 WHERE user_id = ?',
            [newPasswordHash, req.user.id]
        )

        res.status(200).json({ success: true, message: 'ตั้งรหัสผ่านสำเร็จ' })
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message })
    }
}

exports.getProfileSupervisor = async (req, res) => {
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

exports.createProfileSuperVisor = async (req, res) => {
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

exports.updateProfileSuperVisor = async (req, res) => {
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

exports.getNurseTotalHistory = async (req, res) => {
    try {
        const query = `
            SELECT w.*, u.username as creator_username, p.first_name, p.last_name, wa.status
            FROM works w
            JOIN users u ON w.created_by = u.user_id
            LEFT JOIN user_profiles p ON u.user_id = p.user_id
            LEFT JOIN work_assignments wa ON w.work_id = wa.work_id
            WHERE u.role = 'nurse'
            ORDER BY w.created_at DESC
        `;
        const [history] = await db.query(query)
        res.status(200).json({ success: true, total: history.length, data: history })
    } catch (error) { 
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message })
    }
}

exports.getNurseHistory = async (req, res) => {
    try {
        const { user_id } = req.query
        if (!user_id) {
            return res.status(400).json({ success: false, message: 'กรุณาระบุ user_id ของแผนก' })
        }
        const query = `
            SELECT w.*, u.username as creator_username, p.first_name, p.last_name, wa.status
            FROM works w
            JOIN users u ON w.created_by = u.user_id
            LEFT JOIN user_profiles p ON u.user_id = p.user_id
            LEFT JOIN work_assignments wa ON w.work_id = wa.work_id
            WHERE u.role = 'manager' AND w.created_by = ?
            ORDER BY w.created_at DESC
        `
        const [history] = await db.query(query, [user_id])
        res.status(200).json({ success: true, total: history.length , data: history })
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message })
    }
}

exports.getEmployeeTotalHistory = async (req, res) => {
    try {
        const query = `
            SELECT w.*, wa.status, wa.assigned_at, emp_u.username as emp_username, emp_p.first_name as emp_fname, emp_p.last_name as emp_lname
            FROM work_assignments wa
            JOIN works w ON wa.work_id = w.work_id
            JOIN users emp_u ON wa.employee_id = emp_u.user_id
            LEFT JOIN user_profiles emp_p ON emp_u.user_id = emp_p.user_id
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
        const { emp_id } = req.query; // รับ employee_id
        if (!emp_id) return res.status(400).json({ success: false, message: 'กรุณาระบุ emp_id ของพนักงานเวรเปล' });

        const query = `
            SELECT w.*, wa.status, wa.assigned_at, emp_p.first_name as emp_fname, emp_p.last_name as emp_lname
            FROM work_assignments wa
            JOIN works w ON wa.work_id = w.work_id
            LEFT JOIN user_profiles emp_p ON wa.employee_id = emp_p.user_id
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
            SELECT w.*, u.username as creator_username, p.first_name, p.last_name, wa.status
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
        if (!manager_id) return res.status(400).json({ success: false, message: 'กรุณาระบุ manager_id' });

        const query = `
            SELECT w.*, u.username as creator_username, p.first_name, p.last_name, wa.status
            FROM works w
            JOIN users u ON w.created_by = u.user_id
            LEFT JOIN user_profiles p ON u.user_id = p.user_id
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


exports.getEmployee = async (req, res) => {
    try {
        const query = `
            SELECT 
                u.user_id, u.username,
                p.profile_id, p.prename, p.first_name, p.last_name, p.phone_number, p.image_url
            FROM users u
            LEFT JOIN user_profiles p ON u.user_id = p.user_id
            WHERE u.role = 'employee'
        `;
        const [employees] = await db.query(query);

        res.status(200).json({ success: true, total: employees.length, data: employees });
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
};