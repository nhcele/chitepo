import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@mindelta/shared';
import {
  UsersIcon,
  Cog6ToothIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  UserGroupIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import AdminLayout from '@/components/admin/AdminLayout';


