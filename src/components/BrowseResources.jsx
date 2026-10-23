import { useMemo, useState } from "react";
import "./BrowseResources.css";

// Temporary demo inventory.
// Later, replace this data source with resources from the backend/API.
export const demoResources = [
  {
    id: 1,
    name: "Sample Classroom",
    category: "Classroom",
    location: "Academic Block",
    capacity: 60,
    available: true,
    image: "",
  },
  {
    id: 2,
    name: "Sample Computer Lab",
    category: "Lab",
    location: "Technology Block",
    capacity: 35,
    available: true,
    image: "",
  },
  {
    id: 3,
    name: "Sample Projector",
    category: "Equipment",
    location: "Central Store",
    capacity: null,
    available: false,
    image: "",
  },
];

export default function BrowseResources({
  resources = demoResources,
  onBookResource,
}) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [availability, setAvailability] = useState("All");

  const categories = useMemo(
    () => [
      "All",
      ...new Set(
        resources
          .map((resource) => resource.category)
          .filter(Boolean)
      ),
    ],
    [resources]
  );

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();

    return resources.filter((resource) => {
      const matchesSearch = [
        resource.name,
        resource.category,
        resource.location,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(query)
      );

      const matchesCategory =
        selectedCategory === "All" ||
        resource.category === selectedCategory;

      const matchesAvailability =
        availability === "All" ||
        (availability === "Available" && resource.available) ||
        (availability === "Unavailable" && !resource.available);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesAvailability
      );
    });
  }, [resources, search, selectedCategory, availability]);

  function handleBook(resource) {
    if (!resource.available) return;

    if (onBookResource) {
      onBookResource(resource);
    } else {
      window.alert(
        `Demo only: "${resource.name}" selected. Booking will be connected later.`
      );
    }
  }

  function clearFilters() {
    setSearch("");
    setSelectedCategory("All");
    setAvailability("All");
  }

  return (
    <section className="browse-page">
      <div className="browse-heading">
        <div>
          <p className="browse-eyebrow">CAMPUS SERVICES</p>
          <h1>Browse Resources</h1>
          <p className="browse-subtitle">
            Find the campus resources you need.
          </p>
        </div>

        <span className="resource-count">
          {filteredResources.length}{" "}
          {filteredResources.length === 1 ? "resource" : "resources"}
        </span>
      </div>

      <div className="resource-filters">
        <label className="resource-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Search name, category or location..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search resources"
          />
        </label>

        <label className="filter-field">
          <span>Category</span>
          <select
            value={selectedCategory}
            onChange={(event) =>
              setSelectedCategory(event.target.value)
            }
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "All" ? "All categories" : category}
              </option>
            ))}
          </select>
        </label>

        <label className="filter-field">
          <span>Availability</span>
          <select
            value={availability}
            onChange={(event) => setAvailability(event.target.value)}
          >
            <option value="All">All resources</option>
            <option value="Available">Available</option>
            <option value="Unavailable">Unavailable</option>
          </select>
        </label>
      </div>

      {filteredResources.length > 0 ? (
        <div className="resource-grid">
          {filteredResources.map((resource) => (
            <article className="resource-card" key={resource.id}>
              <div className="resource-image">
                {resource.image ? (
                  <img
                    src={resource.image}
                    alt={resource.name}
                    loading="lazy"
                  />
                ) : (
                  <div className="resource-image-placeholder">
                    <span aria-hidden="true">▧</span>
                    <span>Resource photo</span>
                  </div>
                )}

                <span
                  className={`availability-badge ${
                    resource.available
                      ? "is-available"
                      : "is-unavailable"
                  }`}
                >
                  {resource.available ? "Available" : "Unavailable"}
                </span>
              </div>

              <div className="resource-card-body">
                <span className="resource-category">
                  {resource.category || "Other"}
                </span>

                <h2>{resource.name}</h2>

                <p className="resource-location">
                  <span aria-hidden="true">⌖</span>{" "}
                  {resource.location || "Location not specified"}
                </p>

                <div className="resource-details">
                  <span>Capacity</span>
                  <strong>
                    {resource.capacity == null
                      ? "Not specified"
                      : resource.capacity}
                  </strong>
                </div>

                <button
                  type="button"
                  className="resource-book-button"
                  disabled={!resource.available}
                  onClick={() => handleBook(resource)}
                >
                  {resource.available
                    ? "Book Resource →"
                    : "Currently Unavailable"}
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="resource-empty">
          <div aria-hidden="true">⌕</div>
          <h2>No resources found</h2>
          <p>Try another search or change your filters.</p>
          <button type="button" onClick={clearFilters}>
            Clear filters
          </button>
        </div>
      )}

      <p className="demo-note">
        Demo inventory only. Actual resources and availability will come
        from the campus database after backend integration.
      </p>
    </section>
  );
}
