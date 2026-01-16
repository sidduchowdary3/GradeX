import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router";
import { AnimatedBackground } from "./AnimatedBackground";
import { Hero3DScene } from "./Hero3DScene";
import { GradientButton } from "./GradientButton";
import { FeaturesSection } from "./FeaturesSection";

function Landing() {
  const navigate = useNavigate();

  function navToHome() {
    navigate("/home");
  }

  return (
    <div className="relative overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 lg:pt-0">
        <AnimatedBackground />

        <div className="container mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              className="text-center lg:text-left"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {/* Badge */}
              <motion.div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur border border-indigo-500/20 mb-6 shadow-sm"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="text-sm font-semibold text-gray-900">
                  GradeX: The AI Paper Judge
                </span>
              </motion.div>

              {/* Main Headline */}
              <motion.h1
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6 text-gray-900"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                AI-powered exam <br />
                <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  evaluation in seconds
                </span>
              </motion.h1>

              {/* Subtext */}
              <motion.p
                className="text-lg sm:text-xl text-gray-600 max-w-xl mx-auto lg:mx-0 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                Fast, accurate, and fair grading for students and teachers. Upgrade
                your answer sheet evaluation with GradeX AI.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <GradientButton onClick={navToHome}>Get Started</GradientButton>
              </motion.div>

              {/* Stats */}
              {/* <motion.div
                className="flex flex-wrap justify-center lg:justify-start gap-8 mt-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                {[
                  { value: "99.2%", label: "Accuracy Rate" },
                  { value: "50K+", label: "Papers Graded" },
                  { value: "3 sec", label: "Avg. Speed" },
                ].map((stat, i) => (
                  <div key={i} className="text-center lg:text-left">
                    <div className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                      {stat.value}
                    </div>
                    <div className="text-sm text-gray-500">{stat.label}</div>
                  </div>
                ))}
              </motion.div> */}
            </motion.div>

            {/* Right Content */}
            <motion.div
              className="relative hidden lg:block"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <Hero3DScene />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ✅ FEATURES SECTION (separate + gap) */}
      <div className="pt-10 lg:pt-16">
        <FeaturesSection />
      </div>
    </div>
  );
}

export default Landing;
