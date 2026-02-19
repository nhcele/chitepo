import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@mindelta/shared';

interface Props {
  allow: UserRole[];
  children: React.ReactNode;
}

export default function RoleGuard({ allow, children }: Props) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div className="p-6">Loading…</div>;
  }
  if (!user) {
    return <div className="p-6 text-red-600">You must be signed in.</div>;
  }
  if (!allow.includes(user.role)) {
    return <div className="p-6 text-red-600">You do not have permission to view this page.</div>;
  }
  return <>{children}</>;
}
