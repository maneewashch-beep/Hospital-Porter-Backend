const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.getProfile = async (req, res) => {
    try {
        const [profile] = await db.query('SELECT * FROM user_profiles WHERE user_id = ?', [req.user.id])

        if (profile.length === 0) {
            return res.status(400).json({ success: false , message: 'ไม่พบข้อมูลผู้ใช้งาน'})
        }

        res.status(200).json({ success: true , data: profile[0] })
    } catch (error) {
        res.status(500).json({ success: false , message: 'เกิดข้อผืดพลาด' , error: error.message })
    }
}

exports.createProfile = async (req, res) => {
    try {
        const { fname , lname, img, phone } = req.body

        const [U_profile] = await db.query('SELECT * FROM user_profiles WHERE user_id = ?', [req.user.id])
        if (U_profile.length > 0) {
            return res.status(400).json({ success: false, message: 'คุณสร้างข้อมูลไปแล้ว'})
        }

        await db.query (
            'INSERT INTO user_profiles (user_id , first_name , last_name, image_url , phone_number) VALUES (?, ?, ?, ?, ?)',
            [req.user.id , fname, lname, img, phone]
        ) 
        
        res.status(201).json({ success: true, message: 'สร้างข้อมูลสำเร็จ'})
    } catch (error) {
        res.status(500).json({ success: false , message: 'เกิดข้อผืดพลาด' , error: error.message })
    }
}

exports.updateProfile = async (req, res) => {
    try {
        const { fname , lname , img , phone } = req.body

        const [U_profile] = await db.query('SELECT * FROM user_profiles WHERE user_id = ?', [req.user.id])
        if (U_profile.length === 0) {
            return res.status(400).json({ success: false , message: 'ไม่พบข้อมูลผู้ใช้งาน'})
        }

        await db.query(
            'UPDATE user_profiles SET fname = ? , lname = ? , img = ? , phone = ? WHERE user_id = ?',
            [fname, lname, img, phone, req.user.id]
        )

        res.status(201).json({ success: true, message: 'บันทึกข้อมูลสำเร็จ' })
    } catch (error) {
        res.status(500).json({ success: false , message: 'เกิดข้อผืดพลาด' , error: error.message })
    }
}

exports.getEmployeeHistory = async (req, res) => {
    try {
        const [history] = await db.query(`
            SELECT w.work_id, w.title, w.description, w.work_date, 
                   wa.status, wa.assigned_at, wa.updated_at 
            FROM works w 
            INNER JOIN work_assignments wa ON w.work_id = wa.work_id 
            WHERE wa.employee_id = ? AND wa.status IN ('completed', 'cancelled')
            ORDER BY wa.updated_at DESC 
        `, [req.user.id])
        
        res.status(200).json({ success: true, total: history.length, data: history })
    } catch (error) {
        res.status(500).json({ success: false , message: 'เกิดข้อผืดพลาด' , error: error.message })
    }
}

exports.getEmployeeAssign = async (req, res) => {
    try {
        const [assignWorks] = await db.query(`
            SELECT w.work_id, w.title, w.description, w.work_date, 
                   wa.status, wa.assigned_at, wa.updated_at 
            FROM works w 
            INNER JOIN work_assignments wa ON w.work_id = wa.work_id 
            WHERE wa.employee_id = ? AND wa.status NOT IN ('completed', 'cancelled')
            ORDER BY wa.assigned_at ASC
        ` [req.user.id])

        res.status(200).json({ success: true, total: assignWorks.length, data: assignWorks })
    } catch (error) {
        res.status(500).json({ success: false , message: 'เกิดข้อผืดพลาด' , error: error.message })
    }
}

