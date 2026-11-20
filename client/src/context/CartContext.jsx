
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import API from "../api/api";

const CartContext = createContext(null);

const GUEST_CART_KEY = "jbells-cart";

// Read the guest cart safely from the browser.
function readGuestCart() {
  try {
    const savedCart = localStorage.getItem(GUEST_CART_KEY);
    const parsedCart = savedCart ? JSON.parse(savedCart) : [];

    return Array.isArray(parsedCart) ? parsedCart : [];
  } catch (error) {
    console.error("Unable to read guest cart:", error);
    return [];
  }
}

// Convert the backend cart response into the frontend cart format.
function mapBackendCart(responseData) {
  const backendCart = responseData?.cart || responseData;
  const items = Array.isArray(backendCart?.items)
    ? backendCart.items
    : [];

  return items.map((item) => {
    const product = item.product || {};
    const productId = product.id || product._id || "";

    const image = Array.isArray(product.images)
      ? product.images[0] || ""
      : product.images || "";

    return {
      cartKey: `${productId}-${item.variantSku}`,
      backendItemId: item.id || item._id,
      id: productId,
      variantSku: item.variantSku,
      name: product.name || "JBELLS Product",
      category: product.category?.name || "",
      image,
      price: Number(item.unitPrice || 0),
      size: item.size || "",
      color: item.color || "",
      quantity: Number(item.quantity || 0),
      stock: Number(item.availableStock || 0),
    };
  });
}

// Determine whether the current token belongs to a customer.
function getCustomerToken() {
  const token = sessionStorage.getItem("jbells-token");

  if (!token) {
    return null;
  }

  try {
    const savedUser = sessionStorage.getItem("jbells-user");
    const user = savedUser ? JSON.parse(savedUser) : null;

    // If a user object exists, only customer accounts use the customer cart.
    if (user?.role && String(user.role).toLowerCase() !== "customer") {
      return null;
    }

    return token;
  } catch {
    return token;
  }
}

