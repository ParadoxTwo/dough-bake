import { getContent } from "@/lib/content";
import { getProductsWithImages } from "@/lib/actions/product";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import MenuPageClient from "@/components/menu/MenuPageClient";

interface MenuPageProps {
  searchParams: Promise<{ q?: string }>
}

export default async function MenuPage({ searchParams }: MenuPageProps) {
  const products = await getProductsWithImages();
  const menuSubtitle = await getContent('logo_tagline');
  const params = await searchParams;
  const initialQuery = params.q || '';

  return (
    <PageContainer>
      <PageHeader 
        title="Our Menu" 
        subtitle={menuSubtitle}
      />

      <MenuPageClient products={products} initialQuery={initialQuery} />
    </PageContainer>
  );
}

