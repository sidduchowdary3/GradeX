import { motion } from "framer-motion";
import { FileText, CheckCircle, Sparkles } from "lucide-react";
import logo from "../../assets/logo.png"; // ✅ update path if needed

export function Hero3DScene() {
  return (
    <div className="relative w-full h-[500px] flex items-center justify-center">
      {/* Outer glow ring */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background:
            "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.12))",
          boxShadow: "0 0 60px 20px rgba(99,102,241,0.12)",
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
      />

      {/* Inner rotating ring */}
      <motion.div
        className="absolute w-[320px] h-[320px] rounded-full border-2 border-dashed border-indigo-500/20"
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      />

      {/* ✅ Central Logo */}
      <motion.div
  className="relative z-10 w-36 h-36 rounded-3xl flex items-center justify-center 
             bg-[#070A12]/90 backdrop-blur-xl border border-white/10 shadow-2xl"
  animate={{
    scale: [1, 1.05, 1],
    boxShadow: [
      "0 0 40px rgba(99,102,241,0.35)",
      "0 0 70px rgba(168,85,247,0.45)",
      "0 0 40px rgba(99,102,241,0.35)",
    ],
  }}
  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
>
  <img
    src={logo}
    alt="GradeX Logo"
    className="w-24 h-24 object-contain drop-shadow-2xl"
  />
</motion.div>


      {/* Floating cards - Left */}
      <motion.div
        className="absolute left-0 top-1/4 bg-white/60 backdrop-blur-xl border border-white/30 rounded-2xl p-4 flex items-center gap-3 shadow-lg"
        animate={{
          y: [0, -15, 0],
          x: [0, 5, 0],
          rotate: [0, 2, 0],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
          <FileText className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">Answer Sheet</div>
          <div className="text-xs text-gray-600">Uploading...</div>
        </div>
      </motion.div>

      {/* Floating cards - Right */}
      <motion.div
        className="absolute right-0 top-1/3 bg-white/60 backdrop-blur-xl border border-white/30 rounded-2xl p-4 flex items-center gap-3 shadow-lg"
        animate={{
          y: [0, -12, 0],
          x: [0, -5, 0],
          rotate: [0, -2, 0],
        }}
        transition={{
          duration: 4.5,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      >
        <div className="w-10 h-10 bg-purple-500/10 rounded-xl flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-900">AI Scoring</div>
          <div className="text-xs text-gray-600">78/100</div>
        </div>
      </motion.div>

      {/* Floating element - Bottom */}
      <motion.div
        className="absolute bottom-16 left-1/4 bg-white/60 backdrop-blur-xl border border-white/30 rounded-2xl p-3 flex items-center gap-2 shadow-lg"
        animate={{
          y: [0, -10, 0],
          rotate: [0, -1, 0],
        }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <Sparkles className="w-4 h-4 text-indigo-600" />
        <span className="text-xs font-semibold text-gray-900">Concept Analysis</span>
      </motion.div>

      {/* Orbiting dots */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => (
        <motion.div
          key={i}
          className="absolute w-3 h-3 rounded-full"
          style={{
            top: "50%",
            left: "50%",
            background: "linear-gradient(135deg, #4f46e5, #a855f7)",
          }}
          animate={{
            x: [
              Math.cos((angle * Math.PI) / 180) * 180,
              Math.cos(((angle + 360) * Math.PI) / 180) * 180,
            ],
            y: [
              Math.sin((angle * Math.PI) / 180) * 180,
              Math.sin(((angle + 360) * Math.PI) / 180) * 180,
            ],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  );
}
