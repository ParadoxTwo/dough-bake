import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";

export default async function ShippingPage() {
  return (
    <PageContainer>
      <PageHeader 
        title="Shipping Information" 
        subtitle="Fast, fresh delivery to your door"
      />

      <div className="max-w-3xl mx-auto space-y-8">
        <section>
          <h2 
            className="text-2xl font-semibold mb-4"
            style={{ color: 'var(--theme-text)' }}
          >
            Delivery Options
          </h2>
          <div className="space-y-4">
            <div>
              <h3 
                className="text-xl font-semibold mb-2"
                style={{ color: 'var(--theme-text)' }}
              >
                Same-Day Delivery
              </h3>
              <p 
                className="text-lg leading-relaxed"
                style={{ color: 'var(--theme-text-secondary)' }}
              >
                Orders placed before 12:00 PM can be delivered the same day. 
                Delivery times vary by location and are typically between 2:00 PM and 6:00 PM.
              </p>
            </div>
            <div>
              <h3 
                className="text-xl font-semibold mb-2"
                style={{ color: 'var(--theme-text)' }}
              >
                Next-Day Delivery
              </h3>
              <p 
                className="text-lg leading-relaxed"
                style={{ color: 'var(--theme-text-secondary)' }}
              >
                Orders placed after 12:00 PM will be delivered the next business day. 
                We'll send you a confirmation email with your estimated delivery window.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 
            className="text-2xl font-semibold mb-4"
            style={{ color: 'var(--theme-text)' }}
          >
            Delivery Areas
          </h2>
          <p 
            className="text-lg leading-relaxed mb-4"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            We currently deliver within a 20-mile radius of our bakery. During checkout, 
            you can enter your address to check if we deliver to your area. We're 
            constantly expanding our delivery zones, so check back if we don't currently 
            serve your location.
          </p>
        </section>

        <section>
          <h2 
            className="text-2xl font-semibold mb-4"
            style={{ color: 'var(--theme-text)' }}
          >
            Shipping Costs
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span 
                className="text-lg"
                style={{ color: 'var(--theme-text-secondary)' }}
              >
                Orders over $50
              </span>
              <span 
                className="text-lg font-semibold"
                style={{ color: 'var(--theme-text)' }}
              >
                FREE
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span 
                className="text-lg"
                style={{ color: 'var(--theme-text-secondary)' }}
              >
                Orders under $50
              </span>
              <span 
                className="text-lg font-semibold"
                style={{ color: 'var(--theme-text)' }}
              >
                $5.99
              </span>
            </div>
          </div>
        </section>

        <section>
          <h2 
            className="text-2xl font-semibold mb-4"
            style={{ color: 'var(--theme-text)' }}
          >
            Order Tracking
          </h2>
          <p 
            className="text-lg leading-relaxed"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            Once your order is confirmed, you'll receive an email with your order number 
            and tracking information. You can also check your order status in your account 
            dashboard.
          </p>
        </section>

        <section>
          <h2 
            className="text-2xl font-semibold mb-4"
            style={{ color: 'var(--theme-text)' }}
          >
            Packaging & Freshness
          </h2>
          <p 
            className="text-lg leading-relaxed"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            All our products are carefully packaged to maintain freshness during transit. 
            We use eco-friendly packaging materials and ensure that your baked goods arrive 
            in perfect condition. Items are baked fresh on the day of delivery to ensure 
            maximum quality and flavor.
          </p>
        </section>

        <section>
          <h2 
            className="text-2xl font-semibold mb-4"
            style={{ color: 'var(--theme-text)' }}
          >
            Delivery Instructions
          </h2>
          <p 
            className="text-lg leading-relaxed mb-4"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            During checkout, you can add special delivery instructions such as:
          </p>
          <ul 
            className="space-y-2 text-lg ml-6"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            <li>• Leave at door / Ring doorbell</li>
            <li>• Preferred delivery time window</li>
            <li>• Gate codes or building access information</li>
            <li>• Any other special instructions</li>
          </ul>
        </section>
      </div>
    </PageContainer>
  );
}
