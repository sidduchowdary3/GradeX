export function GradientButton({
  children,
  onClick,
  className = "",
  variant = "solid",
  ...props
}) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-6 py-3 text-base font-semibold transition-all duration-200";

  const solid =
    "text-white bg-gradient-to-r from-indigo-600 to-purple-600 shadow-md hover:shadow-lg hover:opacity-95";

  const outline =
    "text-gray-900 bg-white/70 backdrop-blur border border-gray-200 hover:bg-white shadow-sm";

  return (
    <button
      onClick={onClick}
      className={`${base} ${variant === "outline" ? outline : solid} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
