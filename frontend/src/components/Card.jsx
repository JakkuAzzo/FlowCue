export default function Card({ 
  children, 
  title, 
  icon, 
  iconColor = "blue", 
  className = "",
  hoverable = true,
  ...props 
}) {
  const iconColors = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600", 
    purple: "from-purple-500 to-purple-600",
    red: "from-red-500 to-red-600",
    yellow: "from-yellow-500 to-yellow-600",
    indigo: "from-indigo-500 to-indigo-600"
  };

  const hoverClasses = hoverable 
    ? "hover:border-opacity-50 hover:bg-white/10 transition-all duration-300 group cursor-pointer"
    : "";

  return (
    <div 
      className={`bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 ${hoverClasses} ${className}`}
      {...props}
    >
      {icon && (
        <div className={`flex items-center justify-center w-16 h-16 bg-gradient-to-r ${iconColors[iconColor]} rounded-xl mb-6 mx-auto ${hoverable ? 'group-hover:scale-110 transition-transform' : ''}`}>
          <span className="text-2xl">{icon}</span>
        </div>
      )}
      
      {title && (
        <h3 className="text-2xl font-bold text-white text-center mb-4">
          {title}
        </h3>
      )}
      
      {children}
    </div>
  );
}
