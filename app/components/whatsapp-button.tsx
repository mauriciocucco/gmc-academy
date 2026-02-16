export function WhatsAppButton() {
  const phoneNumber = "5492267468985"; // +54 9 2267 46-8985
  const message = "Hola! Tengo una consulta teórica sobre conducción.";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      {/* Tooltip */}
      <div className="absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-sm text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none">
        <div className="font-semibold">🤖 Chatbot Educativo</div>
        <div className="text-xs text-gray-300">
          Consultas teóricas de conducción
        </div>
        {/* Arrow */}
        <div className="absolute top-full right-6 -mt-1 h-2 w-2 rotate-45 bg-gray-900"></div>
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-green-600 hover:shadow-xl cursor-pointer"
        aria-label="Chatbot educativo - Consultas teóricas de conducción"
      >
        <svg
          className="h-8 w-8 transition-transform group-hover:bounce"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Robot head */}
          <rect x="5" y="7" width="14" height="10" rx="2" />
          {/* Antenna */}
          <line x1="12" y1="7" x2="12" y2="4" />
          <circle cx="12" cy="4" r="1" fill="currentColor" />
          {/* Eyes */}
          <circle cx="9" cy="11" r="1" fill="currentColor" />
          <circle cx="15" cy="11" r="1" fill="currentColor" />
          {/* Mouth */}
          <line x1="9" y1="14" x2="15" y2="14" />
          {/* Body */}
          <rect x="7" y="17" width="10" height="4" rx="1" />
        </svg>

        {/* Pulse animation */}
        <span className="absolute inset-0 rounded-full bg-green-400 opacity-75 animate-ping"></span>
      </a>
    </div>
  );
}
