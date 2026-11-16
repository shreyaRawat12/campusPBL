import React, { useState, useMemo } from "react";
import "./ResourceManagement.css";
import { useCampus } from "../context/CampusContext";

export default function ResourceManagement() {
  const { resources, addResource, updateResource, toggleResourceAvailability, deleteResource } = useCampus();

  const [search, setSearch] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    block: "Block C",
    floor: "Ground Floor",
    category: "Classroom",
    capacity: "",
    facilities: "",
    description: "",
    available: true,
  });

  const blocks = ["All", "Block C", "Block D", "Block E"];

  const categories = useMemo(() => {
    return [
      "All",
      "Classroom",
      "Computer Lab",
      "Specialized Lab",
      "Seminar Hall / Auditorium",
    ];
  }, []);

  const filteredResources = useMemo(() => {
    const q = search.trim().toLowerCase();
    return resources.filter((r) => {
      const matchText = [r.name, r.category, r.block, r.floor, r.location].some((val) =>
        String(val || "").toLowerCase().includes(q)
      );
      const matchBlock = selectedBlock === "All" || r.block === selectedBlock;
      const matchCat = selectedCategory === "All" || r.category === selectedCategory;
      const matchStatus =
        statusFilter === "All" ||
        (statusFilter === "Available" && r.available) ||
        (statusFilter === "Unavailable" && !r.available);

      return matchText && matchBlock && matchCat && matchStatus;
    });
  }, [resources, search, selectedBlock, selectedCategory, statusFilter]);

  function openCreateModal() {
    setEditingResource(null);
    setFormData({
      name: "",
      block: "Block C",
      floor: "Ground Floor",
      category: "Classroom",
      capacity: "",
      facilities: "",
      description: "",
      available: true,
    });
    setIsModalOpen(true);
  }

  function openEditModal(resource) {
    setEditingResource(resource);
    setFormData({
      name: resource.name,
      block: resource.block || "Block C",
      floor: resource.floor || "Ground Floor",
      category: resource.category,
      capacity: resource.capacity || "",
      facilities: Array.isArray(resource.facilities) ? resource.facilities.join(", ") : "",
      description: resource.description || "",
      available: resource.available,
    });
    setIsModalOpen(true);
  }

  function handleSave(e) {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert("Please enter a room/resource name.");
      return;
    }

    const payload = {
      ...formData,
      location: `${formData.block}, ${formData.floor}`,
      facilities: formData.facilities
        ? formData.facilities.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
    };

    if (editingResource) {
      updateResource(editingResource.id, payload);
    } else {
      addResource(payload);
    }
    setIsModalOpen(false);
  }

  // Category Icon helper
  function getCategoryIcon(cat) {
    switch (cat) {
      case "Computer Lab":
        return "💻";
      case "Specialized Lab":
        return "🔬";
      case "Seminar Hall / Auditorium":
        return "🏛️";
      default:
        return "🏫";
    }
  }

  return (
    <div className="rm-container">
      {/* Header */}
      <div className="rm-header">
        <div>
          <p className="rm-eyebrow">CAMPUS INVENTORY</p>
          <h1>Resource & Room Management</h1>
          <p>Register, inspect, and update rooms across Block C and Block E.</p>
        </div>

        <button type="button" className="admin-btn-primary" onClick={openCreateModal}>
          ＋ Register New Room
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="rm-controls">
        <div className="rm-search-box">
          <span style={{ color: "#64748b" }}>🔍</span>
          <input
            type="search"
            placeholder="Search room (e.g. E001, C202, Lab 6)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="rm-select"
          value={selectedBlock}
          onChange={(e) => setSelectedBlock(e.target.value)}
        >
          {blocks.map((b) => (
            <option key={b} value={b}>
              {b === "All" ? "All Blocks" : b}
            </option>
          ))}
        </select>

        <select
          className="rm-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "All" ? "All Categories" : c}
            </option>
          ))}
        </select>

        <select
          className="rm-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Available">Available Only</option>
          <option value="Unavailable">Offline / In Maintenance</option>
        </select>
      </div>

      {/* Inventory Table */}
      <div className="rm-table-card">
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Room Name</th>
                <th>Block & Floor</th>
                <th>Category</th>
                <th>Capacity</th>
                <th>Key Facilities</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.map((res) => (
                <tr key={res.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ fontSize: "1.3rem" }}>{getCategoryIcon(res.category)}</span>
                      <strong style={{ color: "#ffffff", fontSize: "1rem" }}>{res.name}</strong>
                    </div>
                  </td>
                  <td>
                    <div style={{ color: "#38bdf8", fontWeight: "600" }}>{res.block || "Block C"}</div>
                    <small style={{ color: "#94a3b8" }}>{res.floor || "General"}</small>
                  </td>
                  <td>
                    <span style={{ color: "#cbd5e1" }}>{res.category}</span>
                  </td>
                  <td>
                    <strong>{res.capacity ? `~${res.capacity}` : "N/A"}</strong>
                  </td>
                  <td>
                    <small style={{ color: "#94a3b8" }}>
                      {res.facilities && res.facilities.length > 0
                        ? res.facilities.join(" · ")
                        : "General Facilities"}
                    </small>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        res.available ? "status-active" : "status-inactive"
                      }`}
                    >
                      {res.available ? "● Available" : "● Offline / Maintenance"}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button
                        type="button"
                        className="btn-icon-action"
                        title={res.available ? "Mark as Offline / Maintenance" : "Mark as Available"}
                        onClick={() => toggleResourceAvailability(res.id)}
                      >
                        {res.available ? "🔒" : "🔓"}
                      </button>
                      <button
                        type="button"
                        className="btn-icon-action"
                        title="Edit Room"
                        onClick={() => openEditModal(res)}
                      >
                        ✏️
                      </button>
                      <button
                        type="button"
                        className="btn-icon-action btn-icon-danger"
                        title="Delete Room"
                        onClick={() => {
                          if (window.confirm(`Delete "${res.name}" from campus inventory?`)) {
                            deleteResource(res.id);
                          }
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingResource ? "Edit Room Details" : "Register Campus Room"}</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Room Number / Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. E001, C202, Lab 6, OSH"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Campus Block *</label>
                    <select
                      value={formData.block}
                      onChange={(e) => setFormData({ ...formData, block: e.target.value })}
                    >
                      <option value="Block C">Block C</option>
                      <option value="Block D">Block D</option>
                      <option value="Block E">Block E</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Floor *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ground Floor, 1st Floor, 2nd Floor, 3rd Floor"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      {categories.filter((c) => c !== "All").map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Approx Seating Capacity *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 100"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Key Facilities (comma separated)</label>
                  <input
                    type="text"
                    placeholder="Projector, Whiteboard, Smart Board, Computers"
                    value={formData.facilities}
                    onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Description / Usage Guidelines</label>
                  <textarea
                    rows="2"
                    placeholder="Special instructions or equipment notes..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  {editingResource ? "Save Changes" : "Register Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
