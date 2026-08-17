const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.getProfile = async (req, res) => {
    try {
        const [profile] = await db.query('SELECT * FROM user_profiles WHERE user_id = ?', [req.user_id])

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

        const [U_profile] = await db.query('SELECT * FROM user_profiles WHERE user_id = ?', [req.user_id])
        if (U_profile.length > 0) {
            return res.status(400).json({ success: false, message: 'คุณสร้างข้อมูลไปแล้ว'})
        }

        await db.query (
            'INSERT INTO user_profiles (user_id , first_name , last_name, image_url , phone_number) VALUES (?, ?, ?, ?, ?)',
            [req.user_id , fname, lname, img, phone]
        ) 
        
        res.status(201).json({ success: true, message: 'สร้างข้อมูลสำเร็จ'})
    } catch (error) {
        res.status(500).json({ success: false , message: 'เกิดข้อผืดพลาด' , error: error.message })
    }
}

exports.updateProfile = async (req, res) => {
    try {
        const { fname , lname , img , phone } = req.body

        const [U_profile] = await db.query('SELECT * FROM user_profiles WHERE user_id = ?', [req.user_id])
        if (U_profile.length === 0) {
            return res.status(400).json({ success: false , message: 'ไม่พบข้อมูลผู้ใช้งาน'})
        }

        await db.query(
            'UPDATE user_profiles SET fname = ? , lname = ? , img = ? , phone = ? WHERE user_id = ?',
            [fname, lname, img, phone, req.user_id]
        )

        res.status(201).json({ success: true, message: 'บันทึกข้อมูลสำเร็จ' })
    } catch (error) {
        res.status(500).json({ success: false , message: 'เกิดข้อผืดพลาด' , error: error.message })
    }
}

