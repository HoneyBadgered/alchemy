import { Header, Footer } from '@/components/layout';

/**
 * Shipping & Returns policy page.
 * Contains detailed shipping and return policy information.
 */
export default function ShippingReturnsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gradient-to-b from-purple-50 to-white">
        {/* Hero Section */}
        <section className="bg-purple-900 py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Shipping & Returns
            </h1>
            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
              Everything you need to know about getting your order and our return policy.
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Shipping Information */}
            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl" aria-hidden="true">📦</span>
                <h2 className="text-2xl font-bold text-purple-900">Shipping Information</h2>
              </div>
              
              <div className="prose prose-purple max-w-none text-gray-700">
                <h3>Domestic Shipping (United States)</h3>
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Method</th>
                      <th className="text-left">Delivery Time</th>
                      <th className="text-left">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Standard Shipping</td>
                      <td>3-5 business days</td>
                      <td>Free on orders $50+, otherwise $5.99</td>
                    </tr>
                    <tr>
                      <td>Express Shipping</td>
                      <td>1-2 business days</td>
                      <td>$12.99</td>
                    </tr>
                    <tr>
                      <td>Overnight</td>
                      <td>Next business day</td>
                      <td>$24.99</td>
                    </tr>
                  </tbody>
                </table>
                
                <h3>International Shipping</h3>
                <p>
                  We ship to most countries worldwide. International shipping rates and delivery 
                  times are calculated at checkout based on your location. Please note:
                </p>
                <ul>
                  <li>Delivery typically takes 7-14 business days</li>
                  <li>You may be responsible for customs duties and taxes</li>
                  <li>Some products may be restricted in certain countries</li>
                </ul>
                
                <h3>Order Processing</h3>
                <p>
                  Orders are processed within 1-2 business days (Monday-Friday, excluding holidays). 
                  Custom blend orders may take an additional 1-2 days as they are made to order.
                </p>
                
                <h3>Tracking Your Order</h3>
                <p>
                  Once your order ships, you&apos;ll receive an email with tracking information. 
                  You can also track your order by logging into your account and visiting the 
                  <a href="/profile/orders"> Orders section</a>.
                </p>
              </div>
            </div>

            {/* Returns Information */}
            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl" aria-hidden="true">↩️</span>
                <h2 className="text-2xl font-bold text-purple-900">Returns Policy</h2>
              </div>
              
              <div className="prose prose-purple max-w-none text-gray-700">
                <h3>Our Guarantee</h3>
                <p>
                  We want you to love your purchase! If you&apos;re not completely satisfied, 
                  we&apos;re here to make it right. Contact us within 30 days of delivery.
                </p>
                
                <h3>Unopened Products</h3>
                <ul>
                  <li>Full refund or exchange</li>
                  <li>Return shipping is free for US orders</li>
                  <li>Items must be in original packaging</li>
                </ul>
                
                <h3>Opened Products</h3>
                <p>
                  We understand that sometimes a blend just isn&apos;t right for you. For opened 
                  products, we offer:
                </p>
                <ul>
                  <li>Store credit for future purchases</li>
                  <li>Exchange for a different product</li>
                  <li>Partial refund on a case-by-case basis</li>
                </ul>
                
                <h3>Damaged or Defective Items</h3>
                <p>
                  If your order arrives damaged or is defective, contact us immediately with 
                  photos and we&apos;ll send a replacement at no cost.
                </p>
                
                <h3>Non-Returnable Items</h3>
                <ul>
                  <li>Personalized or custom-labeled products (unless defective)</li>
                  <li>Gift cards</li>
                  <li>Items marked as final sale</li>
                </ul>
              </div>
            </div>

            {/* How to Return */}
            <div className="bg-white rounded-xl shadow-md p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl" aria-hidden="true">📋</span>
                <h2 className="text-2xl font-bold text-purple-900">How to Return</h2>
              </div>
              
              <div className="prose prose-purple max-w-none text-gray-700">
                <ol>
                  <li>
                    <strong>Contact Us:</strong> Email us at{' '}
                    <a href="mailto:returns@alchemytable.com">returns@alchemytable.com</a> or 
                    use our <a href="/contact">contact form</a> with your order number and 
                    reason for return.
                  </li>
                  <li>
                    <strong>Receive Instructions:</strong> We&apos;ll email you a return 
                    authorization and prepaid shipping label (for US orders).
                  </li>
                  <li>
                    <strong>Ship Your Return:</strong> Pack items securely and ship within 
                    14 days of receiving your return authorization.
                  </li>
                  <li>
                    <strong>Receive Your Refund:</strong> Once we receive and inspect your 
                    return, we&apos;ll process your refund within 3-5 business days.
                  </li>
                </ol>
              </div>
            </div>

            {/* Refund Timeline */}
            <div className="bg-purple-100 rounded-xl p-8">
              <h2 className="text-xl font-bold text-purple-900 mb-4">
                Refund Timeline
              </h2>
              <div className="space-y-4 text-gray-700">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-semibold">Return received</p>
                    <p className="text-sm">We&apos;ll email you when we receive your return</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-semibold">Processing (3-5 business days)</p>
                    <p className="text-sm">We inspect the return and initiate your refund</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-semibold">Refund issued</p>
                    <p className="text-sm">Appears on your payment method in 5-10 business days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-purple-900 mb-4">
              Questions about shipping or returns?
            </h2>
            <p className="text-gray-600 mb-6">
              Our customer service team is happy to help.
            </p>
            <a
              href="/contact"
              className="inline-block bg-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-purple-700 transition-colors"
            >
              Contact Us
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
