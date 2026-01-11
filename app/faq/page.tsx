import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/ui/PageHeader";

export default async function FAQPage() {
  const faqs = [
    {
      question: "How do I place an order?",
      answer: "Browse our menu, add items to your cart, and proceed to checkout. You'll need to create an account and provide your delivery information to complete your order."
    },
    {
      question: "What are your delivery options?",
      answer: "We offer same-day delivery for orders placed before noon. Delivery times and fees vary by location. Check our shipping page for more details."
    },
    {
      question: "Do you offer custom orders?",
      answer: "Yes! We'd be happy to create custom orders for special occasions. Please contact us at least 48 hours in advance to discuss your needs."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards and various payment methods through our secure checkout system."
    },
    {
      question: "How should I store my baked goods?",
      answer: "Most of our products are best enjoyed fresh on the day of delivery. If you need to store them, keep them in an airtight container at cool temperature. Some items may be frozen for longer storage."
    },
    {
      question: "Do you accommodate dietary restrictions?",
      answer: "We offer a variety of products to suit different dietary needs. Please check product descriptions for allergen information, and feel free to contact us with specific questions."
    },
    {
      question: "What is your return policy?",
      answer: "We want you to be completely satisfied with your order. If you have any concerns about your purchase, please contact us within 24 hours of delivery."
    },
    {
      question: "Can I modify or cancel my order?",
      answer: "Orders can be modified or cancelled within an hour of placement, provided they haven't entered production. Contact us as soon as possible if you need to make changes."
    }
  ];

  return (
    <PageContainer>
      <PageHeader 
        title="Frequently Asked Questions" 
        subtitle="Everything you need to know"
      />

      <div className="max-w-3xl mx-auto space-y-6">
        {faqs.map((faq, index) => (
          <div 
            key={index}
            className="border-b pb-6 last:border-b-0"
            style={{ borderColor: 'var(--theme-secondary)' }}
          >
            <h3 
              className="text-xl font-semibold mb-3"
              style={{ color: 'var(--theme-text)' }}
            >
              {faq.question}
            </h3>
            <p 
              className="text-lg leading-relaxed"
              style={{ color: 'var(--theme-text-secondary)' }}
            >
              {faq.answer}
            </p>
          </div>
        ))}

        <div 
          className="mt-12 p-6 rounded-lg"
          style={{ backgroundColor: 'var(--theme-surface)' }}
        >
          <p 
            className="text-lg text-center"
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            Still have questions?{" "}
            <a 
              href="/contact"
              className="font-semibold hover:opacity-70 transition-opacity"
              style={{ color: 'var(--theme-text)' }}
            >
              Contact us
            </a>{" "}
            and we'll be happy to help!
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
