
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import "../App.css";
import API from "../api/api";
import { useCart } from "../context/CartContext.jsx";

import tropicalSet from "../assets/products/tropical-set.jpg";
import greenFloralShirt from "../assets/products/green-floral-shirt.jpg";
import purpleTrousers from "../assets/products/purple-trousers.jpg";
import embroideredJacket from "../assets/products/embroidered-jacket.jpg";

const fallbackImages = {
  "Tropical Print Shirt & Shorts Set": tropicalSet,
  "Green Floral Shirt": greenFloralShirt,
  "Purple Formal Trousers": purpleTrousers,
  "Green Embroidered Jacket": embroideredJacket,
};

const STORE_CATEGORIES = [
  "Men's Clothing",
  "Unisex Clothing",
];

function normaliseCategory(category) {
  // The database uses specific men's categories such as Men's Shirts,
  // Men's Jackets, Men's Trousers and Men's Two-Piece Sets.
  // Group all of them under the Men's Clothing shop filter.
  const name =
    typeof category === "string"
      ? category
      : category?.name || "";

  const normalisedName = name.trim().toLowerCase();

  if (
    normalisedName.startsWith("men's ") ||
    normalisedName === "men's clothing" ||
    normalisedName === "male clothing" ||
    normalisedName === "mens clothing"
  ) {
    return "Men's Clothing";
  }

  if (normalisedName.includes("unisex")) {
    return "Unisex Clothing";
  }

  return null;
}

function formatPrice(price) {
  return `₦${Number(price || 0).toLocaleString("en-NG")}`;
}

