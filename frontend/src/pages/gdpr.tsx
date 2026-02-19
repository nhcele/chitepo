import Layout from '../components/Layout';

export default function GDPR() {
  return (
    <Layout>
      <div className="bg-gradient-to-b from-gray-50 to-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              GDPR Compliance
            </h1>
            <p className="text-gray-600">
              Last updated: January 19, 2025
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8 prose prose-lg max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                Chitepo Platform is committed to protecting the privacy and personal data of all users, including 
                those in the European Union and European Economic Area. This document outlines our compliance with 
                the General Data Protection Regulation (GDPR).
              </p>
              <p className="text-gray-700">
                While Chitepo is based in Zimbabwe, we recognize the importance of GDPR compliance for our users 
                worldwide, including diaspora community members residing in the EU/EEA.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Legal Basis for Processing</h2>
              <p className="text-gray-700 mb-4">
                We process your personal data based on the following legal grounds:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Consent:</strong> When you provide explicit consent for specific processing activities</li>
                <li><strong>Contract:</strong> To fulfill our contractual obligations when you enroll in courses</li>
                <li><strong>Legal Obligation:</strong> To comply with applicable laws and regulations</li>
                <li><strong>Legitimate Interests:</strong> To improve our services and protect against fraud</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Your GDPR Rights</h2>
              <p className="text-gray-700 mb-4">
                Under GDPR, you have the following rights regarding your personal data:
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Right to Access</h3>
              <p className="text-gray-700 mb-4">
                You have the right to request a copy of all personal data we hold about you. We will provide this 
                information in a structured, commonly used, and machine-readable format.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Right to Rectification</h3>
              <p className="text-gray-700 mb-4">
                You can request correction of inaccurate or incomplete personal data. We will update your information 
                promptly upon verification.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.3 Right to Erasure (Right to be Forgotten)</h3>
              <p className="text-gray-700 mb-4">
                You can request deletion of your personal data under certain circumstances, such as:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>The data is no longer necessary for the purposes it was collected</li>
                <li>You withdraw consent and there is no other legal basis for processing</li>
                <li>You object to processing and there are no overriding legitimate grounds</li>
                <li>The data has been unlawfully processed</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.4 Right to Restriction of Processing</h3>
              <p className="text-gray-700 mb-4">
                You can request that we limit how we use your personal data in certain situations, such as when 
                you contest the accuracy of the data or object to processing.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.5 Right to Data Portability</h3>
              <p className="text-gray-700 mb-4">
                You have the right to receive your personal data in a portable format and transmit it to another 
                service provider where technically feasible.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.6 Right to Object</h3>
              <p className="text-gray-700 mb-4">
                You can object to processing of your personal data based on legitimate interests or for direct 
                marketing purposes. We will stop processing unless we have compelling legitimate grounds.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.7 Right to Withdraw Consent</h3>
              <p className="text-gray-700 mb-4">
                Where processing is based on consent, you have the right to withdraw that consent at any time. 
                This will not affect the lawfulness of processing before withdrawal.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.8 Right to Lodge a Complaint</h3>
              <p className="text-gray-700">
                You have the right to lodge a complaint with a supervisory authority in the EU/EEA if you believe 
                your data protection rights have been violated.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. How to Exercise Your Rights</h2>
              <p className="text-gray-700 mb-4">
                To exercise any of your GDPR rights, please contact our Data Protection Officer:
              </p>
              <ul className="list-none text-gray-700 mb-4">
                <li className="mb-2"><strong>Email:</strong> dpo@chitepo.co.zw</li>
                <li className="mb-2"><strong>Subject Line:</strong> GDPR Rights Request</li>
              </ul>
              <p className="text-gray-700 mb-4">
                Please include the following information in your request:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Your full name and email address associated with your account</li>
                <li>The specific right you wish to exercise</li>
                <li>Any relevant details to help us process your request</li>
                <li>Proof of identity (for security purposes)</li>
              </ul>
              <p className="text-gray-700">
                We will respond to your request within one month. In complex cases, we may extend this period by 
                two additional months and will inform you of the extension.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Processing Activities</h2>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 What Data We Collect</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Identity data (name, username)</li>
                <li>Contact data (email, phone number)</li>
                <li>Technical data (IP address, browser type, device information)</li>
                <li>Usage data (course progress, learning analytics)</li>
                <li>Payment data (billing information, transaction history)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 How We Use Your Data</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Provide and maintain our services</li>
                <li>Process payments and manage subscriptions</li>
                <li>Personalize your learning experience</li>
                <li>Send service-related communications</li>
                <li>Improve platform functionality and user experience</li>
                <li>Comply with legal obligations</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.3 Who We Share Data With</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Service providers (hosting, payment processing, analytics)</li>
                <li>Course instructors (for educational purposes)</li>
                <li>Legal authorities (when required by law)</li>
                <li>Business partners (with your consent)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. International Data Transfers</h2>
              <p className="text-gray-700 mb-4">
                Your personal data may be transferred to and processed in countries outside the EU/EEA, including 
                Zimbabwe. When we transfer data internationally, we ensure appropriate safeguards are in place:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
                <li>Adequacy decisions by the European Commission</li>
                <li>Other legally approved transfer mechanisms</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate technical and organizational measures to protect your personal data:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Encryption of data in transit (TLS/SSL) and at rest</li>
                <li>Regular security assessments and penetration testing</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Employee training on data protection</li>
                <li>Incident response procedures</li>
                <li>Regular backups and disaster recovery plans</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your personal data only for as long as necessary:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li><strong>Account data:</strong> Until account deletion or 3 years of inactivity</li>
                <li><strong>Course progress:</strong> For the duration of your account</li>
                <li><strong>Payment records:</strong> 7 years (for legal compliance)</li>
                <li><strong>Marketing data:</strong> Until consent is withdrawn</li>
                <li><strong>Support tickets:</strong> 3 years after resolution</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Data Breach Notification</h2>
              <p className="text-gray-700">
                In the event of a data breach that poses a risk to your rights and freedoms, we will notify you 
                and the relevant supervisory authority within 72 hours of becoming aware of the breach, as required 
                by GDPR.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Children's Privacy</h2>
              <p className="text-gray-700">
                We do not knowingly collect personal data from children under 16 without parental consent. If you 
                are under 16, please obtain consent from your parent or guardian before using our services.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Automated Decision-Making</h2>
              <p className="text-gray-700">
                We use automated systems for course recommendations and personalized learning paths. You have the 
                right to request human review of automated decisions that significantly affect you.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Updates to This Policy</h2>
              <p className="text-gray-700">
                We may update this GDPR compliance document to reflect changes in our practices or legal requirements. 
                We will notify you of significant changes via email or platform notification.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                <strong>Data Protection Officer:</strong>
              </p>
              <ul className="list-none text-gray-700 mb-4">
                <li className="mb-2"><strong>Email:</strong> dpo@chitepo.co.zw</li>
                <li className="mb-2"><strong>Phone:</strong> +263 (0) 242 48 331</li>
                <li className="mb-2"><strong>Address:</strong> Chitepo House, Herbert Chitepo Avenue, Harare, Zimbabwe</li>
              </ul>
              <p className="text-gray-700 mb-4">
                <strong>EU Representative:</strong> (If applicable, to be appointed)
              </p>
              <p className="text-gray-700">
                For questions about GDPR compliance or to exercise your rights, please contact our Data Protection 
                Officer using the contact information above.
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
