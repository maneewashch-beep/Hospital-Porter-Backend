const db = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto'); 

exports.getProfile = async (req, res) => {
    try {
        const [profile] = await db.query('SELECT * FROM user_profiles WHERE user_id = ?', [req.user_id]);

        if (profile.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้งาน' });
        }

        res.status(200).json({ success: true, data: profile[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
};

exports.createProfile = async (req, res) => {
    try {
        const { prename, fname, lname, img, phone } = req.body;

        if (!prename || !fname || !lname) {
            return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
        }

        const [uProfile] = await db.query('SELECT * FROM user_profiles WHERE user_id = ?', [req.user_id]);
        if (uProfile.length > 0) {
            return res.status(400).json({ success: false, message: 'คุณสร้างข้อมูลไปแล้ว' });
        }

        const profileId = crypto.randomUUID();

        await db.query(
            'INSERT INTO user_profiles (profile_id, user_id, prename, first_name, last_name, image_url, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [profileId, req.user_id, prename, fname, lname, img || null, phone || null]
        );
        
        res.status(201).json({ success: true, message: 'สร้างข้อมูลสำเร็จ' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { prename, fname, lname, img, phone } = req.body;

        const [uProfile] = await db.query('SELECT * FROM user_profiles WHERE user_id = ?', [req.user_id]);
        if (uProfile.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้งาน' });
        }

        await db.query(
            'UPDATE user_profiles SET prename = ?, first_name = ?, last_name = ?, image_url = ?, phone_number = ? WHERE user_id = ?',
            [prename, fname, lname, img, phone, req.user_id]
        );

        res.status(200).json({ success: true, message: 'บันทึกข้อมูลสำเร็จ' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
};

exports.getManagerHistory = async (req, res) => {
    try {
        const { source } = req.query;
        
        let query = `
            SELECT
                w.work_id, w.title, w.description, w.work_date, w.created_at,
                wa.assignment_id, wa.status, wa.updated_at AS status_updated_at,
                creator_u.role AS creator_role,
                creator_p.first_name AS creator_first_name,
                creator_p.last_name AS creator_last_name,
                emp_p.first_name AS employee_first_name,
                emp_p.last_name AS employee_last_name
            FROM works w
            LEFT JOIN users creator_u ON w.created_by = creator_u.user_id
            LEFT JOIN user_profiles creator_p ON w.created_by = creator_p.user_id
            LEFT JOIN work_assignments wa ON w.work_id = wa.work_id
            LEFT JOIN user_profiles emp_p ON wa.employee_id = emp_p.user_id
            WHERE 1=1
        `;

        const queryParams = [];

        if (source === 'self') {
            query += ` AND w.created_by = ?`;
            queryParams.push(req.user_id);
        } else if (source === 'nurse') {
            query += ` AND creator_u.role = 'nurse'`;
        } else {
            query += ` AND (creator_u.role = 'nurse' OR w.created_by = ?)`;
            queryParams.push(req.user_id);
        }

        query += ` AND wa.status IN ('completed', 'cancelled') ORDER BY wa.updated_at DESC`;

        const [history] = await db.query(query, queryParams);
        res.status(200).json({ success: true, total: history.length, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
};

exports.getEmployees = async (req, res) => {
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

exports.getEmployeeHistory = async (req, res) => {
    try {
        const { employee_id } = req.query; 
        
        let query = `
            SELECT 
                w.work_id, w.title, w.work_date,
                wa.status, wa.assigned_at, wa.updated_at,
                emp_p.first_name AS employee_first_name,
                emp_p.last_name AS employee_last_name
            FROM works w
            INNER JOIN work_assignments wa ON w.work_id = wa.work_id
            LEFT JOIN user_profiles emp_p ON wa.employee_id = emp_p.user_id
        `;
        
        const queryParams = [];
        if (employee_id) {
            query += ` WHERE wa.employee_id = ?`;
            queryParams.push(employee_id);
        }
        
        query += ` ORDER BY wa.updated_at DESC`;
        const [history] = await db.query(query, queryParams);

        res.status(200).json({ success: true, total: history.length, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
};

exports.createWork = async (req, res) => {
    try {
        const { title, description, work_date } = req.body;

        if (!title || !work_date) {
            return res.status(400).json({ success: false, message: 'กรุณากรอกหัวข้อผู้ป่วย/งาน และวันที่ปฏิบัติงาน' });
        }

        const [result] = await db.query(
            'INSERT INTO works (title, description, work_date, created_by) VALUES (?, ?, ?, ?)',
            [title, description || null, work_date, req.user_id]
        );

        res.status(201).json({ success: true, message: 'สร้างงานสำเร็จ', data: { work_id: result.insertId } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
};

exports.updateWork = async (req, res) => {
    try {
        const workId = req.params.id;
        const { title, description, work_date } = req.body;

        const [existingWork] = await db.query('SELECT work_id FROM works WHERE work_id = ? AND created_by = ?', [workId, req.user_id]);
        
        if (existingWork.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลงาน หรือคุณไม่มีสิทธิ์แก้ไขงานที่พยาบาลสร้าง' });
        }

        await db.query(
            'UPDATE works SET title = ?, description = ?, work_date = ? WHERE work_id = ?',
            [title, description || null, work_date, workId]
        );

        res.status(200).json({ success: true, message: 'แก้ไขข้อมูลสำเร็จ' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
};

exports.getWorks = async (req, res) => {
    try {
        const { date } = req.query; 
        
        let query = `
            SELECT 
                w.work_id, w.title, w.description, w.work_date, w.created_at,
                creator_u.role AS creator_role,
                creator_p.prename AS creator_prename,
                creator_p.first_name AS creator_first_name,
                creator_p.last_name AS creator_last_name,
                wa.assignment_id, wa.employee_id,
                COALESCE(wa.status, 'pending') AS status,
                emp_p.first_name AS employee_first_name,
                emp_p.last_name AS employee_last_name
            FROM works w
            LEFT JOIN users creator_u ON w.created_by = creator_u.user_id
            LEFT JOIN user_profiles creator_p ON w.created_by = creator_p.user_id
            LEFT JOIN work_assignments wa ON w.work_id = wa.work_id
            LEFT JOIN user_profiles emp_p ON wa.employee_id = emp_p.user_id
            WHERE (creator_u.role = 'nurse' OR w.created_by = ?)
        `;

        const queryParams = [req.user_id];
        if (date) {
            query += ` AND w.work_date = ?`;
            queryParams.push(date);
        }
        query += ` ORDER BY w.created_at DESC`;

        const [works] = await db.query(query, queryParams);
        res.status(200).json({ success: true, total: works.length, data: works });
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
};

exports.assignWork = async (req, res) => {
    try {
        const workId = req.params.id;
        const { employee_id } = req.body;

        if (!employee_id) return res.status(400).json({ success: false, message: 'กรุณาระบุพนักงานที่ต้องการจ่ายงานให้' });

        const [works] = await db.query('SELECT work_id FROM works WHERE work_id = ?', [workId]);
        if (works.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลงานนี้' });

        const [assignments] = await db.query('SELECT assignment_id FROM work_assignments WHERE work_id = ?', [workId]);
        if (assignments.length > 0) return res.status(400).json({ success: false, message: 'งานนี้ถูกจ่ายให้พนักงานไปแล้ว' });

        await db.query(
            'INSERT INTO work_assignments (work_id, employee_id, status) VALUES (?, ?, ?)',
            [workId, employee_id, 'pending']
        );

        res.status(201).json({ success: true, message: 'จ่ายงานให้พนักงานสำเร็จ' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
};

exports.getWorkStatus = async (req, res) => {
    try {
        const query = `
            SELECT 
                COALESCE(wa.status, 'pending') AS status,
                COUNT(w.work_id) AS total_count
            FROM works w
            LEFT JOIN users creator_u ON w.created_by = creator_u.user_id
            LEFT JOIN work_assignments wa ON w.work_id = wa.work_id
            WHERE (creator_u.role = 'nurse' OR w.created_by = ?)
            GROUP BY COALESCE(wa.status, 'pending')
        `;

        const [statusSummary] = await db.query(query, [req.user_id]);
        const allStatus = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];
        
        const formattedResult = allStatus.map(statusKey => {
            const found = statusSummary.find(item => item.status === statusKey);
            return { status: statusKey, count: found ? parseInt(found.total_count) : 0 };
        });

        res.status(200).json({ success: true, data: formattedResult });
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
};

exports.cancelWork = async (req, res) => {
    try {   
        const workId = req.params.id;
        
        const [work] = await db.query(`
            SELECT w.created_by, u.role FROM works w 
            JOIN users u ON w.created_by = u.user_id 
            WHERE w.work_id = ? AND (u.role = 'nurse' OR w.created_by = ?)
        `, [workId, req.user_id]);

        if (work.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบงาน หรือไม่มีสิทธิ์ยกเลิกงานนี้' });

        const [assignment] = await db.query('SELECT assignment_id FROM work_assignments WHERE work_id = ?', [workId]);
        
        if (assignment.length > 0) {
            await db.query('UPDATE work_assignments SET status = "cancelled" WHERE work_id = ?', [workId]);
            res.status(200).json({ success: true, message: 'ยกเลิกการจ่ายงานเรียบร้อยแล้ว' });
        } else {
            if (work[0].created_by === req.user_id) {
                await db.query('DELETE FROM works WHERE work_id = ?', [workId]);
                res.status(200).json({ success: true, message: 'ลบงานที่คุณสร้างเรียบร้อยแล้ว' });
            } else {
                res.status(400).json({ success: false, message: 'งานของแผนกที่ยังไม่จ่ายงาน ไม่สามารถยกเลิกได้ กรุณาจ่ายงานก่อน' });
            }
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
};

exports.updateManagerPassword = async (req, res) => {
    try {
        const { newPass } = req.body;
        if (!newPass) return res.status(400).json({ success: false, message: 'กรุณากรอกรหัสผ่านใหม่' });

        const [users] = await db.query('SELECT password_reset_count FROM users WHERE user_id = ?', [req.user_id]);
        if (users.length === 0) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งาน' });            

        if (users[0].password_reset_count > 0) {
            return res.status(403).json({ success: false, message: 'คุณได้ตั้งรหัสผ่านไปแล้ว หากลืมรหัสผ่านกรุณาแจ้ง Admin' });
        }

        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPass, salt);
        
        await db.query(
            'UPDATE users SET password_hash = ?, password_reset_count = password_reset_count + 1 WHERE user_id = ?', 
            [newPasswordHash, req.user_id]
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
                w.work_id, w.title, wa.status, wa.updated_at AS status_changed_at,
                emp_p.first_name AS employee_first_name
            FROM works w
            LEFT JOIN users creator_u ON w.created_by = creator_u.user_id
            INNER JOIN work_assignments wa ON w.work_id = wa.work_id
            LEFT JOIN user_profiles emp_p ON wa.employee_id = emp_p.user_id
            WHERE (creator_u.role = 'nurse' OR w.created_by = ?)
        `;

        const queryParams = [req.user_id];
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