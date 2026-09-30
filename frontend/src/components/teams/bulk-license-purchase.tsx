import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Plus, 
  Minus, 
  ShoppingCart, 
  Calculator,
  BookOpen,
  TrendingUp,
  Check,
  AlertCircle,
  Trash2,
  Download
} from 'lucide-react';
import { teamsApi, PurchaseLicenseDto, BulkPurchaseLicensesDto, TeamLicense } from '@/lib/api/teams';

interface BulkLicensePurchaseProps {
  teamId: string;
  onSuccess?: (licenses: TeamLicense[]) => void;
  onCancel?: () => void;
}

interface LicenseItem {
  id: string;
  type: 'course' | 'learning_path' | 'subscription';
  quantity: number;
  durationMonths: number;
  courses?: string[];
  courseId?: string;
  courseTitle?: string;
  courseThumbnail?: string;
  restrictions: {
    canReassign: boolean;
    maxReassignments: number;
    requireManagerApproval: boolean;
    allowedDepartments: string[];
  };
  metadata: {
    paymentMethod: string;
    discountApplied: number;
    bulkDiscount: number;
    totalAmount: number;
  };
}

export default function BulkLicensePurchase({ teamId, onSuccess, onCancel }: BulkLicensePurchaseProps) {
  const [licenses, setLicenses] = useState<LicenseItem[]>([]);
  const [availableCourses, setAvailableCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const licenseTypes = [
    { value: 'course', label: 'Individual Course', description: 'Access to a specific course' },
    { value: 'learning_path', label: 'Learning Path', description: 'Curated collection of courses' },
    { value: 'subscription', label: 'Team Subscription', description: 'Access to all courses' },
  ];

  const bulkDiscounts = [
    { min: 10, discount: 10, label: '10+ licenses: 10% off' },
    { min: 25, discount: 15, label: '25+ licenses: 15% off' },
    { min: 50, discount: 20, label: '50+ licenses: 20% off' },
    { min: 100, discount: 25, label: '100+ licenses: 25% off' },
  ];

  useEffect(() => {
    loadAvailableCourses();
  }, []);

  const loadAvailableCourses = async () => {
    try {
      setLoading(true);
      // Load available courses for license purchase
      const response = await fetch('/api/courses?published=true&limit=50');
      const data = await response.json();
      setAvailableCourses(data.courses || []);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setLoading(false);
    }
  };

  const addLicense = (type: 'course' | 'learning_path' | 'subscription') => {
    const newLicense: LicenseItem = {
      id: Date.now().toString(),
      type,
      quantity: 1,
      durationMonths: 12,
      restrictions: {
        canReassign: true,
        maxReassignments: 3,
        requireManagerApproval: false,
        allowedDepartments: [],
      },
      metadata: {
        paymentMethod: 'credit_card',
        discountApplied: 0,
        bulkDiscount: 0,
        totalAmount: 0,
      },
    };

    setLicenses(prev => [...prev, newLicense]);
    setError(null);
  };

  const updateLicense = (id: string, field: string, value: any) => {
    setLicenses(prev => prev.map(license => 
      license.id === id ? { ...license, [field]: value } : license
    ));
  };

  const removeLicense = (id: string) => {
    setLicenses(prev => prev.filter(license => license.id !== id));
  };

  const calculatePrice = (license: LicenseItem): number => {
    const basePrices = {
      course: 99.99,
      learning_path: 299.99,
      subscription: 49.99,
    };

    let basePrice = basePrices[license.type] || 99.99;
    
    // Apply duration multiplier for subscriptions
    if (license.type === 'subscription') {
      basePrice *= (license.durationMonths || 12) / 12;
    }

    return basePrice;
  };

  const calculateTotalPrice = (license: LicenseItem): number => {
    const unitPrice = calculatePrice(license);
    const totalPrice = unitPrice * license.quantity;
    
    // Apply bulk discount
    const totalQuantity = licenses.reduce((sum, l) => sum + l.quantity, 0);
    const bulkDiscount = bulkDiscounts
      .filter(d => totalQuantity >= d.min)
      .sort((a, b) => b.min - a.min)[0]?.discount || 0;
    
    return totalPrice * (1 - bulkDiscount / 100);
  };

  const calculateOrderTotal = (): number => {
    return licenses.reduce((sum, license) => sum + calculateTotalPrice(license), 0);
  };

  const getTotalQuantity = (): number => {
    return licenses.reduce((sum, license) => sum + license.quantity, 0);
  };

  const getAppliedDiscount = (): number => {
    const totalQuantity = getTotalQuantity();
    return bulkDiscounts
      .filter(d => totalQuantity >= d.min)
      .sort((a, b) => b.min - a.min)[0]?.discount || 0;
  };

  const handleSubmit = async () => {
    if (licenses.length === 0) {
      setError('Please add at least one license to your order');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const bulkPurchaseData: BulkPurchaseLicensesDto = {
        licenses: licenses.map(({ id, ...license }) => ({
          type: 'team', // Convert to expected type
          quantity: license.quantity,
          duration: license.durationMonths >= 12 ? 'yearly' : 'monthly',
          courses: license.courses,
        })),
      };

      const purchasedLicenses = await teamsApi.bulkPurchaseLicenses(teamId, bulkPurchaseData);
      onSuccess?.(purchasedLicenses);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to purchase licenses');
    } finally {
      setSubmitting(false);
    }
  };

  if (showSummary) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-md shadow-sm max-w-4xl mx-auto"
      >
        <div className="p-6 border-b border-border/60">
          <h2 className="text-xl font-bold text-charcoal">Order Summary</h2>
          <p className="text-stone mt-1">Review your license purchase order</p>
        </div>

        <div className="p-6">
          <div className="space-y-4">
            {licenses.map((license, index) => (
              <div key={license.id} className="bg-paper rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-charcoal capitalize">
                      {license.type.replace('_', ' ')}
                    </h4>
                    {license.courseId && (
                      <p className="text-sm text-stone mt-1">
                        Course: {availableCourses.find(c => c.id === license.courseId)?.title || 'Selected Course'}
                      </p>
                    )}
                    <p className="text-sm text-stone">
                      Quantity: {license.quantity} × ${calculatePrice(license).toFixed(2)}
                    </p>
                    {license.type === 'subscription' && (
                      <p className="text-sm text-stone">
                        Duration: {license.durationMonths} months
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-charcoal">
                      ${calculateTotalPrice(license).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>${licenses.reduce((sum, l) => sum + (calculatePrice(l) * l.quantity), 0).toFixed(2)}</span>
              </div>
              {getAppliedDiscount() > 0 && (
                <div className="flex justify-between text-sm text-forest-600">
                  <span>Bulk Discount ({getAppliedDiscount()}%):</span>
                  <span>-${(licenses.reduce((sum, l) => sum + (calculatePrice(l) * l.quantity), 0) * getAppliedDiscount() / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>${calculateOrderTotal().toFixed(2)}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-terracotta-50 border border-terracotta-200 rounded-md flex items-center">
              <AlertCircle className="w-4 h-4 text-terracotta-600 mr-2" />
              <p className="text-sm text-terracotta-700">{error}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border/60 flex items-center justify-between">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowSummary(false)}
            disabled={submitting}
            className="px-4 py-2 border border-border/60 rounded-md hover:bg-paper disabled:opacity-50"
          >
            Back to Edit
          </motion.button>

          <div className="flex items-center space-x-3">
            {onCancel && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onCancel}
                disabled={submitting}
                className="px-4 py-2 border border-border/60 rounded-md hover:bg-paper disabled:opacity-50"
              >
                Cancel
              </motion.button>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center space-x-2 px-6 py-2 bg-forest-600 text-white rounded-md hover:bg-forest-700 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Complete Purchase ${calculateOrderTotal().toFixed(2)}</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-md shadow-sm max-w-6xl mx-auto"
    >
      <div className="p-6 border-b border-border/60">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-charcoal">Bulk License Purchase</h2>
            <p className="text-stone mt-1">Purchase licenses for your team members</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-stone">
            <ShoppingCart className="w-4 h-4" />
            <span>{licenses.length} items</span>
            <span>•</span>
            <span>{getTotalQuantity()} total licenses</span>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Add License Section */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-charcoal mb-4">Add Licenses</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {licenseTypes.map(type => (
              <motion.button
                key={type.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => addLicense(type.value as any)}
                className="p-4 border border-border/60 rounded-md hover:border-primary-300 hover:bg-primary-50 text-left"
              >
                <div className="flex items-center mb-2">
                  <BookOpen className="w-5 h-5 text-primary-600 mr-2" />
                  <span className="font-medium text-charcoal">{type.label}</span>
                </div>
                <p className="text-sm text-stone">{type.description}</p>
              </motion.button>
            ))}
          </div>
        </div>

        {/* License Items */}
        {licenses.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-charcoal mb-4">License Items</h3>
            <div className="space-y-4">
              {licenses.map((license, index) => (
                <motion.div
                  key={license.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-paper rounded-md p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-charcoal capitalize">
                      {license.type.replace('_', ' ')} License
                    </h4>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => removeLicense(license.id)}
                      className="text-terracotta-500 hover:text-terracotta-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Course Selection */}
                    {license.type === 'course' && (
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-1">
                          Course
                        </label>
                        <select
                          value={license.courseId || ''}
                          onChange={(e) => updateLicense(license.id, 'courseId', e.target.value)}
                          className="w-full px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Select a course</option>
                          {availableCourses.map(course => (
                            <option key={course.id} value={course.id}>
                              {course.title}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-1">
                        Quantity
                      </label>
                      <div className="flex items-center">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateLicense(license.id, 'quantity', Math.max(1, license.quantity - 1))}
                          className="p-1 border border-border/60 rounded-l-lg hover:bg-forest-100"
                        >
                          <Minus className="w-4 h-4" />
                        </motion.button>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={license.quantity}
                          onChange={(e) => updateLicense(license.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-20 px-2 py-1 border-t border-b border-border/60 text-center focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => updateLicense(license.id, 'quantity', Math.min(1000, license.quantity + 1))}
                          className="p-1 border border-border/60 rounded-r-lg hover:bg-forest-100"
                        >
                          <Plus className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>

                    {/* Duration */}
                    {license.type === 'subscription' && (
                      <div>
                        <label className="block text-sm font-medium text-charcoal mb-1">
                          Duration
                        </label>
                        <select
                          value={license.durationMonths}
                          onChange={(e) => updateLicense(license.id, 'durationMonths', parseInt(e.target.value))}
                          className="w-full px-3 py-2 border border-border/60 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value={3}>3 months</option>
                          <option value={6}>6 months</option>
                          <option value={12}>12 months</option>
                          <option value={24}>24 months</option>
                        </select>
                      </div>
                    )}

                    {/* Price */}
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-1">
                        Price
                      </label>
                      <div className="text-lg font-bold text-charcoal">
                        ${calculateTotalPrice(license).toFixed(2)}
                      </div>
                      <div className="text-xs text-stone">
                        ${calculatePrice(license).toFixed(2)} × {license.quantity}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Bulk Discount Info */}
        {getTotalQuantity() > 0 && (
          <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-md">
            <div className="flex items-center mb-2">
              <TrendingUp className="w-5 h-5 text-primary-600 mr-2" />
              <h4 className="font-medium text-primary-900">Bulk Discount Applied</h4>
            </div>
            <div className="space-y-1 text-sm text-primary-700">
              {bulkDiscounts.map(discount => (
                <div key={discount.min} className={`flex justify-between ${
                  getTotalQuantity() >= discount.min ? 'font-medium' : 'opacity-50'
                }`}>
                  <span>{discount.label}</span>
                  <span>{getTotalQuantity() >= discount.min ? '✓ Applied' : `Need ${discount.min - getTotalQuantity()} more`}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order Summary */}
        {licenses.length > 0 && (
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-charcoal">Order Summary</h3>
              <div className="text-right">
                <div className="text-2xl font-bold text-charcoal">
                  ${calculateOrderTotal().toFixed(2)}
                </div>
                {getAppliedDiscount() > 0 && (
                  <div className="text-sm text-forest-600">
                    {getAppliedDiscount()}% discount applied
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-terracotta-50 border border-terracotta-200 rounded-md flex items-center">
                <AlertCircle className="w-4 h-4 text-terracotta-600 mr-2" />
                <p className="text-sm text-terracotta-700">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-6 border-t border-border/60 flex items-center justify-between">
        <div>
          {onCancel && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onCancel}
              disabled={submitting}
              className="px-4 py-2 border border-border/60 rounded-md hover:bg-paper disabled:opacity-50"
            >
              Cancel
            </motion.button>
          )}
        </div>

        <div className="flex items-center space-x-3">
          {licenses.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowSummary(true)}
              disabled={submitting}
              className="flex items-center space-x-2 px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50"
            >
              <Calculator className="w-4 h-4" />
              <span>Review Order</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
