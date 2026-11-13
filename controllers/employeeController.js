
const db = require("../config/db");

// Reusable input validation
const validateEmployee = (data) => {
    const { name, email, department, salary } = data;

    if (
        typeof name !== "string" ||
        typeof email !== "string" ||
        typeof department !== "string" ||
        salary === undefined ||
        salary === null ||
        name.trim() === "" ||
        email.trim() === "" ||
        department.trim() === "" ||
        String(salary).trim() === ""
    ) {
        return "All fields are required.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email.trim())) {
        return "Please enter a valid email address.";
    }

    const salaryValue = Number(salary);

    if (!Number.isFinite(salaryValue) || salaryValue < 0) {
        return "Salary must be a valid non-negative number.";
    }

    if (name.trim().length > 100) {
        return "Name cannot exceed 100 characters.";
    }

    if (email.trim().length > 100) {
        return "Email cannot exceed 100 characters.";
    }

    if (department.trim().length > 100) {
        return "Department cannot exceed 100 characters.";
    }

    return null;
};

// Handle database errors
const handleDatabaseError = (err, res) => {
    console.error("Database Error:", err);

    if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
            message: "This email address is already registered."
        });
    }

    return res.status(500).json({
        message: "Internal server error."
    });
};

// GET all employees
exports.getEmployees = (req, res) => {
    const sql = "SELECT * FROM employees ORDER BY employee_id DESC";

    db.query(sql, (err, result) => {
        if (err) {
            return handleDatabaseError(err, res);
        }

        res.status(200).json(result);
    });
};

// POST - Add employee
exports.addEmployee = (req, res) => {
    const validationError = validateEmployee(req.body);

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }

    const { name, email, department, salary } = req.body;

    const sql = `
        INSERT INTO employees
        (name, email, department, salary)
        VALUES (?, ?, ?, ?)
    `;

    db.query(
        sql,
        [
            name.trim(),
            email.trim(),
            department.trim(),
            Number(salary)
        ],
        (err, result) => {
            if (err) {
                return handleDatabaseError(err, res);
            }

            res.status(201).json({
                message: "Employee added successfully.",
                employeeId: result.insertId
            });
        }
    );
};

// PUT - Update employee
exports.updateEmployee = (req, res) => {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
        return res.status(400).json({
            message: "Invalid employee ID."
        });
    }

    const validationError = validateEmployee(req.body);

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }

    const { name, email, department, salary } = req.body;

    const sql = `
        UPDATE employees
        SET name = ?, email = ?, department = ?, salary = ?
        WHERE employee_id = ?
    `;

    db.query(
        sql,
        [
            name.trim(),
            email.trim(),
            department.trim(),
            Number(salary),
            Number(id)
        ],
        (err, result) => {
            if (err) {
                return handleDatabaseError(err, res);
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    message: "Employee not found."
                });
            }

            res.status(200).json({
                message: "Employee updated successfully."
            });
        }
    );
};

// DELETE - Delete employee
exports.deleteEmployee = (req, res) => {
    const { id } = req.params;

    if (!/^[1-9]\d*$/.test(id)) {
        return res.status(400).json({
            message: "Invalid employee ID."
        });
    }

    const sql = "DELETE FROM employees WHERE employee_id = ?";

    db.query(sql, [Number(id)], (err, result) => {
        if (err) {
            return handleDatabaseError(err, res);
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: "Employee not found."
            });
        }

        res.status(200).json({
            message: "Employee deleted successfully."
        });
    });
};
