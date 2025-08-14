import React from 'react';
import { FileText, Shield, AlertTriangle, DollarSign, Gavel, Users } from 'lucide-react';

export const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <div className="container mx-auto max-w-4xl px-6 py-8">
        <div className="gradient-card p-8">
          <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-xl flex items-center justify-center mx-auto">
                <FileText size={32} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold gradient-text">Terms of Service</h1>
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
                      This is a placeholder document. The final Terms of Service must be reviewed and approved by qualified legal professionals 
                      to ensure compliance with applicable laws and regulations for Web3 marketplaces.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Acceptance of Terms */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using the IDEA platform (xidea.app), you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </div>

            {/* Platform Description */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <Users size={24} className="text-blue-600" />
                Platform Description
              </h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-blue-700 mb-4">
                  IDEA is a decentralized marketplace that connects clients with Web3 service providers, including:
                </p>
                <ul className="space-y-2 text-blue-700">
                  <li>• Blockchain developers and smart contract experts</li>
                  <li>• Web3 designers and UI/UX specialists</li>
                  <li>• DeFi protocol developers</li>
                  <li>• NFT creators and marketplace developers</li>
                  <li>• Cryptocurrency and tokenomics consultants</li>
                </ul>
              </div>
            </div>

            {/* User Responsibilities */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <Shield size={24} className="text-green-600" />
                User Responsibilities
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-green-800 mb-3">For Clients</h3>
                  <ul className="space-y-2 text-green-700 text-sm">
                    <li>• Provide accurate project requirements</li>
                    <li>• Make payments as agreed</li>
                    <li>• Communicate professionally</li>
                    <li>• Respect intellectual property rights</li>
                    <li>• Follow dispute resolution procedures</li>
                  </ul>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-purple-800 mb-3">For Service Providers</h3>
                  <ul className="space-y-2 text-purple-700 text-sm">
                    <li>• Deliver services as described</li>
                    <li>• Meet agreed deadlines</li>
                    <li>• Maintain professional standards</li>
                    <li>• Protect client confidentiality</li>
                    <li>• Provide accurate service descriptions</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <DollarSign size={24} className="text-orange-600" />
                Payment Terms
              </h2>
              
              <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-orange-800 mb-3">Escrow System</h3>
                  <p className="text-orange-700 text-sm mb-3">
                    All payments are secured through MultiversX smart contracts:
                  </p>
                  <ul className="space-y-2 text-orange-700 text-sm">
                    <li>• Payments are held in escrow until work completion</li>
                    <li>• Automatic release upon successful delivery</li>
                    <li>• Dispute resolution through admin review</li>
                    <li>• Refund protection for clients</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-yellow-800 mb-3">Platform Fees</h3>
                  <ul className="space-y-2 text-yellow-700 text-sm">
                    <li>• EGLD payments: 10% platform fee</li>
                    <li>• IDA token payments: 0% platform fee</li>
                    <li>• Fees are automatically deducted</li>
                    <li>• No hidden charges or additional costs</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Prohibited Activities */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <AlertTriangle size={24} className="text-red-600" />
                Prohibited Activities
              </h2>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-red-700 mb-4">The following activities are strictly prohibited:</p>
                <ul className="space-y-2 text-red-700">
                  <li>• Fraudulent or deceptive practices</li>
                  <li>• Money laundering or illegal financial activities</li>
                  <li>• Violation of intellectual property rights</li>
                  <li>• Harassment or abusive behavior</li>
                  <li>• Spam or unsolicited communications</li>
                  <li>• Circumventing platform fees</li>
                  <li>• Creating fake accounts or reviews</li>
                </ul>
              </div>
            </div>

            {/* Limitation of Liability */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <Gavel size={24} className="text-purple-600" />
                Limitation of Liability
              </h2>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <p className="text-purple-700 leading-relaxed">
                  IDEA acts as a marketplace platform connecting clients and service providers. We are not responsible for:
                </p>
                <ul className="space-y-2 text-purple-700 mt-4">
                  <li>• Quality of services provided by third parties</li>
                  <li>• Disputes between users</li>
                  <li>• Loss of cryptocurrency due to user error</li>
                  <li>• Technical issues with blockchain networks</li>
                  <li>• Third-party integrations or services</li>
                </ul>
              </div>
            </div>

            {/* Dispute Resolution */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">Dispute Resolution</h2>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="space-y-4">
                  <p className="text-gray-700">
                    In case of disputes between users, IDEA provides a structured resolution process:
                  </p>
                  <ol className="space-y-2 text-gray-700">
                    <li>1. Direct communication between parties</li>
                    <li>2. Platform mediation through admin review</li>
                    <li>3. Smart contract-based resolution</li>
                    <li>4. Final decision by platform administrators</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Changes to Terms */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these terms at any time. Users will be notified of significant changes 
                through the platform. Continued use of the service after changes constitutes acceptance of new terms.
              </p>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">Contact Information</h2>
              
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                <p className="text-indigo-700 mb-4">
                  For questions about these Terms of Service, please contact us:
                </p>
                <div className="space-y-2 text-indigo-700">
                  <p><strong>Email:</strong> legal@ideagigs.store</p>
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
                    This Terms of Service template requires comprehensive review and customization by qualified legal professionals. 
                    It must be updated to comply with applicable laws in your jurisdiction, including but not limited to 
                    consumer protection laws, e-commerce regulations, and Web3-specific legal requirements. 
                    This document does not constitute legal advice.
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