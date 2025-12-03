import { Header, Footer } from '@/components/layout';

/**
 * About page - Company story, mission, and team information.
 */
export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-purple-900 via-purple-800 to-purple-900 py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
              About The Alchemy Table
            </h1>
            <p className="text-xl text-purple-200 max-w-3xl mx-auto">
              Where the ancient art of blending meets modern craftsmanship.
              We&apos;re on a mission to make premium blends accessible to everyone.
            </p>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="text-5xl mb-4 block" aria-hidden="true">🧪</span>
              <h2 className="text-3xl font-bold text-purple-900">Our Story</h2>
            </div>
            
            <div className="prose prose-lg prose-purple max-w-none text-gray-700">
              <p>
                The Alchemy Table began in a small kitchen with a simple idea: what if creating 
                the perfect blend could be as magical as enjoying it? Our founders, passionate 
                about both artisan beverages and gaming, set out to create an experience that 
                would transform the way people discover and create their perfect cup.
              </p>
              
              <p>
                We believe that everyone has the potential to become a master blender. Our 
                platform combines premium ingredients sourced from the world&apos;s best farms with 
                an intuitive, gamified experience that makes learning fun and rewarding.
              </p>
              
              <p>
                From our humble beginnings to serving thousands of customers worldwide, our 
                commitment remains the same: to help you discover the joy of creating something 
                uniquely yours, one blend at a time.
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 md:py-24 bg-purple-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-purple-900 text-center mb-12">
              Our Values
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-8 shadow-md text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl" aria-hidden="true">🌱</span>
                </div>
                <h3 className="text-xl font-bold text-purple-900 mb-2">Quality First</h3>
                <p className="text-gray-600">
                  We source only the finest ingredients from ethical farms and suppliers 
                  who share our commitment to excellence and sustainability.
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-8 shadow-md text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl" aria-hidden="true">✨</span>
                </div>
                <h3 className="text-xl font-bold text-purple-900 mb-2">Creativity</h3>
                <p className="text-gray-600">
                  We encourage experimentation and celebrate the unique blends our 
                  community creates. There are no mistakes, only discoveries.
                </p>
              </div>
              
              <div className="bg-white rounded-xl p-8 shadow-md text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl" aria-hidden="true">🤝</span>
                </div>
                <h3 className="text-xl font-bold text-purple-900 mb-2">Community</h3>
                <p className="text-gray-600">
                  Our alchemists are our greatest asset. We foster a supportive 
                  community where knowledge is shared and everyone can grow.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-purple-900 text-center mb-12">
              Meet the Team
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { name: 'Alex Chen', role: 'Founder & Head Alchemist', emoji: '🧙' },
                { name: 'Maya Patel', role: 'Chief Blend Officer', emoji: '☕' },
                { name: 'Jordan Rivers', role: 'Experience Designer', emoji: '🎮' },
                { name: 'Sam Wilson', role: 'Community Lead', emoji: '💬' },
              ].map((member) => (
                <div key={member.name} className="text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl" aria-hidden="true">{member.emoji}</span>
                  </div>
                  <h3 className="font-bold text-purple-900">{member.name}</h3>
                  <p className="text-gray-600 text-sm">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-24 bg-gradient-to-br from-purple-800 to-purple-900">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">
              Ready to Start Your Journey?
            </h2>
            <p className="text-xl text-purple-200 mb-8">
              Join our community of alchemists and discover your perfect blend.
            </p>
            <a
              href="/signup"
              className="inline-block bg-white text-purple-900 px-8 py-4 rounded-full font-bold text-lg hover:bg-purple-100 transition-colors"
            >
              Get Started
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
