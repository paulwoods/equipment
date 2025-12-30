import Link from "next/link";
import {Mail, MapPin, Phone, Send} from "lucide-react";

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div
                    className="bg-white dark:bg-gray-900 shadow-xl rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                        {/* Contact Information */}
                        <div className="bg-blue-600 p-8 md:p-12 text-white">
                            <h1 className="text-3xl font-extrabold mb-6 tracking-tight">
                                Contact Us
                            </h1>
                            <p className="text-blue-100 mb-12 text-lg">
                                Have questions about the Equipment Management System? We're here to help.
                            </p>

                            <div className="space-y-8">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-blue-500 rounded-lg">
                                        <Mail className="w-6 h-6"/>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-blue-100 text-sm uppercase tracking-wider">Email</p>
                                        <p className="text-lg font-medium">support@equipmentmanager.com</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-blue-500 rounded-lg">
                                        <Phone className="w-6 h-6"/>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-blue-100 text-sm uppercase tracking-wider">Phone</p>
                                        <p className="text-lg font-medium">+1 (555) 123-4567</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-blue-500 rounded-lg">
                                        <MapPin className="w-6 h-6"/>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-blue-100 text-sm uppercase tracking-wider">Office</p>
                                        <p className="text-lg font-medium">123 Tech Way, Suite 400<br/>San Francisco, CA
                                            94107</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="p-8 md:p-12">
                            <form className="space-y-6">
                                <div>
                                    <label htmlFor="name"
                                           className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email"
                                           className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>

                                <div>
                                    <label htmlFor="message"
                                           className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Message
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={4}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-none"
                                        placeholder="How can we help you?"
                                        required
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg hover:shadow-xl active:scale-95 group"
                                >
                                    <span>Send Message</span>
                                    <Send
                                        className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"/>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <Link href="/" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                        Return to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
