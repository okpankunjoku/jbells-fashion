import { useState, useEffect } from "react";
import "../App.css";
import heroImage from "../assets/products/jbells-hero.jpg";
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

function formatPrice(price) {
    return `₦${Number(price || 0).toLocaleString("en-NG")}`;
}

function getProductImage(product) {
    const savedImage = product.images?.[0];

    const isOldInvalidPath =
        typeof savedImage === "string" &&
        savedImage.includes("/src/assets/products/");

    if (!savedImage || isOldInvalidPath) {
        return fallbackImages[product.name] || "";
    }

    return savedImage;
}

function Home() {
    const { addItem } = useCart();

    const [activeCategory, setActiveCategory] =
        useState("All Products");

    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [productsError, setProductsError] = useState("");

    // Load active products from MongoDB.
    useEffect(() => {
        let isMounted = true;

        async function fetchProducts() {
            try {
                setProductsLoading(true);
                setProductsError("");

                const response = await API.get("/products");
                const fetchedProducts = response.data.products || [];

                const formattedProducts = fetchedProducts.map(
                    (product) => {
                        const variants = product.variants || [];

                        const availableSizes = [
                            ...new Set(
                                variants.map((variant) => variant.size)
                            ),
                        ];

                        const totalStock = variants.reduce(
                            (total, variant) =>
                                total + Number(variant.stock || 0),
                            0
                        );

                        return {
                            id: product._id,
                            name: product.name,
                            slug: product.slug,
                            category:
                                product.category?.name || "Clothing",
                            price: Number(product.price),
                            description: product.description || "",
                            image: getProductImage(product),
                            variants,
                            sizes: availableSizes,
                            stock: totalStock,
                            badge: product.isFeatured ? "FEATURED" : "",
                        };
                    }
                );

                if (isMounted) {
                    setProducts(formattedProducts);
                }
            } catch (error) {
                console.error("Unable to load products:", error);

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

        fetchProducts();

        return () => {
            isMounted = false;
        };
    }, []);

    // Categories come from MongoDB products.
    const categories = [
        "All Products",
        ...new Set(products.map((product) => product.category)),
    ];

    const [newsletterEmail, setNewsletterEmail] = useState("");

    const [searchTerm, setSearchTerm] = useState("");
    const [sortOption, setSortOption] = useState("default");

    // Product details popup state.
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedSize, setSelectedSize] = useState("M");
    const [selectedColor, setSelectedColor] = useState("");
    const [selectedQuantity, setSelectedQuantity] = useState(1);

    // Filter and sort products.
    const filteredProducts = products
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

    // Calculate stock for a particular size.
    function getSizeStock(product, size) {
        return (product.variants || [])
            .filter((variant) => variant.size === size)
            .reduce(
                (total, variant) =>
                    total + Number(variant.stock || 0),
                0
            );
    }

    // Find the exact size and colour variant.
    function getSelectedVariant(product, size, color) {
        return (product?.variants || []).find(
            (variant) =>
                variant.size === size &&
                variant.color === color
        );
    }

    // Get stock for the exact selected variant.
    function getSelectedStock(product, size, color) {
        const variant = getSelectedVariant(product, size, color);
        return Number(variant?.stock || 0);
    }

    // Get colours that are in stock for the selected size.
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
            ),
        ];
    }

    // Open product details and select an available variant.
    function openProductDetails(product) {
        setSelectedProduct(product);

        const defaultSize =
            product.sizes.includes("M") &&
                getSizeStock(product, "M") > 0
                ? "M"
                : product.sizes.find(
                    (size) => getSizeStock(product, size) > 0
                ) || "";

        const firstAvailableVariant = (product.variants || []).find(
            (variant) =>
                variant.size === defaultSize &&
                Number(variant.stock || 0) > 0
        );

        setSelectedSize(defaultSize);
        setSelectedColor(firstAvailableVariant?.color || "");
        setSelectedQuantity(1);
    }

    function closeProductDetails() {
        setSelectedProduct(null);
    }

    // Add the selected product to the shared guest or customer cart.
    async function addToCart(product, size, color, quantity = 1) {
        try {
            await addItem(product, size, color, quantity);
            return true;
        } catch (error) {
            console.error("Unable to add product to cart:", error);
            alert(
                error.response?.data?.message ||
                error.message ||
                "Unable to add this item to your cart. Please try again."
            );
            return false;
        }
    }

    // Quick Add chooses an available variant automatically.
    function quickAdd(product) {
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

        addToCart(product, variant.size, variant.color, 1);
    }

    function scrollToSection(sectionId) {
        document
            .getElementById(sectionId)
            ?.scrollIntoView({
                behavior: "smooth",
            });
    }

    // Newsletter form.
    function handleNewsletterSubmit(event) {
        event.preventDefault();

        if (!newsletterEmail.trim()) {
            return;
        }

        alert(
            "Thank you for your interest in JBELLS. Newsletter subscription will be connected later."
        );

        setNewsletterEmail("");
    }

    // Add selected product from the details popup.
    async function handleProductAddToCart() {
        if (!selectedProduct) return;

        const added = await addToCart(
            selectedProduct,
            selectedSize,
            selectedColor,
            selectedQuantity
        );

        if (!added) return;

        closeProductDetails();
    }

    return (
        <>
            <style>{`
                .product-modal-overlay {
                    padding: 12px !important;
                    overscroll-behavior: contain;
                }

                .product-modal {
                    width: min(900px, 100%) !important;
                    max-height: calc(100dvh - 24px) !important;
                    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                    gap: clamp(16px, 3vw, 30px) !important;
                    padding: clamp(18px, 3vw, 30px) !important;
                    overflow-y: auto;
                    overscroll-behavior: contain;
                }

                .product-modal-image {
                    min-width: 0;
                    align-self: start;
                }

                .product-modal-image img {
                    width: 100%;
                    max-height: min(550px, 72dvh);
                    object-fit: contain !important;
                    object-position: center top;
                    background: #f0eee9;
                }

                .product-modal-content {
                    min-width: 0;
                    padding: 20px 0 0 !important;
                }

                @media (max-width: 640px) {
                    .product-modal {
                        grid-template-columns: minmax(0, 1fr) !important;
                        gap: 14px !important;
                        padding: 16px !important;
                    }

                    .product-modal-image img {
                        max-height: 34dvh;
                    }

                    .product-modal-content {
                        padding: 0 !important;
                    }

                    .product-modal-content h2 {
                        margin: 8px 0 10px !important;
                        font-size: clamp(24px, 7vw, 30px) !important;
                    }

                    .product-modal-content .product-modal-section {
                        margin-bottom: 18px !important;
                    }

                    .product-modal-content button {
                        touch-action: manipulation;
                    }
                }

                @media (max-width: 380px) {
                    .product-modal-overlay {
                        padding: 8px !important;
                    }

                    .product-modal {
                        max-height: calc(100dvh - 16px) !important;
                        padding: 14px !important;
                    }
                }
            `}</style>

            {/* Announcement */}
            <div className="announcement">
                DISCOVER YOUR STYLE WITH JBELLS
            </div>

            {/* Hero */}
            <section className="hero" id="home">
                <div className="hero-content">
                    <span className="eyebrow">
                        THE JBELLS COLLECTION
                    </span>

                    <h1>
                        Wear Your
                        <br />
                        <em>Confidence.</em>
                    </h1>

                    <p>
                        Discover thoughtfully selected male and unisex
                        clothing designed for everyday style, comfort,
                        and confidence.
                    </p>

                    <a href="#shop" className="primary-button">
                        EXPLORE COLLECTION
                    </a>

                    <div className="hero-note">
                        <span>01</span>
                        <span>STYLE · COMFORT · CONFIDENCE</span>
                    </div>
                </div>

                <div className="hero-image">
                    <img
                        src={heroImage}
                        alt="JBELLS branded shopping bags and customer"
                    />

                    <div className="image-caption">
                        <span>JBELLS COLLECTION</span>
                        <span>EVERYDAY STYLE</span>
                    </div>
                </div>
            </section>

            {/* Categories */}
            <section
                className="categories-section"
                id="categories"
            >
                <div className="section-heading">
                    <div>
                        <span className="eyebrow">
                            SHOP YOUR STYLE
                        </span>

                        <h2>Explore Categories</h2>
                    </div>

                    <a href="#shop" className="text-link">
                        VIEW COLLECTION →
                    </a>
                </div>

                <div className="category-list">
                    {categories.map((category, index) => (
                        <button
                            key={category}
                            type="button"
                            className="category-item"
                            onClick={() => {
                                setActiveCategory(category);
                                scrollToSection("shop");
                            }}
                        >
                            {category}

                            <span>
                                {String(index + 1).padStart(2, "0")}
                            </span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Shop */}
            <section className="shop-section" id="shop">
                <div className="section-heading">
                    <div>
                        <span className="eyebrow">
                            CURATED FOR YOU
                        </span>

                        <h2>Shop the Collection</h2>
                    </div>

                    <p>
                        Discover clothing made for your everyday
                        moments and personal style.
                    </p>
                </div>

                {/* Category filters */}
                <div className="category-filters">
                    {categories.map((category) => (
                        <button
                            key={category}
                            type="button"
                            className={`filter-button ${activeCategory === category
                                    ? "active"
                                    : ""
                                }`}
                            onClick={() =>
                                setActiveCategory(category)
                            }
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* Search and sorting */}
                <div className="shop-controls">
                    <input
                        type="search"
                        className="product-search"
                        placeholder="Search clothing..."
                        value={searchTerm}
                        onChange={(event) =>
                            setSearchTerm(event.target.value)
                        }
                        aria-label="Search products"
                    />

                    <select
                        className="product-sort"
                        value={sortOption}
                        onChange={(event) =>
                            setSortOption(event.target.value)
                        }
                        aria-label="Sort products"
                    >
                        <option value="default">
                            Default Sorting
                        </option>

                        <option value="price-low">
                            Price: Low to High
                        </option>

                        <option value="price-high">
                            Price: High to Low
                        </option>

                        <option value="name">
                            Name: A to Z
                        </option>
                    </select>
                </div>

                {/* Product loading */}
                {productsLoading && (
                    <p className="empty-products">
                        Loading JBELLS products...
                    </p>
                )}

                {/* Product loading error */}
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

                {/* Products */}
                {!productsLoading && !productsError && (
                    <>
                        <div className="product-grid">
                            {filteredProducts.map((product) => (
                                <article
                                    className="product-card"
                                    key={product.id}
                                >
                                    <div
                                        className="product-image"
                                        onClick={() =>
                                            openProductDetails(product)
                                        }
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
                                            disabled={product.stock <= 0}
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
                                                onClick={() =>
                                                    openProductDetails(product)
                                                }
                                                style={{ cursor: "pointer" }}
                                            >
                                                {product.name}
                                            </h3>

                                            <button
                                                type="button"
                                                className="text-link"
                                                onClick={() =>
                                                    openProductDetails(product)
                                                }
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
                                                color:
                                                    product.stock > 0
                                                        ? "#52734b"
                                                        : "#b42318",
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
                                No products found. Try another search
                                or category.
                            </p>
                        )}
                    </>
                )}
            </section>

            {/* Product Details Popup */}
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
                            gridTemplateColumns:
                                "repeat(auto-fit, minmax(260px, 1fr))",
                            gap: "30px",
                            padding: "30px",
                        }}
                    >
                        {/* Close button */}
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

                        {/* Product image */}
                        <div className="product-modal-image" style={{ minWidth: 0 }}>
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

                        {/* Product information */}
                        <div
                            className="product-modal-content"
                            style={{
                                paddingTop: "20px",
                                minWidth: 0,
                            }}
                        >
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

                            <p
                                style={{
                                    fontSize: "20px",
                                    fontWeight: 600,
                                    marginBottom: "20px",
                                }}
                            >
                                {formatPrice(selectedProduct.price)}
                            </p>

                            <p
                                style={{
                                    color: "#77766f",
                                    fontSize: "14px",
                                    lineHeight: 1.8,
                                    marginBottom: "25px",
                                }}
                            >
                                {selectedProduct.description}
                            </p>

                            <p
                                className="product-stock"
                                style={{
                                    fontSize: "12px",
                                    color:
                                        selectedProduct.stock > 0
                                            ? "#52734b"
                                            : "#b42318",
                                    marginBottom: "20px",
                                }}
                            >
                                {selectedProduct.stock > 0
                                    ? `${selectedProduct.stock} items available`
                                    : "Out of stock"}
                            </p>

                            {/* Size selection */}
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

                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "8px",
                                    }}
                                >
                                    {selectedProduct.sizes.map((size) => {
                                        const sizeStock =
                                            getSizeStock(selectedProduct, size);

                                        return (
                                            <button
                                                key={size}
                                                type="button"
                                                disabled={sizeStock <= 0}
                                                onClick={() => {
                                                    const availableColors =
                                                        getAvailableColors(
                                                            selectedProduct,
                                                            size
                                                        );

                                                    setSelectedSize(size);
                                                    setSelectedColor(
                                                        availableColors[0] || ""
                                                    );
                                                    setSelectedQuantity(1);
                                                }}
                                                aria-pressed={
                                                    selectedSize === size
                                                }
                                                style={{
                                                    minWidth: "45px",
                                                    height: "42px",
                                                    padding: "0 10px",
                                                    border:
                                                        selectedSize === size
                                                            ? "1px solid #22221f"
                                                            : "1px solid #e7e5df",
                                                    background:
                                                        selectedSize === size
                                                            ? "#22221f"
                                                            : "transparent",
                                                    color:
                                                        selectedSize === size
                                                            ? "#ffffff"
                                                            : "#22221f",
                                                    opacity:
                                                        sizeStock <= 0 ? 0.4 : 1,
                                                    cursor:
                                                        sizeStock <= 0
                                                            ? "not-allowed"
                                                            : "pointer",
                                                }}
                                            >
                                                {size}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Colour selection */}
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

                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: "8px",
                                    }}
                                >
                                    {getAvailableColors(
                                        selectedProduct,
                                        selectedSize
                                    ).map((color) => (
                                        <button
                                            key={color}
                                            type="button"
                                            aria-pressed={
                                                selectedColor === color
                                            }
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
                                                    selectedColor === color
                                                        ? "#ffffff"
                                                        : "#22221f",
                                                cursor: "pointer",
                                            }}
                                        >
                                            {color}
                                        </button>
                                    ))}
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

                            {/* Quantity */}
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

                                    <span
                                        style={{
                                            flex: 1,
                                            textAlign: "center",
                                            fontSize: "14px",
                                        }}
                                    >
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

                            {/* Add to cart */}
                            <button
                                type="button"
                                className="primary-button"
                                onClick={handleProductAddToCart}
                                disabled={
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
                                }}
                            >
                                ADD TO CART —{" "}
                                {formatPrice(
                                    selectedProduct.price *
                                    selectedQuantity
                                )}
                            </button>

                            <p
                                style={{
                                    color: "#77766f",
                                    fontSize: "12px",
                                    lineHeight: 1.7,
                                    marginTop: "15px",
                                }}
                            >
                                Select your preferred size and quantity
                                before adding this item to your cart.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* About */}
            <section className="about-section" id="about">
                <div>
                    <span className="eyebrow">OUR STORY</span>

                    <h2>
                        Style that feels
                        <br />
                        <em>like you.</em>
                    </h2>
                </div>

                <p>
                    JBELLS is dedicated to male and unisex fashion.
                    Our collection brings together contemporary
                    clothing, everyday comfort, and timeless style.

                    <br />
                    <br />

                    We believe what you wear should express your
                    personality and make you feel confident.
                </p>
            </section>

            {/* Newsletter */}
            <section className="newsletter-section">
                <span className="eyebrow">STAY CONNECTED</span>

                <h2>
                    Be part of
                    <br />
                    the JBELLS world.
                </h2>

                <form onSubmit={handleNewsletterSubmit}>
                    <input
                        type="email"
                        placeholder="Enter your email address"
                        value={newsletterEmail}
                        onChange={(event) =>
                            setNewsletterEmail(event.target.value)
                        }
                        required
                        aria-label="Email address"
                    />

                    <button type="submit" className="primary-button">
                        JOIN US
                    </button>
                </form>
            </section>

            {/* Contact */}
            <section
                className="newsletter-section"
                id="contact"
                style={{ background: "#faf9f6" }}
            >
                <span className="eyebrow">CONNECT WITH US</span>

                <h2>
                    Follow the
                    <br />
                    JBELLS journey.
                </h2>

                <p>
                    Instagram: Jbellscreation
                    <br />
                    Snapchat: jbells001
                    <br />
                    Facebook: Jbellscreations
                    <br />
                    TikTok: jbells
                    <br />
                    Phone: 08105056702
                </p>
            </section>



        </>
    );
}

export default Home;