import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Check, 
  Calendar,
  DollarSign,
  Package,
  Download,
  Printer
} from "lucide-react";
import { format } from "date-fns";

export default function ProposalTemplate() {
  const clientName = "ABC Auto Parts";
  const proposalDate = new Date();
  const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-8 py-12">
        {/* Print Button */}
        <div className="no-print mb-8 flex justify-end">
          <Button onClick={handlePrint} className="bg-teal-600 hover:bg-teal-700">
            <Printer className="w-4 h-4 mr-2" />
            Print Proposal
          </Button>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">ShipPro</h1>
              <p className="text-slate-600">Custom Shipping Label Solution</p>
            </div>
          </div>
          
          <div className="bg-slate-50 rounded-lg p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">Prepared For:</p>
                <p className="text-xl font-semibold text-slate-900">{clientName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500 mb-1">Proposal Date:</p>
                <p className="font-medium text-slate-900">{format(proposalDate, 'MMMM d, yyyy')}</p>
                <p className="text-sm text-slate-500 mt-2">Valid Until: {format(validUntil, 'MMM d, yyyy')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Executive Summary */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Executive Summary</h2>
          <div className="prose max-w-none text-slate-700 space-y-4">
            <p>
              This proposal outlines a custom shipping label solution designed specifically for {clientName}'s 
              e-commerce operations. Our system will streamline your shipping workflow, reduce label creation 
              time by 60%, and provide multi-carrier rate comparison to ensure optimal shipping costs.
            </p>
            <p>
              Based on your current shipping volume, we estimate this solution will save your team 
              approximately 2-3 hours daily and reduce shipping costs by 10-15% through intelligent 
              carrier selection.
            </p>
          </div>
        </section>

        {/* Current Challenges */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Your Current Challenges</h2>
          <div className="space-y-4">
            {[
              "Manual data entry from Magento to shipping platforms wastes 30-60 minutes daily",
              "Using a single carrier for all shipments leads to overpaying on shipping costs",
              "Tracking down box dimensions and calculating weights slows down the process",
              "International shipments require complicated customs forms and documentation",
              "No centralized tracking or reporting for shipping costs and performance"
            ].map((challenge, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                <span className="text-red-600 font-bold mt-1">⚠️</span>
                <p className="text-slate-700">{challenge}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Solution Overview */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Our Solution</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                title: "Automated Order Import",
                description: "Direct Magento integration pulls orders automatically every 15 minutes. Zero manual typing."
              },
              {
                title: "Smart Box Selection",
                description: "Pre-configured with your exact box sizes. System suggests optimal box based on order items."
              },
              {
                title: "Multi-Carrier Rates",
                description: "Compare FedEx and USPS rates side-by-side. Always choose the best price or fastest delivery."
              },
              {
                title: "Batch Processing",
                description: "Select 10, 20, or 50 orders at once. Create all labels with a single click."
              },
              {
                title: "International Support",
                description: "Automated customs forms and documentation. Simplified international shipping workflow."
              },
              {
                title: "Cost Tracking",
                description: "Detailed reports and analytics. Export to CSV for accounting and budgeting."
              }
            ].map((feature, index) => (
              <Card key={index} className="border-slate-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Deliverables */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">What You Get</h2>
          <Card className="border-2 border-teal-200 bg-teal-50">
            <CardContent className="p-6">
              <div className="space-y-3">
                {[
                  "Fully functional shipping label web application",
                  "Magento store API integration and configuration",
                  "FedEx and USPS carrier account integration",
                  "Your custom box presets pre-configured",
                  "Thermal printer setup and configuration (ZPL format)",
                  "Multi-user access with role-based permissions",
                  "2-hour team training session (remote or on-site)",
                  "Complete user documentation and guides",
                  "30 days of priority launch support",
                  "Ongoing monthly software updates and security patches"
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-teal-700 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-800">{item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Timeline */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Implementation Timeline</h2>
          <div className="space-y-4">
            {[
              { phase: "Discovery & Planning", duration: "Days 1-2", details: "Gather API credentials, box specifications, and workflow requirements" },
              { phase: "Development & Integration", duration: "Days 3-7", details: "Configure Magento integration, set up carrier APIs, customize box presets" },
              { phase: "Testing & QA", duration: "Days 8-9", details: "Test with sample orders, verify printer configuration, check all workflows" },
              { phase: "Training & Launch", duration: "Day 10", details: "2-hour team training session, go-live support, final adjustments" },
              { phase: "Post-Launch Support", duration: "Days 11-40", details: "30 days of priority support to ensure smooth operations" }
            ].map((milestone, index) => (
              <div key={index} className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-teal-700" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-slate-900">{milestone.phase}</h3>
                    <Badge variant="outline" className="text-xs">{milestone.duration}</Badge>
                  </div>
                  <p className="text-sm text-slate-600">{milestone.details}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Investment</h2>
          
          <Card className="border-2 border-slate-300 mb-6">
            <CardHeader className="bg-slate-50">
              <CardTitle className="text-xl">One-Time Setup Fee</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-slate-600 mb-2">Complete custom installation including:</p>
                  <ul className="text-sm text-slate-600 space-y-1 ml-4">
                    <li>• Magento integration</li>
                    <li>• Carrier API setup</li>
                    <li>• Custom configuration</li>
                    <li>• Training & documentation</li>
                    <li>• 30-day launch support</li>
                  </ul>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-slate-900">$3,500</div>
                  <p className="text-sm text-slate-500">One-time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-teal-500">
            <CardHeader className="bg-teal-50">
              <CardTitle className="text-xl">Monthly Support & Maintenance</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-slate-600 mb-2">Ongoing support includes:</p>
                  <ul className="text-sm text-slate-600 space-y-1 ml-4">
                    <li>• Software updates and new features</li>
                    <li>• Security patches and maintenance</li>
                    <li>• Priority email support (24hr response)</li>
                    <li>• System monitoring and uptime</li>
                    <li>• Unlimited users and shipments</li>
                  </ul>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold text-slate-900">$299</div>
                  <p className="text-sm text-slate-500">Per month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 p-6 bg-emerald-50 rounded-lg border border-emerald-200">
            <div className="flex items-start gap-3">
              <DollarSign className="w-6 h-6 text-emerald-700 flex-shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 mb-2">Total First Year Investment</p>
                <p className="text-3xl font-bold text-emerald-700 mb-2">$7,088</p>
                <p className="text-sm text-slate-600">
                  Compare to: ShipStation Pro ($229/mo = $2,748/year) + 30-60 min daily time waste (value: ~$4,000/year) = $6,748/year with NO customization
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ROI Analysis */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Return on Investment</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-lg">Current Monthly Cost</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-700">Staff time (45 min/day @ $20/hr)</span>
                    <span className="font-semibold">$330</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Overpaying on shipping (10%)</span>
                    <span className="font-semibold">$200</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Current software (if any)</span>
                    <span className="font-semibold">$99</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="text-2xl font-bold text-red-600">$629/mo</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-emerald-200 bg-emerald-50">
              <CardHeader>
                <CardTitle className="text-lg">With ShipPro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-slate-700">Staff time (15 min/day @ $20/hr)</span>
                    <span className="font-semibold">$110</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Shipping optimization savings</span>
                    <span className="font-semibold text-emerald-700">-$200</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-700">Monthly support fee</span>
                    <span className="font-semibold">$299</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="text-2xl font-bold text-emerald-700">$209/mo</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2 border-teal-500 bg-teal-50">
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-slate-700 mb-2">Monthly Savings</p>
                <p className="text-4xl font-bold text-teal-700 mb-4">$420/month</p>
                <p className="text-slate-700">
                  <span className="font-semibold">ROI Timeline:</span> Initial investment recovered in approximately 8 months. 
                  Annual savings of $5,040 thereafter.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Terms */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Terms & Conditions</h2>
          <div className="text-sm text-slate-600 space-y-3 bg-slate-50 p-6 rounded-lg">
            <p><strong>Payment Terms:</strong> 50% due upon contract signing, 50% due upon go-live.</p>
            <p><strong>Monthly Billing:</strong> Begins on go-live date, billed monthly via credit card or ACH.</p>
            <p><strong>Cancellation:</strong> No long-term contract. Cancel monthly support anytime with 30 days notice.</p>
            <p><strong>Setup Guarantee:</strong> If not satisfied within 30 days of launch, receive full refund of setup fee.</p>
            <p><strong>Support Response Time:</strong> Priority support responds within 24 business hours.</p>
            <p><strong>Client Responsibilities:</strong> Client provides API credentials, carrier accounts, and reasonable availability for setup meetings.</p>
          </div>
        </section>

        {/* Signature */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Acceptance</h2>
          <Card className="border-slate-300">
            <CardContent className="p-8">
              <p className="text-slate-700 mb-8">
                By signing below, {clientName} accepts this proposal and authorizes ShipPro to proceed with 
                the implementation as outlined above.
              </p>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <p className="text-sm text-slate-500 mb-2">Client Signature</p>
                  <div className="border-b-2 border-slate-300 h-16 mb-4"></div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Printed Name:</p>
                      <div className="border-b border-slate-200 h-8 mt-1"></div>
                    </div>
                    <div>
                      <p className="text-slate-500">Date:</p>
                      <div className="border-b border-slate-200 h-8 mt-1"></div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-500 mb-2">ShipPro Representative</p>
                  <div className="border-b-2 border-slate-300 h-16 mb-4"></div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500">Printed Name:</p>
                      <div className="border-b border-slate-200 h-8 mt-1"></div>
                    </div>
                    <div>
                      <p className="text-slate-500">Date:</p>
                      <div className="border-b border-slate-200 h-8 mt-1"></div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <div className="text-center text-sm text-slate-500 border-t pt-8">
          <p>Questions? Contact us at sales@shippro.com or (555) 123-4567</p>
          <p className="mt-2">ShipPro Custom Shipping Solutions • Proposal Valid Until {format(validUntil, 'MMMM d, yyyy')}</p>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
}