import Layout from '@/components/Layout';
import Head from 'next/head';
import { 
  UserGroupIcon,
  AcademicCapIcon,
  ClockIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  BriefcaseIcon,
  CreditCardIcon,
  ComputerDesktopIcon,
  UserIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const roles = [
  {
    id: 'teller',
    title: 'Teller / Customer Service Rep',
    icon: UserIcon,
    color: 'from-forest-500 to-forest-700',
    description: 'Frontline staff handling customer transactions and inquiries',
    mandatoryCourses: [
      { name: 'AML and KYC Fundamentals', duration: '4 hours', critical: true },
      { name: 'Customer Service Excellence', duration: '3 hours', critical: false },
      { name: 'Fraud Prevention and Detection', duration: '3 hours', critical: false },
    ],
    totalTime: '10 hours initial + 2 hours annual refresher',
    rbzRequirement: 'Must complete within 90 days of hire',
    complianceNote: 'Meets FATF Recommendation 18 for frontline staff',
  },
  {
    id: 'manager',
    title: 'Branch Manager / Team Leader',
    icon: BriefcaseIcon,
    color: 'from-terracotta-500 to-terracotta-700',
    description: 'Supervisory staff managing teams and branch operations',
    mandatoryCourses: [
      { name: 'AML and KYC Fundamentals', duration: '4 hours', critical: true },
      { name: 'Customer Service Excellence', duration: '3 hours', critical: false },
      { name: 'Fraud Prevention and Detection', duration: '3 hours', critical: false },
      { name: 'Credit Risk Fundamentals', duration: '3 hours', critical: false },
      { name: 'Retail Banking Products and Operations', duration: '4 hours', critical: false },
    ],
    totalTime: '17 hours initial + 3 hours annual refresher',
    rbzRequirement: 'Must complete within 60 days of promotion',
    complianceNote: 'Meets RBZ supervisory staff requirements',
  },
  {
    id: 'compliance',
    title: 'Compliance Officer / MLRO',
    icon: ShieldCheckIcon,
    color: 'from-terracotta-500 to-terracotta-700',
    description: 'Compliance and AML/CFT specialists',
    mandatoryCourses: [
      { name: 'AML and KYC Fundamentals', duration: '4 hours', critical: true },
      { name: 'Information Security Awareness', duration: '3 hours', critical: true },
      { name: 'Fraud Prevention and Detection', duration: '3 hours', critical: false },
      { name: 'Credit Risk Fundamentals', duration: '3 hours', critical: false },
    ],
    totalTime: '13 hours initial + 8 hours annual (quarterly updates)',
    rbzRequirement: 'Must complete within 30 days of appointment',
    complianceNote: 'Meets MLRO certification requirements + quarterly regulatory updates',
  },
  {
    id: 'credit',
    title: 'Credit Analyst / Loan Officer',
    icon: CreditCardIcon,
    color: 'from-forest-500 to-forest-700',
    description: 'Staff responsible for credit assessment and lending',
    mandatoryCourses: [
      { name: 'AML and KYC Fundamentals', duration: '4 hours', critical: true },
      { name: 'Credit Risk Fundamentals', duration: '3 hours', critical: true },
      { name: 'Fraud Prevention and Detection', duration: '3 hours', critical: false },
    ],
    totalTime: '10 hours initial + 3 hours annual refresher',
    rbzRequirement: 'Must complete within 90 days of hire',
    complianceNote: 'Meets RBZ credit risk management requirements',
  },
  {
    id: 'it',
    title: 'IT / Operations Staff',
    icon: ComputerDesktopIcon,
    color: 'from-forest-500 to-forest-700',
    description: 'Technology and operations support teams',
    mandatoryCourses: [
      { name: 'Information Security Awareness', duration: '3 hours', critical: true },
      { name: 'AML and KYC Fundamentals', duration: '4 hours', critical: true },
      { name: 'Retail Banking Products and Operations', duration: '4 hours', critical: false },
    ],
    totalTime: '11 hours initial + 3 hours annual refresher',
    rbzRequirement: 'Must complete within 90 days of hire',
    complianceNote: 'Meets RBZ operational risk requirements',
  },
  {
    id: 'executive',
    title: 'Executive Leadership / Board',
    icon: ChartBarIcon,
    color: 'from-ochre-500 to-ochre-700',
    description: 'Senior management and board members',
    mandatoryCourses: [
      { name: 'AML and KYC Fundamentals', duration: '4 hours', critical: true },
      { name: 'Credit Risk Fundamentals', duration: '3 hours', critical: false },
      { name: 'Information Security Awareness', duration: '3 hours', critical: false },
    ],
    totalTime: '10 hours initial + 8 hours annual (quarterly briefings)',
    rbzRequirement: 'Must complete within 60 days of appointment',
    complianceNote: 'Meets RBZ senior management oversight requirements',
  },
];

const benefits = [
  {
    title: 'Zero Guesswork',
    description: 'Each role has pre-mapped courses. No manual assignment needed.',
    icon: CheckCircleIcon,
  },
  {
    title: 'RBZ-Aligned',
    description: 'Every learning path meets specific RBZ and FATF requirements.',
    icon: ShieldCheckIcon,
  },
  {
    title: 'Time-Optimized',
    description: 'Staff only take courses relevant to their role. No wasted hours.',
    icon: ClockIcon,
  },
  {
    title: 'Auto-Tracking',
    description: 'System automatically tracks completion by role and department.',
    icon: AcademicCapIcon,
  },
];

export default function RoleMapping() {
  
  const companyName = 'Chitepo School of Ideology';

  return (
    <>
      <Head>
        <title>{`Role-Based Training Paths | ${companyName}`}</title>
        <meta name="description" content="Pre-mapped training courses for every banking role. Meet RBZ requirements with precision-targeted learning paths." />
      </Head>

      <Layout>
        <div className="bg-gradient-to-b from-primary-50 to-white">
          {/* Hero Section */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold text-charcoal mb-4">
                Role-Based Training Paths
              </h1>
              <p className="text-xl text-stone max-w-3xl mx-auto">
                Every banking position has unique RBZ compliance requirements. Our platform automatically assigns the right courses to the right roles—nothing more, nothing less.
              </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="bg-white rounded-md p-6 shadow-sm text-center">
                  <benefit.icon className="h-12 w-12 text-primary-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-charcoal mb-2">{benefit.title}</h3>
                  <p className="text-stone text-sm">{benefit.description}</p>
                </div>
              ))}
            </div>

            {/* Role Cards */}
            <div className="space-y-8">
              {roles.map((role) => (
                <div key={role.id} className="bg-white rounded-md shadow-sm overflow-hidden">
                  <div className={`bg-gradient-to-r ${role.color} p-6 text-white`}>
                    <div className="flex items-center">
                      <role.icon className="h-12 w-12 mr-4" />
                      <div>
                        <h2 className="text-2xl font-bold">{role.title}</h2>
                        <p className="text-white/90 mt-1">{role.description}</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      {/* Mandatory Courses */}
                      <div>
                        <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center">
                          <AcademicCapIcon className="h-5 w-5 mr-2 text-primary-600" />
                          Mandatory Courses
                        </h3>
                        <ul className="space-y-3">
                          {role.mandatoryCourses.map((course, idx) => (
                            <li key={idx} className="flex items-start">
                              <CheckCircleIcon className={`h-5 w-5 mr-2 flex-shrink-0 mt-0.5 ${course.critical ? 'text-terracotta-600' : 'text-forest-600'}`} />
                              <div>
                                <span className="text-charcoal font-medium">{course.name}</span>
                                {course.critical && (
                                  <span className="ml-2 text-xs bg-terracotta-100 text-terracotta-800 px-2 py-1 rounded">CRITICAL</span>
                                )}
                                <div className="text-sm text-stone">{course.duration}</div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Compliance Info */}
                      <div>
                        <h3 className="text-lg font-semibold text-charcoal mb-4 flex items-center">
                          <ShieldCheckIcon className="h-5 w-5 mr-2 text-primary-600" />
                          RBZ Compliance
                        </h3>
                        <div className="space-y-4">
                          <div className="bg-primary-50 rounded-md p-4">
                            <div className="text-sm font-semibold text-primary-900 mb-1">Total Training Time</div>
                            <div className="text-charcoal">{role.totalTime}</div>
                          </div>
                          <div className="bg-ochre-50 rounded-md p-4">
                            <div className="text-sm font-semibold text-ochre-900 mb-1">RBZ Deadline</div>
                            <div className="text-charcoal">{role.rbzRequirement}</div>
                          </div>
                          <div className="bg-forest-50 rounded-md p-4">
                            <div className="text-sm font-semibold text-forest-900 mb-1">Compliance Status</div>
                            <div className="text-charcoal text-sm">{role.complianceNote}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="border-t pt-4">
                      <button className="w-full bg-primary-600 text-white py-3 rounded-md font-semibold hover:bg-primary-700 transition-colors">
                        Assign to {role.title} Staff
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA Section */}
            <div className="mt-16 bg-gradient-to-r from-primary-600 to-primary-700 rounded-md p-12 text-center text-white">
              <h2 className="text-3xl font-bold mb-4">
                Ready to Automate Your Training Assignments?
              </h2>
              <p className="text-xl mb-8 text-primary-100 max-w-2xl mx-auto">
                Upload your employee roster, and we'll automatically assign the correct training path to each role. Achieve 100% compliance in days, not months.
              </p>
              <div className="flex justify-center space-x-4">
                <a 
                  href="/auth/register" 
                  className="bg-white text-primary-600 px-8 py-3 rounded-md font-semibold hover:bg-forest-100 transition-colors"
                >
                  Start Free Trial
                </a>
                <a 
                  href="/contact" 
                  className="bg-primary-500 text-white px-8 py-3 rounded-md font-semibold hover:bg-primary-400 transition-colors"
                >
                  Request Demo
                </a>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}