exports.getHistory = async (req, res) => {
    try {
        const query = `
            SELECT
                w.work_id,
                w.tital,
                w.description,
                w.work_date,
                w.created_at,
                wa.assignment_id,
                wa.status,
                wa.updated_at AS status_updated_at,
                emp_p.first_name AS employee_first_name,
                emp_p.last_name AS employee_last_name,
                emp_p.phone_name AS employee_phone
            FROM works w
            LEFT JOIN work_assignments wa ON w.word_id = wa.word_id
            LEFT JOIN user_profiles emp_p ON wa.employee_id = emp_p.user_id
            WHERE w.created_by = ?
            ORDER BY w.created_at DESC
        `

        const [history] = await db.query(query, [req.user_id])

        res.status(200).json({
            success: true,
            total:  history.length,
            data: history
        })
    } catch (error) {
        res.status(500).json({ success: false , message: 'เกิดข้อผืดพลาด' , error: error.message })
    }
}

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
            GROUP BY w.work_id
            ORDER BY w.created_at DESC
        `

        const [totalhistory] = await db.query(query, [req.user_id])

        res.status(200).json({
            success: true,
            data: totalhistory
        })
    } catch (error) {
        res.status(500).json({ success: false , message: 'เกิดข้อผืดพลาด' , error: error.message })
    }
}

exports.ResetPassword = async (req, res) => {
    try {
        const {oldPass, newPass} = req.body

        if (!oldPass || !newPass) {
            return res.status(400).json({ success: false, message: 'กรุณากรอกรหัสผ่าน'})
        }

        const [users] = await db.query('SELECT password_hash FROM users WHERE user_id = ?',[req.user_id])
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้งาน'})            
        }

        const user = users[0]
        const isMatch = await bcrypt.compare(oldPass, user.password_hash)
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'รหัสผ่านไม่ถูกต้อง' })
        }

        const salt = await bcrypt.genSalt(10)
        const  newPasswordHash = await bcrypt.hash(newPass, salt)
        
        await db.query(
            'UPDATE users SET password_hash = ?, password_reset_count = password_reset_count + 1 WHERE user_id = ?', 
            [newPasswordHash, req.user_id]
        )

        res.status(200).json({ success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จ'})
    } catch (error) {
        res.status(500).json({ success: false , message: 'เกิดข้อผืดพลาด' , error: error.message })
    }
}

exports.createWorks = async (req, res) => {
    try {
        const { title , description, work_date } = req.body

        if (!title || !work_date) {
            return res.status(400).json({ success: false , message: 'กรุณากรอกหัวข้อผู้ป่วย/งาน และวันที่ปฏิบัติงาน'})
        }

        const [result] = await db.query(
            'INSERT INTO works (title, description, work_date, created_by) VALUES (?, ?, ?, ?)',
            [title , description || null , work_date, req.user_id]
        )

        res.status(201).json({ 
            success: true , 
            message: 'สร้างงานสำเร็จ',
            data: {
                work_id: result.insertId,
                title,
                description,
                work_date,
                created_by: req.user.id
            }
        })
    } catch (error) {
        res.status(500).json({ success: false , message: 'เกิดข้อผืดพลาด' , error: error.message })
    }
}

exports.updateWork = async (req, res) => {
    try {
        const workId = req.params.id
        const { title , description, work_date } = req.body

        const [existingWork] = await db.query('SELECT work_id FROM works WHERE work_id = ? AND created_by = ?',
            [workId, req.user_id]
        )
        if (existingWork.length === 0) {
            return res.status(404).json({ success: false , message: 'ไม่พบข้อมูลงาน และไม่มีสิทธิ์แก้ไขงาน'})
        }

        await db.query(
            'UPDATE work SET title = ?, description = ?, work_date = ?, WHERE work_id = ? AND created_by = ?',
            [title, description, work_date, workId, req.user_id]
        )

        res.status(200).json({ success: true, message: 'แก่ไขข้อมูลสำเร็จ'})
    } catch (error) {
        res.status(500).json({ success: false , message: 'เกิดข้อผืดพลาด' , error: error.message })
    }
}

exports.getWorks = async (req, res) => {
    try {
        const { date } = req.body
        let query = `
            SELECT 
                w.work_id,
                w.title,
                w.description,
                w.work_date,
                w.created_at,
                w.updated_at,
                wa.assignment_id,
                wa.employee_id,
                COALESCE(wa.status, 'pending') AS status,
                emp_p.first_name AS employee_first_name,
                emp_p.last_name AS employee_last_name,
                emp_p.phone_number AS employee_phone
            FROM works w
            LEFT JOIN work_assignments wa ON w.work_id = wa.work_id
            LEFT JOIN user_profiles emp_p ON wa.employee_id = emp_p.user_id
            WHERE w.created_by = ?
        `

        const queryParams = [req.user_id]
        if (date) {
            query += `AND w.work_date = ?`
            queryParams.push(date)
        }

        query += ` ORDER BY w.created_at DESC`

        const [works] = await db.query(query, queryParams)
        res.status(200).json({ success: true, total: works.length, data: works })
    } catch (error) {
        res.status(500).json({ success: false , message: 'เกิดข้อผืดพลาด' , error: error.message })
    }
}

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
        `

        const [status] = await db.query(query, [req.user_id])
        
        const allStatus = ['pending','accepted','in_progress','completed','cancelled'];
        const formattedResult = allStatus.map(statusKey => {
            const found = statusSummary.find(item => item.status === statusKey)
            return {
                status: statusKey,
                count: found ? parseInt(found.total_count) : 0
            }
        })
        res.status(200).json({ success: true, data: formattedResult })
    } catch (error) {
        res.status(500).json({ success: false , message: 'เกิดข้อผืดพลาด' , error: error.message })
    }
}

exports.cancelWork = async (req, res) => {
    try {   
        const workId = req.params.id;
        const [work] = await db.query(
            'SELECT work_id FROM works WHERE work_id = ? AND created_by = ?',
            [workId, req.user_id]
        )

        if (work.length === 0) {
            return res.status(404).json({success: false, message: 'ไม่พบข้อมูล และไม่มีสิทธิ์แก้ไขงาน'})
        }

        const [assignment] = await db.query('SELECT assignment_id FROM work_assignments WHERE work_id = ?', [workId]) 
        if (assignment.length > 0) {
            await db.query(
                'UPDATE work_assignments SET status = "cancelled" WHERE work_id = ?',
                [workId]
            )
        } else {
            await db.query(
                'INSERT INTO work_assignments (work_id, employee_id, status) VALUES (?, ?, "cancelled")',
                [workId, req.user_id]
            )
        }
        res.status(200).json({ success: true, message: 'ยกเลิกรายการเรียบร้อย'})
    } catch (error) {
        res.status(500).json({ success: false , message: 'เกิดข้อผืดพลาด' , error: error.message })
    }
}

exports.getNotifications = async (req, res) => {
    try {
        const { status } = req.query
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
        `

        const queryParams = [req.user_id]
        if (status) { 
            query += ` AND wa.status = ?`
            queryParams.push(status)
        }
        query += ` ORDER BY wa.updated_at DESC LIMIT 20`
        const [notifications] = await db.query(query, queryParams)

        res.status(200).json({ success: true, total: notifications.length , data: notifications})
    } catch (error) {
        res.status(500).json({ success: false , message: 'เกิดข้อผืดพลาด' , error: error.message })
    }
}