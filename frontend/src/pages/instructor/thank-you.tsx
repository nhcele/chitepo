import React from 'react';
import Link from 'next/link';

export default function InstructorThankYou() {
  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold">Thank you!</h1>
      <p className="mt-2 text-gray-700">We’ll get back to you within 3 business days.</p>
      <Link href="/" className="mt-4 inline-flex px-4 py-2 rounded bg-gray-800 text-white">Back to Home</Link>
    </div>
  );
}
