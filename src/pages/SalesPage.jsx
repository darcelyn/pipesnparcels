import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  Truck, 
  Zap, 
  DollarSign, 
  Clock,
  Package,
  TrendingDown,
  Shield,
  Headphones,
  ArrowRight,
  Star,
  CheckCircle2
} from "lucide-react";

export default function SalesPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    monthly_volume: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // In production, this would send to your email or CRM
    alert(`Thanks ${formData.name}! We'll contact you at ${formData.email} within 24 hours.`);
  };

  const features = [
    {
      icon: Zap,
      title: "Multi-Carrier Rate Comparison",
      description: "Compare FedEx and USPS rates side-by-side. Always get the best price automatically."
    },
    {
      icon: Package,
      title: "Smart Box Selection",
      description: "Pre-configured box library with intelligent suggestions based on your products."
    },
    {
      icon: Truck,
      title: "Magento Integration",
      description: "Orders automatically sync every 15 minutes. Zero manual data entry."
    },
    {
      icon: Clock,
      title: "Batch Label Processing",
      description: "Select multiple orders and create all labels with one click. Save hours daily."
    },
    {
      icon: DollarSign,
      title: "Cost Tracking & Reports",
      description: "Detailed shipping analytics and CSV exports for accounting and budgeting."
    },
    {
      icon: Shield,
      title: "International Shipping",
      description: "Automated customs forms and documentation for international orders."
    }
  ];

  const pricing = {
    setup: 3500,
    monthly: 299,
    includes: [
      "Complete custom installation",
      "Magento store integration",
      "FedEx & USPS API setup",
      "Your box presets configured",
      "Thermal printer configuration",
      "Team training (2 hours)",
      "30-day launch support",
      "Monthly software updates",
      "Priority email support",
      "Unlimited users"
    ]
  };

  const testimonials = [
    {
      company: "Performance Auto Parts Inc.",
      author: "Mike Rodriguez, Operations Manager",
      quote: "Cut our shipping time by 60%. We went from 45 minutes to create 20 labels down to just 15 minutes. ROI in the first month.",
      volume: "~35 shipments/day"
    },
    {
      company: "Midwest Exhaust Specialists",
      author: "Jennifer Liu, Owner",
      quote: "The rate comparison alone saves us $200-300/month. Plus our warehouse team loves how easy it is to use.",
      volume: "~25 shipments/day"
    },
    {
      company: "Elite Performance Mufflers",
      author: "Tom Anderson, Warehouse Lead",
      quote: "No more typing addresses manually. No more carrier website logins. Everything's automatic from Magento.",
      volume: "~40 shipments/day"
    }
  ];

  const problemSolutions = [
    {
      problem: "Wasting 30-60 minutes daily entering shipping data manually",
      solution: "Orders auto-import from Magento. Click, print, ship."
    },
    {
      problem: "Overpaying for shipping by using the same carrier every time",
      solution: "See all carrier rates instantly. Choose cheapest or fastest."
    },
    {
      problem: "Paying $50-100/month for ShipStation or similar SaaS",
      solution: "One-time setup + low monthly fee. No per-label charges."
    },
    {
      problem: "International shipments are complicated and time-consuming",
      solution: "Customs forms auto-generate. All documentation in one place."
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 text-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="bg-teal-500 text-white mb-4 text-sm px-4 py-1">
              Custom Shipping Solution for E-Commerce
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Stop Wasting Time on
              <br />
              <span className="text-teal-400">Manual Shipping Labels</span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
              Custom shipping label software built specifically for automotive aftermarket businesses. 
              Compare rates, create labels, and ship in half the time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a href="#contact">
                <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-white text-lg px-8 h-14">
                  Get a Free Demo
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
              <a href="#pricing">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-slate-900 text-lg px-8 h-14">
                  See Pricing
                </Button>
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-3 gap-8 mt-16 text-center">
            <div>
              <div className="text-4xl font-bold text-teal-400 mb-2">60%</div>
              <div className="text-slate-300">Faster Label Creation</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-teal-400 mb-2">$200+</div>
              <div className="text-slate-300">Avg. Monthly Savings</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-teal-400 mb-2">100%</div>
              <div className="text-slate-300">Magento Automation</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Built for Your Exact Workflow
            </h2>
            <p className="text-xl text-slate-600">
              We understand the pain points of shipping automotive parts
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {problemSolutions.map((item, index) => (
              <Card key={index} className="border-2 border-slate-200 hover:border-teal-500 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-2xl">❌</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900 mb-3">{item.problem}</p>
                      <div className="flex items-start gap-3 bg-teal-50 p-3 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                        <p className="text-slate-700">{item.solution}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Everything You Need to Ship Faster
            </h2>
            <p className="text-xl text-slate-600">
              Professional-grade shipping software without the enterprise price tag
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-slate-200 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Trusted by Automotive Parts Businesses
            </h2>
            <p className="text-xl text-slate-600">
              See what other shop owners are saying
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-slate-200">
                <CardContent className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 mb-4 italic">
                    "{testimonial.quote}"
                  </p>
                  <div className="border-t pt-4">
                    <p className="font-semibold text-slate-900">{testimonial.author}</p>
                    <p className="text-sm text-slate-600">{testimonial.company}</p>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {testimonial.volume}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-600">
              No hidden fees. No per-label charges. No surprises.
            </p>
          </div>

          <Card className="border-2 border-teal-500 shadow-xl">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <Badge className="bg-teal-500 text-white mb-4">Most Popular</Badge>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">
                  Custom Installation Package
                </h3>
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div>
                    <div className="text-4xl font-bold text-slate-900">
                      ${pricing.setup.toLocaleString()}
                    </div>
                    <div className="text-slate-600">One-time setup</div>
                  </div>
                  <div className="text-3xl text-slate-400">+</div>
                  <div>
                    <div className="text-4xl font-bold text-slate-900">
                      ${pricing.monthly}
                    </div>
                    <div className="text-slate-600">/month support</div>
                  </div>
                </div>
                <div className="bg-teal-50 rounded-lg p-4 mb-6">
                  <p className="text-teal-900 font-medium">
                    💰 Compare: ShipStation costs $99-229/mo + NO customization
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {pricing.includes.map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{item}</span>
                  </div>
                ))}
              </div>

              <a href="#contact">
                <Button size="lg" className="w-full bg-teal-600 hover:bg-teal-700 text-lg h-14">
                  Schedule Your Demo Call
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="flex items-start gap-3">
              <Shield className="w-6 h-6 text-teal-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-900">30-Day Guarantee</p>
                <p className="text-sm text-slate-600">Full refund if not satisfied</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Headphones className="w-6 h-6 text-teal-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-900">Ongoing Support</p>
                <p className="text-sm text-slate-600">Priority email response</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Zap className="w-6 h-6 text-teal-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-900">Quick Setup</p>
                <p className="text-sm text-slate-600">Live in 7-10 business days</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Calculate Your ROI
            </h2>
            <p className="text-xl text-slate-600">
              See how much time and money you'll save
            </p>
          </div>

          <Card className="border-slate-200">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="font-semibold text-slate-900 text-lg">Your Current Costs:</h3>
                  <div>
                    <p className="text-slate-700 mb-4">⏱️ Time spent creating labels daily:</p>
                    <p className="text-2xl font-bold text-red-600">45-60 minutes</p>
                  </div>
                  <div>
                    <p className="text-slate-700 mb-4">💵 Monthly cost (staff time @ $20/hr):</p>
                    <p className="text-2xl font-bold text-red-600">~$330/month</p>
                  </div>
                  <div>
                    <p className="text-slate-700 mb-4">📦 Overpaying on shipping (10%):</p>
                    <p className="text-2xl font-bold text-red-600">~$200/month</p>
                  </div>
                  <div className="border-t pt-4">
                    <p className="text-slate-700 mb-2">Total monthly waste:</p>
                    <p className="text-3xl font-bold text-red-600">$530/month</p>
                  </div>
                </div>

                <div className="space-y-6 bg-teal-50 rounded-lg p-6">
                  <h3 className="font-semibold text-slate-900 text-lg">With ShipPro:</h3>
                  <div>
                    <p className="text-slate-700 mb-4">⏱️ Time spent daily:</p>
                    <p className="text-2xl font-bold text-teal-700">15-20 minutes</p>
                    <p className="text-sm text-teal-600">↓ 60% time savings</p>
                  </div>
                  <div>
                    <p className="text-slate-700 mb-4">💵 Monthly cost:</p>
                    <p className="text-2xl font-bold text-teal-700">$299/month</p>
                    <p className="text-sm text-teal-600">Support + updates included</p>
                  </div>
                  <div>
                    <p className="text-slate-700 mb-4">📦 Rate comparison savings:</p>
                    <p className="text-2xl font-bold text-teal-700">~$200/month</p>
                  </div>
                  <div className="border-t border-teal-200 pt-4">
                    <p className="text-slate-700 mb-2">Monthly savings:</p>
                    <p className="text-3xl font-bold text-teal-700">$231/month</p>
                    <p className="text-sm text-teal-600 mt-2">
                      ✅ ROI in ~15 months
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contact Form */}
      <section id="contact" className="py-20 px-4 bg-gradient-to-br from-slate-900 to-teal-900 text-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Streamline Your Shipping?
            </h2>
            <p className="text-xl text-slate-300">
              Schedule a free 30-minute demo call. See the system in action.
            </p>
          </div>

          <Card className="border-0 shadow-2xl">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Your Name *
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Smith"
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address *
                  </label>
                  <Input
                    required
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@yourcompany.com"
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Company Name
                  </label>
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Your Auto Parts Company"
                    className="h-12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Average Monthly Shipments
                  </label>
                  <Input
                    value={formData.monthly_volume}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthly_volume: e.target.value }))}
                    placeholder="e.g., 300-500"
                    className="h-12"
                  />
                </div>

                <Button type="submit" size="lg" className="w-full bg-teal-600 hover:bg-teal-700 h-14 text-lg">
                  Request Free Demo
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>

                <p className="text-center text-sm text-slate-500">
                  We'll respond within 24 hours to schedule your demo call
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                q: "Do I need to use Magento?",
                a: "No! While we specialize in Magento integration, we can integrate with Shopify, WooCommerce, or build a manual entry workflow for any platform."
              },
              {
                q: "What if I already have FedEx and USPS accounts?",
                a: "Perfect! We'll connect your existing accounts. You keep your negotiated rates and existing relationship with carriers."
              },
              {
                q: "How long does setup take?",
                a: "Typically 7-10 business days from signing to going live. This includes integration testing, box configuration, and team training."
              },
              {
                q: "Can I cancel the monthly support?",
                a: "Yes, there's no long-term contract. However, support includes software updates, security patches, and priority help when needed."
              },
              {
                q: "What about thermal label printers?",
                a: "We support all major thermal printers (Zebra, Rollo, Dymo). If you don't have one, we can recommend affordable options ($150-300)."
              },
              {
                q: "Is my data secure?",
                a: "Absolutely. All data is encrypted, hosted on secure cloud infrastructure, and we never store payment card information."
              }
            ].map((faq, index) => (
              <Card key={index} className="border-slate-200">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-slate-900 text-lg mb-3">
                    {faq.q}
                  </h3>
                  <p className="text-slate-600">
                    {faq.a}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 px-4 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Stop Wasting Time on Shipping Labels
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Join other automotive parts businesses saving 60% of their time
          </p>
          <a href="#contact">
            <Button size="lg" className="bg-teal-500 hover:bg-teal-600 text-lg px-8 h-14">
              Schedule Your Free Demo
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}