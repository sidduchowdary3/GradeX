import React from "react";

function InfoCard({ icon, title, description }) {
  return (
    <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/70 backdrop-blur-xl border border-white/30 shadow-sm hover:shadow-md transition">
      {/* Icon */}
      <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center shadow-md">
        <div className="text-white">{icon}</div>
      </div>

      {/* Content */}
      <div>
        <h4 className="text-base font-extrabold text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

export default InfoCard;
