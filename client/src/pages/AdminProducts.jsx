import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Search,
  RefreshCw,
  Edit,
  Trash2,
  Archive,
  X,
  Package,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

import API from "../api/api";

// Existing JBELLS product images
import tropicalSetImage from "../assets/products/tropical-set.jpg";
import greenFloralShirtImage from "../assets/products/green-floral-shirt.jpg";
import purpleTrousersImage from "../assets/products/purple-trousers.jpg";
import embroideredJacketImage from "../assets/products/embroidered-jacket.jpg";

// Local image selector
const localImageOptions = [
  { label: "Tropical Set", src: tropicalSetImage },
  { label: "Green Floral Shirt", src: greenFloralShirtImage },
  { label: "Purple Trousers", src: purpleTrousersImage },
  { label: "Embroidered Jacket", src: embroideredJacketImage },
];

const emptyForm = {
  name: "",
  description: "",
  category: "",
  brand: "JBELLS",
  price: "",
  compareAtPrice: "",
  images: "",
  isFeatured: false,
  status: "draft",
  variants: [
    {
      sku: "",
      size: "M",
      color: "",
      stock: "0",
    },
  ],
};

const currency = (amount) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(Number(amount) || 0);

// Use the matching bundled JBELLS image when a saved product URL is broken.
function getProductFallbackImage(product) {
  const name = (product.name || "").toLowerCase();

  if (name.includes("embroidered") || name.includes("jacket")) {
    return embroideredJacketImage;
  }

  if (name.includes("purple") || name.includes("trouser")) {
    return purpleTrousersImage;
  }

  if (name.includes("floral") || name.includes("green floral")) {
    return greenFloralShirtImage;
  }

  if (
    name.includes("tropical") ||
    name.includes("print") ||
    name.includes("short")
  ) {
    return tropicalSetImage;
  }

  return "";
}

