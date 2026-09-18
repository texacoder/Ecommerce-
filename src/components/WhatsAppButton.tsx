"use client";

import { usePathname } from "next/navigation";

// WhatsApp Click-to-Chat deep link format: wa.me/<country code><number>, no
// "+", spaces or dashes. This number is for chat only - never render it as
// visible text anywhere on the site.
const WHATSAPP_NUMBER = "918089568674";
const DEFAULT_MESSAGE = "Hi, I have a question about my order.";

export default function WhatsAppButton() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-[#25D366] shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
    >
      <svg viewBox="0 0 32 32" className="w-8 h-8" fill="white" aria-hidden="true">
        <path d="M16.001 3.2c-7.06 0-12.8 5.74-12.8 12.8 0 2.4.66 4.65 1.8 6.58L3.2 28.8l6.42-1.75a12.74 12.74 0 0 0 6.38 1.71h.01c7.06 0 12.8-5.74 12.8-12.8s-5.74-12.76-12.8-12.76zm0 23.2h-.01a10.36 10.36 0 0 1-5.28-1.45l-.38-.22-3.93 1.07 1.05-3.83-.25-.4a10.4 10.4 0 0 1-1.6-5.57c0-5.75 4.68-10.43 10.42-10.43 2.79 0 5.4 1.09 7.37 3.06a10.34 10.34 0 0 1 3.05 7.38c0 5.75-4.68 10.39-10.44 10.39zm5.71-7.79c-.31-.16-1.85-.91-2.14-1.02-.29-.1-.5-.16-.71.16-.21.31-.81 1.02-1 1.23-.18.21-.37.23-.68.08-1.85-.93-3.06-1.66-4.28-3.76-.32-.56.32-.52.92-1.73.1-.21.05-.39-.05-.55-.1-.16-.71-1.71-.97-2.34-.26-.63-.52-.55-.71-.56-.18-.01-.39-.01-.6-.01-.21 0-.55.08-.84.39-.29.31-1.1 1.08-1.1 2.63 0 1.55 1.13 3.05 1.29 3.26.16.21 2.19 3.34 5.31 4.55 2.63 1.02 3.17.82 3.74.76.57-.05 1.85-.76 2.11-1.5.26-.73.26-1.36.18-1.5-.08-.14-.29-.21-.6-.37z" />
      </svg>
    </a>
  );
}
