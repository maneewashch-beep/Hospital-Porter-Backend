const db = require('../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const SECRET_KEY = process.env.SECRET_KEY

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body
        const [rows] = await db.query('SELECT * FROM users WHERE username = ?' ,[username])
        if (rows.length === 0) {
            return res.status(400).json({ success: false , message: 'ไม่พบผู้ใช้งาน'})
        }

        const user = rows[0]
        // const isMatch = await bcrypt.compare(password_hash, user.password_hash)
        // if (!isMatch) {
        //     res.status(400).json({ success: false, message: 'รหัสผ่านไม่ถูกต้อง'})
        // }

        if(password !== user.password_hash) {
            return res.status(400).json({ success: false, message: 'รหัสผ่านไม่ถูกต้อง'})
        }

        const token = jwt.sign(
            {id: user.user_id , role: user.role, user: user.username},
            SECRET_KEY,
            { expiresIn: '2h' }
        )

        res.status(200).json({
            success: true,
            message: 'เข้าสู่ระบบสำเร็จ',
            data: {
                token: token,
                user: {
                    id: user.user_id ,
                    user: user.username,
                    role: user.role
                }
            }
        })
    } catch (error) {
       res.status(500).json({ success: false , message: 'เกิดข้อผืดพลาด' , error: error.message })
    }
}

exports.logout = async (req, res) => {
    try {
        res.status(200).json({ success: true, message: 'ออกจากระบบสำเร็จ' })
    } catch (error) {
        res.status(500).json({ success: false , message: 'เกิดข้อผืดพลาด' , error: error.message })
    }
}