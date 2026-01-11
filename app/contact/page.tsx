import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";
import Link from "next/link";

export default async function ContactPage() {
  return (
    <PageContainer>
      <PageHeader 
        title="Contact Us" 
        subtitle="We'd love to hear from you"
      />

      <div className="max-w-3xl mx-auto space-y-8">
        <section>
          <h2 
            className="text-2xl font-semibold mb-4"
            style={{ color: 'var(--theme-text)' }}
          >
            Get in Touch
          </h2>
          <p 
            className="text-lg leading-relaxed mb-6"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            Have a question, special request, or feedback? We're here to help! 
            Reach out to us through any of the following methods:
          </p>

          <div className="space-y-4">
            <div>
              <h3 
                className="text-xl font-semibold mb-2"
                style={{ color: 'var(--theme-text)' }}
              >
                Email
              </h3>
              <a 
                href="mailto:hello@doughbake.com"
                className="text-lg hover:opacity-70 transition-opacity"
                style={{ color: 'var(--theme-text-secondary)' }}
              >
                payal@doughandbake.store
              </a>
            </div>

            <div>
              <h3 
                className="text-xl font-semibold mb-2"
                style={{ color: 'var(--theme-text)' }}
              >
                Business Hours
              </h3>
              <p 
                className="text-lg"
                style={{ color: 'var(--theme-text-secondary)' }}
              >
                Weekdays: 9:00 AM - 6:00 PM<br />
                Weekends: 9:00 AM - 4:00 PM<br />
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 
            className="text-2xl font-semibold mb-4"
            style={{ color: 'var(--theme-text)' }}
          >
            Special Orders
          </h2>
          <p 
            className="text-lg leading-relaxed"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            Need something special for an event or celebration? We'd be happy to 
            discuss custom orders and special arrangements. Please contact us at 
            least 48 hours in advance for custom orders.
          </p>
        </section>

        <section>
          <h2 
            className="text-2xl font-semibold mb-4"
            style={{ color: 'var(--theme-text)' }}
          >
            Follow Us
          </h2>
          <p 
            className="text-lg leading-relaxed mb-4"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            Stay connected with us on social media for the latest updates, new 
            products, and special offers:
          </p>
          <div className="flex gap-4">
            <a 
              href="https://wa.me/918527296139?text=Hello, I would like to place an order for " 
              className="text-lg hover:opacity-70 transition-opacity"
              style={{ color: 'var(--theme-text-secondary)' }}
            >
              WhatsApp
            </a>
            <a 
              href="https://www.instagram.com/_dough.bake/" 
              className="text-lg hover:opacity-70 transition-opacity"
              style={{ color: 'var(--theme-text-secondary)' }}
            >
              Instagram
            </a>
          </div>
        </section>
      </div>
    </PageContainer>
  );
}
