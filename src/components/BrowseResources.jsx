import { useMemo, useState } from "react";
import "./BrowseResources.css";
import { useCampus } from "../context/CampusContext";

export default function BrowseResources({
  resources = [],
  onBookResource,
  onCheckAvailability,
}) {
  const { requests } = useCampus();

  const [search, setSearch] = useState("");
  const [selectedBlock, setSelectedBlock] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedFacility, setSelectedFacility] = useState("All");
  const [minCapacity, setMinCapacity] = useState("");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [availability, setAvailability] = useState("All");
  const [selectedDetailsResource, setSelectedDetailsResource] = useState(null);

  const blocks = ["All", "Block C", "Block E"];
  const categories = [
    "All",
    "Classroom",
    "Computer Lab",
    "Specialized Lab",
    "Seminar Hall / Auditorium",
  ];

  const allFacilities = useMemo(() => {
    const set = new Set();
    resources.forEach((r) => {
      if (Array.isArray(r.facilities)) {
        r.facilities.forEach((f) => set.add(f.trim()));
      }
    });
    return ["All", ...Array.from(set)];
  }, [resources]);

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();

    return resources.filter((resource) => {
      const matchesSearch = [
        resource.name,
        resource.block,
        resource.floor,
        resource.category,
        resource.location,
        Array.isArray(resource.facilities) ? resource.facilities.join(" ") : "",
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      );

      const matchesBlock =
        selectedBlock === "All" || resource.block === selectedBlock;

      const matchesCategory =
        selectedCategory === "All" || resource.category === selectedCategory;

      const matchesFacility =
        selectedFacility === "All" ||
        (Array.isArray(resource.facilities) &&
          resource.facilities.some((f) => f.toLowerCase().includes(selectedFacility.toLowerCase())));

      const matchesMinCap =
        !minCapacity || (resource.capacity && resource.capacity >= Number(minCapacity));

      const matchesMaxCap =
        !maxCapacity || (resource.capacity && resource.capacity <= Number(maxCapacity));

      const matchesAvailability =
        availability === "All" ||
        (availability === "Available" && resource.available) ||
        (availability === "Unavailable" && !resource.available);

      return (
        matchesSearch &&
        matchesBlock &&
        matchesCategory &&
        matchesFacility &&
        matchesMinCap &&
        matchesMaxCap &&
        matchesAvailability
      );
    });
  }, [
    resources,
    search,
    selectedBlock,
    selectedCategory,
    selectedFacility,
    minCapacity,
    maxCapacity,
    availability,
  ]);

  function clearFilters() {
    setSearch("");
    setSelectedBlock("All");
    setSelectedCategory("All");
    setSelectedFacility("All");
    setMinCapacity("");
    setMaxCapacity("");
    setAvailability("All");
  }

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

  // Get confirmed allocations for the modal room
  const resourceBookings = useMemo(() => {
    if (!selectedDetailsResource) return [];
    return requests.filter(
      (r) =>
        String(r.resourceId) === String(selectedDetailsResource.id) &&
        r.status === "Approved"
    );
  }, [selectedDetailsResource, requests]);

  return (
    <section className="browse-page">
      <div className="browse-heading">
        <div>
          <p className="browse-eyebrow">CAMPUS INFRASTRUCTURE DIRECTORY</p>
          <h1>Browse Campus Resources</h1>
          <p className="browse-subtitle">
            Explore classrooms, laboratories, seminar halls, and other campus facilities across Block C and Block E.
          </p>
        </div>

        <span className="resource-count">
          {filteredResources.length}{" "}
          {filteredResources.length === 1 ? "room found" : "rooms found"}
        </span>
      </div>

      {/* Search & Filters */}
      <div className="resource-filters" style={{ flexWrap: "wrap", gap: "12px", background: "#ffffff", padding: "18px 20px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
        <label className="resource-search" style={{ minWidth: "220px", flex: 1 }}>
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Search room number or name (e.g. E001, C202, Lab 6, OSH)..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search resources"
          />
        </label>

        {/* Building Filter */}
        <label className="filter-field">
          <span>Building / Block</span>
          <select
            value={selectedBlock}
            onChange={(e) => setSelectedBlock(e.target.value)}
          >
            {blocks.map((b) => (
              <option key={b} value={b}>
                {b === "All" ? "All Blocks (C & E)" : b}
              </option>
            ))}
          </select>
        </label>

        {/* Category Filter */}
        <label className="filter-field">
          <span>Resource Type</span>
          <select
            value={selectedCategory}
            onChange={(event) => setSelectedCategory(event.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "All" ? "All Resource Types" : category}
              </option>
            ))}
          </select>
        </label>

        {/* Facilities Filter */}
        <label className="filter-field">
          <span>Facility</span>
          <select
            value={selectedFacility}
            onChange={(e) => setSelectedFacility(e.target.value)}
          >
            {allFacilities.map((f) => (
              <option key={f} value={f}>
                {f === "All" ? "All Facilities" : f}
              </option>
            ))}
          </select>
        </label>

        {/* Min Capacity */}
        <label className="filter-field" style={{ width: "95px" }}>
          <span>Min Cap</span>
          <input
            type="number"
            placeholder="Min"
            min="1"
            value={minCapacity}
            onChange={(e) => setMinCapacity(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
          />
        </label>

        {/* Max Capacity */}
        <label className="filter-field" style={{ width: "95px" }}>
          <span>Max Cap</span>
          <input
            type="number"
            placeholder="Max"
            min="1"
            value={maxCapacity}
            onChange={(e) => setMaxCapacity(e.target.value)}
            style={{ width: "100%", padding: "8px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
          />
        </label>

        {/* Availability */}
        <label className="filter-field">
          <span>Availability</span>
          <select
            value={availability}
            onChange={(event) => setAvailability(event.target.value)}
          >
            <option value="All">All statuses</option>
            <option value="Available">Available</option>
            <option value="Unavailable">Maintenance / Offline</option>
          </select>
        </label>

        {/* Clear Button */}
        <button
          type="button"
          onClick={clearFilters}
          style={{
            alignSelf: "flex-end",
            padding: "9px 14px",
            background: "#f1f5f9",
            border: "1px solid #cbd5e1",
            color: "#475569",
            borderRadius: "6px",
            fontSize: "0.82rem",
            fontWeight: "600",
            cursor: "pointer",
          }}
        >
          Clear Filters
        </button>
      </div>

      {filteredResources.length > 0 ? (
        <div className="resource-grid">
          {filteredResources.map((resource) => (
            <article className="resource-card" key={resource.id}>
              {/* Card Banner */}
              <div
                style={{
                  background: "linear-gradient(135deg, #1e293b, #0f172a)",
                  padding: "20px 18px",
                  borderBottom: "1px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  position: "relative",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      background: "rgba(59, 130, 246, 0.15)",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.4rem",
                    }}
                  >
                    {getCategoryIcon(resource.category)}
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#ffffff" }}>
                      {resource.name}
                    </h2>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        color: "#38bdf8",
                        fontWeight: "600",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {resource.block || "Block C"} · {resource.floor || "General"}
                    </span>
                  </div>
                </div>

                <span
                  className={`availability-badge ${
                    resource.available ? "is-available" : "is-unavailable"
                  }`}
                >
                  {resource.available ? "Available" : "Maintenance"}
                </span>
              </div>

              <div className="resource-card-body">
                <span className="resource-category">
                  {resource.category || "Classroom"}
                </span>

                <div className="resource-details" style={{ marginTop: "10px" }}>
                  <span>Seating Capacity</span>
                  <strong>
                    {resource.capacity ? `~${resource.capacity} Students` : "Not specified"}
                  </strong>
                </div>

                {/* Facilities Pills */}
                {resource.facilities && resource.facilities.length > 0 && (
                  <div style={{ margin: "10px 0 12px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {resource.facilities.map((fac, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: "#f1f5f9",
                          color: "#475569",
                          fontSize: "0.72rem",
                          fontWeight: "600",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        ✓ {fac}
                      </span>
                    ))}
                  </div>
                )}

                <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0 0 16px 0", lineHeight: "1.4" }}>
                  {resource.description || `${resource.name} located in ${resource.block}`}
                </p>

                {/* 3 Action Buttons */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setSelectedDetailsResource(resource)}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      color: "#334155",
                      padding: "8px",
                      borderRadius: "6px",
                      fontSize: "0.78rem",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedDetailsResource(resource)}
                    style={{
                      background: "#eff6ff",
                      border: "1px solid #bfdbfe",
                      color: "#2563eb",
                      padding: "8px",
                      borderRadius: "6px",
                      fontSize: "0.78rem",
                      fontWeight: "600",
                      cursor: "pointer",
                    }}
                  >
                    Check Availability
                  </button>
                </div>

                <button
                  type="button"
                  className="resource-book-button"
                  disabled={!resource.available}
                  onClick={() => onBookResource && onBookResource(resource)}
                >
                  {resource.available ? "Book This Venue →" : "Temporarily Offline"}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="resource-empty">
          <div aria-hidden="true">⌕</div>
          <h2>No matching rooms found</h2>
          <p>Try switching to another block, category, or clear search filters.</p>
          <button type="button" onClick={clearFilters}>
            Clear all filters
          </button>
        </div>
      )}

      {/* Resource Details Modal */}
      {selectedDetailsResource && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "14px", padding: "24px", maxWidth: "560px", width: "100%", border: "1px solid #cbd5e1", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.15)", maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", borderBottom: "1px solid #e2e8f0", paddingBottom: "14px" }}>
              <div>
                <span style={{ fontSize: "0.75rem", color: "#3b82f6", fontWeight: "700", textTransform: "uppercase" }}>VENUE SPECIFICATIONS</span>
                <h2 style={{ margin: "4px 0 0", color: "#0f172a" }}>{selectedDetailsResource.name}</h2>
                <small style={{ color: "#64748b" }}>{selectedDetailsResource.block} · {selectedDetailsResource.floor}</small>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailsResource(null)}
                style={{ background: "none", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "#64748b" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", fontSize: "0.88rem", marginBottom: "18px" }}>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>CATEGORY</span>
                <strong>{selectedDetailsResource.category}</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>SEATING CAPACITY</span>
                <strong>~{selectedDetailsResource.capacity} Seats</strong>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>OPERATING HOURS</span>
                <span>08:30 AM – 05:30 PM</span>
              </div>
              <div>
                <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem" }}>STATUS</span>
                <span style={{ color: selectedDetailsResource.available ? "#059669" : "#dc2626", fontWeight: "600" }}>
                  {selectedDetailsResource.available ? "● Operational" : "● Maintenance"}
                </span>
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", marginBottom: "6px" }}>EQUIPPED FACILITIES</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {selectedDetailsResource.facilities && selectedDetailsResource.facilities.length > 0 ? (
                  selectedDetailsResource.facilities.map((f, i) => (
                    <span key={i} style={{ background: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", fontSize: "0.78rem", color: "#334155", fontWeight: "600" }}>
                      ✓ {f}
                    </span>
                  ))
                ) : (
                  <span style={{ color: "#94a3b8", fontSize: "0.85rem" }}>General classroom facilities</span>
                )}
              </div>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <span style={{ color: "#64748b", display: "block", fontSize: "0.75rem", marginBottom: "6px" }}>ACTIVE ALLOCATIONS &amp; RESERVATIONS</span>
              {resourceBookings.length === 0 ? (
                <p style={{ margin: 0, color: "#10b981", fontSize: "0.85rem", background: "#ecfdf5", padding: "10px", borderRadius: "6px" }}>
                  ✓ No upcoming bookings scheduled. Venue is fully available for reservations.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {resourceBookings.slice(0, 4).map((b) => (
                    <div key={b.id} style={{ background: "#f8fafc", padding: "8px 10px", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "0.82rem", display: "flex", justifyContent: "space-between" }}>
                      <span><strong>{b.date}</strong> · {b.time}</span>
                      <span style={{ color: "#64748b" }}>Occupied (Reserved)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", borderTop: "1px solid #e2e8f0", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={() => setSelectedDetailsResource(null)}
                style={{ background: "#f1f5f9", border: "1px solid #cbd5e1", padding: "8px 16px", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer", fontWeight: "600" }}
              >
                Close
              </button>
              <button
                type="button"
                disabled={!selectedDetailsResource.available}
                onClick={() => {
                  const target = selectedDetailsResource;
                  setSelectedDetailsResource(null);
                  onBookResource && onBookResource(target);
                }}
                style={{ background: "#2563eb", color: "#ffffff", border: "none", padding: "8px 18px", borderRadius: "6px", fontSize: "0.85rem", cursor: "pointer", fontWeight: "600" }}
              >
                Book This Venue →
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="demo-note">
        Live campus inventory for Block C &amp; Block E · Real-time schedule sync with MySQL database.
      </p>
    </section>
  );
}
