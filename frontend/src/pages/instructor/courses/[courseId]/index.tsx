import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import CourseBuilder from '@/pages/instructor/course/[courseId]';

export default function CourseEditorPage() {
  return <CourseBuilder />;
}
