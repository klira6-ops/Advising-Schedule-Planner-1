const express = require("express");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Database connection pool
const db = mysql.createPool({
    host: "localhost",          // ← just the hostname
    user: "",
    password: "",
    database: "advising_schedule_planner_db",
    waitForConnections: true,
    connectionLimit: 10
});

// ---------- LOGIN ----------
app.post("/login", async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: "Missing email, password, or role" });
    }

    // Pick the right table and columns based on role
    const config = role === "advisor"
        ? {
            table: "Advisor",
            idCol: "Advisor_ID",
            emailCol: "advisor_email",
            nameCol: "advisor_name",
            passwordCol: "advisor_password"
        }
        : {
            table: "Student",
            idCol: "student_id",
            emailCol: "student_email",
            nameCol: "student_name",
            passwordCol: "student_password"
        };

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
            return res.status(401).json({ message: "Invalid email or password" });
        }

        const user = rows[0];

        const passwordMatch = (password === user.password);

        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Success — return user info (never send the password back)
        res.json({
            message: "Login successful",
            id: user.id,
            name: user.name,
            email: user.email,
            role: role
        });
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ---------- REGISTER ----------
app.post("/register", async (req, res) => {
    const { name, email, password, role, phone } = req.body;

    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    try {

        if (role === "advisor") {
            await db.query(
                `INSERT INTO Advisor (advisor_name, advisor_email, advisor_password, advisor_phone)
                 VALUES (?, ?, ?, ?)`,
                [name, email, hashedPassword, phone || null]
            );
        } else {
            await db.query(
                `INSERT INTO Student (student_name, student_email, student_password)
                 VALUES (?, ?, ?)`,
                [name, email, hashedPassword]
            );
        }

        res.json({ message: "Registration successful" });
    } catch (error) {
        // MySQL duplicate-key error (because email is UNIQUE)
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({ message: "Email is already registered" });
        }
        console.error("Register error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ---------- CREATE APPOINTMENT ----------
app.post("/appointments", async (req, res) => {
    const { studentEmail, advisorName, appointmentTime, priority } = req.body;

    if (!studentEmail || !advisorName || !appointmentTime || !priority) {
        return res.status(400).json({ message: "Missing required appointment fields" });
    }

    try {
        // 1. Look up the student's ID from their email
        const [studentRows] = await db.query(
            "SELECT student_id FROM Student WHERE student_email = ?",
            [studentEmail]
        );
        if (studentRows.length === 0) {
            return res.status(404).json({ message: "Student not found" });
        }
        const studentId = studentRows[0].student_id;

        // 2. Look up the advisor's ID from their name
        const [advisorRows] = await db.query(
            "SELECT Advisor_ID FROM Advisor WHERE advisor_name = ?",
            [advisorName]
        );
        if (advisorRows.length === 0) {
            return res.status(404).json({ message: "Advisor not found" });
        }
        const advisorId = advisorRows[0].Advisor_ID;

        // 3. Compute end_time as 30 minutes after start time
        const startTime = new Date(appointmentTime);
        const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

        // 4. Insert the appointment
        await db.query(
            `INSERT INTO Appointments
                (student_student_id, Advisor_Advisor_ID, priority_slot,
                 appointment_time, end_time, status)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [studentId, advisorId, priority, startTime, endTime, "pending"]
        );

        res.json({ message: "Appointment added to queue" });
    } catch (error) {
        console.error("Appointment error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ---------- GET QUEUE ----------
app.get("/appointments", async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT a.appointment_id,
                    a.appointment_time,
                    a.priority_slot AS priority,
                    a.status,
                    s.student_name,
                    adv.advisor_name
             FROM Appointments a
             JOIN Student s ON a.student_student_id = s.student_id
             JOIN Advisor adv ON a.Advisor_Advisor_ID = adv.Advisor_ID
             WHERE a.status = 'pending'
             ORDER BY a.priority_slot ASC, a.time_created ASC`
        );

        res.json(rows);
    } catch (error) {
        console.error("Queue load error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

app.get("/advisors", async (req, res) => {
    try {
        const [rows] = await db.query(
            "SELECT Advisor_ID, advisor_name FROM Advisor ORDER BY advisor_name"
        );
        res.json(rows);
    } catch (error) {
        console.error("Advisors load error:", error);
        res.status(500).json({ message: "Server error" });
    }
});

// ---------- START SERVER ----------
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});