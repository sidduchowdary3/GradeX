import { useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";

function Header() {
  const navigate = useNavigate();

  // ✅ Smooth scroll to footer
  const handleAboutClick = (e) => {
    e.preventDefault();
    const footer = document.getElementById("footer");
    if (footer) {
      footer.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#070A12]/95 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        
        {/* ✅ Logo + Brand */}
        <div
          className="flex items-center gap-2 cursor-pointer select-none"
          onClick={() => navigate("/")}
        >
          <img
            src={logo}
            alt="GradeX Logo"
            className="w-16 h-16 object-contain"   // ✅ BIG LOGO
          />

          <div className="leading-tight">
            <h1 className="text-2xl font-bold text-white tracking-wide">
              GradeX
            </h1>
            <p className="text-sm text-white/60">
              Exams judged with excellence.
            </p>
          </div>
        </div>

        {/* ✅ Right side (Nav + Button aligned right) */}
        <div className="flex items-center gap-10">
          
          {/* ✅ Nav on right */}
          <nav className="hidden md:flex items-center gap-10 text-sm font-medium text-white/70">
            <a href="#features" className="hover:text-white transition">
              Features
            </a>

            <a
              href="#footer"
              onClick={handleAboutClick}
              className="hover:text-white transition"
            >
              About
            </a>
          </nav>

          {/* ✅ Button */}
          <button
            onClick={() => navigate("/home")}
            className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-semibold shadow-md hover:bg-indigo-700 transition"
          >
            Get Started
          </button>
        </div>

      </div>
    </header>
  );
}

export default Header;
