import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../../assets/logo.png";

function Header() {
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Smooth scroll to footer (works only on Landing page)
  const handleAboutClick = (e) => {
    e.preventDefault();

    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const footer = document.getElementById("footer");
        if (footer) footer.scrollIntoView({ behavior: "smooth" });
      }, 300);
      return;
    }

    const footer = document.getElementById("footer");
    if (footer) footer.scrollIntoView({ behavior: "smooth" });
  };

  // ✅ Smooth scroll to features (works only on Landing page)
  const handleFeaturesClick = (e) => {
    e.preventDefault();

    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        const section = document.getElementById("features");
        if (section) section.scrollIntoView({ behavior: "smooth" });
      }, 300);
      return;
    }

    const section = document.getElementById("features");
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 bg-[#070A12]/95 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        
        {/* ✅ Logo + Brand */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none"
          onClick={() => navigate("/")}
        >
          <img
            src={logo}
            alt="GradeX Logo"
            className="w-16 h-16 object-contain"
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

        {/* ✅ Right Side */}
        <div className="flex items-center gap-10">
          
          {/* ✅ Nav */}
          <nav className="hidden md:flex items-center gap-10 text-sm font-medium text-white/70">
            <button
              onClick={handleFeaturesClick}
              className="hover:text-white transition"
            >
              Features
            </button>

            <Link to="/reports" className="hover:text-white transition">
              Reports
            </Link>

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
