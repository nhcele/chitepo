import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { EyeIcon, EyeSlashIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { withBasePath } from '@/lib/basePath';
import AuthBrandPanel from '@/components/auth/AuthBrandPanel';

interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  jobTitle: string;
  agreeToTerms: boolean;
  subscribeNewsletter: boolean;
}

export default function RegisterPage() {
  const [formData, setFormData] = useState<RegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    jobTitle: '',
    agreeToTerms: false,
    subscribeNewsletter: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof RegistrationData, string>>>({});
  const [error, setError] = useState('');
  const { register } = useAuth();

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof RegistrationData, string>> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setError('');

    try {
      await register({
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        password: formData.password,
        jobTitle: formData.jobTitle || undefined,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name as keyof RegistrationData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const inputClass = (field: keyof RegistrationData) =>
    `block w-full px-4 py-3 bg-white border rounded-md text-charcoal placeholder:text-pewter focus:outline-none focus:border-forest-600 focus:ring-1 focus:ring-forest-600 transition-colors ${
      errors[field] ? 'border-terracotta-600' : 'border-border/60'
    }`;

  return (
    <>
      <Head>
        <title>Create your account — Chitepo School of Ideology</title>
        <meta name="description" content="Join Chitepo School of Ideology and start your learning journey." />
      </Head>

      <div className="min-h-screen bg-cream flex flex-col lg:flex-row">
        <AuthBrandPanel
          headline="Join a community of learners shaping the future of Africa."
          body="Create an account to access orientation courses, track your progress, and earn certificates in Pan-African political education."
        />

        <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-16 py-12 lg:py-0">
          <div className="max-w-lg w-full mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Mobile logo */}
              <div className="flex items-center gap-3 mb-8 lg:hidden">
                <span className="relative block h-10 w-10 flex-shrink-0">
                  <Image
                    src={withBasePath('/chitepo-logo.jpg')}
                    alt="Chitepo School of Ideology"
                    fill
                    className="object-contain"
                    sizes="2.5rem"
                    loading="eager"
                    fetchPriority="high"
                  />
                </span>
                <div>
                  <span className="font-serif text-base font-semibold text-charcoal leading-tight block">
                    Chitepo
                  </span>
                  <span className="text-xs text-stone leading-tight block">School of Ideology</span>
                </div>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-charcoal mb-3">
                Create your account
              </h1>
              <p className="text-stone mb-8">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="font-semibold text-forest-600 hover:text-forest-500 transition-colors"
                >
                  Sign in
                </Link>
              </p>

              {error && (
                <div className="mb-6 p-4 border-l-4 border-terracotta-600 bg-terracotta-100 rounded-r-md" role="alert">
                  <p className="text-sm text-terracotta-700">{error}</p>
                </div>
              )}

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-charcoal mb-2">
                      First name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={inputClass('firstName')}
                      placeholder="John"
                    />
                    {errors.firstName && <p className="mt-1.5 text-sm text-terracotta-700">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-charcoal mb-2">
                      Last name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={inputClass('lastName')}
                      placeholder="Doe"
                    />
                    {errors.lastName && <p className="mt-1.5 text-sm text-terracotta-700">{errors.lastName}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-2">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className={inputClass('email')}
                    placeholder="john@example.com"
                  />
                  {errors.email && <p className="mt-1.5 text-sm text-terracotta-700">{errors.email}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`${inputClass('password')} pr-10`}
                        placeholder="Create a strong password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-pewter hover:text-stone transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.password ? (
                      <p className="mt-1.5 text-sm text-terracotta-700">{errors.password}</p>
                    ) : (
                      <p className="mt-1.5 text-xs text-stone">At least 8 characters with a number and mixed case.</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-charcoal mb-2">
                      Confirm password
                    </label>
                    <div className="relative">
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`${inputClass('confirmPassword')} pr-10`}
                        placeholder="Confirm password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-pewter hover:text-stone transition-colors"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                      </button>
                    </div>
                    {errors.confirmPassword && <p className="mt-1.5 text-sm text-terracotta-700">{errors.confirmPassword}</p>}
                  </div>
                </div>

                <div>
                  <label htmlFor="jobTitle" className="block text-sm font-medium text-charcoal mb-2">
                    Job title (optional)
                  </label>
                  <input
                    id="jobTitle"
                    name="jobTitle"
                    type="text"
                    value={formData.jobTitle}
                    onChange={handleInputChange}
                    className={inputClass('jobTitle')}
                    placeholder="e.g. Policy Analyst, Educator"
                  />
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-start">
                    <input
                      id="agreeToTerms"
                      name="agreeToTerms"
                      type="checkbox"
                      checked={formData.agreeToTerms}
                      onChange={handleInputChange}
                      className={`mt-1 h-4 w-4 text-forest-600 border-border/60 rounded focus:ring-forest-600 ${
                        errors.agreeToTerms ? 'border-terracotta-600' : ''
                      }`}
                    />
                    <label htmlFor="agreeToTerms" className="ml-3 text-sm text-stone">
                      I agree to the{' '}
                      <Link href="/terms" className="text-forest-600 hover:text-forest-500 transition-colors">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy" className="text-forest-600 hover:text-forest-500 transition-colors">
                        Privacy Policy
                      </Link>
                    </label>
                  </div>
                  {errors.agreeToTerms && <p className="text-sm text-terracotta-700">{errors.agreeToTerms}</p>}

                  <div className="flex items-start">
                    <input
                      id="subscribeNewsletter"
                      name="subscribeNewsletter"
                      type="checkbox"
                      checked={formData.subscribeNewsletter}
                      onChange={handleInputChange}
                      className="mt-1 h-4 w-4 text-forest-600 border-border/60 rounded focus:ring-forest-600"
                    />
                    <label htmlFor="subscribeNewsletter" className="ml-3 text-sm text-stone">
                      Send me updates about new courses and features
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-forest-600 rounded-md hover:bg-forest-500 focus:outline-none focus:ring-2 focus:ring-ochre-400 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRightIcon className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-8 border-t border-border/60 text-center">
                <p className="text-sm text-stone">
                  Already a learner?{' '}
                  <Link
                    href="/auth/login"
                    className="font-semibold text-forest-600 hover:text-forest-500 transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
