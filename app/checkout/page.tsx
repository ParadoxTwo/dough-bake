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
import { CartItem, clearCart } from "@/lib/utils/cart";
import OrderSummary from "@/components/ui/OrderSummary";
import type { Database } from "@/lib/types/database.types";
import ThemedText from "@/components/ui/ThemedText";

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

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [customer, setCustomer] = useState<CustomerRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const supabase = createClient();

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

      setLoading(false);
    };

    init();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Create or update customer info
      if (customer) {
        await (supabase
          .from("customers") as any)
          .update(formData)
          .eq("user_id", user!.id);
      } else {
        const { data } = await (supabase
          .from("customers") as any)
          .insert([{ user_id: user!.id, ...formData } as CustomerInsert])
          .select()
          .single();

        setCustomer(data as CustomerRow | null);
      }

      // In a real app, this would:
      // 1. Create an order in the database
      // 2. Initiate Razorpay payment
      // 3. Handle payment callback
      // For now, we'll just show success

      alert("Order placed successfully! (Payment integration pending)");
      clearCart();
      router.push("/");
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Error placing order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingSkeleton />
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
            {submitting ? "Processing..." : "Place Order"}
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