function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  // Bulk variation generator defaults for JBELLS products
  const [bulkSizes, setBulkSizes] = useState([
    "S",
    "M",
    "L",
    "XL",
    "XXL",
  ]);

  const [bulkColors, setBulkColors] = useState([
    "White",
    "Black",
    "Blue",
    "Green",
  ]);

  const [bulkStock, setBulkStock] = useState("20");

  // Load products and active categories
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [productResponse, categoryResponse] = await Promise.all([
        API.get("/products/admin", {
          params: {
            search: search.trim(),
            status,
            limit: 50,
            page: 1,
            sort: "newest",
          },
        }),
        API.get("/categories"),
      ]);

      if (!productResponse.data?.success) {
        throw new Error("Unable to retrieve products.");
      }

      setProducts(
        Array.isArray(productResponse.data.products)
          ? productResponse.data.products
          : []
      );

      setCategories(
        Array.isArray(categoryResponse.data?.categories)
          ? categoryResponse.data.categories
          : []
      );
    } catch (err) {
      console.error("Product loading error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load products."
      );
    } finally {
      setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Update ordinary form fields
  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // Update product variations
  function updateVariant(index, field, value) {
    setForm((previous) => ({
      ...previous,
      variants: previous.variants.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant
      ),
    }));
  }

  function addVariant() {
    setForm((previous) => ({
      ...previous,
      variants: [
        ...previous.variants,
        {
          sku: "",
          size: "M",
          color: "",
          stock: "0",
        },
      ],
    }));
  }

  function removeVariant(index) {
    setForm((previous) => ({
      ...previous,
      variants: previous.variants.filter((_, i) => i !== index),
    }));
  }

  // Generate every selected size/colour combination.
  // Existing matching variations keep their SKU and stock when editing.
  function generateBulkVariants() {
    setError("");

    if (!form.name.trim()) {
      setError("Enter the product name before generating variations.");
      return;
    }

    if (bulkSizes.length === 0 || bulkColors.length === 0) {
      setError("Select at least one size and one colour.");
      return;
    }

    const stock = Number(bulkStock);

    if (!Number.isInteger(stock) || stock < 0) {
      setError("Bulk stock must be a whole number of zero or more.");
      return;
    }

    const productPrefix = form.name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 32);

    setForm((previous) => {
      const existingByCombination = new Map(
        previous.variants.map((variant) => [
          `${variant.size.trim().toLowerCase()}|${variant.color.trim().toLowerCase()}`,
          variant,
        ])
      );

      const generated = [];

      for (const size of bulkSizes) {
        for (const color of bulkColors) {
          const key = `${size.toLowerCase()}|${color.toLowerCase()}`;
          const existing = existingByCombination.get(key);

          generated.push(
            existing || {
              sku: `JB-${productPrefix}-${size}-${color}`
                .toUpperCase()
                .replace(/[^A-Z0-9-]/g, "-"),
              size,
              color,
              stock: String(stock),
            }
          );
        }
      }

      return {
        ...previous,
        variants: generated,
      };
    });

    setSuccess(
      `${bulkSizes.length * bulkColors.length} size-and-colour variations generated. Review the SKUs and stock before saving.`
    );
  }

  function toggleBulkSize(size) {
    setBulkSizes((current) =>
      current.includes(size)
        ? current.filter((item) => item !== size)
        : [...current, size]
    );
  }

  function toggleBulkColor(color) {
    setBulkColors((current) =>
      current.includes(color)
        ? current.filter((item) => item !== color)
        : [...current, color]
    );
  }

  // Add product form
  function openAddForm() {
    setEditingId(null);

    setForm({
      ...emptyForm,
      category: categories[0]?._id || "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  // Edit product form
  function openEditForm(product) {
    setEditingId(product._id);

    setForm({
      name: product.name || "",
      description: product.description || "",
      category: product.category?._id || product.category || "",
      brand: product.brand || "JBELLS",
      price: String(product.price ?? ""),
      compareAtPrice:
        product.compareAtPrice == null
          ? ""
          : String(product.compareAtPrice),
      images: Array.isArray(product.images)
        ? product.images.join("\n")
        : "",
      isFeatured: Boolean(product.isFeatured),
      status: product.status || "draft",
      variants:
        product.variants?.length > 0
          ? product.variants.map((variant) => ({
              sku: variant.sku || "",
              size: variant.size || "",
              color: variant.color || "",
              stock: String(variant.stock ?? 0),
            }))
          : [{ sku: "", size: "M", color: "", stock: "0" }],
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  // Save product
  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.category) {
      setError("Please select a product category.");
      return;
    }

    if (!form.variants.length) {
      setError("Please add at least one product variation.");
      return;
    }

    const variants = form.variants.map((variant) => ({
      sku: variant.sku.trim().toUpperCase(),
      size: variant.size.trim(),
      color: variant.color.trim(),
      stock: Number(variant.stock),
    }));

    const invalidVariant = variants.some(
      (variant) =>
        !variant.sku ||
        !variant.size ||
        !variant.color ||
        !Number.isInteger(variant.stock) ||
        variant.stock < 0
    );

    if (invalidVariant) {
      setError(
        "Every variation needs a SKU, size, colour and valid stock quantity."
      );
      return;
    }

    const images = form.images
      .split(/\n/)
      .map((image) => image.trim())
      .filter(Boolean);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      brand: form.brand.trim(),
      price: Number(form.price),
      compareAtPrice:
        form.compareAtPrice === ""
          ? null
          : Number(form.compareAtPrice),
      images,
      isFeatured: form.isFeatured,
      status: form.status,
      variants,
    };

    if (
      !payload.name ||
      !payload.description ||
      !Number.isFinite(payload.price) ||
      payload.price < 0
    ) {
      setError(
        "Please enter a valid product name, description and price."
      );
      return;
    }

    if (
      payload.compareAtPrice !== null &&
      (!Number.isFinite(payload.compareAtPrice) ||
        payload.compareAtPrice < 0)
    ) {
      setError("Please enter a valid comparison price.");
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        await API.put(`/products/${editingId}`, payload);
        setSuccess("Product updated successfully.");
      } else {
        await API.post("/products", payload);
        setSuccess("Product created successfully.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);

      await loadData();
    } catch (err) {
      console.error("Product saving error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to save this product. Please check your entries."
      );
    } finally {
      setSaving(false);
    }
  }

  // Delete product
  async function handleDelete(product) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"? This action may be blocked if the product has related orders, carts or inventory records.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await API.delete(`/products/${product._id}`);
      setSuccess("Product deleted successfully.");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete this product."
      );
    }
  }

  // Archive product
  async function handleArchive(product) {
    const confirmed = window.confirm(
      `Archive "${product.name}"? Archived products will no longer appear in the active customer catalogue.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await API.put(`/products/${product._id}`, {
        status: "archived",
      });

      setSuccess("Product archived successfully.");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to archive this product."
      );
    }
  }

  // Product image selection
  function selectLocalImage(imageSrc) {
    if (!imageSrc) return;

    setForm((previous) => {
      const existingImages = previous.images
        .split(/\n/)
        .map((image) => image.trim())
        .filter(Boolean);

      if (existingImages.includes(imageSrc)) {
        return previous;
      }

      return {
        ...previous,
        images: [...existingImages, imageSrc].join("\n"),
      };
    });
  }

  function removeImage(imageToRemove) {
    setForm((previous) => ({
      ...previous,
      images: previous.images
        .split(/\n/)
        .map((image) => image.trim())
        .filter((image) => image && image !== imageToRemove)
        .join("\n"),
    }));
  }

  const selectedImages = form.images
    .split(/\n/)
    .map((image) => image.trim())
    .filter(Boolean);

  return (
    <section className="admin-products">
      <div className="admin-products-toolbar">
        <div>
          <h2>Product Catalogue</h2>
          <p>
            Manage your JBELLS clothing products and inventory variations.
          </p>
        </div>

        <button
          type="button"
          className="admin-product-primary-btn"
          onClick={openAddForm}
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {error && (
        <div className="admin-product-alert error" role="alert">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="admin-product-alert success" role="status">
          <CheckCircle size={18} />
          {success}
        </div>
      )}

      <div className="admin-products-filters">
        <div className="admin-product-search">
          <Search size={18} />

          <input
            type="search"
            placeholder="Search products..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter products by status"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>

        <button
          type="button"
          className="admin-product-refresh"
          onClick={loadData}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      <div className="admin-products-count">
        {products.length} product{products.length === 1 ? "" : "s"} displayed
      </div>

      {loading ? (
        <div className="admin-products-empty">
          <RefreshCw size={28} />
          <p>Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="admin-products-empty">
          <Package size={42} />
          <h3>No products found</h3>
          <p>Add a product or change your search and filters.</p>

          <button
            type="button"
            className="admin-product-primary-btn"
            onClick={openAddForm}
          >
            <Plus size={17} />
            Add Your First Product
          </button>
        </div>
      ) : (
        <div className="admin-products-table-wrap">
          <table className="admin-products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Variations</th>
                <th>Status</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>
                    <div className="admin-product-name">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          onError={(event) => {
                            const fallbackImage = getProductFallbackImage(product);

                            if (
                              fallbackImage &&
                              !event.currentTarget.dataset.fallbackApplied
                            ) {
                              event.currentTarget.dataset.fallbackApplied = "true";
                              event.currentTarget.src = fallbackImage;
                            } else {
                              event.currentTarget.style.display = "none";
                            }
                          }}
                        />
                      ) : getProductFallbackImage(product) ? (
                        <img
                          src={getProductFallbackImage(product)}
                          alt={product.name}
                        />
                      ) : (
                        <div className="admin-product-no-image">
                          <ImageIcon size={22} />
                        </div>
                      )}

                      <div>
                        <strong>{product.name}</strong>
                        <small>{product.brand || "JBELLS"}</small>
                      </div>
                    </div>
                  </td>

                  <td>
                    {product.category?.name || "Unassigned"}
                  </td>

                  <td>{currency(product.price)}</td>

                  <td>{product.variants?.length || 0}</td>

                  <td>
                    <span
                      className={`admin-product-status ${product.status}`}
                    >
                      {product.status}
                    </span>
                  </td>

                  <td>{product.isFeatured ? "Yes" : "No"}</td>

                  <td>
                    <div className="admin-product-actions">
                      <button
                        type="button"
                        title="Edit product"
                        aria-label={`Edit ${product.name}`}
                        onClick={() => openEditForm(product)}
                      >
                        <Edit size={17} />
                      </button>

                      {product.status !== "archived" && (
                        <button
                          type="button"
                          title="Archive product"
                          aria-label={`Archive ${product.name}`}
                          onClick={() => handleArchive(product)}
                        >
                          <Archive size={17} />
                        </button>
                      )}

                      <button
                        type="button"
                        title="Delete product"
                        aria-label={`Delete ${product.name}`}
                        onClick={() => handleDelete(product)}
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
        <div
          className="admin-product-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowForm(false);
            }
          }}
        >
          <div
            className="admin-product-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-product-form-title"
          >
            <div className="admin-product-modal-heading">
              <div>
                <h2 id="admin-product-form-title">
                  {editingId ? "Edit Product" : "Add New Product"}
                </h2>

                <p>Enter the product information below.</p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                disabled={saving}
                aria-label="Close product form"
              >
                <X />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="admin-product-form-grid">
                <label>
                  Product Name *
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    maxLength={150}
                    required
                  />
                </label>

                <label>
                  Brand
                  <input
                    type="text"
                    value={form.brand}
                    onChange={(event) =>
                      updateField("brand", event.target.value)
                    }
                  />
                </label>

                <label>
                  Category *
                  <select
                    value={form.category}
                    onChange={(event) =>
                      updateField("category", event.target.value)
                    }
                    required
                  >
                    <option value="">Select category</option>

                    {categories.map((category) => (
                      <option
                        key={category._id}
                        value={category._id}
                      >
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Price (₦) *
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(event) =>
                      updateField("price", event.target.value)
                    }
                    required
                  />
                </label>

                <label>
                  Compare-at Price (₦)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.compareAtPrice}
                    onChange={(event) =>
                      updateField("compareAtPrice", event.target.value)
                    }
                  />
                </label>

                <label>
                  Product Status
                  <select
                    value={form.status}
                    onChange={(event) =>
                      updateField("status", event.target.value)
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
              </div>

              <label className="admin-product-full-label">
                Product Description *
                <textarea
                  rows={5}
                  value={form.description}
                  onChange={(event) =>
                    updateField("description", event.target.value)
                  }
                  maxLength={5000}
                  required
                />
              </label>

              {/* JBELLS LOCAL IMAGE SELECTOR */}
              <div className="admin-product-full-label">
                <label htmlFor="jbells-local-image">
                  Select Existing JBELLS Image
                </label>

                <select
                  id="jbells-local-image"
                  defaultValue=""
                  onChange={(event) => {
                    selectLocalImage(event.target.value);
                    event.target.value = "";
                  }}
                >
                  <option value="">Choose an image to add</option>

                  {localImageOptions.map((image) => (
                    <option key={image.label} value={image.src}>
                      {image.label}
                    </option>
                  ))}
                </select>

                <label htmlFor="product-image-urls">
                  Additional Image URLs
                </label>

                <textarea
                  id="product-image-urls"
                  rows={3}
                  placeholder="Enter one image URL per line"
                  value={form.images}
                  onChange={(event) =>
                    updateField("images", event.target.value)
                  }
                />

                <small>
                  You can select existing JBELLS images and add external
                  image URLs. Each image must be on a separate line.
                </small>

                {selectedImages.length > 0 && (
                  <div className="admin-product-image-previews">
                    {selectedImages.map((image, index) => (
                      <div
                        className="admin-product-image-preview"
                        key={`${image}-${index}`}
                      >
                        <img
                          src={image}
                          alt={`Product preview ${index + 1}`}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />

                        <button
                          type="button"
                          onClick={() => removeImage(image)}
                          aria-label={`Remove image ${index + 1}`}
                          title="Remove image"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <label className="admin-product-featured">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(event) =>
                    updateField("isFeatured", event.target.checked)
                  }
                />
                Display as a featured product
              </label>

              {/* BULK VARIATION GENERATOR */}
              <div
                className="admin-product-full-label"
                style={{
                  border: "1px solid #e7e5df",
                  borderRadius: "10px",
                  padding: "18px",
                  marginTop: "24px",
                  marginBottom: "20px",
                  background: "#faf9f6",
                }}
              >
                <h3 style={{ marginTop: 0 }}>
                  Bulk Variation Generator
                </h3>

                <p
                  style={{
                    color: "#77766f",
                    fontSize: "13px",
                    lineHeight: 1.6,
                  }}
                >
                  Select sizes and colours to generate all combinations at
                  once. Existing matching variations keep their current SKU
                  and stock.
                </p>

                <strong
                  style={{
                    display: "block",
                    margin: "14px 0 8px",
                  }}
                >
                  Sizes
                </strong>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  {["S", "M", "L", "XL", "XXL"].map((size) => (
                    <label
                      key={size}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={bulkSizes.includes(size)}
                        onChange={() => toggleBulkSize(size)}
                      />
                      {size}
                    </label>
                  ))}
                </div>

                <strong
                  style={{
                    display: "block",
                    margin: "14px 0 8px",
                  }}
                >
                  Colours
                </strong>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  {["White", "Black", "Blue", "Green"].map((color) => (
                    <label
                      key={color}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={bulkColors.includes(color)}
                        onChange={() => toggleBulkColor(color)}
                      />
                      {color}
                    </label>
                  ))}
                </div>

                <label
                  style={{
                    display: "block",
                    maxWidth: "220px",
                    marginTop: "14px",
                  }}
                >
                  Stock for each new variation
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={bulkStock}
                    onChange={(event) =>
                      setBulkStock(event.target.value)
                    }
                  />
                </label>

                <button
                  type="button"
                  className="admin-product-add-variant"
                  onClick={generateBulkVariants}
                  style={{ marginTop: "14px" }}
                >
                  <Package size={16} />
                  Generate {bulkSizes.length * bulkColors.length} Variations
                </button>
              </div>

              {/* PRODUCT VARIATIONS */}
              <div className="admin-product-variants-heading">
                <div>
                  <h3>Product Variations *</h3>
                  <p>
                    Add the available sizes, colours, SKUs and stock.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addVariant}
                  className="admin-product-add-variant"
                >
                  <Plus size={16} />
                  Add Variation
                </button>
              </div>

              {form.variants.map((variant, index) => (
                <div className="admin-product-variant" key={index}>
                  <div className="admin-product-variant-title">
                    <strong>Variation {index + 1}</strong>

                    {form.variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                      >
                        <X size={16} />
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="admin-product-form-grid">
                    <label>
                      SKU *
                      <input
                        type="text"
                        value={variant.sku}
                        onChange={(event) =>
                          updateVariant(index, "sku", event.target.value)
                        }
                        required
                      />
                    </label>

                    <label>
                      Size *
                      <input
                        type="text"
                        placeholder="e.g. M, L, XL"
                        value={variant.size}
                        onChange={(event) =>
                          updateVariant(index, "size", event.target.value)
                        }
                        required
                      />
                    </label>

                    <label>
                      Colour *
                      <input
                        type="text"
                        placeholder="e.g. Black"
                        value={variant.color}
                        onChange={(event) =>
                          updateVariant(index, "color", event.target.value)
                        }
                        required
                      />
                    </label>

                    <label>
                      Stock Quantity *
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={variant.stock}
                        onChange={(event) =>
                          updateVariant(index, "stock", event.target.value)
                        }
                        required
                      />
                    </label>
                  </div>
                </div>
              ))}

              <div className="admin-product-form-actions">
                <button
                  type="button"
                  className="admin-product-cancel-btn"
                  onClick={() => setShowForm(false)}
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
                      ? "Update Product"
                      : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

export default AdminProducts;