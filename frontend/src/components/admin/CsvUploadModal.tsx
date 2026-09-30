import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  ArrowUpTrayIcon,
  DocumentIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface CsvUploadModalProps {
  onClose: () => void;
  onUpload: (csvData: string, notifyUsers: boolean) => void;
}

export default function CsvUploadModal({ onClose, onUpload }: CsvUploadModalProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<string>('');
  const [notifyUsers, setNotifyUsers] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setCsvData(content);
      };
      reader.readAsText(file);
    } else {
      toast('Please select a valid CSV file');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleUpload = async () => {
    if (!csvData.trim()) {
      toast('Please select a CSV file');
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(csvData, notifyUsers);
    } finally {
      setIsUploading(false);
    }
  };

  const downloadTemplate = () => {
    const template = `email,jobRole
john.doe@company.com,Teller
jane.smith@company.com,Customer Service Rep
mike.johnson@company.com,Branch Manager`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'role-assignment-template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const validateCsv = () => {
    if (!csvData.trim()) return null;
    
    const lines = csvData.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return { valid: false, error: 'CSV must contain header and at least one row' };
    }

    const header = lines[0].toLowerCase();
    const hasEmail = header.includes('email');
    const hasRole = header.includes('role');

    if (!hasEmail || !hasRole) {
      return { valid: false, error: 'CSV must contain email and role columns' };
    }

    return { valid: true };
  };

  const validation = validateCsv();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-md shadow-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-charcoal">Bulk Role Assignment</h3>
          <button
            onClick={onClose}
            className="p-2 text-pewter hover:text-stone hover:bg-forest-100 rounded-md"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Instructions */}
          <div className="mb-6 p-4 bg-forest-50 rounded-md">
            <div className="flex items-start space-x-2">
              <DocumentIcon className="w-5 h-5 text-forest-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-forest-900">CSV Format Requirements</p>
                <ul className="text-sm text-forest-700 mt-2 space-y-1">
                  <li>• Must contain 'email' and 'jobRole' columns</li>
                  <li>• Email addresses must match existing users</li>
                  <li>• Job roles must be from the predefined list</li>
                  <li>• First row should contain column headers</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Download Template */}
          <div className="mb-6">
            <button
              onClick={downloadTemplate}
              className="text-sm text-primary-600 hover:text-primary-800 flex items-center"
            >
              <ArrowUpTrayIcon className="w-4 h-4 mr-1 rotate-180" />
              Download CSV Template
            </button>
          </div>

          {/* File Upload Area */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-charcoal mb-2">
              Upload CSV File
            </label>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`border-2 border-dashed rounded-md p-6 text-center transition-colors ${
                isDragging
                  ? 'border-primary-400 bg-primary-50'
                  : csvFile
                  ? 'border-forest-400 bg-forest-50'
                  : 'border-border/60 hover:border-border/60'
              }`}
            >
              {csvFile ? (
                <div className="flex items-center justify-center space-x-2">
                  <CheckCircleIcon className="w-6 h-6 text-forest-600" />
                  <span className="text-sm font-medium text-forest-900">{csvFile.name}</span>
                </div>
              ) : (
                <>
                  <ArrowUpTrayIcon className="w-8 h-8 text-pewter mx-auto mb-2" />
                  <p className="text-sm text-stone mb-2">
                    Drag and drop your CSV file here, or click to browse
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-primary-600 hover:text-primary-800"
                  >
                    Choose File
                  </button>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Validation Status */}
          {validation && (
            <div className={`mb-6 p-3 rounded-md flex items-start space-x-2 ${
              validation.valid
                ? 'bg-forest-50 border border-forest-200'
                : 'bg-terracotta-50 border border-terracotta-200'
            }`}>
              {validation.valid ? (
                <CheckCircleIcon className="w-5 h-5 text-forest-600 mt-0.5" />
              ) : (
                <ExclamationTriangleIcon className="w-5 h-5 text-terracotta-600 mt-0.5" />
              )}
              <div>
                <p className={`text-sm font-medium ${
                  validation.valid ? 'text-forest-900' : 'text-terracotta-900'
                }`}>
                  {validation.valid ? 'CSV Validation Passed' : 'CSV Validation Failed'}
                </p>
                {!validation.valid && (
                  <p className="text-sm text-terracotta-700 mt-1">{validation.error}</p>
                )}
              </div>
            </div>
          )}

          {/* CSV Preview */}
          {csvData && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-charcoal mb-2">
                CSV Preview (first 5 rows)
              </label>
              <div className="border border-border/60 rounded-md overflow-hidden">
                <pre className="text-xs text-stone p-3 bg-paper overflow-x-auto">
                  {csvData.split('\n').slice(0, 6).join('\n')}
                  {csvData.split('\n').length > 6 && '\n...'}
                </pre>
              </div>
            </div>
          )}

          {/* Notify Users */}
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={notifyUsers}
                onChange={(e) => setNotifyUsers(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-border/60 rounded"
              />
              <span className="ml-2 text-sm text-charcoal">
                Send email notifications to users about role assignments
              </span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-paper">
          <button
            onClick={onClose}
            className="px-4 py-2 text-charcoal bg-white border border-border/60 rounded-md hover:bg-paper"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!csvData || !validation?.valid || isUploading}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Uploading...
              </>
            ) : (
              <>
                <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
                Upload & Assign Roles
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

