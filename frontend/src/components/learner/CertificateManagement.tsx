import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import {
  AcademicCapIcon,
  ArrowDownTrayIcon,
  ShareIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  UserGroupIcon,
  GlobeAltIcon,
  LinkIcon,
  QrCodeIcon,
  TrophyIcon as AwardIcon,
  StarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

interface Certificate {
  id: string;
  courseId: string;
  courseTitle: string;
  instructorName: string;
  issueDate: Date;
  completionDate: Date;
  score: number;
  totalHours: number;
  certificateUrl: string;
  verificationCode: string;
  skills: string[];
  status: 'earned' | 'in-progress' | 'not-available';
  progress?: {
    completedLessons: number;
    totalLessons: number;
    completedQuizzes: number;
    totalQuizzes: number;
  };
}

interface CertificateManagementProps {
  userId: string;
  onCertificateShare?: (certificateId: string, platform: string) => void;
}

export default function CertificateManagement({ 
  userId, 
  onCertificateShare 
}: CertificateManagementProps) {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [showVerification, setShowVerification] = useState(false);

  // Mock data - in real app, this would come from API
  useEffect(() => {
    const fetchCertificates = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockCertificates: Certificate[] = [
          {
            id: '1',
            courseId: 'js-fundamentals',
            courseTitle: 'JavaScript Fundamentals Mastery',
            instructorName: 'Dr. Sarah Johnson',
            issueDate: new Date('2024-01-15'),
            completionDate: new Date('2024-01-14'),
            score: 92,
            totalHours: 8,
            certificateUrl: '/certificates/js-fundamentals.pdf',
            verificationCode: 'JSFM-2024-ABC123',
            skills: ['JavaScript', 'ES6+', 'DOM Manipulation', 'Async Programming', 'Error Handling'],
            status: 'earned'
          },
          {
            id: '2',
            courseId: 'react-advanced',
            courseTitle: 'Advanced React & Redux',
            instructorName: 'Michael Chen',
            issueDate: new Date('2024-02-20'),
            completionDate: new Date('2024-02-19'),
            score: 88,
            totalHours: 12,
            certificateUrl: '/certificates/react-advanced.pdf',
            verificationCode: 'RAR-2024-XYZ789',
            skills: ['React', 'Redux', 'Hooks', 'State Management', 'Performance Optimization'],
            status: 'earned'
          },
          {
            id: '3',
            courseId: 'nodejs-backend',
            courseTitle: 'Node.js Backend Development',
            instructorName: 'Emily Rodriguez',
            issueDate: new Date(),
            completionDate: new Date(),
            score: 0,
            totalHours: 10,
            certificateUrl: '',
            verificationCode: '',
            skills: ['Node.js', 'Express', 'MongoDB', 'REST APIs', 'Authentication'],
            status: 'in-progress',
            progress: {
              completedLessons: 18,
              totalLessons: 24,
              completedQuizzes: 4,
              totalQuizzes: 6
            }
          },
          {
            id: '4',
            courseId: 'python-ds',
            courseTitle: 'Python for Data Science',
            instructorName: 'Dr. James Wilson',
            issueDate: new Date(),
            completionDate: new Date(),
            score: 0,
            totalHours: 15,
            certificateUrl: '',
            verificationCode: '',
            skills: ['Python', 'NumPy', 'Pandas', 'Matplotlib', 'Machine Learning'],
            status: 'not-available'
          }
        ];
        
        setCertificates(mockCertificates);
      } catch (error) {
        console.error('Failed to fetch certificates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [userId]);

  const handleDownloadCertificate = (certificate: Certificate) => {
    // Simulate certificate download
    const link = document.createElement('a');
    link.href = certificate.certificateUrl;
    link.download = `${certificate.courseTitle.replace(/\s+/g, '-').toLowerCase()}-certificate.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareCertificate = (certificate: Certificate, platform: string) => {
    const shareText = `I've successfully completed "${certificate.courseTitle}" with a score of ${certificate.score}%! 🎓`;
    const shareUrl = `https://mindelta.com/verify/${certificate.verificationCode}`;
    
    let url = '';
    switch (platform) {
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      default:
        // Copy to clipboard
        navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
        toast('Certificate link copied to clipboard!');
        return;
    }
    
    window.open(url, '_blank', 'width=600,height=400');
    onCertificateShare?.(certificate.id, platform);
  };

  const handleVerifyCertificate = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setShowVerification(true);
  };

  const getStatusIcon = (status: Certificate['status']) => {
    switch (status) {
      case 'earned':
        return <CheckCircleIcon className="h-5 w-5 text-forest-500" />;
      case 'in-progress':
        return <ClockIcon className="h-5 w-5 text-ochre-500" />;
      case 'not-available':
        return <DocumentTextIcon className="h-5 w-5 text-pewter" />;
    }
  };

  const getStatusText = (status: Certificate['status']) => {
    switch (status) {
      case 'earned':
        return 'Certificate Earned';
      case 'in-progress':
        return 'In Progress';
      case 'not-available':
        return 'Not Started';
    }
  };

  const getStatusColor = (status: Certificate['status']) => {
    switch (status) {
      case 'earned':
        return 'text-forest-600 bg-forest-50';
      case 'in-progress':
        return 'text-ochre-600 bg-ochre-50';
      case 'not-available':
        return 'text-stone bg-paper';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-terracotta-600 rounded-full mb-4">
          <AcademicCapIcon className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-charcoal mb-4">
          Your Certificates
        </h1>
        <p className="text-xl text-stone max-w-2xl mx-auto">
          Showcase your achievements and share your accomplishments with the world.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
      >
        <div className="bg-white border border-border/60 rounded-md p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-forest-100 rounded-full mb-3">
            <AwardIcon className="h-6 w-6 text-forest-600" />
          </div>
          <div className="text-2xl font-bold text-charcoal">
            {certificates.filter(c => c.status === 'earned').length}
          </div>
          <div className="text-sm text-stone">Certificates Earned</div>
        </div>

        <div className="bg-white border border-border/60 rounded-md p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-ochre-100 rounded-full mb-3">
            <ClockIcon className="h-6 w-6 text-ochre-600" />
          </div>
          <div className="text-2xl font-bold text-charcoal">
            {certificates.filter(c => c.status === 'in-progress').length}
          </div>
          <div className="text-sm text-stone">In Progress</div>
        </div>

        <div className="bg-white border border-border/60 rounded-md p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-full mb-3">
            <StarIcon className="h-6 w-6 text-primary-600" />
          </div>
          <div className="text-2xl font-bold text-charcoal">
            {certificates.filter(c => c.status === 'earned').reduce((sum, c) => sum + c.totalHours, 0)}
          </div>
          <div className="text-sm text-stone">Learning Hours</div>
        </div>

        <div className="bg-white border border-border/60 rounded-md p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-terracotta-100 rounded-full mb-3">
            <UserGroupIcon className="h-6 w-6 text-terracotta-600" />
          </div>
          <div className="text-2xl font-bold text-charcoal">
            {certificates.filter(c => c.status === 'earned').reduce((sum, c) => sum + c.skills.length, 0)}
          </div>
          <div className="text-sm text-stone">Skills Acquired</div>
        </div>
      </motion.div>

      {/* Certificates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {certificates.map((certificate, index) => (
          <motion.div
            key={certificate.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white border border-border/60 rounded-md overflow-hidden hover:shadow-sm transition-shadow"
          >
            {/* Certificate Header */}
            <div className="bg-gradient-to-r from-forest-50 to-terracotta-50 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {getStatusIcon(certificate.status)}
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${getStatusColor(certificate.status)}`}>
                      {getStatusText(certificate.status)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-charcoal mb-1">
                    {certificate.courseTitle}
                  </h3>
                  <p className="text-sm text-stone">
                    Instructor: {certificate.instructorName}
                  </p>
                </div>
                
                {certificate.status === 'earned' && (
                  <div className="text-right">
                    <div className="text-2xl font-bold text-forest-600">{certificate.score}%</div>
                    <div className="text-xs text-stone">Final Score</div>
                  </div>
                )}
              </div>
            </div>

            {/* Certificate Details */}
            <div className="p-6">
              {certificate.status === 'earned' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone">Completed on</span>
                    <span className="font-medium text-charcoal">
                      {certificate.completionDate.toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone">Duration</span>
                    <span className="font-medium text-charcoal">{certificate.totalHours} hours</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone">Verification Code</span>
                    <span className="font-mono text-xs text-charcoal">
                      {certificate.verificationCode}
                    </span>
                  </div>

                  <div>
                    <div className="text-sm text-stone mb-2">Skills Acquired</div>
                    <div className="flex flex-wrap gap-2">
                      {certificate.skills.map((skill, skillIndex) => (
                        <span
                          key={skillIndex}
                          className="px-2 py-1 text-xs font-medium text-primary-700 bg-primary-50 rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-4 border-t border-border/60">
                    <button
                      onClick={() => handleDownloadCertificate(certificate)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      Download
                    </button>
                    
                    <button
                      onClick={() => handleShareCertificate(certificate, 'linkedin')}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-charcoal bg-white border border-border/60 rounded-md hover:bg-paper transition-colors"
                    >
                      <ShareIcon className="h-4 w-4 mr-1" />
                      Share
                    </button>
                    
                    <button
                      onClick={() => handleVerifyCertificate(certificate)}
                      className="inline-flex items-center justify-center p-2 text-stone hover:text-charcoal transition-colors"
                    >
                      <QrCodeIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : certificate.status === 'in-progress' ? (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <ClockIcon className="h-12 w-12 text-ochre-500 mx-auto mb-3" />
                    <h4 className="font-medium text-charcoal mb-1">Almost There!</h4>
                    <p className="text-sm text-stone">
                      Keep going to earn your certificate
                    </p>
                  </div>

                  {certificate.progress && (
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-stone">Lessons</span>
                          <span className="font-medium text-charcoal">
                            {certificate.progress.completedLessons}/{certificate.progress.totalLessons}
                          </span>
                        </div>
                        <div className="w-full bg-forest-100 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${(certificate.progress.completedLessons / certificate.progress.totalLessons) * 100}%` 
                            }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-stone">Quizzes</span>
                          <span className="font-medium text-charcoal">
                            {certificate.progress.completedQuizzes}/{certificate.progress.totalQuizzes}
                          </span>
                        </div>
                        <div className="w-full bg-forest-100 rounded-full h-2">
                          <div 
                            className="bg-forest-600 h-2 rounded-full transition-all duration-500"
                            style={{ 
                              width: `${(certificate.progress.completedQuizzes / certificate.progress.totalQuizzes) * 100}%` 
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <button className="w-full px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors">
                    Continue Learning
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <DocumentTextIcon className="h-12 w-12 text-pewter mx-auto mb-3" />
                  <h4 className="font-medium text-charcoal mb-1">Not Started</h4>
                  <p className="text-sm text-stone mb-4">
                    Begin this course to start earning your certificate
                  </p>
                  <button className="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors">
                    Start Course
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Verification Modal */}
      {showVerification && selectedCertificate && (
        <VerificationModal
          certificate={selectedCertificate}
          onClose={() => setShowVerification(false)}
        />
      )}
    </div>
  );
}

// Verification Modal Component
interface VerificationModalProps {
  certificate: Certificate;
  onClose: () => void;
}

function VerificationModal({ certificate, onClose }: VerificationModalProps) {
  const verificationUrl = `https://mindelta.com/verify/${certificate.verificationCode}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-md shadow-sm max-w-md w-full"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-charcoal">Verify Certificate</h3>
            <button
              onClick={onClose}
              className="text-pewter hover:text-stone"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-forest-100 rounded-full mb-4">
                <CheckCircleIcon className="h-8 w-8 text-forest-600" />
              </div>
              <h4 className="font-medium text-charcoal mb-2">
                {certificate.courseTitle}
              </h4>
              <p className="text-sm text-stone">
                Successfully completed on {certificate.completionDate.toLocaleDateString()}
              </p>
            </div>

            <div className="bg-paper rounded-md p-4">
              <div className="text-sm text-stone mb-2">Verification Code</div>
              <div className="font-mono text-lg text-charcoal text-center">
                {certificate.verificationCode}
              </div>
            </div>

            <div className="bg-paper rounded-md p-4">
              <div className="text-sm text-stone mb-2">Verification URL</div>
              <div className="text-xs text-primary-600 break-all">
                {verificationUrl}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigator.clipboard.writeText(verificationUrl)}
                className="flex-1 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors"
              >
                <LinkIcon className="h-4 w-4 inline mr-1" />
                Copy Link
              </button>
              
              <button
                onClick={() => window.open(verificationUrl, '_blank')}
                className="flex-1 px-4 py-2 text-sm font-medium text-charcoal bg-white border border-border/60 rounded-md hover:bg-paper transition-colors"
              >
                <GlobeAltIcon className="h-4 w-4 inline mr-1" />
                Open URL
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
