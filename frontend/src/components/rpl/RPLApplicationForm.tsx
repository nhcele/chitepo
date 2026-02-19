import { useState } from 'react';
import {
  TrashIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

interface CertificationPathway {
  id: string;
  name: string;
  levelTitle: string;
  type: string;
}

interface RPLApplicationFormProps {
  pathways: CertificationPathway[];
  onSubmit: (data: {
    pathwayId: string;
    rationale: string;
    evidenceItems: any[];
    requestedCredits: any[];
  }) => Promise<void>;
  onCancel?: () => void;
  initialData?: {
    pathwayId?: string;
    rationale?: string;
    evidenceItems?: any[];
    requestedCredits?: any[];
  };
}

const evidenceTypes = [
  { value: 'work_experience', label: 'Work Experience' },
  { value: 'previous_education', label: 'Previous Education' },
  { value: 'professional_certification', label: 'Professional Certification' },
  { value: 'training_programs', label: 'Training Programs' },
  { value: 'publications', label: 'Publications' },
  { value: 'leadership_roles', label: 'Leadership Roles' },
  { value: 'community_service', label: 'Community Service' },
  { value: 'other', label: 'Other' },
];

export default function RPLApplicationForm({
  pathways,
  onSubmit,
  onCancel,
  initialData,
}: RPLApplicationFormProps) {
  const [selectedPathway, setSelectedPathway] = useState(initialData?.pathwayId || '');
  const [rationale, setRationale] = useState(initialData?.rationale || '');
  const [evidenceItems, setEvidenceItems] = useState(
    initialData?.evidenceItems || [
      { type: 'work_experience', title: '', description: '', institution: '', date: '', duration: '' },
    ]
  );
  const [requestedCredits, setRequestedCredits] = useState(
    initialData?.requestedCredits || [{ courseName: '', justification: '' }]
  );
  const [submitting, setSubmitting] = useState(false);

  const addEvidence = () => {
    setEvidenceItems([
      ...evidenceItems,
      { type: 'work_experience', title: '', description: '', institution: '', date: '', duration: '' },
    ]);
  };

  const removeEvidence = (index: number) => {
    setEvidenceItems(evidenceItems.filter((_, i) => i !== index));
  };

  const addCredit = () => {
    setRequestedCredits([...requestedCredits, { courseName: '', justification: '' }]);
  };

  const removeCredit = (index: number) => {
    setRequestedCredits(requestedCredits.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPathway || !rationale || rationale.length < 100) {
      alert('Please fill in all required fields. Rationale must be at least 100 characters.');
      return;
    }

    if (evidenceItems.filter(item => item.title).length === 0) {
      alert('Please add at least one evidence item.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        pathwayId: selectedPathway,
        rationale,
        evidenceItems: evidenceItems.filter(item => item.title),
        requestedCredits: requestedCredits.filter(item => item.courseName),
      });
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">New RPL Application</h2>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        )}
      </div>

      {/* Pathway Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Certification Pathway *
        </label>
        <select
          value={selectedPathway}
          onChange={(e) => setSelectedPathway(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">Choose a pathway...</option>
          {pathways.map((pathway) => (
            <option key={pathway.id} value={pathway.id}>
              {pathway.levelTitle} - {pathway.name}
            </option>
          ))}
        </select>
      </div>

      {/* Rationale */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rationale * (minimum 100 characters)
        </label>
        <textarea
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Explain why you believe you should receive credit for prior learning. Describe your relevant experience, qualifications, and how they align with the certification requirements..."
          required
          minLength={100}
        />
        <p className="text-sm text-gray-500 mt-1">{rationale.length}/100 characters</p>
      </div>

      {/* Evidence Items */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Evidence of Prior Learning *
          </label>
          <button
            type="button"
            onClick={addEvidence}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add Evidence
          </button>
        </div>

        {evidenceItems.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-medium text-gray-900">Evidence Item #{index + 1}</h4>
              {evidenceItems.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEvidence(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Type</label>
                <select
                  value={item.type}
                  onChange={(e) => {
                    const updated = [...evidenceItems];
                    updated[index].type = e.target.value;
                    setEvidenceItems(updated);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  {evidenceTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Title *</label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => {
                    const updated = [...evidenceItems];
                    updated[index].title = e.target.value;
                    setEvidenceItems(updated);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Senior District Administrator"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-600 mb-1">Description *</label>
                <textarea
                  value={item.description}
                  onChange={(e) => {
                    const updated = [...evidenceItems];
                    updated[index].description = e.target.value;
                    setEvidenceItems(updated);
                  }}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Describe your role, responsibilities, and relevant skills gained..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Institution/Organization</label>
                <input
                  type="text"
                  value={item.institution}
                  onChange={(e) => {
                    const updated = [...evidenceItems];
                    updated[index].institution = e.target.value;
                    setEvidenceItems(updated);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Duration</label>
                <input
                  type="text"
                  value={item.duration}
                  onChange={(e) => {
                    const updated = [...evidenceItems];
                    updated[index].duration = e.target.value;
                    setEvidenceItems(updated);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., 5 years, 2015-2020"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Requested Credits */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Requested Course Credits
          </label>
          <button
            type="button"
            onClick={addCredit}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            + Add Credit Request
          </button>
        </div>

        {requestedCredits.map((credit, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-medium text-gray-900">Credit Request #{index + 1}</h4>
              {requestedCredits.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeCredit(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Course Name</label>
                <input
                  type="text"
                  value={credit.courseName}
                  onChange={(e) => {
                    const updated = [...requestedCredits];
                    updated[index].courseName = e.target.value;
                    setRequestedCredits(updated);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="e.g., Leadership and Governance"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Justification</label>
                <textarea
                  value={credit.justification}
                  onChange={(e) => {
                    const updated = [...requestedCredits];
                    updated[index].justification = e.target.value;
                    setRequestedCredits(updated);
                  }}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="Explain how your prior experience relates to this course..."
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? 'Submitting...' : 'Submit Application'}
        </button>
      </div>
    </form>
  );
}

