export function WhatsAppButton() {
  const phoneNumber = "5492267468985";
  const message = "Hola! Tengo una consulta teorica sobre conduccion.";
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      <div className="pointer-events-none absolute bottom-full right-0 mb-2 whitespace-nowrap rounded-lg bg-slate-900 px-3 py-2 text-sm text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="font-semibold">WhatsApp GMC</div>
        <div className="text-xs text-slate-300">
          Abrir conversacion por WhatsApp
        </div>
        <div className="absolute right-6 top-full -mt-1 h-2 w-2 rotate-45 bg-slate-900" />
      </div>

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_18px_36px_-18px_rgba(37,211,102,0.85)] transition-all duration-200 hover:scale-105 hover:bg-[#1ebe5d]"
        aria-label="Abrir WhatsApp GMC"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-8 w-8"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M19.05 4.94A9.8 9.8 0 0 0 12.09 2c-5.43 0-9.84 4.4-9.84 9.83 0 1.74.46 3.45 1.33 4.95L2 22l5.37-1.4a9.8 9.8 0 0 0 4.71 1.2h.01c5.42 0 9.83-4.41 9.83-9.84a9.76 9.76 0 0 0-2.87-7.02ZM12.09 20.14h-.01a8.16 8.16 0 0 1-4.16-1.14l-.3-.18-3.19.83.85-3.11-.2-.32a8.17 8.17 0 0 1 1.26-10.09 8.13 8.13 0 0 1 5.79-2.4c4.52 0 8.18 3.67 8.19 8.18a8.18 8.18 0 0 1-8.23 8.23Zm4.48-6.11c-.24-.12-1.4-.69-1.62-.77-.22-.08-.38-.12-.54.12-.16.24-.62.77-.76.93-.14.16-.28.18-.52.06-.24-.12-1-.37-1.91-1.18-.71-.63-1.19-1.41-1.33-1.65-.14-.24-.01-.37.11-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.48-.4-.41-.54-.42h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.31.98 2.47c.12.16 1.68 2.57 4.08 3.61.57.25 1.02.4 1.37.51.58.18 1.1.15 1.52.09.46-.07 1.4-.57 1.6-1.12.2-.55.2-1.02.14-1.12-.06-.1-.22-.16-.46-.28Z" />
        </svg>
      </a>
    </div>
  );
}
