import React from "react";
import Footer from "./components/footer/Footer";
import Header from "./components/header/Header";
import { Outlet } from "react-router-dom";

function RootLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-indigo-50 via-white to-white">
      <Header />

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default RootLayout;
