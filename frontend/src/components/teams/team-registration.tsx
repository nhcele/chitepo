import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Users, 
  CreditCard, 
  Mail, 
  Phone, 
  Globe, 
  FileText,
  Check,
  AlertCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { teamsApi, CreateTeamDto } from '@/lib/api/teams';

interface TeamRegistrationProps {
  onSuccess?: (team: any) => void;
  onCancel?: () => void;
}

export default function TeamRegistration({ onSuccess, onCancel }: TeamRegistrationProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateTeamDto>({
    name: '',
    description: '',
    industry: '',
    website: '',
    size: 'small',
    settings: {
      allowSelfEnrollment: true,
      requireApproval: false,
      customBranding: false,
      reportingFrequency: 'monthly',
    },
    billingEmail: '',
    contactPhone: '',
  });

  const steps = [
    { id: 1, title: 'Basic Information', icon: Building2 },
    { id: 2, title: 'Team Details', icon: Users },
    { id: 3, title: 'Billing & Settings', icon: CreditCard },
    { id: 4, title: 'Review & Create', icon: Check },
  ];

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Education',
    'Manufacturing',
    'Retail',
    'Consulting',
    'Government',
    'Non-profit',
    'Other',
  ];

  const teamSizes = [
    { value: 'small', label: 'Small (1-10 employees)', description: 'Perfect for startups and small teams' },
    { value: 'medium', label: 'Medium (11-50 employees)', description: 'Growing teams with structured learning' },
    { value: 'large', label: 'Large (51-200 employees)', description: 'Established organizations' },
    { value: 'enterprise', label: 'Enterprise (200+ employees)', description: 'Large-scale organizations' },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handleSettingsChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: value,
      },
    }));
    setError(null);
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.name?.trim()) {
          setError('Team name is required');
          return false;
        }
        if (formData.name.length < 2) {
          setError('Team name must be at least 2 characters');
          return false;
        }
        return true;
      
      case 2:
        if (!formData.industry) {
          setError('Please select an industry');
          return false;
        }
        if (!formData.size) {
          setError('Please select team size');
          return false;
        }
        return true;
      
      case 3:
        if (!formData.billingEmail?.trim()) {
          setError('Billing email is required');
          return false;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.billingEmail)) {
          setError('Please enter a valid email address');
          return false;
        }
        return true;
      
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    try {
      setLoading(true);
      setError(null);
      
      const team = await teamsApi.createTeam(formData);
      onSuccess?.(team);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Team Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter your team name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Brief description of your team or organization"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Website
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pewter w-4 h-4" />
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="https://example.com"
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Industry *
              </label>
              <select
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="w-full px-4 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select an industry</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-4">
                Team Size *
              </label>
              <div className="grid grid-cols-1 gap-3">
                {teamSizes.map(size => (
                  <label
                    key={size.value}
                    className={`relative flex items-center p-4 border rounded-md cursor-pointer transition-colors ${
                      formData.size === size.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-border/60 hover:border-border/60'
                    }`}
                  >
                    <input
                      type="radio"
                      name="size"
                      value={size.value}
                      checked={formData.size === size.value}
                      onChange={(e) => handleInputChange('size', e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                        formData.size === size.value
                          ? 'border-primary-500 bg-primary-500'
                          : 'border-border/60'
                      }`}>
                        {formData.size === size.value && (
                          <div className="w-full h-full rounded-full bg-white scale-50"></div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-charcoal">{size.label}</div>
                        <div className="text-sm text-stone">{size.description}</div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Billing Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pewter w-4 h-4" />
                <input
                  type="email"
                  value={formData.billingEmail}
                  onChange={(e) => handleInputChange('billingEmail', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="billing@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal mb-2">
                Contact Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pewter w-4 h-4" />
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-charcoal mb-4">Team Settings</h3>
              
              <div className="space-y-4">
                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-charcoal">Allow Self-Enrollment</div>
                    <div className="text-sm text-stone">Team members can enroll in courses without approval</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.settings?.allowSelfEnrollment}
                    onChange={(e) => handleSettingsChange('allowSelfEnrollment', e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-border/60 rounded focus:ring-primary-500"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-charcoal">Require Approval</div>
                    <div className="text-sm text-stone">Manager approval required for course enrollment</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.settings?.requireApproval}
                    onChange={(e) => handleSettingsChange('requireApproval', e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-border/60 rounded focus:ring-primary-500"
                  />
                </label>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-2">
                    Reporting Frequency
                  </label>
                  <select
                    value={formData.settings?.reportingFrequency}
                    onChange={(e) => handleSettingsChange('reportingFrequency', e.target.value)}
                    className="w-full px-4 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="bg-forest-50 border border-forest-200 rounded-md p-4">
              <div className="flex items-center">
                <Check className="w-5 h-5 text-forest-600 mr-2" />
                <h3 className="text-lg font-medium text-forest-900">Review Your Team Information</h3>
              </div>
              <p className="text-sm text-forest-700 mt-1">
                Please review all details before creating your team
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-paper rounded-md p-4">
                <h4 className="font-medium text-charcoal mb-3">Basic Information</h4>
                <dl className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-stone">Team Name:</dt>
                    <dd className="font-medium">{formData.name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-stone">Description:</dt>
                    <dd className="font-medium">{formData.description || 'Not provided'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-stone">Website:</dt>
                    <dd className="font-medium">{formData.website || 'Not provided'}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-paper rounded-md p-4">
                <h4 className="font-medium text-charcoal mb-3">Team Details</h4>
                <dl className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-stone">Industry:</dt>
                    <dd className="font-medium">{formData.industry}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-stone">Size:</dt>
                    <dd className="font-medium">{teamSizes.find(s => s.value === formData.size)?.label}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-paper rounded-md p-4">
                <h4 className="font-medium text-charcoal mb-3">Billing & Settings</h4>
                <dl className="grid grid-cols-1 gap-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-stone">Billing Email:</dt>
                    <dd className="font-medium">{formData.billingEmail}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-stone">Contact Phone:</dt>
                    <dd className="font-medium">{formData.contactPhone || 'Not provided'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-stone">Self-Enrollment:</dt>
                    <dd className="font-medium">{formData.settings?.allowSelfEnrollment ? 'Enabled' : 'Disabled'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-stone">Require Approval:</dt>
                    <dd className="font-medium">{formData.settings?.requireApproval ? 'Enabled' : 'Disabled'}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-stone">Reporting:</dt>
                    <dd className="font-medium capitalize">{formData.settings?.reportingFrequency}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-md shadow-sm max-w-4xl mx-auto"
    >
      {/* Progress Steps */}
      <div className="px-6 py-4 border-b border-border/60">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  isActive
                    ? 'border-primary-500 bg-primary-500 text-white'
                    : isCompleted
                    ? 'border-forest-500 bg-forest-500 text-white'
                    : 'border-border/60 bg-white text-stone'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    isActive ? 'text-primary-600' : isCompleted ? 'text-forest-600' : 'text-stone'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-px mx-4 ${
                    isCompleted ? 'bg-forest-500' : 'bg-stone'
                  }`}></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-terracotta-50 border border-terracotta-200 rounded-md flex items-center">
          <AlertCircle className="w-4 h-4 text-terracotta-600 mr-2" />
          <p className="text-sm text-terracotta-700">{error}</p>
        </div>
      )}

      {/* Form Content */}
      <div className="p-6">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderStepContent()}
        </motion.div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-border/60 flex items-center justify-between">
        <div>
          {currentStep > 1 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePrevious}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 border border-border/60 rounded-md hover:bg-paper disabled:opacity-50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </motion.button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {onCancel && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 border border-border/60 rounded-md hover:bg-paper disabled:opacity-50"
            >
              Cancel
            </motion.button>
          )}

          {currentStep < steps.length ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleNext}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              <span>Next</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-2 bg-forest-600 text-white rounded-md hover:bg-forest-700 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Team...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Create Team</span>
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
