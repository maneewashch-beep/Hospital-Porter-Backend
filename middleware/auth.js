require('dotenv').config();
const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.SECRET_KEY
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization']

    if(!authHeader) {
        res.status(401).json({ success: false, message: 'ไม่พบ Token' })
    }

    const token = authHeader.split(' ')[1]
    if (!token) {
        res.status(401).json({ success: false, message: 'รูปแบบ Token ไม่ถูกต้อง'})
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            res.status(401).json({ success: false, message: 'Token หมดอายุ' })
        }
        req.user = decoded
        next()
    })
}

exports.authorize = (allowedRoles = []) =>{
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            res.status(401).json({ success: false, message: 'คุณไม่มีสิทธิ์เข้าถึง' })
        }
        next()
    }
}