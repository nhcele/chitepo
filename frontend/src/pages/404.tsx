import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';

export default function NotFoundPage() {
  return (
    <>
      <Head>
        <title>404 - Page Not Found</title>
      </Head>
      <Layout>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h1 className="text-5xl font-bold mb-4">404</h1>
          <p className="text-gray-600 mb-8">The page you are looking for does not exist.</p>
          <Link href="/" className="text-primary-600 font-semibold hover:underline">Go back home</Link>
        </div>
      </Layout>
    </>
  );
}
