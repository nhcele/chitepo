import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  XMarkIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  jobRole?: string;
  department?: string;
  isActive: boolean;
}

interface RoleAssignmentModalProps {
  user: User;
  onClose: () => void;
  onAssign: (userId: string, newRole: string, notifyUser: boolean) => void;
}

const ALL_ROLES = [
  'Teller', 'Customer Service Rep', 'Personal Banker', 'Operations Clerk',
  'Compliance Officer', 'Risk Analyst', 'Credit Analyst', 'IT Support',
  'Systems Administrator', 'Cybersecurity Analyst', 'Branch Manager',
  'Operations Manager', 'Compliance Manager', 'Risk Manager',
  'CEO', 'CFO', 'CTO', 'CCO', 'CRO'
];

export default function RoleAssignmentModal({ user, onClose, onAssign }: RoleAssignmentModalProps) {
  const [selectedRole, setSelectedRole] = useState(user.jobRole || '');
  const [notifyUser, setNotifyUser] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);

  const handleAssign = async () => {
    if (!selectedRole) {
      toast('Please select a role');
      return;
    }

    if (selectedRole === user.jobRole) {
      toast('This user already has this role');
      return;
    }

    setIsAssigning(true);
    try {
      await onAssign(user.id, selectedRole, notifyUser);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Assign Role</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* User Info */}
          <div className="flex items-center space-x-3 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-gray-500">{user.email}</p>
              {user.jobRole && (
                <p className="text-xs text-blue-600 mt-1">
                  Current role: {user.jobRole}
                </p>
              )}
            </div>
          </div>

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select New Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Choose a role...</option>
              {ALL_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Notify User */}
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={notifyUser}
                onChange={(e) => setNotifyUser(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">
                Send notification to user about role assignment
              </span>
            </label>
          </div>

          {/* Role Description */}
          {selectedRole && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-2">
                <ShieldCheckIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Role: {selectedRole}</p>
                  <p className="text-sm text-blue-700 mt-1">
                    This assignment will provide the user with access to role-specific learning paths and compliance requirements.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            disabled={isAssigning}
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedRole || isAssigning || selectedRole === user.jobRole}
            className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isAssigning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Assigning...
              </>
            ) : (
              <>
                <ShieldCheckIcon className="w-4 h-4 mr-2" />
                Assign Role
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

