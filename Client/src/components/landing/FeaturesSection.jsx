import { motion } from "framer-motion";
import {
  ScanText,
  Brain,
  MessageSquareText,
  FileDown,
  Users,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: ScanText,
    title: "OCR Extraction",
    description:
      "Advanced optical character recognition extracts handwritten and typed text with high accuracy.",
  },
  {
    icon: Brain,
    title: "AI Scoring",
    description:
      "Intelligent evaluation powered by modern language models for fair and consistent grading.",
  },
  {
    icon: MessageSquareText,
    title: "Concept-wise Feedback",
    description:
      "Detailed analysis of each concept tested, highlighting strengths and areas for improvement.",
  },
  {
    icon: FileDown,
    title: "PDF Report Generation",
    description:
      "Generate comprehensive PDF reports with scores, feedback, and actionable insights.",
  },
  {
    icon: Users,
    title: "Student/Teacher Modes",
    description:
      "Tailored interfaces for students to upload answers and teachers to manage evaluations.",
  },
  {
    icon: Zap,
    title: "Fast Results",
    description:
      "Get evaluation results in seconds, not hours. Handle multiple papers smoothly.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" },
  },
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-28 relative">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <motion.div
          className="text-center max-w-3xl mx-auto mb-14"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-indigo-600 font-semibold text-sm uppercase tracking-wider">
            Features
          </span>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mt-4 mb-5 text-gray-900">
            Everything you need for{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              smart grading
            </span>
          </h2>

          <p className="text-lg text-gray-600">
            GradeX combines OCR + AI evaluation + analytics to simplify exam correction
            with speed and accuracy.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              className="bg-white/70 backdrop-blur-xl border border-white/40 rounded-3xl p-8 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              variants={itemVariants}
            >
              {/* Icon */}
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
                <feature.icon className="w-7 h-7 text-white" />
              </div>

              {/* Text */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
