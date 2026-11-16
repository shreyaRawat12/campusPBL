// Frontend API service to communicate with the Node.js + Express + MySQL backend

const API_BASE_URL = "http://localhost:5000/api";

async function request(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || data.message || `HTTP error ${res.status}`);
    }
    return { success: true, data };
  } catch (error) {
    // Return connection error
    return { success: false, error: error.message };
  }
}

export const api = {
  // Health
  checkHealth: () => request("/health"),

  // Auth
  login: (role, credentials) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ role, credentials }),
    }),

  // Resources
  getResources: () => request("/resources"),
  addResource: (resource) =>
    request("/resources", {
      method: "POST",
      body: JSON.stringify(resource),
    }),
  updateResource: (id, resource) =>
    request(`/resources/${id}`, {
      method: "PUT",
      body: JSON.stringify(resource),
    }),
  toggleResource: (id) =>
    request(`/resources/${id}/toggle`, {
      method: "PATCH",
    }),
  deleteResource: (id) =>
    request(`/resources/${id}`, {
      method: "DELETE",
    }),

  // Bookings
  getBookings: () => request("/bookings"),
  createBooking: (booking) =>
    request("/bookings", {
      method: "POST",
      body: JSON.stringify(booking),
    }),
  approveBooking: (id, remarks) =>
    request(`/bookings/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify({ remarks }),
    }),
  rejectBooking: (id, remarks) =>
    request(`/bookings/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ remarks }),
    }),
  cancelBooking: (id) =>
    request(`/bookings/${id}/cancel`, {
      method: "PATCH",
    }),
  triggerAutoDispatch: (forceAll = false) =>
    request("/bookings/auto-dispatch", {
      method: "POST",
      body: JSON.stringify({ forceAll }),
    }),
  getOsMonitor: () => request("/bookings/os-monitor"),
  getAnalytics: () => request("/analytics"),

  // Users
  getUsers: () => request("/users"),
  addUser: (user) =>
    request("/users", {
      method: "POST",
      body: JSON.stringify(user),
    }),
  toggleUser: (id) =>
    request(`/users/${id}/toggle`, {
      method: "PATCH",
    }),

  // Settings
  getSettings: () => request("/settings"),
  toggleAutoApprove: () =>
    request("/settings/toggle-auto-approve", {
      method: "POST",
    }),
};
