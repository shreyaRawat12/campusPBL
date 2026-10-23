import { useState } from "react";
import "./login.css";

function Login() {
  const [role, setRole] = useState("user");
  const [credential, setCredential] = useState("");

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setCredential("");
  };

  const handleLogin = (event) => {
    event.preventDefault();

    if (!credential.trim()) {
      alert(
        role === "user"
          ? "Please enter your Student ID."
          : "Please enter the Admin Password."
      );
      return;
    }

    if (role === "user") {
      console.log("Student ID:", credential);
    } else {
      console.log("Admin Password entered");
    }
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

          {/* ROLE SELECTION */}
          <div className="role-switch">

            <button
              type="button"
              className={`role ${
                role === "user" ? "active" : ""
              }`}
              onClick={() => handleRoleChange("user")}
            >
              <span className="radio"></span>
              User
            </button>

            <button
              type="button"
              className={`role ${
                role === "admin" ? "active" : ""
              }`}
              onClick={() => handleRoleChange("admin")}
            >
              <span className="radio"></span>
              Admin
            </button>

          </div>

          {/* LOGIN FORM */}
          <form onSubmit={handleLogin}>

            <div className="input-group">

              <div className="input-icon">
                {role === "user" ? "ID" : "A"}
              </div>

              <input
                type={role === "admin" ? "password" : "text"}
                value={credential}
                onChange={(event) =>
                  setCredential(event.target.value)
                }
                placeholder={
                  role === "user"
                    ? "Student ID"
                    : "Password"
                }
              />

            </div>

            <button
              type="submit"
              className="login-button"
            >
              LOGIN
            </button>

          </form>

          <p className="login-info">
            {role === "user"
              ? "Login using your Student ID"
              : "Authorized administrator access only"}
          </p>

        </div>


        {/* RIGHT SIDE */}
        <div className="login-right">

          <div className="shield">
            <div className="lock-symbol">
              🔒
            </div>
          </div>

          <div className="system-title">
            <h2>CAMPUS</h2>
            <h3>ALLOCATION SYSTEM</h3>
          </div>

          <div className="divider"></div>

          <p>
            Smart scheduling and efficient
            campus resource management
          </p>

        </div>

      </div>

    </div>
  );
}

export default Login;