import FeatureCard from './FeatureCard';
import Steps from './Steps';
import { useNavigate } from 'react-router';
import { 
    Brain, 
    CheckCircle2, 
    Clock, 
    FileSpreadsheet,
    BarChart3,
    Shield
} from 'lucide-react';

function Landing() {
    let navigate = useNavigate();

    function navToHome(){
        navigate('/home');
    }
    
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Hero Section */}
            <header className="container mx-auto px-6 py-16 text-center">
                <div className="mx-auto max-w-4xl">
                <Brain className="w-16 h-16 mx-auto text-indigo-600 mb-6" />
                <h1 className="text-5xl font-bold text-gray-900 mb-6">
                    Intelligent Answer Sheet Evaluation
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                    Automate your grading process with AI-powered accuracy and efficiency.
                    Save time while ensuring fair and consistent evaluations.
                </p>
                <button onClick={navToHome} className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors cursor-pointer">
                    Get Started
                </button>
                </div>
            </header>

            {/* Features Grid */}
            <section className="container mx-auto px-6 py-16">
                <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                Key Features
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <FeatureCard 
                    icon={<CheckCircle2 className="w-8 h-8 text-indigo-600" />}
                    title="Accurate Evaluation"
                    description="Advanced AI algorithms ensure precise comparison with model answers"
                />
                <FeatureCard 
                    icon={<Clock className="w-8 h-8 text-indigo-600" />}
                    title="Time-Saving"
                    description="Reduce grading time by up to 90% with automated processing"
                />
                <FeatureCard 
                    icon={<FileSpreadsheet className="w-8 h-8 text-indigo-600" />}
                    title="Batch Processing"
                    description="Evaluate multiple answer sheets simultaneously"
                />
                <FeatureCard 
                    icon={<BarChart3 className="w-8 h-8 text-indigo-600" />}
                    title="Detailed Analytics"
                    description="Get comprehensive insights and performance metrics"
                />
                <FeatureCard 
                    icon={<Shield className="w-8 h-8 text-indigo-600" />}
                    title="Reliable Security"
                    description="Enterprise-grade security for your sensitive data"
                />
                <FeatureCard 
                    icon={<Brain className="w-8 h-8 text-indigo-600" />}
                    title="Smart Learning"
                    description="AI system learns and improves with each evaluation"
                />
                </div>
            </section>

            {/* How It Works */}
            <section className="bg-gray-50 py-16">
                <div className="container mx-auto px-6">
                <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
                    How It Works
                </h2>
                <div className="max-w-3xl mx-auto">
                    <Steps />
                </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="container mx-auto px-6 py-16 text-center">
                <div className="bg-indigo-600 rounded-2xl py-12 px-6">
                <h2 className="text-3xl font-bold text-white mb-4">
                    Ready to Transform Your Evaluation Process?
                </h2>
                <p className="text-indigo-100 mb-8 max-w-2xl mx-auto">
                    Join thousands of educators who have already automated their grading workflow.
                    Start saving time and ensuring consistency today.
                </p>
                {/* <button className="bg-white text-indigo-600 px-8 py-3 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors">
                    Start Free Trial
                </button> */}
                </div>
            </section>
        </div>
    )
}

export default Landing