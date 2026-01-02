import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import StatCard from "@/components/ui/StatCard";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import StatusBadge from "@/components/ui/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import ThemeSwitcher from "@/components/ThemeSwitcher";
import ThemedText from "@/components/ui/ThemedText";
import AdminProductsList from "@/components/admin/AdminProductsList";
import CurrencyManager from "@/components/admin/CurrencyManager";
import PaymentManager from "@/components/admin/PaymentManager";
import CurrencyText from "@/components/ui/CurrencyText";
import type { Database } from "@/lib/types/database.types";

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProductRow = Database['public']['Tables']['products']['Row'];
type OrderRow = Database['public']['Tables']['orders']['Row'];
type CustomerRow = Database['public']['Tables']['customers']['Row'];

type OrderWithCustomer = OrderRow & {
  customers: Pick<CustomerRow, 'name' | 'user_id'> | null;
};

export default async function AdminPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin?redirect=/admin");
  }

  const profileResult = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const profile = profileResult.data as Pick<ProfileRow, 'role'> | null;

  if (profile?.role !== "admin") {
    redirect("/");
  }

  const productsResult = await supabase
    .from("products")
    .select(`
      *,
      product_variants (
        id,
        name,
        product_id
      )
    `)
    .order("created_at", { ascending: false });
  const products = productsResult.data as (ProductRow & {
    product_variants: Array<{ id: string; name: string; product_id: string }> | null;
  })[] | null;

  const ordersResult = await supabase
    .from("orders")
    .select(`
      *,
      customers (
        name,
        user_id
      )
    `)
    .order("created_at", { ascending: false })
    .limit(10);
  const orders = ordersResult.data as OrderWithCustomer[] | null;

  const { count: totalOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true });

  const { count: pendingOrders } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  const revenueResult = await supabase
    .from("orders")
    .select("total_amount")
    .eq("payment_status", "completed");
  const revenueData = revenueResult.data as Pick<OrderRow, 'total_amount'>[] | null;

  const totalRevenue = revenueData?.reduce(
    (sum, order) => sum + parseFloat(order.total_amount.toString()),
    0
  ) || 0;

  return (
    <PageContainer>
      <PageHeader
        title="Admin Dashboard"
        subtitle="Manage products, orders, and view analytics"
        className="mb-8"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard label="Total Products" value={products?.length || 0} />
        <StatCard label="Total Orders" value={totalOrders || 0} />
        <StatCard label="Pending Orders" value={pendingOrders || 0} valueColor="accent" />
        <StatCard 
          label="Total Revenue" 
          value={<CurrencyText amount={totalRevenue} />} 
          valueColor="accent" 
        />
      </div>

      <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <ThemeSwitcher />
        </Card>
        <CurrencyManager />
      </div>

      <div className="mb-8">
        <PaymentManager />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <AdminProductsList products={products || []} />

        <Card>
          <ThemedText as="h2" size="xl" weight="bold" className="mb-6">
            Recent Orders
          </ThemedText>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {orders && orders.length > 0 ? (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between border-b pb-4"
                  style={{ borderColor: 'var(--theme-secondary)' }}
                >
                  <div>
                    <ThemedText as="h3" weight="semibold">
                      {order.customers?.name || "Unknown"}
                    </ThemedText>
                    <ThemedText as="p" size="sm" tone="secondary">
                      {new Date(order.created_at).toLocaleDateString()}
                    </ThemedText>
                  </div>
                  <div className="text-right">
                    <ThemedText as="div" weight="bold">
                      <CurrencyText amount={parseFloat(order.total_amount.toString())} />
                    </ThemedText>
                    <div className="text-sm mt-1">
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="No orders yet" />
            )}
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}