export function CartProvider({ children }) {
  const [guestCart, setGuestCart] = useState(readGuestCart);
  const [cart, setCart] = useState(readGuestCart);

  const [cartMode, setCartMode] = useState("guest");
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState("");

  const migrationInProgress = useRef(false);
  const activeToken = useRef(null);

  // Save the guest cart whenever it changes.
  useEffect(() => {
    try {
      localStorage.setItem(
        GUEST_CART_KEY,
        JSON.stringify(guestCart)
      );
    } catch (error) {
      console.error("Unable to save guest cart:", error);
    }
  }, [guestCart]);

  // Retrieve the signed-in customer's MongoDB cart.
  const refreshCart = useCallback(async () => {
    const token = getCustomerToken();

    if (!token) {
      setCartMode("guest");
      setCart(guestCart);
      return guestCart;
    }

    const response = await API.get("/cart");
    const customerItems = mapBackendCart(response.data);

    setCartMode("customer");
    setCart(customerItems);

    return customerItems;
  }, [guestCart]);

  // Load the cart and transfer guest items after customer login.
  const initialiseCart = useCallback(async () => {
    const token = getCustomerToken();

    if (!token) {
      activeToken.current = null;
      setCartMode("guest");
      setCart(guestCart);
      setCartError("");
      setCartLoading(false);
      return;
    }

    if (
      migrationInProgress.current &&
      activeToken.current === token
    ) {
      return;
    }

    migrationInProgress.current = true;
    activeToken.current = token;

    setCartMode("customer");
    setCartLoading(true);
    setCartError("");

    try {
      const migrationPrefix = `jbells-cart-migrated-${token.slice(-16)}`;

      // Transfer each guest item only once for this login token.
      for (const item of guestCart) {
        if (
          !item.id ||
          !item.variantSku ||
          !Number.isInteger(Number(item.quantity)) ||
          Number(item.quantity) < 1
        ) {
          continue;
        }

        const itemMigrationKey = `${migrationPrefix}-${item.cartKey}`;

        if (sessionStorage.getItem(itemMigrationKey) === "true") {
          continue;
        }

        await API.post("/cart", {
          productId: item.id,
          variantSku: item.variantSku,
          quantity: Number(item.quantity),
        });

        sessionStorage.setItem(itemMigrationKey, "true");
      }

      // Retrieve the latest customer cart after migration.
      const response = await API.get("/cart");
      const customerItems = mapBackendCart(response.data);

      setCart(customerItems);

      // Clear the guest cart only after successful migration.
      if (guestCart.length > 0) {
        setGuestCart([]);
      }
    } catch (error) {
      console.error("Unable to initialise customer cart:", error);

      setCartError(
        error.response?.data?.message ||
          "Unable to load your saved cart. Please try again."
      );
    } finally {
      migrationInProgress.current = false;
      setCartLoading(false);
    }
  }, [guestCart]);

  // Initialise on page load and respond to login/logout events.
  useEffect(() => {
    initialiseCart();

    function handleAuthenticationChange() {
      initialiseCart();
    }

    window.addEventListener(
      "jbells-auth-changed",
      handleAuthenticationChange
    );

    return () => {
      window.removeEventListener(
        "jbells-auth-changed",
        handleAuthenticationChange
      );
    };
  }, [initialiseCart]);

  // Add a product or selected variation to the cart.
  const addItem = useCallback(
    async (product, size, color, quantity = 1) => {
      const variant = (product?.variants || []).find(
        (entry) =>
          entry.size === size &&
          entry.color === color
      );

      if (!variant) {
        throw new Error("Please select an available size and colour.");
      }

      const requestedQuantity = Number(quantity);
      const stock = Number(variant.stock || 0);

      if (
        !Number.isInteger(requestedQuantity) ||
        requestedQuantity < 1
      ) {
        throw new Error("Please select a valid quantity.");
      }

      if (stock < 1) {
        throw new Error("This product variation is out of stock.");
      }

      const token = getCustomerToken();

      if (token) {
        const response = await API.post("/cart", {
          productId: product.id,
          variantSku: variant.sku,
          quantity: requestedQuantity,
        });

        setCart(mapBackendCart(response.data));
        setCartMode("customer");

        return true;
      }

      const cartKey = `${product.id}-${variant.sku}`;

      const existingItem = guestCart.find(
        (item) => item.cartKey === cartKey
      );

      const currentQuantity = Number(existingItem?.quantity || 0);

      if (currentQuantity + requestedQuantity > stock) {
        throw new Error(
          `Only ${Math.max(0, stock - currentQuantity)} more item(s) are available in this size and colour.`
        );
      }

      const newItem = {
        cartKey,
        id: product.id,
        variantSku: variant.sku,
        name: product.name,
        category: product.category || "",
        image: product.image || "",
        price: Number(product.price || 0),
        size: variant.size || "",
        color: variant.color || "",
        quantity: requestedQuantity,
        stock,
      };

      setGuestCart((currentCart) => {
        const existing = currentCart.find(
          (item) => item.cartKey === cartKey
        );

        if (existing) {
          return currentCart.map((item) =>
            item.cartKey === cartKey
              ? {
                  ...item,
                  quantity:
                    Number(item.quantity || 0) +
                    requestedQuantity,
                  stock,
                }
              : item
          );
        }

        return [...currentCart, newItem];
      });

      setCartMode("guest");

      setCart((currentCart) => {
        const existing = currentCart.find(
          (item) => item.cartKey === cartKey
        );

        if (existing) {
          return currentCart.map((item) =>
            item.cartKey === cartKey
              ? {
                  ...item,
                  quantity:
                    Number(item.quantity || 0) +
                    requestedQuantity,
                  stock,
                }
              : item
          );
        }

        return [...currentCart, newItem];
      });

      return true;
    },
    [guestCart]
  );

  // Change the quantity of a cart item.
  const updateQuantity = useCallback(
    async (item, quantity) => {
      const newQuantity = Number(quantity);

      if (!Number.isInteger(newQuantity) || newQuantity < 1) {
        throw new Error("Quantity must be at least 1.");
      }

      if (newQuantity > Number(item.stock || 0)) {
        throw new Error(
          `Only ${item.stock} units are currently available.`
        );
      }

      const token = getCustomerToken();

      if (token) {
        if (!item.backendItemId) {
          throw new Error("Cart item ID is missing. Please refresh your cart.");
        }

        const response = await API.put(
          `/cart/${item.backendItemId}`,
          { quantity: newQuantity }
        );

        setCart(mapBackendCart(response.data));
        return true;
      }

      const updateItems = (items) =>
        items.map((currentItem) =>
          currentItem.cartKey === item.cartKey
            ? { ...currentItem, quantity: newQuantity }
            : currentItem
        );

      setGuestCart(updateItems);
      setCart(updateItems);

      return true;
    },
    []
  );

  // Remove one item from the cart.
  const removeItem = useCallback(
    async (item) => {
      const token = getCustomerToken();

      if (token) {
        if (!item.backendItemId) {
          throw new Error("Cart item ID is missing. Please refresh your cart.");
        }

        const response = await API.delete(
          `/cart/${item.backendItemId}`
        );

        setCart(mapBackendCart(response.data));
        return true;
      }

      const removeFromItems = (items) =>
        items.filter(
          (currentItem) =>
            currentItem.cartKey !== item.cartKey
        );

      setGuestCart(removeFromItems);
      setCart(removeFromItems);

      return true;
    },
    []
  );

  // Remove every item from the cart.
  const clearCart = useCallback(async () => {
    const token = getCustomerToken();

    if (token) {
      await API.delete("/cart");
      setCart([]);
      return true;
    }

    setGuestCart([]);
    setCart([]);
    return true;
  }, []);

  const cartCount = useMemo(
    () =>
      cart.reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
      ),
    [cart]
  );

  const cartSubtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total +
          Number(item.price || 0) *
            Number(item.quantity || 0),
        0
      ),
    [cart]
  );

  const value = useMemo(
    () => ({
      cart,
      guestCart,
      cartMode,
      cartCount,
      cartSubtotal,
      cartLoading,
      cartError,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      refreshCart,
    }),
    [
      cart,
      guestCart,
      cartMode,
      cartCount,
      cartSubtotal,
      cartLoading,
      cartError,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      refreshCart,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside a CartProvider."
    );
  }

  return context;
}
