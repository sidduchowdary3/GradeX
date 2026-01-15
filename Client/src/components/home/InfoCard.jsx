import React from 'react'

function InfoCard({icon, title, description}) {
    return (
        <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
                {icon}
            </div>
            <div>
                <h4 className="text-sm font-medium text-gray-900">{title}</h4>
                <p className="text-sm text-gray-600">{description}</p>
            </div>
        </div>
    )
}

export default InfoCard