exports.getDailyWorks = async (req, res) => {
    try {
        const date = req.query.date || new Date().toISOString().split('T')[0]

        const [work] = await db.query(`
            SELECT 
                w.work_id, w.title, w.description, w.work_date, 
                w.created_at,
                w.origin, 
                w.destination, 
                w.equipment_type, 
                w.work_time,
                wa.status,
                creator_u.username AS creator_username,
                creator_u.role AS creator_role
            FROM works w
            INNER JOIN work_assignments wa ON w.work_id = wa.work_id
            LEFT JOIN users creator_u ON w.created_by = creator_u.user_id
            WHERE wa.employee_id = ? AND w.work_date = ?
            ORDER BY wa.assigned_at ASC   
        `, [req.user.id, date])

        res.status(200).json({ success: true, total: work.length, data: work })
    } catch (error) {
        res.status(500).json({ success: false , message: 'เกิดข้อผิดพลาด' , error: error.message })
    }
}

exports.updateWorkStatus = async (req, res) => {
    try {
        const { id } = req.params
        const { status } = req.body

        const validStatuses = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'สถานะไม่ถูกต้อง' })
        }

        const [result] = await db.query(`
            UPDATE work_assignments 
            SET status = ? 
            WHERE work_id = ? AND employee_id = ?
        `, [status, id, req.user.id])

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบงานที่ได้รับมอบหมาย หรือคุุณไม่มีสิทธิ์แก้ไขงานนี้' })
        }
        
        res.status(200).json({ success: true, message: 'อัปเดตข้อมูลสำเร็จ' })
    } catch (error) {
        res.status(500).json({ success: false , message: 'เกิดข้อผืดพลาด' , error: error.message })
    }
}

exports.getWorkStatuses = async (req, res) => {
    try {
        const statuses = [
            { id: 'pending', name: 'รอดำเนินการ' },
            { id: 'accepted', name: 'รับงานแล้ว' },
            { id: 'in_progress', name: 'กำลังดำเนินการ' },
            { id: 'completed', name: 'เสร็จสิ้น' },
            { id: 'cancelled', name: 'ยกเลิก' }
        ]
        res.status(200).json({ success: true, data: statuses })
    } catch (error) {
        res.status(500).json({ success: false , message: 'เกิดข้อผืดพลาด' , error: error.message })
    }
}

exports.updateEmployeePassword = async (req, res) => {
    try {
        const { newPass } = req.body;

        if (!newPass) {
            return res.status(400).json({ success: false, message: 'กรุณากรอกรหัสผ่านใหม่' });
        }

        const [users] = await db.query('SELECT password_reset_count FROM users WHERE user_id = ?', [req.user.id]);
        
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งาน' });            
        }

        const user = users[0];

        if (user.password_reset_count > 0) {
            return res.status(403).json({ success: false, message: 'คุณได้ทำการตั้งรหัสผ่านไปแล้ว หากลืมรหัสผ่านกรุณาติดต่อ Admin' });
        }

        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPass, salt);

        await db.query(
            'UPDATE users SET password_hash = ?, password_reset_count = password_reset_count + 1 WHERE user_id = ?', 
            [newPasswordHash, req.user.id]
        );

        res.status(200).json({ success: true, message: 'ตั้งรหัสผ่านสำเร็จ' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const { status } = req.query;
        let query = `
            SELECT 
                w.work_id, w.title, w.work_date,
                wa.status, wa.updated_at AS status_changed_at,
                up.prename AS creator_prename,
                up.first_name AS creator_first_name,
                up.last_name AS creator_last_name
            FROM works w
            INNER JOIN work_assignments wa ON w.work_id = wa.work_id
            LEFT JOIN user_profiles up ON w.created_by = up.user_id
            WHERE wa.employee_id = ?
        `;

        const queryParams = [req.user.id];
        
        if (status) { 
            query += ` AND wa.status = ?`;
            queryParams.push(status);
        }
        
        query += ` ORDER BY wa.updated_at DESC LIMIT 20`;
        const [notifications] = await db.query(query, queryParams);

        res.status(200).json({ success: true, total: notifications.length, data: notifications });
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
};