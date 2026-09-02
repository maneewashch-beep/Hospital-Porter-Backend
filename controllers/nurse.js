const db = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto'); 

exports.getProfile = async (req, res) => {
    try {
        const [profile] = await db.query('SELECT * FROM user_profiles WHERE user_id = ?', [req.user.id]);

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

        const [uProfile] = await db.query('SELECT * FROM user_profiles WHERE user_id = ?', [req.user.id]);
        if (uProfile.length > 0) {
            return res.status(400).json({ success: false, message: 'คุณสร้างข้อมูลไปแล้ว' });
        }

        const profileId = crypto.randomUUID();

        await db.query(
            'INSERT INTO user_profiles (profile_id, user_id, prename, first_name, last_name, image_url, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [profileId, req.user.id, prename, fname, lname, img || null, phone || null]
        );
        
        res.status(201).json({ success: true, message: 'สร้างข้อมูลสำเร็จ' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { prename, fname, lname, img, phone } = req.body;

        const [uProfile] = await db.query('SELECT * FROM user_profiles WHERE user_id = ?', [req.user.id]);
        if (uProfile.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลผู้ใช้งาน' });
        }

        await db.query(
            'UPDATE user_profiles SET prename = ?, first_name = ?, last_name = ?, image_url = ?, phone_number = ? WHERE user_id = ?',
            [prename, fname, lname, img, phone, req.user.id]
        );

        res.status(200).json({ success: true, message: 'บันทึกข้อมูลสำเร็จ' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
};

exports.getHistory = async (req, res) => {
    try {
        const query = `
            SELECT
                w.work_id,
                w.title,
                w.description,
                w.work_date,
                w.created_at,
                wa.assignment_id,
                wa.status,
                wa.updated_at AS status_updated_at,
                emp_p.prename AS employee_prename,
                emp_p.first_name AS employee_first_name,
                emp_p.last_name AS employee_last_name,
                emp_p.phone_number AS employee_phone
            FROM works w
            LEFT JOIN work_assignments wa ON w.work_id = wa.work_id
            LEFT JOIN user_profiles emp_p ON wa.employee_id = emp_p.user_id
            WHERE w.created_by = ?
            ORDER BY w.created_at DESC
        `;

        const [history] = await db.query(query, [req.user.id]);

        res.status(200).json({ success: true, total: history.length, data: history });
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
};

exports.getTotalHistory = async (req, res) => {
    try {
        const query = `
            SELECT 
                w.work_id,
                w.title,
                w.description,
                w.work_date,
                w.created_at,
                wa.status,
                COUNT(wa.assignment_id) AS total_assignments
            FROM works w
            LEFT JOIN work_assignments wa ON w.work_id = wa.work_id
            WHERE w.created_by = ?
            GROUP BY w.work_id, wa.status
            ORDER BY w.created_at DESC
        `;

        const [totalHistory] = await db.query(query, [req.user.id]);

        res.status(200).json({ success: true, data: totalHistory });
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
};

exports.updateWardPassword = async (req, res) => {
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
            return res.status(403).json({ success: false, message: 'คุณได้ตั้งรหัสผ่านไปแล้ว หากลืมรหัสผ่านกรุณาแจ้ง Admin' });
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

exports.createWorks = async (req, res) => {
    try {
        const { title, origin, destination, equipment_type, work_date, work_time, description } = req.body;

        if (!title || !origin || !destination || !equipment_type || !work_date) {
            return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (*)' });
        }

        const [result] = await db.query(
            'INSERT INTO works (title, origin, destination, equipment_type, work_date, work_time, description, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [title, origin, destination, equipment_type, work_date, work_time || null, description || null, req.user.id]
        );

        res.status(201).json({ 
            success: true, 
            message: 'สร้างงานสำเร็จ',
            data: {
                work_id: result.insertId,
                title,
                origin,
                destination,
                equipment_type,
                work_date,
                work_time,
                description,
                created_by: req.user.id 
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
};

exports.updateWork = async (req, res) => {
    try {
        const workId = req.params.id;
        const { title, origin, destination, equipment_type, work_date, work_time, description } = req.body;

        if (!title || !origin || !destination || !equipment_type || !work_date) {
            return res.status(400).json({ success: false, message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (*)' });
        }

        const [existingWork] = await db.query('SELECT work_id FROM works WHERE work_id = ? AND created_by = ?', [workId, req.user.id]);
        
        if (existingWork.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลงาน หรือไม่มีสิทธิ์แก้ไขงานนี้' });
        }

        const [assignment] = await db.query('SELECT * FROM work_assignments WHERE work_id = ?', [workId]);
        if (assignment.length > 0) {
            return res.status(403).json({ success: false, message: 'ไม่สามารถแก้ไขได้ เนื่องจาก Manager จ่ายงานนี้แล้ว' });
        }

        await db.query(
            'UPDATE works SET title = ?, origin = ?, destination = ?, equipment_type = ?, work_date = ?, work_time = ?, description = ? WHERE work_id = ? AND created_by = ?',
            [title, origin, destination, equipment_type, work_date, work_time || null, description || null, workId, req.user.id]
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
                w.work_id,
                w.title,
                w.description,
                w.work_date,
                w.created_at,
                w.updated_at,
                w.origin, 
                w.destination, 
                w.equipment_type, 
                w.work_time,
                wa.assignment_id,
                wa.employee_id,
                w.cancel_reason,
                COALESCE(wa.status, 'pending') AS status,
                emp_p.prename AS employee_prename,
                emp_p.first_name AS employee_first_name,
                emp_p.last_name AS employee_last_name,
                emp_p.phone_number AS employee_phone
            FROM works w
            LEFT JOIN work_assignments wa ON w.work_id = wa.work_id
            LEFT JOIN user_profiles emp_p ON wa.employee_id = emp_p.user_id
            WHERE w.created_by = ?
        `;

        const queryParams = [req.user.id];
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

exports.getWorkStatus = async (req, res) => {
    try {
        const query = `
            SELECT 
                COALESCE(wa.status, 'pending') AS status,
                COUNT(w.work_id) AS total_count
            FROM works w
            LEFT JOIN work_assignments wa ON w.work_id = wa.work_id
            WHERE w.created_by = ?
            GROUP BY COALESCE(wa.status, 'pending')
        `;

        const [statusSummary] = await db.query(query, [req.user.id]);
        
        const allStatus = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];
        
        const formattedResult = allStatus.map(statusKey => {
            const found = statusSummary.find(item => item.status === statusKey);
            return {
                status: statusKey,
                count: found ? parseInt(found.total_count) : 0
            };
        });

        res.status(200).json({ success: true, data: formattedResult });
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
};

exports.cancelWork = async (req, res) => {
    try {   
        const workId = req.params.id;
        const { reason } = req.body;
        const [work] = await db.query(
            'SELECT work_id FROM works WHERE work_id = ? AND created_by = ?',
            [workId, req.user.id]
        );

        if (work.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบข้อมูล หรือไม่มีสิทธิ์ยกเลิกงานนี้' });
        }

        const [assignment] = await db.query('SELECT assignment_id FROM work_assignments WHERE work_id = ?', [workId]);
        
        if (assignment.length > 0) {
            return res.status(403).json({ success: false, message: 'ไม่สามารถยกเลิกได้ เนื่องจาก Manager จ่ายงานนี้แล้ว' });
        } else {
            await db.query(
                'UPDATE works SET cancel_reason = ? WHERE work_id = ?',
                [reason, workId]
            );

            await db.query(
                'INSERT INTO work_assignments (work_id, status) VALUES (?, "cancelled")',
                [workId]
            );

            res.status(200).json({ success: true, message: 'ยกเลิกงานและบันทึกเหตุผลเรียบร้อยแล้ว' });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาด', error: error.message });
    }
};

exports.getNotifications = async (req, res) => {
    try {
        const { status } = req.query;
        let query = `
            SELECT 
                w.work_id,
                w.title,
                w.work_date,
                wa.status,
                wa.updated_at AS status_changed_at,
                emp_p.first_name AS employee_first_name,
                emp_p.last_name AS employee_last_name
            FROM works w
            INNER JOIN work_assignments wa ON w.work_id = wa.work_id
            LEFT JOIN user_profiles emp_p ON wa.employee_id = emp_p.user_id
            WHERE w.created_by = ?
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