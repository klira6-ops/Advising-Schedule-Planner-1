const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "lucky123", 
    database: "advising_schedule_planner_db", // <-- Make sure this matches schema.sql
    waitForConnections: true,
    connectionLimit: 10
});

(async () => {
    try {
        const connection = await db.getConnection();
        console.log("Connected to MySQL database");
        connection.release();
    } catch (error) {
        console.error("Database connection failed:", error.message);
    }
})();

// REGISTER
app.post("/register", async (req, res) => {
    const { name, email, password, role, phone, specialization } = req.body; // Add specialization here

    if (!name || !email || !password || !role) {
        return res.status(400).json({
            message: "Missing required fields"
        });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        if (role === "advisor") {
            // Updated to save the chosen role/specialty column
            await db.query(
                `INSERT INTO Advisor
                 (advisor_name, advisor_email, advisor_password, advisor_phone, advisor_role)
                 VALUES (?, ?, ?, ?, ?)`,
                [name, email, hashedPassword, phone || null, specialization || "General"]
            );
        } else if (role === "student") {
            await db.query(
                `INSERT INTO Student
                 (student_name, student_email, student_password)
                 VALUES (?, ?, ?)`,
                [name, email, hashedPassword]
            );
        } else {
            return res.status(400).json({
                message: "Invalid role"
            });
        }

        res.json({
            message: "Registration successful"
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                message: "Email is already registered"
            });
        }

        console.error("Register error:", error);
        res.status(500).json({
            message: "Server error during registration"
        });
    }
});

// LOGIN
app.post("/login", async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({
            message: "Missing email, password, or role"
        });
    }

    const config =
        role === "advisor"
            ? {
                table: "Advisor",
                idCol: "Advisor_ID",
                emailCol: "advisor_email",
                nameCol: "advisor_name",
                passwordCol: "advisor_password"
            }
            : role === "student"
            ? {
                table: "Student",
                idCol: "student_id",
                emailCol: "student_email",
                nameCol: "student_name",
                passwordCol: "student_password"
            }
            : null;

    if (!config) {
        return res.status(400).json({
            message: "Invalid role"
        });
    }

    try {
        const [rows] = await db.query(
            `SELECT ${config.idCol} AS id,
                    ${config.nameCol} AS name,
                    ${config.emailCol} AS email,
                    ${config.passwordCol} AS password
             FROM ${config.table}
             WHERE ${config.emailCol} = ?`,
            [email]
        );

        if (rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = rows[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        res.json({
            message: "Login successful",
            id: user.id,
            name: user.name,
            email: user.email,
            role
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            message: "Server error during login"
        });
    }
});

// GET ADVISORS
app.get("/advisors", async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT Advisor_ID, advisor_name
             FROM Advisor
             ORDER BY advisor_name`
        );

        res.json(rows);

    } catch (error) {
        console.error("Advisors load error:", error);
        res.status(500).json({
            message: "Server error loading advisors"
        });
    }
});

// CREATE APPOINTMENT
app.post("/appointments", async (req, res) => {
    const {
        studentName,
        studentEmail,
        advisorName,
        appointmentTime,
        priority
    } = req.body;

    if (!studentEmail || !advisorName || !appointmentTime || !priority) {
        return res.status(400).json({
            message: "Missing required appointment fields"
        });
    }

    try {
        let studentId;

        const [studentRows] = await db.query(
            `SELECT student_id
             FROM Student
             WHERE student_email = ?`,
            [studentEmail]
        );

        if (studentRows.length === 0) {
            const [insertStudent] = await db.query(
                `INSERT INTO Student
                 (student_name, student_email, student_password)
                 VALUES (?, ?, ?)`,
                [studentName || "Unknown Student", studentEmail, "temporary"]
            );

            studentId = insertStudent.insertId;
        } else {
            studentId = studentRows[0].student_id;
        }

        const [advisorRows] = await db.query(
            `SELECT Advisor_ID
             FROM Advisor
             WHERE advisor_name = ?`,
            [advisorName]
        );

        if (advisorRows.length === 0) {
            return res.status(404).json({
                message: "Advisor not found. Please register this advisor first."
            });
        }

        const advisorId = advisorRows[0].Advisor_ID;

        const startTime = new Date(appointmentTime);
        const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

        const [conflicts] = await db.query(
            `SELECT appointment_id
             FROM Appointments
             WHERE Advisor_Advisor_ID = ?
             AND status = 'Waiting'
             AND appointment_time < ?
             AND end_time > ?`,
            [advisorId, endTime, startTime]
        );

        if (conflicts.length > 0) {
            return res.status(409).json({
                message: "This appointment time is already taken."
            });
        }

        await db.query(
            `INSERT INTO Appointments
             (student_student_id, Advisor_Advisor_ID, priority_slot, appointment_time, end_time, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [studentId, advisorId, priority, startTime, endTime, "Waiting"]
        );

        res.json({
            message: "Appointment added to queue"
        });

    } catch (error) {
        console.error("Appointment error:", error);
        res.status(500).json({
            message: "Server error creating appointment"
        });
    }
});

// GET APPOINTMENTS
app.get("/appointments", async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT a.appointment_id AS id,
                    s.student_name,
                    s.student_email,
                    adv.advisor_name,
                    a.appointment_time,
                    a.end_time,
                    a.priority_slot AS priority,
                    a.status,
                    a.time_created AS created_at
             FROM Appointments a
             JOIN Student s ON a.student_student_id = s.student_id
             JOIN Advisor adv ON a.Advisor_Advisor_ID = adv.Advisor_ID
             WHERE a.status = 'Waiting'
             ORDER BY a.priority_slot ASC, a.time_created ASC`
        );

        res.json(rows);

    } catch (error) {
        console.error("Queue load error:", error);
        res.status(500).json({
            message: "Server error loading appointments"
        });
    }
});

app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});