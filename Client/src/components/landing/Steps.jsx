import React from 'react'

function Steps() {
    const steps = [
        {
        number: "01",
        title: "Upload Answer Sheets",
        description: "Simply upload student answer sheets in bulk through our intuitive interface"
        },
        {
        number: "02",
        title: "Set Model Answers",
        description: "Input or upload the correct answers and scoring criteria"
        },
        {
        number: "03",
        title: "Automated Evaluation",
        description: "Our AI processes and evaluates all submissions with precision"
        },
        {
        number: "04",
        title: "Review Results",
        description: "Access detailed reports and analytics of the evaluation process"
        }
    ];

    return (
        <div className="space-y-8">
            {steps.map((step, index) => (
                <div key={index} className="flex items-start">
                <div className="flex-shrink-0 bg-indigo-600 text-white font-bold rounded-lg w-12 h-12 flex items-center justify-center">
                    {step.number}
                </div>
                <div className="ml-4">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">{step.title}</h3>
                    <p className="text-gray-600">{step.description}</p>
                </div>
                </div>
            ))}
        </div>
    )
}

export default Steps