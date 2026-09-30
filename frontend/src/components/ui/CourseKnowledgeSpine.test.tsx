import React from 'react';
import { render, screen } from '@testing-library/react';
import CourseKnowledgeSpine, { SpineModule } from './CourseKnowledgeSpine';

jest.mock('@heroicons/react/24/outline', () => ({
  ChevronDownIcon: () => <svg data-testid="chevron-down" />,
  ChevronUpIcon: () => <svg data-testid="chevron-up" />,
  PlayIcon: () => <svg data-testid="play-icon" />,
  DocumentTextIcon: () => <svg data-testid="document-icon" />,
  LockClosedIcon: () => <svg data-testid="lock-icon" />,
}));

jest.mock('framer-motion', () => ({
  motion: {
    ul: (props: any) => <ul {...props} data-testid="motion-ul" />,
  },
}));

const modules: SpineModule[] = [
  {
    id: 'mod-1',
    orderIndex: 0,
    title: 'Module 1',
    lessons: [
      { id: 'l-1', title: 'Completed lesson', type: 'video', isPreview: false, status: 'completed', href: '/courses/c/lessons/l-1' },
      { id: 'l-2', title: 'Current lesson', type: 'video', isPreview: false, status: 'current', href: '/courses/c/lessons/l-2' },
      { id: 'l-3', title: 'In progress lesson', type: 'video', isPreview: false, status: 'in_progress', href: '/courses/c/lessons/l-3' },
      { id: 'l-4', title: 'Locked lesson', type: 'video', isPreview: false, status: 'pending', isLocked: true },
      { id: 'l-5', title: 'Pending lesson', type: 'video', isPreview: false, status: 'pending' },
    ],
  },
];

describe('CourseKnowledgeSpine', () => {
  it('renders module and lesson titles', () => {
    render(<CourseKnowledgeSpine modules={modules} isEnrolled title="Outline" />);
    expect(screen.getByText('Module 1')).toBeInTheDocument();
    expect(screen.getByText('Current lesson')).toBeInTheDocument();
  });

  it('links unlocked lessons', () => {
    render(<CourseKnowledgeSpine modules={modules} isEnrolled title="Outline" />);
    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/courses/c/lessons/l-1');
    expect(hrefs).toContain('/courses/c/lessons/l-2');
    expect(hrefs).not.toContain('/courses/c/lessons/l-4');
  });

  it('does not link locked lessons', () => {
    render(<CourseKnowledgeSpine modules={modules} isEnrolled title="Outline" />);
    expect(screen.getByText('Locked lesson')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Locked lesson/i })).not.toBeInTheDocument();
  });

  it('shows locked badge for locked lessons', () => {
    render(<CourseKnowledgeSpine modules={modules} isEnrolled title="Outline" />);
    expect(screen.getByText('Locked')).toBeInTheDocument();
  });
});
