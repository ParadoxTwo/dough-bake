import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";

export default async function AboutPage() {
  return (
    <PageContainer>
      <PageHeader 
        title="About Us" 
        subtitle="Our story, our passion, our commitment to quality"
      />

      <div className="max-w-3xl mx-auto space-y-8">
        <section>
          <h2 
            className="text-2xl font-semibold mb-4"
            style={{ color: 'var(--theme-text)' }}
          >
            Our Story
          </h2>
          <p 
            className="text-lg leading-relaxed"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            Dough Bake was born from a simple passion: creating the finest baked goods 
            using traditional methods and the highest quality ingredients. What started 
            as a small home kitchen experiment has grown into a beloved bakery that 
            brings the warmth and comfort of homemade treats to your door.
          </p>
        </section>

        <section>
          <h2 
            className="text-2xl font-semibold mb-4"
            style={{ color: 'var(--theme-text)' }}
          >
            Our Mission
          </h2>
          <p 
            className="text-lg leading-relaxed"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            We believe that great baking starts with great ingredients. That's why we 
            source only the finest organic and locally-sourced ingredients, ensuring 
            every bite is as fresh and flavorful as possible. Our expert bakers combine 
            time-honored techniques with modern care to deliver products that meet the 
            highest standards of quality and taste.
          </p>
        </section>

        <section>
          <h2 
            className="text-2xl font-semibold mb-4"
            style={{ color: 'var(--theme-text)' }}
          >
            What Makes Us Different
          </h2>
          <ul 
            className="space-y-3 text-lg"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            <li className="flex items-start">
              <span className="mr-3">🌾</span>
              <span>Fresh, locally-sourced organic ingredients</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3">👨‍🍳</span>
              <span>Handcrafted by experienced artisan bakers</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3">🚚</span>
              <span>Same-day delivery for maximum freshness</span>
            </li>
            <li className="flex items-start">
              <span className="mr-3">❤️</span>
              <span>Made with care and attention to detail</span>
            </li>
          </ul>
        </section>
      </div>
    </PageContainer>
  );
}
