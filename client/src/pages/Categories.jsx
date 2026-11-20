
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, RefreshCw, Layers3 } from "lucide-react";

import API from "../api/api";

function Categories() {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");

        const response = await API.get("/products");
        const fetchedProducts = response.data?.products || [];

        if (!Array.isArray(fetchedProducts)) {
          throw new Error("The products response was not in the expected format.");
        }

        if (isMounted) {
          setProducts(fetchedProducts);
        }
      } catch (err) {
        console.error("Categories loading error:", err);

        if (isMounted) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load categories."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  // Build categories from the products returned by the backend.
  const categories = useMemo(() => {
    const categoryMap = new Map();

    products.forEach((product) => {
      const categoryName =
        typeof product.category === "string"
          ? product.category
          : product.category?.name;

      if (!categoryName) return;

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          name: categoryName,
          image: product.images?.[0] || "",
          productCount: 0,
        });
      }

      const category = categoryMap.get(categoryName);
      category.productCount += 1;

      if (!category.image && product.images?.[0]) {
        category.image = product.images[0];
      }
    });

    return Array.from(categoryMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [products]);

  function openCategory(categoryName) {
    navigate("/shop", {
      state: { category: categoryName },
    });
  }

  return (
    <div className="categories-page">
      <section className="categories-hero">
        <div className="categories-hero-content">
          <span className="eyebrow">THE JBELLS COLLECTION</span>
          <h1>
            Find Your
            <br />
            <em>Own Style.</em>
          </h1>
          <p>
            Explore our collections of male and unisex clothing.
            Find pieces that express your personality and make
            everyday dressing feel effortless.
          </p>
        </div>
      </section>

      <section className="categories-content">
        <div className="categories-heading">
          <div>
            <span className="eyebrow">EXPLORE JBELLS</span>
            <h2>Shop by Category</h2>
            <p>
              Browse our available collections and discover
              something that fits your style.
            </p>
          </div>

          <div className="categories-total">
            <Layers3 size={20} />
            <span>
              {categories.length} {categories.length === 1 ? "Category" : "Categories"}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="categories-message">
            <RefreshCw className="categories-spinner" size={25} />
            <p>Loading JBELLS collections...</p>
          </div>
        ) : error ? (
          <div className="categories-message categories-error">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        ) : categories.length === 0 ? (
          <div className="categories-message">
            <Layers3 size={34} />
            <h3>No categories available yet</h3>
            <p>
              Categories will appear here when products have
              been added to the store.
            </p>
          </div>
        ) : (
          <div className="categories-grid">
            {categories.map((category, index) => (
              <button
                type="button"
                className="category-card"
                key={category.name}
                onClick={() => openCategory(category.name)}
              >
                <div className="category-card-image">
                  {category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      loading="lazy"
                    />
                  ) : (
                    <div className="category-image-placeholder">
                      <Layers3 size={38} />
                    </div>
                  )}

                  <span className="category-card-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <div className="category-card-info">
                  <div>
                    <h3>{category.name}</h3>
                    <p>
                      {category.productCount}{" "}
                      {category.productCount === 1 ? "Product" : "Products"}
                    </p>
                  </div>

                  <span className="category-card-arrow">
                    <ArrowRight size={19} />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="categories-bottom">
          <span className="eyebrow">STYLE · COMFORT · CONFIDENCE</span>
          <h2>Discover your next favourite look.</h2>
          <button
            type="button"
            className="categories-shop-button"
            onClick={() => navigate("/shop")}
          >
            EXPLORE ALL PRODUCTS <ArrowRight size={17} />
          </button>
        </div>
      </section>
    </div>
  );
}

export default Categories;
