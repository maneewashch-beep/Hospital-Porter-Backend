const cors = require('cors');
const express = require('express')
require('dotenv').config();

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

const AuthRouter = require('./routes/auth');
app.use('/api', AuthRouter)

const NurseRouter = require('./routes/nurse');
app.use('/api', NurseRouter)

const EmployeeRouter = require('./routes/employee');
app.use('/api/employee', EmployeeRouter)

const SuperVisorRouter = require('./routes/supervisor');
app.use('/api/supervisor', SuperVisorRouter)

const ManagerRouter = require('./routes/manager');
app.use('/api/manager', ManagerRouter)

const AdminRouter = require('./routes/admin');
app.use('/api/admin', AdminRouter)

app.listen(process.env.PORT, () => 
    console.log(`Server running on port ${process.env.PORT}!`)
)