
import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Building2,
  Settings,
  Bell,
  Search,
  Plus,
  UserCircle,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

import API from "./api";
import "./App.css";

function App() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [activeSection, setActiveSection] = useState("Dashboard");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    department: "",
    salary: "",
  });

  // Fetch employees from backend
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await API.get("/employees");
      setEmployees(response.data);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError("Unable to load employees. Check backend server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Sidebar navigation
  const handleNavigation = (section) => {
    setActiveSection(section);
    setSearch("");
    setError("");
    setSuccess("");
  };

  // Search employees by ID, name, email or department
  const filteredEmployees = employees.filter((employee) => {
    const value = search.trim().toLowerCase();

    return (
      String(employee.employee_id ?? "").toLowerCase().includes(value) ||
      String(employee.name ?? "").toLowerCase().includes(value) ||
      String(employee.email ?? "").toLowerCase().includes(value) ||
      String(employee.department ?? "").toLowerCase().includes(value)
    );
  });

  // Dashboard statistics
  const totalEmployees = employees.length;

  const departments = [
    ...new Set(
      employees.map((employee) => employee.department)
    ),
  ];

  const totalDepartments = departments.length;

  const averageSalary =
    totalEmployees > 0
      ? employees.reduce(
          (total, employee) => total + Number(employee.salary),
          0
        ) / totalEmployees
      : 0;

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Open Add Employee modal
  const openAddForm = () => {
    setEditingId(null);
    setFormError("");

    setFormData({
      name: "",
      email: "",
      department: "",
      salary: "",
    });

    setShowForm(true);
  };

  // Open Edit Employee modal
  const handleEdit = (employee) => {
    setEditingId(employee.employee_id);
    setFormError("");

    setFormData({
      name: employee.name,
      email: employee.email,
      department: employee.department,
      salary: employee.salary,
    });

    setShowForm(true);
  };

  // Add or Update Employee
  const handleSubmit = async (e) => {
    e.preventDefault();

    setFormError("");
    setSuccess("");

    const { name, email, department, salary } = formData;

    if (
      !name.trim() ||
      !email.trim() ||
      !department.trim() ||
      salary === ""
    ) {
      setFormError("Please fill in all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError("Please enter a valid email address.");
      return;
    }

    if (!Number.isFinite(Number(salary)) || Number(salary) < 0) {
      setFormError("Please enter a valid salary.");
      return;
    }

    const employeeData = {
      name: name.trim(),
      email: email.trim(),
      department: department.trim(),
      salary: Number(salary),
    };

    try {
      setSaving(true);

      if (editingId !== null) {
        await API.put(`/employees/${editingId}`, employeeData);
        setSuccess("Employee updated successfully!");
      } else {
        await API.post("/employees", employeeData);
        setSuccess("Employee added successfully!");
      }

      setShowForm(false);
      setEditingId(null);

      await fetchEmployees();
      setActiveSection("Employees");
    } catch (err) {
      console.error("Save Error:", err);

      setFormError(
        err.response?.data?.message || "Unable to save employee."
      );
    } finally {
      setSaving(false);
    }
  };

  // Delete Employee
  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this employee?"
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await API.delete(`/employees/${id}`);

      setSuccess("Employee deleted successfully!");
      await fetchEmployees();
    } catch (err) {
      console.error("Delete Error:", err);

      setError(
        err.response?.data?.message || "Unable to delete employee."
      );
    }
  };

  // Reusable Employee Table
  const renderEmployeeTable = () => (
    <>
      <div className="table-toolbar">
        <div className="search-box">
          <Search size={18} />

          <input
            type="search"
            placeholder="Search by ID, name, email or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              title="Clear search"
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <X size={17} />
            </button>
          )}
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Salary</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  Loading employees...
                </td>
              </tr>
            ) : filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-state">
                  {search
                    ? "No matching employees found."
                    : "No employees found. Add your first employee!"}
                </td>
              </tr>
            ) : (
              filteredEmployees.map((employee) => (
                <tr key={employee.employee_id}>
                  <td>{employee.employee_id}</td>
                  <td>{employee.name}</td>
                  <td>{employee.email}</td>
                  <td>{employee.department}</td>
                  <td>
                    ₹{Number(employee.salary).toLocaleString("en-IN")}
                  </td>
                  <td>
                    <button
                      title="Edit employee"
                      onClick={() => handleEdit(employee)}
                      style={actionButtonStyle}
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      title="Delete employee"
                      onClick={() => handleDelete(employee.employee_id)}
                      style={deleteButtonStyle}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );

  // Reusable Employee Management section
  const renderEmployeeSection = () => (
    <section className="employee-section">
      <div className="section-header">
        <div>
          <h2>Employee Management</h2>
          <p>Manage and monitor your employees.</p>
        </div>

        <button className="add-button" onClick={openAddForm}>
          <Plus size={18} />
          Add Employee
        </button>
      </div>

      {success && <p className="success-message">{success}</p>}
      {error && <p className="error-message">{error}</p>}

      {renderEmployeeTable()}
    </section>
  );

  return (
    <div className="dashboard">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo">
          EMS<span>.</span>
        </h2>

        <p className="menu-title">MENU</p>

        <nav>
          <button
            className={`nav-link ${
              activeSection === "Dashboard" ? "active" : ""
            }`}
            onClick={() => handleNavigation("Dashboard")}
          >
            <LayoutDashboard size={19} />
            Dashboard
          </button>

          <button
            className={`nav-link ${
              activeSection === "Employees" ? "active" : ""
            }`}
            onClick={() => handleNavigation("Employees")}
          >
            <Users size={19} />
            Employees
          </button>

          <button
            className={`nav-link ${
              activeSection === "Departments" ? "active" : ""
            }`}
            onClick={() => handleNavigation("Departments")}
          >
            <Building2 size={19} />
            Departments
          </button>

          <button
            className={`nav-link ${
              activeSection === "Settings" ? "active" : ""
            }`}
            onClick={() => handleNavigation("Settings")}
          >
            <Settings size={19} />
            Settings
          </button>
        </nav>

        <div className="sidebar-footer">
          <UserCircle size={35} />

          <div>
            <strong>Admin User</strong>
            <small>Administrator</small>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <div>
            <h2>{activeSection}</h2>
            <p>
              {activeSection === "Dashboard"
                ? "Welcome back! Here's your overview."
                : activeSection === "Employees"
                ? "View, search and manage your employees."
                : activeSection === "Departments"
                ? "Explore employees by department."
                : "Manage your system information."}
            </p>
          </div>

          <div className="top-actions">
            <button className="icon-button" title="Notifications">
              <Bell size={20} />
            </button>

            <div className="admin-profile">
              <UserCircle size={32} />
              <span>Admin</span>
            </div>
          </div>
        </header>

        {/* Dashboard Section */}
        {activeSection === "Dashboard" && (
          <>
            <section className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon blue">
                  <Users size={23} />
                </div>

                <p>Total Employees</p>
                <h2>{totalEmployees}</h2>
                <small>Registered employees</small>
              </div>

              <div className="stat-card">
                <div className="stat-icon purple">
                  <Building2 size={23} />
                </div>

                <p>Departments</p>
                <h2>{totalDepartments}</h2>
                <small>Active departments</small>
              </div>

              <div className="stat-card">
                <div className="stat-icon green">
                  <UserCircle size={23} />
                </div>

                <p>Average Salary</p>

                <h2>
                  ₹{averageSalary.toLocaleString("en-IN", {
                    maximumFractionDigits: 2,
                  })}
                </h2>

                <small>Monthly average</small>
              </div>
            </section>

            {renderEmployeeSection()}
          </>
        )}

        {/* Employees Section */}
        {activeSection === "Employees" && renderEmployeeSection()}

        {/* Departments Section */}
        {activeSection === "Departments" && (
          <section className="employee-section">
            <div className="section-header">
              <div>
                <h2>Department Overview</h2>
                <p>Employees grouped by their departments.</p>
              </div>
            </div>

            {loading ? (
              <p className="empty-state">Loading departments...</p>
            ) : totalDepartments === 0 ? (
              <p className="empty-state">
                No departments available yet.
              </p>
            ) : (
              <div className="stats-grid">
                {departments.map((department) => {
                  const departmentEmployees = employees.filter(
                    (employee) => employee.department === department
                  );

                  return (
                    <div className="stat-card" key={department}>
                      <div className="stat-icon purple">
                        <Building2 size={23} />
                      </div>

                      <p>{department}</p>

                      <h2>{departmentEmployees.length}</h2>

                      <small>
                        {departmentEmployees.length === 1
                          ? "Employee"
                          : "Employees"}
                      </small>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Settings Section */}
        {activeSection === "Settings" && (
          <section className="employee-section">
            <div className="section-header">
              <div>
                <h2>Settings</h2>
                <p>Employee Management System information.</p>
              </div>
            </div>

            <div style={{ padding: "20px" }}>
              <h3>Administrator Profile</h3>
              <p style={{ marginTop: "12px" }}>
                Name: Admin User
              </p>
              <p style={{ marginTop: "8px" }}>
                Role: Administrator
              </p>

              <hr style={{ margin: "22px 0" }} />

              <h3>System Information</h3>
              <p style={{ marginTop: "12px" }}>
                Application: Employee Management System
              </p>
              <p style={{ marginTop: "8px" }}>
                Frontend: React.js
              </p>
              <p style={{ marginTop: "8px" }}>
                Backend: Node.js and Express.js
              </p>
              <p style={{ marginTop: "8px" }}>
                Database: MySQL
              </p>
            </div>
          </section>
        )}
      </main>

      {/* Add / Edit Employee Modal */}
      {showForm && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={modalHeaderStyle}>
              <div>
                <h2>
                  {editingId !== null
                    ? "Edit Employee"
                    : "Add New Employee"}
                </h2>

                <p style={{ color: "#64748b", marginTop: "6px" }}>
                  {editingId !== null
                    ? "Update employee details below."
                    : "Enter employee details below."}
                </p>
              </div>

              <button
                onClick={() => setShowForm(false)}
                style={closeButtonStyle}
                type="button"
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label style={labelStyle}>Employee Name</label>
              <input
                style={inputStyle}
                type="text"
                name="name"
                placeholder="Enter employee name"
                value={formData.name}
                onChange={handleChange}
                required
              />

              <label style={labelStyle}>Email Address</label>
              <input
                style={inputStyle}
                type="email"
                name="email"
                placeholder="Enter email address"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <label style={labelStyle}>Department</label>
              <input
                style={inputStyle}
                type="text"
                name="department"
                placeholder="e.g. IT, HR, Finance"
                value={formData.department}
                onChange={handleChange}
                required
              />

              <label style={labelStyle}>Salary (₹)</label>
              <input
                style={inputStyle}
                type="number"
                name="salary"
                placeholder="Enter monthly salary"
                min="0"
                step="0.01"
                value={formData.salary}
                onChange={handleChange}
                required
              />

              {formError && (
                <p style={{ color: "red", marginTop: "12px" }}>
                  {formError}
                </p>
              )}

              <div style={modalActionsStyle}>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  style={cancelButtonStyle}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="add-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                    ? "Update Employee"
                    : "Save Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const actionButtonStyle = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: "7px",
  color: "#2563eb",
};

const deleteButtonStyle = {
  ...actionButtonStyle,
  color: "#dc2626",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  zIndex: 1000,
};

const modalStyle = {
  background: "white",
  borderRadius: "12px",
  padding: "28px",
  width: "100%",
  maxWidth: "480px",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 15px 45px rgba(0,0,0,0.2)",
};

const modalHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "24px",
};

const closeButtonStyle = {
  background: "transparent",
  border: "none",
  cursor: "pointer",
  color: "#64748b",
};

const labelStyle = {
  display: "block",
  fontSize: "14px",
  fontWeight: "600",
  marginBottom: "7px",
  marginTop: "15px",
};

const inputStyle = {
  width: "100%",
  padding: "12px",
  border: "1px solid #cbd5e1",
  borderRadius: "7px",
  outline: "none",
  fontSize: "14px",
};

const modalActionsStyle = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "12px",
  marginTop: "25px",
};

const cancelButtonStyle = {
  padding: "11px 17px",
  background: "#f1f5f9",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
};

export default App;
