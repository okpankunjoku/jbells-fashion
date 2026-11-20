
import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Tags,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import API from "../api/api";

const emptyForm = {
  name: "",
  description: "",
  image: "",
  displayOrder: "0",
};

function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await API.get("/categories");

      if (!response.data?.success) {
        throw new Error("Unable to load categories.");
      }

      setCategories(
        Array.isArray(response.data.categories)
          ? response.data.categories
          : []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load categories."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  function openCreate() {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEdit(category) {
    setEditingId(category._id);
    setForm({
      name: category.name || "",
      description: category.description || "",
      image: category.image || "",
      displayOrder: String(category.displayOrder ?? 0),
    });
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (!saving) {
      setShowForm(false);
      setEditingId(null);
    }
  }

  async function handleSave(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const displayOrder = Number(form.displayOrder);

    if (!form.name.trim()) {
      setError("Category name is required.");
      return;
    }

    if (!Number.isInteger(displayOrder) || displayOrder < 0) {
      setError("Display order must be a non-negative whole number.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      displayOrder,
    };

    setSaving(true);

    try {
      if (editingId) {
        await API.put(`/categories/${editingId}`, payload);
        setSuccess("Category updated successfully.");
      } else {
        await API.post("/categories", payload);
        setSuccess("Category created successfully.");
      }

      setShowForm(false);
      setEditingId(null);
      await loadCategories();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save category."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category) {
    const confirmed = window.confirm(
      `Delete "${category.name}"? Categories assigned to products cannot be deleted.`
    );

    if (!confirmed) return;

    setBusyId(category._id);
    setError("");
    setSuccess("");

    try {
      await API.delete(`/categories/${category._id}`);
      setSuccess("Category deleted successfully.");
      await loadCategories();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete category."
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleDeactivate(category) {
    const confirmed = window.confirm(
      `Deactivate "${category.name}"? It will no longer appear in the active category list.`
    );

    if (!confirmed) return;

    setBusyId(category._id);
    setError("");
    setSuccess("");

    try {
      await API.put(`/categories/${category._id}`, {
        isActive: false,
      });

      setSuccess("Category deactivated successfully.");
      await loadCategories();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to deactivate category."
      );
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="admin-categories">
      <div className="admin-products-toolbar">
        <div>
          <h2>Product Categories</h2>
          <p>Organize your JBELLS clothing catalogue.</p>
        </div>

        <button
          type="button"
          className="admin-product-primary-btn"
          onClick={openCreate}
        >
          <Plus size={18} />
          Add Category
        </button>
      </div>

      {error && (
        <div className="admin-product-alert error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="admin-product-alert success" role="status">
          <CheckCircle2 size={18} />
          <span>{success}</span>
        </div>
      )}

      <div className="admin-products-filters">
        <span>
          {categories.length} active categor
          {categories.length === 1 ? "y" : "ies"}
        </span>

        <button
          type="button"
          className="admin-product-refresh"
          onClick={loadCategories}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="admin-products-empty">
          <RefreshCw size={28} />
          <p>Loading categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="admin-products-empty">
          <Tags size={40} />
          <h3>No active categories</h3>
          <p>Create your first clothing category.</p>
        </div>
      ) : (
        <div className="admin-products-table-wrap">
          <table className="admin-products-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Description</th>
                <th>Display Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {categories.map((category) => (
                <tr key={category._id}>
                  <td>
                    <strong>{category.name}</strong>
                  </td>

                  <td>
                    {category.description || "No description"}
                  </td>

                  <td>{category.displayOrder ?? 0}</td>

                  <td>
                    <span className="admin-product-status active">
                      Active
                    </span>
                  </td>

                  <td>
                    <div className="admin-product-actions">
                      <button
                        type="button"
                        title="Edit category"
                        aria-label={`Edit ${category.name}`}
                        onClick={() => openEdit(category)}
                        disabled={busyId === category._id}
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        title="Deactivate category"
                        aria-label={`Deactivate ${category.name}`}
                        onClick={() => handleDeactivate(category)}
                        disabled={busyId === category._id}
                      >
                        <X size={17} />
                      </button>

                      <button
                        type="button"
                        title="Delete category"
                        aria-label={`Delete ${category.name}`}
                        onClick={() => handleDelete(category)}
                        disabled={busyId === category._id}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="admin-product-modal-backdrop">
          <div
            className="admin-product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="category-form-title"
          >
            <div className="admin-product-modal-heading">
              <div>
                <h2 id="category-form-title">
                  {editingId ? "Edit Category" : "Add New Category"}
                </h2>
                <p>Enter the category details below.</p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Close category form"
              >
                <X />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="admin-product-form-grid">
                <label>
                  Category Name *
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        name: event.target.value,
                      }))
                    }
                    required
                  />
                </label>

                <label>
                  Display Order
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.displayOrder}
                    onChange={(event) =>
                      setForm((previous) => ({
                        ...previous,
                        displayOrder: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
              </div>

              <label className="admin-product-full-label">
                Description
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      description: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="admin-product-full-label">
                Category Image URL
                <input
                  type="url"
                  value={form.image}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      image: event.target.value,
                    }))
                  }
                  placeholder="https://example.com/category.jpg"
                />
              </label>

              <div className="admin-product-form-actions">
                <button
                  type="button"
                  className="admin-product-cancel-btn"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="admin-product-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Category"
                      : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminCategories;
