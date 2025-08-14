import React, { useState } from 'react';
import { Shield, Trash2, Download, Mail, Cookie, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from 'components';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { supabase } from '../../lib/supabase';

export const PrivacyPolicy = () => {
  const { user } = useAuth();
  const { success: showSuccessToast, error: showErrorToast } = useToast();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleDeleteData = async () => {
    if (!user?.id) {
      showErrorToast('Please log in to delete your data');
      return;
    }

    setIsDeleting(true);
    try {
      // Send data deletion request email
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: 'privacy@ideagigs.store',
          subject: `Data Deletion Request - User ${user.username}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Data Deletion Request</title>
            </head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">🗑️ Data Deletion Request</h1>
              </div>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
                <h2 style="color: #495057; margin-top: 0;">User Information</h2>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
                  <p><strong>User ID:</strong> ${user.id}</p>
                  <p><strong>Username:</strong> ${user.username || 'N/A'}</p>
                  <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
                  <p><strong>Wallet Address:</strong> ${user.wallet_address || 'N/A'}</p>
                  <p><strong>Request Date:</strong> ${new Date().toISOString()}</p>
                </div>
                
                <p style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 30px;">
                  This user has requested deletion of all their personal data from IDEA Platform.<br>
                  Please process this request according to GDPR and privacy policy requirements.
                </p>
              </div>
            </body>
            </html>
          `
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to send deletion request');
      }

      showSuccessToast('Data deletion request sent successfully. We will process your request within 30 days.');
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error sending deletion request:', error);
      showErrorToast('Failed to send deletion request. Please contact privacy@ideagigs.store directly.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportData = async () => {
    if (!user?.id) {
      showErrorToast('Please log in to export your data');
      return;
    }

    setIsExporting(true);
    try {
      // Send data export request email
      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: 'privacy@ideagigs.store',
          subject: `Data Export Request - User ${user.username}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Data Export Request</title>
            </head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">📥 Data Export Request</h1>
              </div>
              
              <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e9ecef;">
                <h2 style="color: #495057; margin-top: 0;">User Information</h2>
                
                <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
                  <p><strong>User ID:</strong> ${user.id}</p>
                  <p><strong>Username:</strong> ${user.username || 'N/A'}</p>
                  <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
                  <p><strong>Wallet Address:</strong> ${user.wallet_address || 'N/A'}</p>
                  <p><strong>Request Date:</strong> ${new Date().toISOString()}</p>
                </div>
                
                <p style="color: #6c757d; font-size: 14px; text-align: center; margin-top: 30px;">
                  This user has requested export of all their personal data from IDEA Platform.<br>
                  Please prepare and send the data export within 30 days.
                </p>
              </div>
            </body>
            </html>
          `
        }
      });

      if (error) {
        throw new Error(error.message || 'Failed to send export request');
      }

      showSuccessToast('Data export request sent successfully. We will send your data within 30 days.');
    } catch (error) {
      console.error('Error sending export request:', error);
      showErrorToast('Failed to send export request. Please contact privacy@ideagigs.store directly.');
    } finally {
      setIsExporting(false);
    }
  };

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
            </div>

            {/* User Data Management */}
            {user && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-blue-800 mb-4">Your Data Rights</h3>
                <p className="text-blue-700 mb-4">
                  As a registered user, you have the right to manage your personal data:
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleExportData}
                    disabled={isExporting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Download size={16} />
                    {isExporting ? 'Requesting...' : 'Export My Data'}
                  </Button>
                  <Button
                    onClick={() => setShowDeleteModal(true)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Delete My Data
                  </Button>
                </div>
              </div>
            )}

            {/* 1. Introduction */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                IDEA ("we," "our," or "us") operates xidea.app, a Web3 services marketplace platform. This Privacy Policy explains how we collect, use, disclose, and protect your personal data when you use our website or services. By using our platform, you agree to the practices described here.
              </p>
            </div>

            {/* 2. Information We Collect */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">2. Information We Collect</h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-blue-800 mb-3">a) Blockchain Information</h3>
                  <ul className="space-y-2 text-blue-700">
                    <li>• MultiversX wallet addresses</li>
                    <li>• Transaction hashes and blockchain data</li>
                    <li>• Smart contract interactions</li>
                    <li>• Token balances and transfers</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-green-800 mb-3">b) Profile Information</h3>
                  <ul className="space-y-2 text-green-700">
                    <li>• Username and display name</li>
                    <li>• Profile picture and bio</li>
                    <li>• Skills and portfolio information</li>
                    <li>• Email address (optional)</li>
                  </ul>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-purple-800 mb-3">c) Platform Activity</h3>
                  <ul className="space-y-2 text-purple-700">
                    <li>• Gigs created and orders placed</li>
                    <li>• Messages and communications</li>
                    <li>• Reviews and ratings</li>
                    <li>• Platform usage analytics</li>
                  </ul>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-orange-800 mb-3">d) Cookies and Tracking</h3>
                  <ul className="space-y-2 text-orange-700">
                    <li>• Usage of cookies and similar technologies to track activity and improve functionality</li>
                    <li>• Third-party analytics (e.g., Google Analytics)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 3. How We Use Your Information */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">3. How We Use Your Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-blue-800 mb-3">a) Platform Operations</h3>
                    <ul className="space-y-2 text-blue-700">
                      <li>• Facilitate transactions between users</li>
                      <li>• Provide customer support</li>
                      <li>• Prevent fraud and abuse</li>
                      <li>• Improve platform functionality</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-green-800 mb-3">b) Communications</h3>
                    <ul className="space-y-2 text-green-700">
                      <li>• Send order notifications</li>
                      <li>• Provide platform updates and announcements</li>
                      <li>• Send marketing communications (with prior consent)</li>
                      <li>• Issue legal and regulatory notices</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-purple-800 mb-3">c) Legal Compliance</h3>
                    <ul className="space-y-2 text-purple-700">
                      <li>• Detect and prevent illegal activities</li>
                      <li>• Comply with legal obligations and regulatory requirements</li>
                    </ul>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="text-lg font-bold text-red-800 mb-3">d) Data Security</h3>
                    <p className="text-red-700 mb-3">We implement appropriate technical and organizational measures to protect your data:</p>
                    <ul className="space-y-2 text-red-700">
                      <li>• Encryption in transit and at rest</li>
                      <li>• Regular security audits and assessments</li>
                      <li>• Access controls and authentication</li>
                      <li>• Blockchain-based transaction security</li>
                      <li>• Secure cloud infrastructure (Supabase)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Legal Basis for Processing */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">4. Legal Basis for Processing (GDPR)</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <ul className="space-y-3 text-gray-700">
                  <li><strong>Consent:</strong> Where you have given consent (e.g., marketing emails)</li>
                  <li><strong>Contractual necessity:</strong> To provide our services and facilitate transactions</li>
                  <li><strong>Legal obligation:</strong> To comply with applicable laws</li>
                  <li><strong>Legitimate interest:</strong> To improve platform functionality and prevent fraud</li>
                </ul>
              </div>
            </div>

            {/* 5. Your Rights */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800">5. Your Rights</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-indigo-800 mb-3">GDPR Rights (EU Users)</h3>
                  <ul className="space-y-2 text-indigo-700 text-sm">
                    <li>• Right to access your data</li>
                    <li>• Right to rectification</li>
                    <li>• Right to erasure ("right to be forgotten")</li>
                    <li>• Right to data portability</li>
                    <li>• Right to object to processing</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-green-800 mb-3">CCPA Rights (California Users)</h3>
                  <ul className="space-y-2 text-green-700 text-sm">
                    <li>• Right to know what personal data is collected</li>
                    <li>• Right to delete personal data</li>
                    <li>• Right to opt-out of sale or sharing of personal information</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 md:col-span-2">
                  <h3 className="text-lg font-bold text-yellow-800 mb-3">All Users</h3>
                  <ul className="space-y-2 text-yellow-700 text-sm">
                    <li>• Update your profile information</li>
                    <li>• Delete your account</li>
                    <li>• Opt-out of marketing communications</li>
                    <li>• Request data export</li>
                    <li>• Contact support for assistance</li>
                  </ul>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-bold text-blue-800 mb-3">How to Exercise Your Rights:</h3>
                <p className="text-blue-700">
                  Email us at <strong>privacy@ideagigs.store</strong>. We will respond within the time frame required by law.
                </p>
              </div>
            </div>

            {/* 6. Data Retention */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">6. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain personal data only as long as necessary to provide services, comply with legal obligations, resolve disputes, and enforce agreements. Once data is no longer needed, it will be securely deleted or anonymized.
              </p>
            </div>

            {/* 7. Third-Party Services */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">7. Third-Party Services</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may share your information with third-party service providers who perform services on our behalf, such as:
              </p>
              <ul className="space-y-2 text-gray-700 ml-6">
                <li>• Payment processing</li>
                <li>• Analytics and performance tracking</li>
                <li>• Cloud storage</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                These providers are contractually obligated to protect your data and use it only for the purposes we specify.
              </p>
            </div>

            {/* 8. Cookies and Tracking */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">8. Cookies and Tracking</h2>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                <ul className="space-y-2 text-orange-700">
                  <li>• We use cookies and similar technologies to enhance user experience, track platform usage, and deliver personalized content.</li>
                  <li>• You can manage cookie preferences in your browser or through our platform's settings.</li>
                  <li>• Third-party services may also use cookies or tracking technologies.</li>
                </ul>
              </div>
            </div>

            {/* 9. Minors */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">9. Minors</h2>
              <p className="text-gray-700 leading-relaxed">
                Our platform is not intended for children under 13 (or 16 in the EU). We do not knowingly collect personal information from minors.
              </p>
            </div>

            {/* 10. Contact Us */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">10. Contact Us</h2>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <p className="text-purple-700 mb-4">
                  If you have questions or complaints regarding this Privacy Policy, please contact:
                </p>
                <div className="space-y-2 text-purple-700">
                  <p><strong>Email:</strong> privacy@ideagigs.store</p>
                  <p><strong>Support:</strong> support@ideagigs.store</p>
                  <p><strong>Website:</strong> xidea.app</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Data Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 size={24} className="text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800">Delete All Data</h3>
                  <p className="text-gray-600 text-sm">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700 text-sm">
                  <strong>Warning:</strong> This will permanently delete all your personal data including:
                </p>
                <ul className="text-red-700 text-sm mt-2 ml-4">
                  <li>• Profile information</li>
                  <li>• Order history</li>
                  <li>• Messages and communications</li>
                  <li>• Reviews and ratings</li>
                </ul>
              </div>
              
              <p className="text-gray-700 text-sm">
                We will send a deletion request to our privacy team. Your data will be permanently removed within 30 days as required by GDPR.
              </p>
              
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteData}
                  disabled={isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg"
                >
                  {isDeleting ? 'Sending Request...' : 'Delete My Data'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};