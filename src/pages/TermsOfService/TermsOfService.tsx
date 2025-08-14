import React from 'react';
import { FileText, Shield, AlertTriangle, DollarSign, Gavel, Users, Coins } from 'lucide-react';

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
            </div>

            {/* 1. Acceptance of Terms */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using the IDEA platform (xidea.app), you accept and agree to be bound by the terms 
                and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </div>

            {/* 2. Platform Description */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <Users size={24} className="text-blue-600" />
                2. Platform Description
              </h2>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="text-blue-700 mb-4">
                  IDEA is a decentralized marketplace built on MultiversX blockchain that connects clients with Web3 service providers, including:
                </p>
                <ul className="space-y-2 text-blue-700">
                  <li>• Blockchain developers and smart contract experts</li>
                  <li>• Web3 designers and UI/UX specialists</li>
                  <li>• DeFi protocol developers</li>
                  <li>• NFT creators and marketplace developers</li>
                  <li>• Cryptocurrency and tokenomics consultants</li>
                  <li>• MultiversX ecosystem specialists</li>
                </ul>
              </div>
            </div>

            {/* 3. User Responsibilities */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <Shield size={24} className="text-green-600" />
                3. User Responsibilities
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-green-800 mb-3">For Clients</h3>
                  <ul className="space-y-2 text-green-700 text-sm">
                    <li>• Provide accurate project requirements</li>
                    <li>• Make payments as agreed through escrow system</li>
                    <li>• Communicate professionally and respectfully</li>
                    <li>• Respect intellectual property rights</li>
                    <li>• Follow dispute resolution procedures</li>
                    <li>• Release payments promptly upon satisfactory completion</li>
                  </ul>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-purple-800 mb-3">For Service Providers</h3>
                  <ul className="space-y-2 text-purple-700 text-sm">
                    <li>• Deliver services as described in gig listings</li>
                    <li>• Meet agreed deadlines and milestones</li>
                    <li>• Maintain professional standards and quality</li>
                    <li>• Protect client confidentiality and data</li>
                    <li>• Provide accurate service descriptions and pricing</li>
                    <li>• Respond to client communications promptly</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 4. Payment Terms */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <DollarSign size={24} className="text-orange-600" />
                4. Payment Terms
              </h2>
              
              <div className="space-y-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-orange-800 mb-3">Escrow System</h3>
                  <p className="text-orange-700 text-sm mb-3">
                    All payments are secured through MultiversX smart contracts:
                  </p>
                  <ul className="space-y-2 text-orange-700 text-sm">
                    <li>• Payments are held in escrow until work completion</li>
                    <li>• Automatic release upon successful delivery confirmation</li>
                    <li>• Dispute resolution through admin review process</li>
                    <li>• Refund protection for clients in case of non-delivery</li>
                    <li>• Smart contract address: erd1qqqqqqqqqqqqqpgqvesht6c8ard8zzj5n02fmfae0kuy2z4vpmuqw5q9v0</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="text-lg font-bold text-yellow-800 mb-3 flex items-center gap-2">
                    <Coins size={20} />
                    Platform Fees
                  </h3>
                  <ul className="space-y-2 text-yellow-700 text-sm">
                    <li>• <strong>EGLD payments:</strong> 10% platform fee (deducted automatically)</li>
                    <li>• <strong>IDA token payments:</strong> 0% platform fee (no charges)</li>
                    <li>• Fees are transparently displayed before payment</li>
                    <li>• No hidden charges or additional costs</li>
                    <li>• Gas fees for blockchain transactions are separate</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 5. Prohibited Activities */}
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <AlertTriangle size={24} className="text-red-600" />
                5. Prohibited Activities
              </h2>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-red-700 mb-4 font-medium">The following activities are strictly prohibited on our platform:</p>
                <ul className="space-y-2 text-red-700">
                  <li>• Fraudulent or deceptive practices</li>
                  <li>• Money laundering or illegal financial activities</li>
                  <li>• Violation of intellectual property rights</li>
                  <li>• Harassment, abuse, or discriminatory behavior</li>
                  <li>• Spam or unsolicited communications</li>
                  <li>• Circumventing platform fees or payment systems</li>
                  <li>• Creating fake accounts, reviews, or ratings</li>
                  <li>• Offering services that violate applicable laws</li>
                  <li>• Manipulation of blockchain transactions</li>
                </ul>
              </div>
            </div>

            {/* 6. Intellectual Property */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">6. Intellectual Property</h2>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                <ul className="space-y-3 text-indigo-700">
                  <li>• Service providers retain ownership of their original work and methodologies</li>
                  <li>• Clients receive agreed-upon usage rights as specified in individual orders</li>
                  <li>• IDEA platform retains rights to platform technology and branding</li>
                  <li>• Users grant IDEA limited rights to display their content for platform operation</li>
                  <li>• Respect for third-party intellectual property is mandatory</li>
                </ul>
              </div>
            </div>

            {/* 7. Limitation of Liability */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <Gavel size={24} className="text-purple-600" />
                7. Limitation of Liability
              </h2>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <p className="text-purple-700 leading-relaxed mb-4">
                  IDEA acts as a marketplace platform connecting clients and service providers. We are not responsible for:
                </p>
                <ul className="space-y-2 text-purple-700">
                  <li>• Quality, accuracy, or completeness of services provided by third parties</li>
                  <li>• Disputes between users regarding service delivery</li>
                  <li>• Loss of cryptocurrency due to user error or negligence</li>
                  <li>• Technical issues with MultiversX blockchain network</li>
                  <li>• Third-party integrations or external services</li>
                  <li>• Market volatility affecting token values</li>
                  <li>• Smart contract vulnerabilities or exploits</li>
                </ul>
                <p className="text-purple-700 leading-relaxed mt-4">
                  <strong>Maximum Liability:</strong> Our total liability shall not exceed the amount of fees paid to us in the 12 months preceding the claim.
                </p>
              </div>
            </div>

            {/* 8. Dispute Resolution */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">8. Dispute Resolution</h2>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  In case of disputes between users, IDEA provides a structured resolution process:
                </p>
                <ol className="space-y-2 text-gray-700">
                  <li><strong>1. Direct Communication:</strong> Users attempt to resolve issues through platform messaging</li>
                  <li><strong>2. Dispute Filing:</strong> Either party can file a formal dispute through the platform</li>
                  <li><strong>3. Admin Review:</strong> IDEA administrators review evidence and communications</li>
                  <li><strong>4. Smart Contract Resolution:</strong> Funds are released or refunded based on admin decision</li>
                  <li><strong>5. Final Decision:</strong> Admin decisions are final and binding</li>
                </ol>
              </div>
            </div>

            {/* 9. Platform Availability */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">9. Platform Availability</h2>
              <p className="text-gray-700 leading-relaxed">
                While we strive to maintain continuous service availability, we do not guarantee uninterrupted access to the platform. 
                We may temporarily suspend or restrict access for maintenance, security updates, or compliance with legal requirements.
              </p>
            </div>

            {/* 10. Changes to Terms */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">10. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these terms at any time. Users will be notified of significant changes 
                through platform notifications and email (if provided). Continued use of the service after changes 
                constitutes acceptance of new terms.
              </p>
            </div>

            {/* 11. Governing Law */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">11. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms of Service shall be governed by and construed in accordance with applicable laws. 
                Any disputes arising from these terms shall be subject to the exclusive jurisdiction of competent courts.
              </p>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-gray-800">12. Contact Information</h2>
              
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                <p className="text-indigo-700 mb-4">
                  For questions about these Terms of Service, please contact us:
                </p>
                <div className="space-y-2 text-indigo-700">
                  <p><strong>Email:</strong> legal@ideagigs.store</p>
                  <p><strong>Support:</strong> support@ideagigs.store</p>
                  <p><strong>Website:</strong> xidea.app</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};