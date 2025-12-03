import { Header, Footer } from '@/components/layout';

/**
 * Terms of Service and Privacy Policy page.
 * Contains legal information about using the platform.
 */
export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 bg-gradient-to-b from-purple-50 to-white">
        {/* Hero Section */}
        <section className="bg-purple-900 py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Terms & Privacy
            </h1>
            <p className="text-xl text-purple-200 max-w-2xl mx-auto">
              Our commitment to transparency and protecting your information.
            </p>
            <p className="text-sm text-purple-300 mt-4">
              Last updated: January 1, 2024
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="py-12 md:py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Table of Contents */}
            <nav className="bg-white rounded-xl shadow-md p-6 mb-8" aria-label="Page contents">
              <h2 className="text-lg font-bold text-purple-900 mb-4">On This Page</h2>
              <ul className="space-y-2">
                <li>
                  <a href="#terms" className="text-purple-600 hover:underline">Terms of Service</a>
                </li>
                <li>
                  <a href="#privacy" className="text-purple-600 hover:underline">Privacy Policy</a>
                </li>
                <li>
                  <a href="#cookies" className="text-purple-600 hover:underline">Cookie Policy</a>
                </li>
              </ul>
            </nav>

            {/* Terms of Service */}
            <div id="terms" className="bg-white rounded-xl shadow-md p-8 mb-8 scroll-mt-24">
              <h2 className="text-2xl font-bold text-purple-900 mb-6">Terms of Service</h2>
              
              <div className="prose prose-purple max-w-none text-gray-700">
                <h3>1. Acceptance of Terms</h3>
                <p>
                  By accessing or using The Alchemy Table website and services, you agree to be 
                  bound by these Terms of Service. If you do not agree to these terms, please 
                  do not use our services.
                </p>
                
                <h3>2. Account Registration</h3>
                <p>
                  To access certain features, you must create an account. You agree to:
                </p>
                <ul>
                  <li>Provide accurate and complete information</li>
                  <li>Maintain the security of your account credentials</li>
                  <li>Notify us immediately of any unauthorized access</li>
                  <li>Accept responsibility for all activities under your account</li>
                </ul>
                
                <h3>3. Use of Services</h3>
                <p>
                  You agree to use our services only for lawful purposes. You may not:
                </p>
                <ul>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on the rights of others</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Use automated systems to access our services without permission</li>
                  <li>Transmit harmful code or interfere with our services</li>
                </ul>
                
                <h3>4. Products and Orders</h3>
                <p>
                  All product descriptions, prices, and availability are subject to change 
                  without notice. We reserve the right to refuse or cancel any order for 
                  any reason, including errors in pricing or availability.
                </p>
                
                <h3>5. Intellectual Property</h3>
                <p>
                  All content on The Alchemy Table, including text, graphics, logos, and 
                  software, is our property or licensed to us and is protected by intellectual 
                  property laws.
                </p>
                
                <h3>6. User Content</h3>
                <p>
                  By submitting content (reviews, custom blend names, etc.), you grant us a 
                  non-exclusive, royalty-free license to use, display, and distribute such 
                  content in connection with our services.
                </p>
                
                <h3>7. Limitation of Liability</h3>
                <p>
                  To the maximum extent permitted by law, The Alchemy Table shall not be 
                  liable for any indirect, incidental, or consequential damages arising from 
                  your use of our services.
                </p>
                
                <h3>8. Changes to Terms</h3>
                <p>
                  We may update these terms from time to time. Continued use of our services 
                  after changes constitutes acceptance of the new terms.
                </p>
              </div>
            </div>

            {/* Privacy Policy */}
            <div id="privacy" className="bg-white rounded-xl shadow-md p-8 mb-8 scroll-mt-24">
              <h2 className="text-2xl font-bold text-purple-900 mb-6">Privacy Policy</h2>
              
              <div className="prose prose-purple max-w-none text-gray-700">
                <h3>Information We Collect</h3>
                <p>We collect information you provide directly to us, including:</p>
                <ul>
                  <li>Account information (name, email, password)</li>
                  <li>Profile information (preferences, saved blends)</li>
                  <li>Order information (shipping address, payment details)</li>
                  <li>Communications (support requests, feedback)</li>
                </ul>
                
                <p>We automatically collect certain information when you use our services:</p>
                <ul>
                  <li>Device information (browser type, operating system)</li>
                  <li>Usage data (pages visited, actions taken)</li>
                  <li>IP address and location information</li>
                </ul>
                
                <h3>How We Use Your Information</h3>
                <p>We use the information we collect to:</p>
                <ul>
                  <li>Process and fulfill your orders</li>
                  <li>Manage your account and provide customer support</li>
                  <li>Send transactional emails (order confirmations, shipping updates)</li>
                  <li>Send marketing communications (with your consent)</li>
                  <li>Improve our services and develop new features</li>
                  <li>Prevent fraud and ensure security</li>
                </ul>
                
                <h3>Information Sharing</h3>
                <p>We do not sell your personal information. We may share information with:</p>
                <ul>
                  <li>Service providers who help us operate our business</li>
                  <li>Payment processors for transaction processing</li>
                  <li>Shipping carriers to deliver your orders</li>
                  <li>Law enforcement when required by law</li>
                </ul>
                
                <h3>Data Security</h3>
                <p>
                  We implement appropriate security measures to protect your personal 
                  information. However, no method of transmission over the Internet is 
                  100% secure.
                </p>
                
                <h3>Your Rights</h3>
                <p>You have the right to:</p>
                <ul>
                  <li>Access your personal information</li>
                  <li>Correct inaccurate information</li>
                  <li>Delete your account and data</li>
                  <li>Opt out of marketing communications</li>
                  <li>Request a copy of your data</li>
                </ul>
                
                <h3>Contact Us</h3>
                <p>
                  For privacy-related questions, contact us at{' '}
                  <a href="mailto:privacy@alchemytable.com">privacy@alchemytable.com</a>
                </p>
              </div>
            </div>

            {/* Cookie Policy */}
            <div id="cookies" className="bg-white rounded-xl shadow-md p-8 scroll-mt-24">
              <h2 className="text-2xl font-bold text-purple-900 mb-6">Cookie Policy</h2>
              
              <div className="prose prose-purple max-w-none text-gray-700">
                <h3>What Are Cookies</h3>
                <p>
                  Cookies are small text files stored on your device when you visit our website. 
                  They help us provide a better experience by remembering your preferences and 
                  understanding how you use our site.
                </p>
                
                <h3>Types of Cookies We Use</h3>
                <ul>
                  <li>
                    <strong>Essential Cookies:</strong> Required for the site to function 
                    (authentication, shopping cart)
                  </li>
                  <li>
                    <strong>Functional Cookies:</strong> Remember your preferences and settings
                  </li>
                  <li>
                    <strong>Analytics Cookies:</strong> Help us understand how visitors use our site
                  </li>
                  <li>
                    <strong>Marketing Cookies:</strong> Used to deliver relevant advertisements
                  </li>
                </ul>
                
                <h3>Managing Cookies</h3>
                <p>
                  Most browsers allow you to control cookies through their settings. Note that 
                  disabling certain cookies may affect website functionality.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-purple-900 mb-4">
              Questions about our policies?
            </h2>
            <p className="text-gray-600 mb-6">
              We&apos;re happy to provide more information or clarify any concerns.
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
