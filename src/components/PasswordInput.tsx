"use client";

import { useState } from "react";

type Props = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

export default function PasswordInput({ className, ...props }: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`${className ?? ""} pr-10`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        tabIndex={-1}
        className="absolute right-0 top-0 h-full px-3 flex items-center text-[var(--text-faint)] hover:text-[var(--text-muted)]"
      >
        {visible ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-10-8-10-8a18.6 18.6 0 0 1 4.06-5.94M9.9 4.24A10.4 10.4 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M1 1l22 22" strokeLinecap="round" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <path d="M1 12s3-8 11-8 11 8 11 8-3 8-11 8-11-8-11-8Z" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}
