import Head from 'next/head';
import toast from 'react-hot-toast';
import Layout from '@/components/Layout';
import { useState, useEffect } from 'react';
import {
  DocumentCheckIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import RPLApplicationForm from '@/components/rpl/RPLApplicationForm';

interface RPLApplication {
  id: string;
  pathway: {
    name: string;
    levelTitle: string;
  };
  status: string;
  rationale: string;
  creditsRequested: number;
  creditsApproved: number;
  submittedAt: string;
  reviewedAt: string;
  createdAt: string;
}

interface CertificationPathway {
  id: string;
  name: string;
  levelTitle: string;
  type: string;
}

const statusColors = {
  draft: 'bg-forest-100 text-charcoal',
  submitted: 'bg-forest-100 text-forest-800',
  under_review: 'bg-ochre-100 text-ochre-800',
  approved: 'bg-forest-100 text-forest-800',
  partially_approved: 'bg-forest-100 text-forest-700',
  rejected: 'bg-terracotta-100 text-terracotta-800',
  requires_evidence: 'bg-ochre-100 text-ochre-800',
};

const statusLabels = {
  draft: 'Draft',
  submitted: 'Submitted',
  under_review: 'Under Review',
  approved: 'Approved',
  partially_approved: 'Partially Approved',
  rejected: 'Rejected',
  requires_evidence: 'Requires Evidence',
};


export default function RPLApplicationPage() {
  const [applications, setApplications] = useState<RPLApplication[]>([]);
  const [pathways, setPathways] = useState<CertificationPathway[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch applications
      const appsRes = await fetch('/api/rpl/applications', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (appsRes.ok) {
        setApplications(await appsRes.json());
      }

      // Fetch pathways
      const pathwaysRes = await fetch('/api/certifications/pathways', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      });
      if (pathwaysRes.ok) {
        setPathways(await pathwaysRes.json());
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (data: {
    pathwayId: string;
    rationale: string;
    evidenceItems: any[];
    requestedCredits: any[];
  }) => {
    try {
      const response = await fetch('/api/rpl/applications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const application = await response.json();
        
        // Submit immediately
        const submitRes = await fetch(`/api/rpl/applications/${application.id}/submit`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });

        if (submitRes.ok) {
          toast('Application submitted successfully!');
          setShowForm(false);
          fetchData();
        } else {
          throw new Error('Failed to submit application');
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create application');
      }
    } catch (err: any) {
      toast(err.message || 'Failed to submit application. Please try again.');
      throw err;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-forest-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>RPL Application - Recognition of Prior Learning</title>
        <meta name="description" content="Apply for Recognition of Prior Learning credit" />
      </Head>

      {/* Header */}
      <div className="bg-gradient-to-br from-forest-600 to-terracotta-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Recognition of Prior Learning (RPL)</h1>
              <p className="text-xl text-forest-100">Apply for course credit based on your experience</p>
            </div>
            <DocumentCheckIcon className="h-20 w-20 text-white/30" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Info Section */}
        <div className="bg-forest-50 border border-forest-200 rounded-md p-6 mb-8">
          <h3 className="text-lg font-semibold text-charcoal mb-3">What is RPL?</h3>
          <p className="text-charcoal mb-4">
            Recognition of Prior Learning (RPL) allows you to receive credit for knowledge and skills you've already gained through:
          </p>
          <ul className="list-disc list-inside text-charcoal space-y-1 mb-4">
            <li>Work experience in relevant fields</li>
            <li>Previous education and qualifications</li>
            <li>Professional certifications</li>
            <li>Leadership roles and community service</li>
            <li>Publications and research</li>
          </ul>
          <p className="text-sm text-stone">
            <strong>Requirements:</strong> Provide detailed evidence and justification for each claim. Applications are reviewed by qualified assessors.
          </p>
        </div>

        {/* Applications List */}
        {applications.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-charcoal mb-4">Your Applications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {applications.map((app) => (
                <div key={app.id} className="bg-white rounded-md shadow p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-charcoal">{app.pathway.levelTitle}</h3>
                      <p className="text-sm text-stone">{app.pathway.name}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[app.status as keyof typeof statusColors]}`}>
                      {statusLabels[app.status as keyof typeof statusLabels]}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-stone">
                      <span className="font-medium">Credits Requested:</span> {app.creditsRequested}
                    </p>
                    {app.creditsApproved > 0 && (
                      <p className="text-forest-600">
                        <span className="font-medium">Credits Approved:</span> {app.creditsApproved}
                      </p>
                    )}
                    <p className="text-stone">
                      <span className="font-medium">Submitted:</span> {new Date(app.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Application Button */}
        {!showForm && (
          <div className="text-center mb-8">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-6 py-3 bg-forest-600 text-white rounded-md font-medium hover:bg-forest-700 transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New RPL Application
            </button>
          </div>
        )}

        {/* Application Form */}
        {showForm && (
          <RPLApplicationForm
            pathways={pathways}
            onSubmit={handleFormSubmit}
            onCancel={() => setShowForm(false)}
          />
        )}
      </div>
    </Layout>
  );
}

