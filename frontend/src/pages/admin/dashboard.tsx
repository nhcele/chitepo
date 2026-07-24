import { useEffect } from 'react';
import { useRouter } from 'next/router';

// The admin dashboard lives at /admin (see pages/admin/index.tsx). This route
// redirects there so the "Dashboard" nav link (/admin/dashboard) works.
export default function AdminDashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/admin');
  }, [router]);
  return null;
}
