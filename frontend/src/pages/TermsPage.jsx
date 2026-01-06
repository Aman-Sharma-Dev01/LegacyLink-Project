import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowLeft, Shield, Users, FileText } from 'lucide-react';

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <GraduationCap className="w-8 h-8 text-linkedin-blue" />
            <span className="text-xl font-bold text-gray-900">LegacyLink</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center text-gray-600 hover:text-linkedin-blue"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 md:p-12"
        >
          <div className="flex items-center mb-8">
            <div className="w-12 h-12 bg-linkedin-blue rounded-xl flex items-center justify-center mr-4">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
              <p className="text-gray-500">Last updated: January 2026</p>
            </div>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 mb-4">
              By accessing and using LegacyLink, you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these terms, please do not use our services.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
            <p className="text-gray-600 mb-4">
              LegacyLink is an alumni networking platform that connects students, alumni, and institutions. Our services include:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Professional networking and mentorship connections</li>
              <li>Job board and career opportunities</li>
              <li>Event management and registration</li>
              <li>Community posts and discussions</li>
              <li>Direct messaging between users</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">3. User Accounts</h2>
            <p className="text-gray-600 mb-4">
              To access certain features, you must register for an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Provide accurate and complete information</li>
              <li>Maintain the security of your password</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized use</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">4. User Conduct</h2>
            <p className="text-gray-600 mb-4">
              You agree not to use the platform to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4 space-y-2">
              <li>Violate any applicable laws or regulations</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Post false, misleading, or fraudulent content</li>
              <li>Spam or send unsolicited messages</li>
              <li>Attempt to gain unauthorized access to our systems</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">5. Content Ownership</h2>
            <p className="text-gray-600 mb-4">
              You retain ownership of content you post on LegacyLink. By posting, you grant us a non-exclusive license to use, display, and distribute your content on our platform.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">6. Termination</h2>
            <p className="text-gray-600 mb-4">
              We reserve the right to suspend or terminate your account at any time for violations of these terms or for any other reason at our discretion.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-4">7. Contact Us</h2>
            <p className="text-gray-600 mb-4">
              If you have any questions about these Terms, please contact us at support@legacylink.com
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default TermsPage;
