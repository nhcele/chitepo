import { useState } from 'react';
import Layout from '@/components/Layout';
import { 
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Layout>
      <div className="bg-gradient-to-b from-forest-100 to-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-charcoal mb-4">
              Get in Touch
            </h1>
            <p className="text-xl text-stone max-w-3xl mx-auto">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-2xl font-bold text-charcoal mb-6">
                Contact Information
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <EnvelopeIcon className="h-6 w-6 text-primary-600 mr-4 mt-1" />
                  <div>
                    <h3 className="font-semibold text-charcoal mb-1">Email</h3>
                    <p className="text-stone">info@chitepo.co.zw</p>
                    <p className="text-stone">support@chitepo.co.zw</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <PhoneIcon className="h-6 w-6 text-primary-600 mr-4 mt-1" />
                  <div>
                    <h3 className="font-semibold text-charcoal mb-1">Phone</h3>
                    <p className="text-stone">+263 (0) 242 48 331</p>
                    <p className="text-stone">+263 (0) 77 123 4567</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <MapPinIcon className="h-6 w-6 text-primary-600 mr-4 mt-1" />
                  <div>
                    <h3 className="font-semibold text-charcoal mb-1">Office</h3>
                    <p className="text-stone">
                      Chitepo House<br />
                      Herbert Chitepo Avenue<br />
                      Harare, Zimbabwe
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <ClockIcon className="h-6 w-6 text-primary-600 mr-4 mt-1" />
                  <div>
                    <h3 className="font-semibold text-charcoal mb-1">Business Hours</h3>
                    <p className="text-stone">Monday - Friday: 8:00 AM - 5:00 PM</p>
                    <p className="text-stone">Saturday: 9:00 AM - 1:00 PM</p>
                    <p className="text-stone">Sunday: Closed</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-primary-50 rounded-md p-6">
                <h3 className="font-semibold text-charcoal mb-2">
                  Enterprise Inquiries
                </h3>
                <p className="text-stone mb-4">
                  For enterprise solutions and partnerships, please contact our business development team.
                </p>
                <a 
                  href="/enterprise/contact" 
                  className="text-primary-600 hover:text-primary-700 font-semibold"
                >
                  Contact Enterprise Team →
                </a>
              </div>
            </div>

            <div className="bg-white rounded-md shadow-sm p-8">
              <h2 className="text-2xl font-bold text-charcoal mb-6">
                Send us a Message
              </h2>
              
              {submitted && (
                <div className="mb-6 bg-forest-50 border border-forest-200 text-forest-800 px-4 py-3 rounded-md">
                  Thank you! Your message has been sent successfully.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-charcoal mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-charcoal mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="technical">Technical Support</option>
                    <option value="billing">Billing Question</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="feedback">Feedback</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-charcoal mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={6}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-primary-700 transition-colors"
                >
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
