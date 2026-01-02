import { getContent } from "@/lib/content";
import { getProductsWithImages } from "@/lib/actions/product";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import MenuPageClient from "@/components/menu/MenuPageClient";

export default async function MenuPage() {
  const products = await getProductsWithImages();
  const menuSubtitle = await getContent('logo_tagline');

  return (
    <PageContainer>
      <PageHeader 
        title="Our Menu" 
        subtitle={menuSubtitle}
      />

      <MenuPageClient products={products} />
    </PageContainer>
  );
}

