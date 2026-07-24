import Layout from '@/components/Layout';

export default function Privacy() {
  return (
    <Layout>
      <div className="bg-gradient-to-b from-gray-50 to-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Privacy Policy
            </h1>
            <p className="text-gray-600">
              Last updated: January 19, 2025
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                Chitepo Platform ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
                explains how we collect, use, disclose, and safeguard your information when you use our platform.
              </p>
              <p className="text-gray-700">
                By accessing or using Chitepo, you agree to this Privacy Policy. If you do not agree with the terms 
                of this Privacy Policy, please do not access the platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Personal Information</h3>
              <p className="text-gray-700 mb-4">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Name, email address, and contact information</li>
                <li>Account credentials (username and password)</li>
                <li>Profile information and preferences</li>
                <li>Payment and billing information</li>
                <li>Course enrollment and progress data</li>
                <li>Communications with us</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Automatically Collected Information</h3>
              <p className="text-gray-700 mb-4">
                When you use our platform, we automatically collect:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (pages visited, time spent, features used)</li>
                <li>Learning analytics (course progress, quiz scores, completion rates)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process your transactions and manage your account</li>
                <li>Personalize your learning experience</li>
                <li>Send you course updates, notifications, and communications</li>
                <li>Analyze usage patterns and improve platform functionality</li>
                <li>Detect, prevent, and address technical issues and fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-4">
                We do not sell your personal information. We may share your information with:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Course Instructors:</strong> To facilitate your learning experience</li>
                <li><strong>Service Providers:</strong> Third-party vendors who assist in platform operations</li>
                <li><strong>Government Partners:</strong> When required for official programs or certifications</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with mergers or acquisitions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate technical and organizational measures to protect your personal information, including:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and audits</li>
                <li>Access controls and authentication measures</li>
                <li>Employee training on data protection</li>
              </ul>
              <p className="text-gray-700">
                However, no method of transmission over the Internet is 100% secure. While we strive to protect 
                your information, we cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights</h2>
              <p className="text-gray-700 mb-4">
                You have the right to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Access and receive a copy of your personal information</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Request deletion of your personal information</li>
                <li>Object to or restrict certain processing activities</li>
                <li>Data portability</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p className="text-gray-700">
                To exercise these rights, please contact us at privacy@chitepo.co.zw
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
              <p className="text-gray-700">
                We retain your personal information for as long as necessary to fulfill the purposes outlined in 
                this Privacy Policy, unless a longer retention period is required by law. When we no longer need 
                your information, we will securely delete or anonymize it.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Children's Privacy</h2>
              <p className="text-gray-700">
                Our platform is not intended for children under 13 years of age. We do not knowingly collect 
                personal information from children under 13. If you believe we have collected information from 
                a child under 13, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. International Data Transfers</h2>
              <p className="text-gray-700">
                Your information may be transferred to and processed in countries other than Zimbabwe. We ensure 
                appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Privacy Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
                the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review 
                this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy, please contact us:
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
