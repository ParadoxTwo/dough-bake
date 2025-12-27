import Link from "next/link";
import { getContentBatch } from "@/lib/content";
import { getProductsWithImages } from "@/lib/actions/product";
import ProductGrid from "@/components/product/ProductGrid";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";

export default async function Home() {
  const allProducts = await getProductsWithImages();
  const products = allProducts.slice(0, 6);

  // Fetch all content items in parallel
  const content = await getContentBatch([
    "hero_title",
    "hero_description",
    "featured_products_subtitle",
    "service_fresh_ingredients_title",
    "service_fresh_ingredients_description",
    "service_expert_bakers_title",
    "service_expert_bakers_description",
    "service_fast_delivery_title",
    "service_fast_delivery_description",
  ]);

  return (
    <div>
      {/* Hero Section */}
      <section 
        className="py-20"
        style={{
          background: `radial-gradient(circle at center, var(--theme-gradient-start), var(--theme-gradient-middle), var(--theme-background))`,
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 
              className="text-5xl font-bold mb-6"
              style={{ color: 'var(--theme-text)' }}
            >
              {content.hero_title}
            </h1>
            <p 
              className="text-xl mb-8 max-w-2xl mx-auto"
              style={{ color: 'var(--theme-text-secondary)' }}
            >
              {content.hero_description}
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/menu">
                <Button size="lg" fullWidth={false}>Browse Menu</Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg" fullWidth={false}>Learn More</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section 
        className="py-16"
        style={{ backgroundColor: 'var(--theme-background)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PageHeader 
            title="Featured Products" 
            subtitle={content.featured_products_subtitle}
          />

          {products && products.length > 0 ? (
            <>
              <ProductGrid products={products} columns={3} showCategory={true} />
              <div className="text-center mt-12">
                <Link href="/menu">
                  <Button size="lg" fullWidth={false}>View All Products</Button>
                </Link>
              </div>
            </>
          ) : (
            <EmptyState message="No products available at the moment. Check back soon!" />
          )}
        </div>
      </section>

      {/* Features Section */}
      <section 
        className="py-16"
        style={{ backgroundColor: 'var(--theme-surface)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">🌾</div>
              <h3 
                className="text-xl font-semibold mb-2"
                style={{ color: 'var(--theme-text)' }}
              >
                {content.service_fresh_ingredients_title}
              </h3>
              <p style={{ color: 'var(--theme-text-secondary)' }}>
                {content.service_fresh_ingredients_description}
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">👨‍🍳</div>
              <h3 
                className="text-xl font-semibold mb-2"
                style={{ color: 'var(--theme-text)' }}
              >
                {content.service_expert_bakers_title}
              </h3>
              <p style={{ color: 'var(--theme-text-secondary)' }}>
                {content.service_expert_bakers_description}
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🚚</div>
              <h3 
                className="text-xl font-semibold mb-2"
                style={{ color: 'var(--theme-text)' }}
              >
                {content.service_fast_delivery_title}
              </h3>
              <p style={{ color: 'var(--theme-text-secondary)' }}>
                {content.service_fast_delivery_description}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
