'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import PageHeader from "@/components/ui/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
import Card from "@/components/ui/Card";
import LoadingSkeleton from "@/components/ui/LoadingSkeleton";
import { CartItem, clearCart, calculateCartTotals } from "@/lib/utils/cart";
import OrderSummary from "@/components/ui/OrderSummary";
import type { Database } from "@/lib/types/database.types";
import ThemedText from "@/components/ui/ThemedText";
import { useCurrency } from "@/lib/currency/context";
import type { PaymentProvider } from "@/lib/payment/types";
import PaymentForm from "@/components/payment/PaymentForm";
import { PaymentStatus } from "@/lib/types/payment";

interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
}

type CustomerRow = Database["public"]["Tables"]["customers"]["Row"];
type CustomerInsert = Database["public"]["Tables"]["customers"]["Insert"];
type CustomerUpdate = Database["public"]["Tables"]["customers"]["Update"];
type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];
type OrderItemInsert = Database["public"]["Tables"]["order_items"]["Insert"];

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { currency, convertPrice } = useCurrency();

  const [formData, setFormData] = useState<CustomerInfo>({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postal_code: "",
  });

  useEffect(() => {
    const init = async () => {
      // Check authentication
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/signin?redirect=/checkout");
        return;
      }

      setUser(user);

      // Load cart
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        const parsedCart = JSON.parse(savedCart) as CartItem[];
        if (parsedCart.length === 0) {
          router.push("/cart");
          return;
        }
        setCart(parsedCart);
      } else {
        router.push("/cart");
        return;
      }

      // Check if customer info exists
      const { data: customerData } = (await supabase
        .from("customers")
        .select("*")
        .eq("user_id", user.id)
        .single()) as { data: CustomerRow | null };

      if (customerData) {
        setCustomer(customerData);
        setFormData({
          name: customerData.name,
          phone: customerData.phone || "",
          address: customerData.address || "",
          city: customerData.city || "",
          state: customerData.state || "",
          postal_code: customerData.postal_code || "",
        });
      }

      // Load payment settings
      const paymentResponse = await fetch('/api/payment/settings');
      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json();
        if (paymentData && paymentData.enabled) {
          setPaymentProvider(paymentData.provider);
          setPaymentConfig(paymentData.config);
        }
      }

      setLoading(false);
    };

    init();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Create or update customer info
      let customerId: string;
      if (customer) {
        const customerUpdateData: CustomerUpdate = {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          postal_code: formData.postal_code,
        }
        // Type assertion needed because Supabase's type inference doesn't always work correctly
        const customersUpdateQuery = supabase.from("customers") as unknown as {
          update: (values: CustomerUpdate) => {
            eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>
          }
        }
        await customersUpdateQuery
          .update(customerUpdateData)
          .eq("user_id", user!.id);
        customerId = customer.id;
      } else {
        const { data } = await (supabase
          .from("customers") as any)
          .insert([{ user_id: user!.id, ...formData } as CustomerInsert])
          .select()
          .single();

        const newCustomer = data as CustomerRow | null;
        if (!newCustomer) {
          throw new Error("Failed to create customer");
        }
        setCustomer(newCustomer);
        customerId = newCustomer.id;
      }

      // Calculate order total in base currency (INR)
      // Cart prices are stored in INR (base currency)
      const { total: baseTotal } = calculateCartTotals(cart, 0.1);
      
      // Convert to smallest currency unit for payment (paise for INR, cents for USD)
      const amountInSmallestUnit = Math.round(baseTotal * 100);

      // Create order
      type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
      type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
      
      const { data: orderData, error: orderError } = await (supabase
        .from("orders") as any)
        .insert([
          {
            customer_id: customerId,
            total_amount: baseTotal,
            status: "pending",
            payment_status: PaymentStatus.PENDING,
          } as OrderInsert,
        ])
        .select()
        .single();

      if (orderError || !orderData) {
        throw new Error(orderError?.message || "Failed to create order");
      }

      const order = orderData as OrderRow;

      // Create order items
      type OrderItemInsert = Database["public"]["Tables"]["order_items"]["Insert"];
      
      // Store prices in base currency (INR) - cart prices are already in INR
      // Extract product_id from cart item ID (cart items can have concatenated IDs like "productId-variantId")
      const orderItems = cart.map((item) => {
        // If the ID is longer than 36 characters (standard UUID length), it's likely concatenated
        // Extract just the product_id (first 36 characters which is a UUID)
        const productId = item.id.length > 36 ? item.id.substring(0, 36) : item.id;
        
        return {
          order_id: order.id,
          product_id: productId,
          quantity: item.quantity,
          unit_price: item.price,
        } as OrderItemInsert;
      });

      const { error: orderItemsError } = await (supabase
        .from("order_items") as any)
        .insert(orderItems);

      if (orderItemsError) {
        throw new Error(orderItemsError.message || "Failed to create order items");
      }

      // If payment is not configured, complete order without payment
      if (!paymentProvider || !paymentConfig) {
        const updateData: OrderUpdate = {
          payment_status: PaymentStatus.COMPLETED,
          status: "processing",
        }
        // Type assertion needed because Supabase's type inference doesn't always work correctly
        const ordersUpdateQuery = supabase.from("orders") as unknown as {
          update: (values: OrderUpdate) => {
            eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>
          }
        }
        await ordersUpdateQuery
          .update(updateData)
          .eq("id", order.id);

        alert("Order placed successfully!");
        clearCart();
        router.push("/");
        return;
      }

      // Show payment form for configured payment provider
      setOrderId(order.id);
      setShowPaymentForm(true);
      setSubmitting(false);
    } catch (error: any) {
      console.error("Error placing order:", error);
      alert(error.message || "Error placing order. Please try again.");
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = async () => {
    alert("Payment successful! Order placed.");
    clearCart();
    router.push("/");
  };

  const handlePaymentError = (error: string) => {
    alert(`Payment error: ${error}`);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingSkeleton />
      </PageContainer>
    );
  }

  // Show payment form if order is created and payment is required
  if (showPaymentForm && orderId && paymentProvider && paymentConfig) {
    const { total: baseTotal } = calculateCartTotals(cart, 0.1);
    const amountInSmallestUnit = Math.round(baseTotal * 100);

    return (
      <PageContainer>
        <PageHeader
          title="Complete Payment"
          subtitle="Complete your payment to finish the order"
          className="mb-8 text-left"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <PaymentForm
              provider={paymentProvider}
              paymentConfig={paymentConfig}
              orderId={orderId}
              amount={amountInSmallestUnit}
              currency={currency}
              customerId={user!.id}
              customerName={formData.name}
              customerEmail={user?.email || undefined}
              customerPhone={formData.phone}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
            />
          </div>

          <div className="lg:col-span-1">
            <OrderSummary
              items={cart}
              className="sticky top-4"
              showItems
              showCheckoutButton={false}
            />
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Checkout"
        subtitle="Review your order and provide delivery details"
        className="mb-8 text-left"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6">
          <Card>
            <ThemedText as="h2" size="xl" weight="bold" className="mb-6">
              Delivery Information
            </ThemedText>

            <div className="space-y-4">
              <Input
                label="Full Name *"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />

              <Input
                label="Phone Number *"
                type="tel"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />

              <Input
                label="Address *"
                required
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="City *"
                  required
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                />

                <Input
                  label="State *"
                  required
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                />
              </div>

              <Input
                label="Postal Code *"
                required
                value={formData.postal_code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    postal_code: e.target.value,
                  })
                }
              />
            </div>
          </Card>

          <Button
            type="submit"
            disabled={submitting}
            loading={submitting}
            className="text-lg"
          >
            {submitting ? "Processing..." : paymentProvider ? "Continue to Payment" : "Place Order"}
          </Button>
        </form>

        <div className="lg:col-span-1">
          <OrderSummary
            items={cart}
            className="sticky top-4"
            showItems
            showCheckoutButton={false}
          />
        </div>
      </div>
    </PageContainer>
  );
}


