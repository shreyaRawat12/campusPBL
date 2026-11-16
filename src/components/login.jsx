import { useState, useEffect } from "react";
import "./login.css";
import { useCampus } from "../context/CampusContext";

function Login({ initialRole }) {
  const { login, loginPromptRole } = useCampus();

  const [role, setRole] = useState(initialRole || loginPromptRole || "user");
  const [studentName, setStudentName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (loginPromptRole) {
      setRole(loginPromptRole);
      setStudentName("");
      setStudentId("");
      setAdminPassword("");
      setErrorMessage("");
    }
  }, [loginPromptRole]);

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setErrorMessage("");
  };

  const handleLogin = (event) => {
    event.preventDefault();
    setErrorMessage("");

    if (role === "user") {
      if (!studentName.trim() || !studentId.trim()) {
        setErrorMessage("Please enter both your Student Name and Student ID.");
        return;
      }

      const res = login("user", {
        name: studentName,
        studentId: studentId,
      });

      if (!res.success) {
        setErrorMessage(res.message);
      }
    } else {
      if (!adminPassword.trim()) {
        setErrorMessage("Please enter the Admin Password.");
        return;
      }

      const res = login("admin", {
        password: adminPassword,
      });

      if (!res.success) {
        setErrorMessage(res.message || "Incorrect Admin Password! (Password is 1203)");
      }
    }
  };

  const handleQuickDemo = () => {
    if (role === "user") {
      setStudentName("Shreya Rawat");
      setStudentId("STU-2024-089");
    } else {
      setAdminPassword("1203");
    }
    setErrorMessage("");
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* LEFT SIDE */}
        <div className="login-left">
          <div className="brand">
            <h1>CAMPUS</h1>
            <p>RESOURCE ALLOCATION SYSTEM</p>
          </div>

          {/* ROLE SWITCH */}
          <div className="role-switch">
            <button
              type="button"
              className={`role ${role === "user" ? "active" : ""}`}
              onClick={() => handleRoleChange("user")}
            >
              <span className="radio"></span>
              Student
            </button>

            <button
              type="button"
              className={`role ${role === "admin" ? "active" : ""}`}
              onClick={() => handleRoleChange("admin")}
            >
              <span className="radio"></span>
              Admin
            </button>
          </div>

          {/* ERROR ALERT */}
          {errorMessage && (
            <div
              style={{
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.35)",
                color: "#f87171",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "0.82rem",
                marginBottom: "14px",
                textAlign: "left",
              }}
            >
              ⚠️ {errorMessage}
            </div>
          )}

          {/* LOGIN FORM */}
          <form onSubmit={handleLogin}>
            {role === "user" ? (
              <>
                <div className="input-group" style={{ marginBottom: "12px" }}>
                  <div className="input-icon">👤</div>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter Student Name (e.g. Shreya Rawat)"
                    autoFocus
                  />
                </div>

                <div className="input-group">
                  <div className="input-icon">ID</div>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Enter Student Roll / ID (e.g. STU-2024-089)"
                  />
                </div>
              </>
            ) : (
              <div className="input-group">
                <div className="input-icon">🔑</div>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter Admin Password (Password: 1203)"
                  autoFocus
                />
              </div>
            )}

            {/* Quick Autofill Helper */}
            <div style={{ margin: "12px 0 6px" }}>
              <button
                type="button"
                onClick={handleQuickDemo}
                style={{
                  background: "rgba(59, 130, 246, 0.12)",
                  border: "1px dashed rgba(59, 130, 246, 0.4)",
                  color: "#60a5fa",
                  borderRadius: "6px",
                  padding: "7px 12px",
                  fontSize: "0.78rem",
                  cursor: "pointer",
                  width: "100%",
                }}
              >
                💡 Autofill Credentials ({role === "user" ? "Shreya Rawat · STU-2024-089" : "Password: 1203"})
              </button>
            </div>

            <button type="submit" className="login-button">
              {role === "user" ? "ENTER STUDENT PORTAL →" : "ENTER ADMIN CONSOLE →"}
            </button>
          </form>

          <p className="login-info">
            {role === "user"
              ? "Login with your student name and ID to browse & book campus venues"
              : "Administrator credential verification required (Password: 1203)"}
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="login-right">
          <div className="shield">
            <div className="lock-symbol">🔒</div>
          </div>

          <div className="system-title">
            <h2>CAMPUS</h2>
            <h3>ALLOCATION SYSTEM</h3>
          </div>

          <div className="divider"></div>

          <p>
            Autonomous OS Resource Scheduling, Shortest Job First (SJF) optimization,
            10-minute SLA dispatch, and real-time Block C & Block E allocation.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
