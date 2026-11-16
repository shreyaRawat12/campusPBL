import React, { useState, useMemo } from "react";
import "./UserManagement.css";
import { useCampus } from "../context/CampusContext";

export default function UserManagement() {
  const { users, addUser, toggleUserStatus } = useCampus();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  // Add User Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    id: "",
    name: "",
    email: "",
    role: "Student",
    department: "Computer Science",
  });

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      const matchText = [u.name, u.id, u.email, u.department].some((val) =>
        String(val || "").toLowerCase().includes(q)
      );
      const matchRole = roleFilter === "All" || u.role === roleFilter;
      return matchText && matchRole;
    });
  }, [users, search, roleFilter]);

  function handleCreateUser(e) {
    e.preventDefault();
    if (!newUser.name.trim() || !newUser.id.trim()) {
      alert("Name and ID/Roll number are required.");
      return;
    }
    addUser(newUser);
    setIsModalOpen(false);
    setNewUser({
      id: "",
      name: "",
      email: "",
      role: "Student",
      department: "Computer Science",
    });
  }

  return (
    <div className="um-container">
      {/* Header */}
      <div className="um-header">
        <div>
          <p className="um-eyebrow">ACCESS CONTROL & DIRECTORY</p>
          <h1>User & Staff Management</h1>
          <p>Supervise student and faculty credentials, privileges, and booking allocations.</p>
        </div>

        <button
          type="button"
          className="admin-btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          ＋ Register New User
        </button>
      </div>

      {/* Toolbar */}
      <div className="rm-controls">
        <div className="rm-search-box">
          <span style={{ color: "#64748b" }}>🔍</span>
          <input
            type="search"
            placeholder="Search by student/staff name, roll number, or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="rm-select"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="All">All Roles</option>
          <option value="Student">Student</option>
          <option value="Faculty/Staff">Faculty / Staff</option>
          <option value="Admin">Admin</option>
        </select>
      </div>

      {/* Directory Table */}
      <div className="um-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User / ID</th>
                <th>Role</th>
                <th>Department</th>
                <th>Email Contact</th>
                <th>Status</th>
                <th>Privileges</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          backgroundColor: "#1e293b",
                          border: "1px solid #334155",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: "700",
                          color: "#38bdf8",
                        }}
                      >
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <strong style={{ color: "#ffffff", display: "block" }}>{u.name}</strong>
                        <small style={{ color: "#38bdf8" }}>{u.id}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span
                      className={`role-pill ${
                        u.role === "Student"
                          ? "role-student"
                          : u.role === "Faculty/Staff"
                          ? "role-faculty"
                          : "role-admin"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td>{u.department}</td>
                  <td>{u.email}</td>
                  <td>
                    <span
                      className={`status-badge ${
                        u.status === "Active" ? "status-active" : "status-inactive"
                      }`}
                    >
                      ● {u.status || "Active"}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn-icon-action"
                      title={u.status === "Active" ? "Suspend Account" : "Activate Account"}
                      onClick={() => toggleUserStatus(u.id)}
                    >
                      {u.status === "Active" ? "🚫" : "✓"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: "520px" }}>
            <div className="modal-header">
              <h3>Register New Campus User</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={newUser.name}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Student / Staff ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. STU-2024-201"
                      value={newUser.id}
                      onChange={(e) => setNewUser({ ...newUser, id: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Role *</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    >
                      <option value="Student">Student</option>
                      <option value="Faculty/Staff">Faculty / Staff</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Department *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science & Engineering"
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    placeholder="user@campus.edu"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="admin-btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary">
                  Register User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
