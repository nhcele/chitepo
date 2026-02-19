import React from 'react';
import { useRouter } from 'next/router';

export default function InstructorLanding() {
  const router = useRouter();
  
  React.useEffect(() => {
    // Redirect to the combined instructors page
    router.replace('/instructors');
  }, [router]);
  
  return null;
}
