import React from "react";

function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-white/10">
      <div className="container mx-auto px-6 py-10 text-center">
        {/* Brand Text */}
        <h3 className="text-lg font-extrabold text-white">
          Grade<span className="text-indigo-400">X</span>
        </h3>

        <p className="text-sm text-gray-400 mt-2">
          The AI Paper Judge — Exams judged with excellence.
        </p>

        {/* Small divider */}
        <div className="w-24 h-[2px] bg-gradient-to-r from-indigo-600 to-purple-600 mx-auto mt-4 rounded-full" />

        {/* Copyright */}
        <p className="text-xs text-gray-500 mt-6">
          © {new Date().getFullYear()} GradeX. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
