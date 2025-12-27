'use client'

import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import CartContent from "@/components/ui/CartContent";

export default function CartPage() {
  return (
    <PageContainer>
      <PageHeader title="Shopping Cart" className="mb-8" />
      <CartContent layout="page" />
    </PageContainer>
  );
}