function Shop() {
  const { cartLoading, cartError, addItem } = useCart();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState("");

  const [activeCategory, setActiveCategory] = useState(() =>
    normaliseCategory(location.state?.category) || "All Products"
  );

  // Apply a category selected on the dedicated Categories page.
  useEffect(() => {
    const requestedCategory = normaliseCategory(location.state?.category);
    if (requestedCategory) {
      setActiveCategory(requestedCategory);
    }
  }, [location.state]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState("default");

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedQuantity, setSelectedQuantity] = useState(1);

  const [addingProduct, setAddingProduct] = useState(false);
  const [cartMessage, setCartMessage] = useState("");

  // Load products from the existing MongoDB products endpoint.
  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        setProductsLoading(true);
        setProductsError("");

        const response = await API.get("/products");

        const fetchedProducts = Array.isArray(response.data.products)
          ? response.data.products
          : Array.isArray(response.data)
            ? response.data
            : [];

        const formattedProducts = fetchedProducts
          .map((product) => {
            const categoryName = normaliseCategory(
              product.category?.name || product.category
            );

            const variants = Array.isArray(product.variants)
              ? product.variants
              : [];

            const sizes = [
              ...new Set(
                variants
                  .map((variant) => variant.size)
                  .filter(Boolean)
              ),
            ];

            const stock = variants.reduce(
              (total, variant) =>
                total + Number(variant.stock || 0),
              0
            );

            return {
              id: product._id,
              name: product.name,
              slug: product.slug,
              category: categoryName,
              price: Number(product.price || 0),
              description: product.description || "",
              image:
                product.images?.[0] ||
                fallbackImages[product.name] ||
                "",
              variants,
              sizes,
              stock,
              badge: product.isFeatured ? "FEATURED" : "",
            };
          })
          .filter((product) => product.category);

        if (isMounted) {
          setProducts(formattedProducts);
        }
      } catch (error) {
        console.error("Unable to load shop products:", error);

        if (isMounted) {
          setProductsError(
            error.response?.data?.message ||
              "Unable to load products. Please try again."
          );
        }
      } finally {
        if (isMounted) {
          setProductsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return products
      .filter((product) => {
        const matchesCategory =
          activeCategory === "All Products" ||
          product.category === activeCategory;

        const matchesSearch = product.name
          .toLowerCase()
          .includes(searchTerm.trim().toLowerCase());

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortOption === "price-low") {
          return a.price - b.price;
        }

        if (sortOption === "price-high") {
          return b.price - a.price;
        }

        if (sortOption === "name") {
          return a.name.localeCompare(b.name);
        }

        return 0;
      });
  }, [products, activeCategory, searchTerm, sortOption]);

  function getSizeStock(product, size) {
    return (product?.variants || [])
      .filter((variant) => variant.size === size)
      .reduce(
        (total, variant) =>
          total + Number(variant.stock || 0),
        0
      );
  }

  function getAvailableColors(product, size) {
    return [
      ...new Set(
        (product?.variants || [])
          .filter(
            (variant) =>
              variant.size === size &&
              Number(variant.stock || 0) > 0
          )
          .map((variant) => variant.color)
          .filter(Boolean)
      ),
    ];
  }

  function getSelectedVariant(product, size, color) {
    return (product?.variants || []).find(
      (variant) =>
        variant.size === size &&
        variant.color === color
    );
  }

  function getSelectedStock(product, size, color) {
    const variant = getSelectedVariant(product, size, color);
    return Number(variant?.stock || 0);
  }

  function openProductDetails(product) {
    setSelectedProduct(product);

    const defaultSize =
      product.sizes.includes("M") &&
      getSizeStock(product, "M") > 0
        ? "M"
        : product.sizes.find(
            (size) => getSizeStock(product, size) > 0
          ) || "";

    const firstVariant = (product.variants || []).find(
      (variant) =>
        variant.size === defaultSize &&
        Number(variant.stock || 0) > 0
    );

    setSelectedSize(defaultSize);
    setSelectedColor(firstVariant?.color || "");
    setSelectedQuantity(1);
    setCartMessage("");
  }

  function closeProductDetails() {
    setSelectedProduct(null);
  }

  // Add the selected product through the shared cart system.
  async function addToCart(product, size, color, quantity = 1) {
    try {
      setAddingProduct(true);
      setCartMessage("");

      await addItem(product, size, color, quantity);

      setCartMessage(`${product.name} added to your cart.`);
      return true;
    } catch (error) {
      console.error("Unable to add product to cart:", error);

      alert(
        error.response?.data?.message ||
          error.message ||
          "Unable to add this product to your cart."
      );

      return false;
    } finally {
      setAddingProduct(false);
    }
  }

  // Quick Add selects an available size and colour automatically.
  async function quickAdd(product) {
    const preferredSize =
      product.sizes.includes("M") &&
      getSizeStock(product, "M") > 0
        ? "M"
        : product.sizes.find(
            (size) => getSizeStock(product, size) > 0
          );

    const variant = (product.variants || []).find(
      (item) =>
        item.size === preferredSize &&
        Number(item.stock || 0) > 0
    );

    if (!variant) {
      alert("This product is currently out of stock.");
      return;
    }

    await addToCart(product, variant.size, variant.color, 1);
  }

  async function handleProductAddToCart() {
    if (!selectedProduct) return;

    const added = await addToCart(
      selectedProduct,
      selectedSize,
      selectedColor,
      selectedQuantity
    );

    if (added) {
      closeProductDetails();
    }
  }

  return (
    <div className="shop-page">
        <section
          className="shop-section"
          style={{ minHeight: "70vh" }}
        >
          <div className="section-heading">
            <div>
              <span className="eyebrow">THE JBELLS COLLECTION</span>
              <h1>Shop Our Collection</h1>
            </div>

            <p>
              Discover clothing selected for everyday style,
              comfort and confidence.
            </p>
          </div>

          <div className="category-filters">
            <button
              type="button"
              className={`filter-button ${
                activeCategory === "All Products" ? "active" : ""
              }`}
              onClick={() => setActiveCategory("All Products")}
            >
              All Products
            </button>

            {STORE_CATEGORIES.map((category) => (
              <button
                key={category}
                type="button"
                className={`filter-button ${
                  activeCategory === category ? "active" : ""
                }`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="shop-controls">
            <input
              type="search"
              className="product-search"
              placeholder="Search clothing..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search products"
            />

            <select
              className="product-sort"
              value={sortOption}
              onChange={(event) => setSortOption(event.target.value)}
              aria-label="Sort products"
            >
              <option value="default">Default Sorting</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>

          {cartLoading && (
            <p className="empty-products">Loading your saved cart...</p>
          )}

          {cartError && (
            <p className="empty-products" role="alert">
              {cartError}
            </p>
          )}

          {cartMessage && (
            <p
              role="status"
              style={{
                margin: "15px 0",
                color: "#52734b",
                fontWeight: 600,
              }}
            >
              {cartMessage} You can continue shopping.
            </p>
          )}

          {productsLoading && (
            <p className="empty-products">
              Loading JBELLS products...
            </p>
          )}

          {!productsLoading && productsError && (
            <div className="empty-products">
              <p>{productsError}</p>
              <button
                type="button"
                className="filter-button"
                onClick={() => window.location.reload()}
              >
                TRY AGAIN
              </button>
            </div>
          )}

          {!productsLoading && !productsError && (
            <>
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <article className="product-card" key={product.id}>
                    <div
                      className="product-image"
                      onClick={() => openProductDetails(product)}
                      style={{ cursor: "pointer" }}
                    >
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                        />
                      ) : (
                        <div className="empty-products">
                          Product image unavailable
                        </div>
                      )}

                      {product.badge && (
                        <span className="product-badge">
                          {product.badge}
                        </span>
                      )}

                      <button
                        type="button"
                        className="quick-add"
                        disabled={product.stock <= 0 || addingProduct}
                        onClick={(event) => {
                          event.stopPropagation();
                          quickAdd(product);
                        }}
                      >
                        {product.stock > 0
                          ? "ADD TO CART +"
                          : "OUT OF STOCK"}
                      </button>
                    </div>

                    <div className="product-info">
                      <div>
                        <span className="product-category">
                          {product.category}
                        </span>

                        <h3
                          onClick={() => openProductDetails(product)}
                          style={{ cursor: "pointer" }}
                        >
                          {product.name}
                        </h3>

                        <button
                          type="button"
                          className="text-link"
                          onClick={() => openProductDetails(product)}
                          style={{
                            border: 0,
                            background: "transparent",
                            cursor: "pointer",
                            padding: "8px 0",
                          }}
                        >
                          VIEW DETAILS →
                        </button>
                      </div>

                      <p
                        className="product-stock"
                        style={{
                          fontSize: "12px",
                          marginTop: "8px",
                          color: product.stock > 0 ? "#52734b" : "#b42318",
                        }}
                      >
                        {product.stock > 0
                          ? `${product.stock} items available`
                          : "Out of stock"}
                      </p>

                      <span className="product-price">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                  </article>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <p className="empty-products">
                  No products found in this selection. Try another
                  category or search term.
                </p>
              )}
            </>
          )}
        </section>

      {/* Product details modal */}
      {selectedProduct && (
        <div
          className="product-modal-overlay"
          onClick={closeProductDetails}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(0, 0, 0, 0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            overflowY: "auto",
          }}
        >
          <div
            className="product-modal"
            role="dialog"
            aria-modal="true"
            aria-label={`${selectedProduct.name} details`}
            onClick={(event) => event.stopPropagation()}
            style={{
              position: "relative",
              width: "100%",
              maxWidth: "900px",
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#faf9f6",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "30px",
              padding: "30px",
            }}
          >
            <button
              type="button"
              onClick={closeProductDetails}
              aria-label="Close product details"
              style={{
                position: "absolute",
                top: "12px",
                right: "15px",
                zIndex: 2,
                width: "38px",
                height: "38px",
                border: "1px solid #e7e5df",
                background: "#faf9f6",
                fontSize: "24px",
                cursor: "pointer",
              }}
            >
              ×
            </button>

            <div style={{ minWidth: 0 }}>
              <img
                src={selectedProduct.image}
                alt={selectedProduct.name}
                style={{
                  width: "100%",
                  maxHeight: "550px",
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </div>

            <div style={{ paddingTop: "20px", minWidth: 0 }}>
              <span className="eyebrow">
                {selectedProduct.category}
              </span>

              <h2
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: "clamp(25px, 4vw, 36px)",
                  fontWeight: 400,
                  lineHeight: 1.3,
                  margin: "15px 0",
                }}
              >
                {selectedProduct.name}
              </h2>

              <p style={{ fontSize: "20px", fontWeight: 600 }}>
                {formatPrice(selectedProduct.price)}
              </p>

              <p
                style={{
                  color: "#77766f",
                  fontSize: "14px",
                  lineHeight: 1.8,
                  margin: "20px 0",
                }}
              >
                {selectedProduct.description}
              </p>

              <p
                style={{
                  fontSize: "12px",
                  color: selectedProduct.stock > 0 ? "#52734b" : "#b42318",
                  marginBottom: "20px",
                }}
              >
                {selectedProduct.stock > 0
                  ? `${selectedProduct.stock} items available`
                  : "Out of stock"}
              </p>

              <div style={{ marginBottom: "25px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "12px",
                  }}
                >
                  SELECT SIZE: {selectedSize || "—"}
                </label>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {selectedProduct.sizes.map((size) => {
                    const sizeStock = getSizeStock(selectedProduct, size);

                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={sizeStock <= 0}
                        onClick={() => {
                          const colors = getAvailableColors(
                            selectedProduct,
                            size
                          );

                          setSelectedSize(size);
                          setSelectedColor(colors[0] || "");
                          setSelectedQuantity(1);
                        }}
                        aria-pressed={selectedSize === size}
                        style={{
                          minWidth: "45px",
                          height: "42px",
                          padding: "0 10px",
                          border:
                            selectedSize === size
                              ? "1px solid #22221f"
                              : "1px solid #e7e5df",
                          background:
                            selectedSize === size ? "#22221f" : "transparent",
                          color:
                            selectedSize === size ? "#fff" : "#22221f",
                          opacity: sizeStock <= 0 ? 0.4 : 1,
                          cursor: sizeStock <= 0 ? "not-allowed" : "pointer",
                        }}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: "25px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "12px",
                  }}
                >
                  SELECT COLOUR: {selectedColor || "—"}
                </label>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {getAvailableColors(selectedProduct, selectedSize).map(
                    (color) => (
                      <button
                        key={color}
                        type="button"
                        aria-pressed={selectedColor === color}
                        onClick={() => {
                          setSelectedColor(color);
                          setSelectedQuantity(1);
                        }}
                        style={{
                          minHeight: "40px",
                          padding: "0 14px",
                          border:
                            selectedColor === color
                              ? "1px solid #22221f"
                              : "1px solid #e7e5df",
                          background:
                            selectedColor === color
                              ? "#22221f"
                              : "transparent",
                          color:
                            selectedColor === color ? "#fff" : "#22221f",
                          cursor: "pointer",
                        }}
                      >
                        {color}
                      </button>
                    )
                  )}
                </div>

                <p
                  style={{
                    fontSize: "12px",
                    color: "#77766f",
                    marginTop: "10px",
                  }}
                >
                  {selectedColor
                    ? `${getSelectedStock(
                        selectedProduct,
                        selectedSize,
                        selectedColor
                      )} items available in ${selectedSize}, ${selectedColor}`
                    : "Choose a size to see available colours."}
                </p>
              </div>

              <div style={{ marginBottom: "25px" }}>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 600,
                    marginBottom: "12px",
                  }}
                >
                  QUANTITY
                </label>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    width: "130px",
                    border: "1px solid #e7e5df",
                  }}
                >
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    disabled={selectedQuantity <= 1}
                    onClick={() =>
                      setSelectedQuantity((quantity) =>
                        Math.max(1, quantity - 1)
                      )
                    }
                    style={{
                      width: "40px",
                      height: "42px",
                      border: 0,
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    −
                  </button>

                  <span style={{ flex: 1, textAlign: "center" }}>
                    {selectedQuantity}
                  </span>

                  <button
                    type="button"
                    aria-label="Increase quantity"
                    disabled={
                      selectedQuantity >=
                        getSelectedStock(
                          selectedProduct,
                          selectedSize,
                          selectedColor
                        ) ||
                      getSelectedStock(
                        selectedProduct,
                        selectedSize,
                        selectedColor
                      ) <= 0
                    }
                    onClick={() =>
                      setSelectedQuantity((quantity) =>
                        Math.min(
                          getSelectedStock(
                            selectedProduct,
                            selectedSize,
                            selectedColor
                          ),
                          quantity + 1
                        )
                      )
                    }
                    style={{
                      width: "40px",
                      height: "42px",
                      border: 0,
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="button"
                className="primary-button"
                onClick={handleProductAddToCart}
                disabled={
                  addingProduct ||
                  !selectedSize ||
                  !selectedColor ||
                  getSelectedStock(
                    selectedProduct,
                    selectedSize,
                    selectedColor
                  ) <= 0
                }
                style={{
                  width: "100%",
                  border: 0,
                  cursor: "pointer",
                  textAlign: "center",
                  opacity: addingProduct ? 0.7 : 1,
                }}
              >
                {addingProduct
                  ? "ADDING TO CART..."
                  : `ADD TO CART — ${formatPrice(
                      selectedProduct.price * selectedQuantity
                    )}`}
              </button>

              <p
                style={{
                  color: "#77766f",
                  fontSize: "12px",
                  lineHeight: 1.7,
                  marginTop: "15px",
                }}
              >
                After adding this item, you can continue browsing the
                JBELLS collection.
              </p>
            </div>
          </div>
        </div>
      )}
</div>
  );
}

export default Shop;
