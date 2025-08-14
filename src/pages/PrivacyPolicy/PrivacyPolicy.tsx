import React from 'react';
import { Shield, Eye, Database, Lock, Mail, Calendar } from 'lucide-react';

export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <div className="container mx-auto max-w-4xl px-6 py-8">
        <div className="gradient-card p-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto">
                <Shield size={32} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold gradient-text">Privacy Policy</h1>
              <p className="text-gray-600">
                Last updated: {new Date().toLocaleDateString()}
              </p>
              
              {/* Legal Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="text-yellow-600 mt-0.5">⚠️</div>
                  <div>
                    <p className="text-yellow-800 font-medium text-sm">Legal Notice</p>
                    <p className="text-yellow-700 text-sm">
                      This is a placeholder document. The final Privacy Policy must be reviewed and approved by qualified legal professionals 
                      to ensure compliance with applicable laws including GDPR, CCPA, and other privacy regulations.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Introduction */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                IDEA ("we," "our," or "us") operates the xidea.app website and Web3 services marketplace platform. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you 
                visit our website and use our services.
              </p>
            </div>

            {/* Information We Collect */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <Database size={24} className="text-blue-600" />
                Information We Collect
              </h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-blue-800 mb-3">Blockchain Information</h3>
                  <ul className="space-y-2 text-blue-700">
                    <li>• MultiversX wallet addresses</li>
                    <li>• Transaction hashes and blockchain data</li>
                    <li>• Smart contract interactions</li>
                    <li>• Token balances and transfers</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-green-800 mb-3">Profile Information</h3>
                  <ul className="space-y-2 text-green-700">
                    <li>• Username and display name</li>
                    <li>• Profile picture and bio</li>
                    <li>• Skills and portfolio information</li>
                    <li>• Email address (optional)</li>
                  </ul>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-purple-800 mb-3">Platform Activity</h3>
                  <ul className="space-y-2 text-purple-700">
                    <li>• Gigs created and orders placed</li>
                    <li>• Messages and communications</li>
                    <li>• Reviews and ratings</li>
                    <li>• Platform usage analytics</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* How We Use Information */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <Eye size={24} className="text-green-600" />
                How We Use Your Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-gray-800">Platform Operations</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Facilitate transactions between users</li>
                    <li>• Provide customer support</li>
                    <li>• Prevent fraud and abuse</li>
                    <li>• Improve platform functionality</li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <h3 className="text-lg font-bold text-gray-800">Communications</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Send order notifications</li>
                    <li>• Platform updates and announcements</li>
                    <li>• Marketing communications (with consent)</li>
                    <li>• Legal and regulatory notices</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Data Security */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <Lock size={24} className="text-red-600" />
                Data Security
              </h2>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="space-y-4">
                  <p className="text-gray-700">
                    We implement appropriate technical and organizational security measures to protect your personal information:
                  </p>
                  <ul className="space-y-2 text-gray-700">
                    <li>• Encryption of data in transit and at rest</li>
                    <li>• Regular security audits and assessments</li>
                    <li>• Access controls and authentication</li>
                    <li>• Blockchain-based transaction security</li>
                    <li>• Secure cloud infrastructure (Supabase)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Your Rights */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">Your Rights</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-indigo-800 mb-3">GDPR Rights (EU Users)</h3>
                  <ul className="space-y-2 text-indigo-700 text-sm">
                    <li>• Right to access your data</li>
                    <li>• Right to rectification</li>
                    <li>• Right to erasure</li>
                    <li>• Right to data portability</li>
                    <li>• Right to object to processing</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-green-800 mb-3">All Users</h3>
                  <ul className="space-y-2 text-green-700 text-sm">
                    <li>• Update your profile information</li>
                    <li>• Delete your account</li>
                    <li>• Opt-out of marketing emails</li>
                    <li>• Request data export</li>
                    <li>• Contact support for assistance</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <Mail size={24} className="text-purple-600" />
                Contact Us
              </h2>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <p className="text-purple-700 mb-4">
                  If you have any questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="space-y-2 text-purple-700">
                  <p><strong>Email:</strong> privacy@ideagigs.store</p>
                  <p><strong>Support:</strong> support@ideagigs.store</p>
                  <p><strong>Website:</strong> https://xidea.app</p>
                </div>
              </div>
            </div>

            {/* Legal Disclaimer */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <div className="text-red-600 mt-0.5">⚖️</div>
                <div>
                  <p className="text-red-800 font-medium mb-2">Important Legal Notice</p>
                  <p className="text-red-700 text-sm">
                    This Privacy Policy template requires review and customization by qualified legal professionals. 
                    It must be updated to comply with applicable laws in your jurisdiction, including but not limited to 
                    GDPR, CCPA, and other privacy regulations. This document does not constitute legal advice.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};