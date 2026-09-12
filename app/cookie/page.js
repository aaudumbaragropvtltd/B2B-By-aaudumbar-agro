import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function CookiePolicy() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 rounded-3xl shadow-sm border border-gray-100">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-8">Cookie Policy</h1>
          <div className="prose prose-blue max-w-none text-gray-600">
            <p className="text-lg">Last updated: October 2023</p>
            
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. What are Cookies?</h2>
            <p>Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to the owners of the site.</p>
            
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. How We Use Cookies</h2>
            <p>B2B India uses cookies for several reasons:</p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>**Essential Cookies:** Required for the operation of our platform (e.g., keeping you logged in).</li>
              <li>**Analytical Cookies:** Help us understand how visitors interact with our website.</li>
              <li>**Preference Cookies:** Remember your settings and preferences (e.g., language or region).</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Managing Cookies</h2>
            <p>Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
