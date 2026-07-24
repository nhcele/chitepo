import { withBasePath } from '@/lib/basePath';
import Layout from '@/components/Layout';

export default function Cookies() {
  return (
    <Layout>
      <div className="bg-gradient-to-b from-gray-50 to-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Cookie Policy
            </h1>
            <p className="text-gray-600">
              Last updated: January 19, 2025
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What Are Cookies?</h2>
              <p className="text-gray-700 mb-4">
                Cookies are small text files that are placed on your device when you visit our platform. They help 
                us provide you with a better experience by remembering your preferences and understanding how you 
                use our services.
              </p>
              <p className="text-gray-700">
                This Cookie Policy explains what cookies are, how we use them, and your choices regarding cookies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Types of Cookies We Use</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Essential Cookies</h3>
              <p className="text-gray-700 mb-4">
                These cookies are necessary for the platform to function properly. They enable core functionality 
                such as security, authentication, and accessibility features.
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Session cookies:</strong> Keep you logged in during your visit</li>
                <li><strong>Security cookies:</strong> Protect against fraudulent activity</li>
                <li><strong>Load balancing cookies:</strong> Distribute traffic across servers</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Functional Cookies</h3>
              <p className="text-gray-700 mb-4">
                These cookies allow us to remember your preferences and provide enhanced features.
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Language preferences:</strong> Remember your language selection</li>
                <li><strong>User preferences:</strong> Store your settings and customizations</li>
                <li><strong>Video player settings:</strong> Remember playback preferences</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.3 Analytics Cookies</h3>
              <p className="text-gray-700 mb-4">
                These cookies help us understand how visitors interact with our platform by collecting and 
                reporting information anonymously.
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Google Analytics:</strong> Track page views and user behavior</li>
                <li><strong>Performance monitoring:</strong> Measure page load times</li>
                <li><strong>Error tracking:</strong> Identify and fix technical issues</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.4 Marketing Cookies</h3>
              <p className="text-gray-700 mb-4">
                These cookies track your browsing activity to deliver relevant advertisements and measure 
                campaign effectiveness.
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Advertising cookies:</strong> Show relevant ads based on your interests</li>
                <li><strong>Social media cookies:</strong> Enable sharing on social platforms</li>
                <li><strong>Retargeting cookies:</strong> Display ads on other websites</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Third-Party Cookies</h2>
              <p className="text-gray-700 mb-4">
                We use services from trusted third parties that may set cookies on your device:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Google Analytics:</strong> Website analytics and reporting</li>
                <li><strong>YouTube:</strong> Video content delivery</li>
                <li><strong>Payment processors:</strong> Secure payment processing</li>
                <li><strong>Social media platforms:</strong> Social sharing functionality</li>
              </ul>
              <p className="text-gray-700">
                These third parties have their own privacy policies and cookie policies. We recommend reviewing 
                their policies to understand how they use cookies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Cookie Duration</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Session Cookies</h3>
              <p className="text-gray-700 mb-4">
                These temporary cookies are deleted when you close your browser. They are used to maintain your 
                session while you navigate the platform.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Persistent Cookies</h3>
              <p className="text-gray-700">
                These cookies remain on your device for a set period or until you delete them. They help us 
                remember your preferences across multiple visits.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Managing Your Cookie Preferences</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Cookie Settings</h3>
              <p className="text-gray-700 mb-4">
                You can manage your cookie preferences through our cookie consent banner when you first visit 
                the platform. You can also update your preferences at any time through your account settings.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 Browser Settings</h3>
              <p className="text-gray-700 mb-4">
                Most web browsers allow you to control cookies through their settings. You can:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Block all cookies</li>
                <li>Block third-party cookies only</li>
                <li>Delete cookies when you close your browser</li>
                <li>View and delete individual cookies</li>
              </ul>
              <p className="text-gray-700">
                Please note that blocking or deleting cookies may affect your ability to use certain features 
                of our platform.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.3 Browser-Specific Instructions</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies and other site data</li>
                <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies and Site Data</li>
                <li><strong>Safari:</strong> Preferences → Privacy → Manage Website Data</li>
                <li><strong>Edge:</strong> Settings → Cookies and site permissions → Manage and delete cookies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Do Not Track Signals</h2>
              <p className="text-gray-700">
                Some browsers include a "Do Not Track" feature that signals websites you visit that you do not 
                want to have your online activity tracked. Currently, there is no standard for how websites should 
                respond to these signals. We do not currently respond to "Do Not Track" signals.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Mobile Devices</h2>
              <p className="text-gray-700 mb-4">
                Mobile devices may use advertising identifiers instead of cookies. You can control these through 
                your device settings:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>iOS:</strong> Settings → Privacy → Advertising → Limit Ad Tracking</li>
                <li><strong>Android:</strong> Settings → Google → Ads → Opt out of Ads Personalization</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Updates to This Policy</h2>
              <p className="text-gray-700">
                We may update this Cookie Policy from time to time to reflect changes in our practices or for 
                legal reasons. We will notify you of any significant changes by posting the updated policy on 
                this page with a new "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. More Information</h2>
              <p className="text-gray-700 mb-4">
                For more information about how we protect your privacy, please review our:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><a href={withBasePath('/privacy')} className="text-primary-600 hover:text-primary-700">Privacy Policy</a></li>
                <li><a href={withBasePath('/terms')} className="text-primary-600 hover:text-primary-700">Terms of Service</a></li>
                <li><a href={withBasePath('/gdpr')} className="text-primary-600 hover:text-primary-700">GDPR Compliance</a></li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about our use of cookies, please contact us:
              </p>
              <ul className="list-none text-gray-700">
                <li className="mb-2"><strong>Email:</strong> privacy@chitepo.co.zw</li>
                <li className="mb-2"><strong>Phone:</strong> +263 (0) 242 48 331</li>
                <li className="mb-2"><strong>Address:</strong> Chitepo House, Herbert Chitepo Avenue, Harare, Zimbabwe</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
