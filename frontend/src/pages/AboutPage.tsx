import React, {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {Info, ShieldCheck} from "lucide-react";
import {Button} from "../components/ui/button";
import {getVersion} from "../api/client";
import {PageContainer} from "../components";

const AboutPage = (): React.JSX.Element => {
    const [serverVersion, setServerVersion] = useState<string | null>(null);

    useEffect(() => {
        getVersion()
            .then(data => setServerVersion(data.version))
            .catch(() => setServerVersion("unavailable"));
    }, []);

    return (
        <PageContainer>
                <div>
                    <div className="p-8 md:p-12">
                        <div className="flex items-center gap-4 mb-8">
                            <div
                                className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                                <Info className="w-8 h-8"/>
                            </div>
                            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">
                                About Equipment Manager
                            </h1>
                        </div>

                        <div className="flex flex-wrap gap-2 mb-6">
                            <span
                                className="px-3 py-1 bg-muted text-foreground rounded-full text-sm font-medium">
                                <span className="px-2 py-0.5 text-muted-foreground mr-1">Client:</span>
                                <span className="px-2 py-0.5 font-mono">{__APP_VERSION__}</span>
                            </span>
                            <span
                                className="px-3 py-1 bg-muted text-foreground rounded-full text-sm font-medium">
                                <span className="px-2 py-0.5 text-muted-foreground mr-1">Server:</span>
                                <span className="px-2 py-0.5 font-mono">{serverVersion ?? "..."}</span>
                            </span>
                        </div>

                        <div
                            className="prose prose-blue dark:prose-invert max-w-none space-y-6 text-muted-foreground">
                            <p className="text-lg leading-relaxed">
                                The <strong>Equipment Management System</strong> is a comprehensive tool designed to
                                help you track your equipment, schedule essential maintenance procedures, and maintain a
                                detailed performance history.
                            </p>

                            <section className="space-y-4 pt-4">
                                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                    <ShieldCheck className="w-5 h-5 text-green-500"/>
                                    Key Features
                                </h2>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0">
                                    <li className="bg-muted p-4 rounded-lg border border-border">
                                        <span
                                            className="font-semibold text-foreground block mb-1">Inventory Tracking</span>
                                        Organize all your equipment in one place with detailed descriptions and purchase
                                        history.
                                    </li>
                                    <li className="bg-muted p-4 rounded-lg border border-border">
                                        <span className="font-semibold text-foreground block mb-1">Maintenance Scheduling</span>
                                        Define recurring procedures and get notified when they are due.
                                    </li>
                                    <li className="bg-muted p-4 rounded-lg border border-border">
                                        <span
                                            className="font-semibold text-foreground block mb-1">Performance History</span>
                                        Keep a permanent record of every maintenance task performed.
                                    </li>
                                    <li className="bg-muted p-4 rounded-lg border border-border">
                                        <span
                                            className="font-semibold text-foreground block mb-1">Responsive Design</span>
                                        Access your data from any device, whether you're at your desk or in the field.
                                    </li>
                                </ul>
                            </section>

                            <section className="pt-8 border-t border-border">
                                <h2 className="text-xl font-bold text-foreground mb-4">Technology
                                    Stack</h2>
                                <p>
                                    Built using modern web technologies for performance and reliability:
                                </p>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {["Spring Boot", "React", "TypeScript", "Tailwind CSS", "Lucide Icons", "Docker"].map((tech) => (
                                        <span key={tech}
                                              className="px-3 py-1 bg-muted text-foreground rounded-full text-sm font-medium">
                                            {tech}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        </div>

                        <div className="mt-12 flex justify-center">
                            <Button asChild>
                                <Link to="/equipment">Get Started</Link>
                            </Button>
                        </div>
                    </div>
                </div>
        </PageContainer>
    );
}

export {AboutPage};
