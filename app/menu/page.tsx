import { getContent } from "@/lib/content";
import { groupProductsByCategory } from "@/lib/utils/products";
import { getProductsWithImages } from "@/lib/actions/product";
import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import CategorySection from "@/components/product/CategorySection";
import EmptyState from "@/components/ui/EmptyState";

export default async function MenuPage() {
  const products = await getProductsWithImages();
  const productsByCategory = groupProductsByCategory(products);
  const menuSubtitle = await getContent('logo_tagline');

  return (
    <PageContainer>
      <PageHeader 
        title="Our Menu" 
        subtitle={menuSubtitle}
      />

      {Object.keys(productsByCategory).length > 0 ? (
        Object.entries(productsByCategory).map(([category, items]) => (
          <CategorySection
            key={category}
            category={category}
            products={items}
            showCategory={false}
          />
        ))
      ) : (
        <EmptyState message="No products available at the moment. Check back soon!" />
      )}
    </PageContainer>
  );
}

