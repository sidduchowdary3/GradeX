import React from 'react'
import { Brain } from 'lucide-react'

function Footer() {
    return (
        <footer className="bg-gray-900 text-gray-300 py-12">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="flex items-center mb-4 md:mb-0">
                    <Brain className="w-8 h-8 text-indigo-400 mr-2" />
                    <span className="text-xl font-semibold">AI Evaluator</span>
                    </div>
                    <div className="flex space-x-6">
                    <a href="#" className="hover:text-white transition-colors">About</a>
                    <a href="#" className="hover:text-white transition-colors">Features</a>
                    <a href="#" className="hover:text-white transition-colors">Pricing</a>
                    <a href="#" className="hover:text-white transition-colors">Contact</a>
                    </div>
                </div>
                <div className="mt-8 text-center text-gray-500">
                    © 2024 AI Evaluator. All rights reserved.
                </div>
            </div>
        </footer>
    )
}

export default Footer