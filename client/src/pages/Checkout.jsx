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
        // पक्का करें कि डेटा आने पर पहला एड्रेस सेलेक्ट हो जाए
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
            try {
              await axios.post("/api/order/razorpay-place", {
                userId: user._id,
                items,
                address: selectedAddress._id,
                paymentId: response.razorpay_payment_id,
              });

              setCartItems({});
              navigate("/my-orders");
            } catch (err) {
              toast.error("Payment recording failed");
            }
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
    <div className="max-w-3xl mx-auto mt-16 px-4">
      <h1 className="text-3xl font-medium mb-6">Checkout</h1>

      {/* Address */}
      <div className="mb-6">
        <p className="font-medium mb-2">Delivery Address</p>
        <select
          // BUG FIX: value को selectedAddress._id से बांध दिया ताकि React को पता रहे क्या सेलेक्टेड है
          value={selectedAddress?._id || ""}
          onChange={(e) => {
            const addr = addresses.find((a) => a._id === e.target.value);
            setSelectedAddress(addr);
          }}
          className="w-full border p-2 bg-white"
        >
          {/* अगर एड्रेस लोड हो रहे हैं या नहीं हैं */}
          {addresses.length === 0 ? (
            <option value="">No address found</option>
          ) : (
            addresses.map((addr) => (
              <option key={addr._id} value={addr._id}>
                {addr.street}, {addr.city}
              </option>
            ))
          )}
        </select>
        {addresses.length === 0 && (
          <p className="text-sm text-red-500 mt-1">Please add an address in your profile first.</p>
        )}
      </div>

      {/* Payment Method */}
      <div className="mb-6">
        <p className="font-medium mb-2">Payment Method</p>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          className="w-full border p-2 bg-white"
        >
          <option value="COD">Cash on Delivery</option>
          <option value="ONLINE">Pay Online</option>
        </select>
      </div>

      {/* Summary */}
      <div className="border p-4 mb-6 bg-gray-50">
        <p className="flex justify-between font-medium">
          <span>Total:</span>
          <span>
            {currency}
            {(getCartAmount() + (getCartAmount() * 2) / 100).toFixed(2)}
          </span>
        </p>
      </div>

      <button
        onClick={placeOrder}
        disabled={!selectedAddress || cartArray.length === 0}
        className={`w-full py-3 text-white font-bold ${
          !selectedAddress || cartArray.length === 0 ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {paymentMethod === "COD" ? "Place Order" : "Pay Now"}
      </button>
    </div>
  );
};

export default Checkout;