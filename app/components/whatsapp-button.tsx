export function WhatsAppButton() {
  const phoneNumber = "5492267468985";
  const message = "Hola! Tengo una consulta teorica sobre conduccion.";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      <div className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-sm text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="font-semibold">🤖 Chatbot Educativo</div>
        <div className="text-xs text-gray-300">
          Consultas teoricas de conduccion
        </div>
        <div className="absolute right-6 top-full -mt-1 h-2 w-2 rotate-45 bg-gray-900" />
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:bg-green-600 hover:shadow-xl"
        aria-label="Chatbot educativo - Consultas teoricas de conduccion"
      >
        <svg
          viewBox="0 0 24 24"
          className="relative z-10 h-8 w-8 transition-transform group-hover:animate-bounce"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="5" y="7" width="14" height="10" rx="2" />
          <line x1="12" y1="7" x2="12" y2="4" />
          <circle cx="12" cy="4" r="1" fill="currentColor" />
          <circle cx="9" cy="11" r="1" fill="currentColor" />
          <circle cx="15" cy="11" r="1" fill="currentColor" />
          <line x1="9" y1="14" x2="15" y2="14" />
          <rect x="7" y="17" width="10" height="4" rx="1" />
        </svg>

        <span
          className="pointer-events-none absolute inset-0 rounded-full bg-green-400 opacity-75 animate-ping"
          aria-hidden="true"
        />
      </a>
    </div>
  );
}
