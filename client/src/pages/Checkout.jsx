import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const Checkout = () => {
  const {
    products,
    cartItems,
    currency,
    getCartAmount,
    axios,
    user,
    navigate,
    setCartItems,
  } = useAppContext();

  const [cartArray, setCartArray] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("COD");

  // 🔹 Convert cartItems object → array (same as Cart.jsx)
  const getCart = () => {
    let temp = [];
    for (const key in cartItems) {
      const product = products.find((p) => p._id === key);
      if (product) {
        temp.push({
          ...product,
          quantity: cartItems[key],
        });
      }
    }
    setCartArray(temp);
  };

  // 🔹 Fetch user addresses
  const getUserAddress = async () => {
    try {
      const { data } = await axios.get("/api/address/get");
      if (data.success && data.addresses.length > 0) {
        setAddresses(data.addresses);
        setSelectedAddress(data.addresses[0]);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // 🔹 COD / Razorpay
  const placeOrder = async () => {
    if (!selectedAddress) {
      return toast.error("Please select an address");
    }

    const items = cartArray.map((item) => ({
      product: item._id,
      quantity: item.quantity,
    }));

    try {
      if (paymentMethod === "COD") {
        const { data } = await axios.post("/api/order/cod", {
          userId: user._id,
          items,
          address: selectedAddress._id,
        });

        if (data.success) {
          toast.success(data.message);
          setCartItems({});
          navigate("/my-orders");
        } else {
          toast.error(data.message);
        }
      } else {
        // Razorpay
        const { data } = await axios.post("/api/order/razorpay-order", {
          amount: getCartAmount() + (getCartAmount() * 2) / 100,
        });

        const options = {
          key: data.key,
          amount: data.order.amount,
          currency: "INR",
          name: "GreenCart",
          description: "Order Payment",
          order_id: data.order.id,

          handler: async function (response) {
            await axios.post("/api/order/razorpay-place", {
              userId: user._id,
              items,
              address: selectedAddress._id,
              paymentId: response.razorpay_payment_id,
            });

            setCartItems({});
            navigate("/my-orders");
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (products.length > 0 && cartItems) {
      getCart();
    }
  }, [products, cartItems]);

  useEffect(() => {
    if (user) {
      getUserAddress();
    }
  }, [user]);

  return (
    <div className="max-w-3xl mx-auto mt-16">
      <h1 className="text-3xl font-medium mb-6">Checkout</h1>

      {/* Address */}
      <div className="mb-6">
        <p className="font-medium mb-2">Delivery Address</p>
        <select
          onChange={(e) =>
            setSelectedAddress(
              addresses.find((a) => a._id === e.target.value)
            )
          }
          className="w-full border p-2"
        >
          {addresses.map((addr) => (
            <option key={addr._id} value={addr._id}>
              {addr.street}, {addr.city}
            </option>
          ))}
        </select>
      </div>

      {/* Payment */}
      <div className="mb-6">
        <p className="font-medium mb-2">Payment Method</p>
        <select
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full border p-2"
        >
          <option value="COD">Cash on Delivery</option>
          <option value="ONLINE">Pay Online</option>
        </select>
      </div>

      {/* Summary */}
      <div className="border p-4 mb-6">
        <p className="flex justify-between">
          <span>Total:</span>
          <span>
            {currency}
            {getCartAmount() + (getCartAmount() * 2) / 100}
          </span>
        </p>
      </div>

      <button
        onClick={placeOrder}
        className="w-full bg-primary text-white py-3"
      >
        {paymentMethod === "COD" ? "Place Order" : "Pay Now"}
      </button>
    </div>
  );
};

export default Checkout;
