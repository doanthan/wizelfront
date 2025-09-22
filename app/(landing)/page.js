import { ArrowRight, Zap, Star, Check, ShoppingBag, BarChart3 } from "lucide-react"

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export default function LandingPage() {

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center px-6 py-20">
                <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-5"
                    style={{
                        backgroundImage: "url('/placeholder.svg?height=1080&width=1920')",
                    }}
                />

                <div className="relative z-10 max-w-4xl mx-auto text-center">
                    <div className="opacity-100 translate-y-0">
                        {/* Integration Badges */}
                        <div className="flex justify-center items-center gap-4 mb-8">
                            <div className="flex items-center bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
                                <ShoppingBag className="h-5 w-5 text-green-600 mr-2" />
                                <span className="text-sm font-medium text-gray-700">Built for Shopify</span>
                            </div>
                            <div className="flex items-center bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
                                <BarChart3 className="h-5 w-5 text-orange-500 mr-2" />
                                <span className="text-sm font-medium text-gray-700">Powered by Klaviyo</span>
                            </div>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-serif font-light text-gray-900 mb-8 leading-tight">
                            Shopify email campaigns that
                            <span className="block text-primary italic">write themselves</span>
                        </h1>

                        <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto font-light leading-relaxed">
                            Transform your Shopify store&apos;s email marketing with AI that syncs with Klaviyo to create campaigns that
                            convert customers automatically.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                            <button className="inline-flex items-center justify-center bg-sky-blue hover:bg-royal-blue text-white px-8 py-4 text-lg font-medium rounded-full transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg">
                                Connect Your Shopify Store
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </button>

                            <button className="inline-flex items-center justify-center text-gray-600 hover:text-gray-900 px-8 py-4 text-lg font-medium rounded-lg transition-colors">
                                Watch Demo
                            </button>
                        </div>

                        <p className="text-sm text-gray-500 mt-6">
                            Free 14-day trial • No Shopify app installation required • Works with existing Klaviyo setup
                        </p>
                    </div>
                </div>
            </section>

            {/* Integration Section */}
            <section className="py-16 px-6 bg-gray-50">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-2xl font-serif font-light text-gray-900 mb-8">
                        Seamlessly integrates with your existing stack
                    </h2>
                    <div className="flex justify-center items-center gap-12 opacity-60">
                        <div className="flex items-center">
                            <ShoppingBag className="h-12 w-12 text-green-600" />
                            <span className="ml-3 text-2xl font-bold text-gray-700">Shopify</span>
                        </div>
                        <div className="text-gray-400 text-2xl">+</div>
                        <div className="flex items-center">
                            <BarChart3 className="h-12 w-12 text-orange-500" />
                            <span className="ml-3 text-2xl font-bold text-gray-700">Klaviyo</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-serif font-light text-gray-900 mb-6">
                            Built specifically for
                            <span className="italic text-primary"> Shopify + Klaviyo</span>
                        </h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
                            Our AI understands your Shopify product catalog and customer data to create Klaviyo campaigns that drive
                            sales.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        <div className="text-center group">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                                <ShoppingBag className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-2xl font-serif font-medium text-gray-900 mb-4">Shopify Product Sync</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Automatically pulls your product catalog, inventory levels, and customer purchase history to create
                                relevant campaigns.
                            </p>
                        </div>

                        <div className="text-center group">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                                <BarChart3 className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-2xl font-serif font-medium text-gray-900 mb-4">Klaviyo Integration</h3>
                            <p className="text-gray-600 leading-relaxed">
                                Seamlessly creates and schedules campaigns in your existing Klaviyo account with your brand voice and
                                segments.
                            </p>
                        </div>

                        <div className="text-center group">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors duration-300">
                                <Zap className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-2xl font-serif font-medium text-gray-900 mb-4">Smart Automation</h3>
                            <p className="text-gray-600 leading-relaxed">
                                AI-powered flows for abandoned cart recovery, post-purchase follow-ups, and win-back campaigns that
                                actually work.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Demo Section */}
            <section className="py-24 px-6 bg-gray-50">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-serif font-light text-gray-900 mb-6">See it in action</h2>
                        <p className="text-xl text-gray-600 max-w-2xl mx-auto font-light">
                            Watch how our AI transforms your Shopify products into compelling Klaviyo email campaigns in minutes.
                        </p>
                    </div>

                    <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                        <img
                            src="/placeholder.svg?height=600&width=1000"
                            alt="Shopify Klaviyo AI Campaign Dashboard"
                            className="w-full h-auto"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section className="py-24 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-serif font-light text-gray-900 mb-6">
                            Trusted by Shopify stores worldwide
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12">
                        <div className="bg-white p-8 rounded-2xl shadow-sm border">
                            <div className="flex items-center mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                                ))}
                            </div>
                            <blockquote className="text-lg text-gray-700 mb-6 font-light leading-relaxed">
                                &quot;Our Klaviyo email revenue increased by 340% in just three months. The AI creates campaigns that
                                perfectly match our Shopify product catalog and customer segments.&quot;
                            </blockquote>
                            <div className="flex items-center">
                                <img
                                    src="/placeholder.svg?height=48&width=48"
                                    alt="Sarah Chen"
                                    className="w-12 h-12 rounded-full mr-4"
                                />
                                <div>
                                    <div className="font-medium text-gray-900">Sarah Chen</div>
                                    <div className="text-gray-600 text-sm">Founder, Bloom & Co • Shopify Plus</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-sm border">
                            <div className="flex items-center mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                                ))}
                            </div>
                            <blockquote className="text-lg text-gray-700 mb-6 font-light leading-relaxed">
                                &quot;Finally, email marketing that doesn&apos;t feel like work. It syncs perfectly with our Shopify store and
                                creates Klaviyo campaigns that actually convert.&quot;
                            </blockquote>
                            <div className="flex items-center">
                                <img
                                    src="/placeholder.svg?height=48&width=48"
                                    alt="Marcus Rodriguez"
                                    className="w-12 h-12 rounded-full mr-4"
                                />
                                <div>
                                    <div className="font-medium text-gray-900">Marcus Rodriguez</div>
                                    <div className="text-gray-600 text-sm">CMO, Urban Threads • Shopify Store</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Teaser */}
            <section className="py-24 px-6 bg-gray-50">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-serif font-light text-gray-900 mb-6">
                        Start growing your Shopify store today
                    </h2>
                    <p className="text-xl text-gray-600 mb-12 font-light">
                        Join hundreds of Shopify stores already using AI to transform their Klaviyo email marketing.
                    </p>

                    <div className="bg-white rounded-2xl p-8 md:p-12 mb-12 border">
                        <div className="flex items-center justify-center mb-6">
                            <span className="text-5xl font-serif font-light text-gray-900">Free</span>
                            <span className="text-xl text-gray-600 ml-2">for 14 days</span>
                        </div>

                        <ul className="text-left max-w-md mx-auto mb-8 space-y-3">
                            <li className="flex items-center text-gray-700">
                                <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                                Connect unlimited Shopify products
                            </li>
                            <li className="flex items-center text-gray-700">
                                <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                                Unlimited AI-generated Klaviyo campaigns
                            </li>
                            <li className="flex items-center text-gray-700">
                                <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                                Advanced Shopify analytics & insights
                            </li>
                            <li className="flex items-center text-gray-700">
                                <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                                24/7 Shopify + Klaviyo support
                            </li>
                        </ul>

                        <button className="inline-flex items-center justify-center bg-sky-blue hover:bg-royal-blue text-white px-12 py-4 text-lg font-medium rounded-full transition-all duration-300 hover:scale-105 shadow-md hover:shadow-lg">
                            Connect Your Shopify Store
                        </button>
                    </div>

                    <p className="text-sm text-gray-500">
                        No credit card required • No Shopify app installation • Works with existing Klaviyo account
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-16 px-6 bg-gray-900 text-white">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-4 gap-8 mb-12">
                        <div className="md:col-span-2">
                            <h3 className="text-2xl font-serif font-light mb-4">ShopifyAI</h3>
                            <p className="text-gray-400 font-light leading-relaxed max-w-md">
                                Intelligent email marketing automation for Shopify stores using Klaviyo.
                            </p>
                        </div>

                        <div>
                            <h4 className="font-medium mb-4">Product</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Shopify Integration
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Klaviyo Sync
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Pricing
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-medium mb-4">Company</h4>
                            <ul className="space-y-2 text-gray-400">
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        About
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Privacy
                                    </a>
                                </li>
                                <li>
                                    <a href="#" className="hover:text-white transition-colors">
                                        Terms
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
                        <p>&copy; 2024 ShopifyAI. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
