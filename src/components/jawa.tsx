"use client";

import Link from "next/link";
import { motion } from "motion/react";

// Javanese ornaments (UI_RULES 6). Decorative only: always aria-hidden.

/** "primbon" in aksara Jawa. */
export const AKSARA_PRIMBON = "ꦥꦿꦶꦩ꧀ꦧꦺꦴꦤ꧀";

export function Aksara({ children, className = "" }: { children: string; className?: string }) {
  return (
    <span aria-hidden="true" lang="jv-Java" className={`font-jawa ${className}`}>
      {children}
    </span>
  );
}

/** Simplified wayang gunungan (kayon). `berpikir` sways it gently while Mbah is working. */
export function Gunungan({ className = "size-10", berpikir = false }: { className?: string; berpikir?: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 48 64"
      aria-hidden="true"
      className={className}
      style={{ originY: 1 }}
      animate={berpikir ? { rotate: [-5, 5, -5] } : { rotate: 0 }}
      transition={berpikir ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
    >
      <path d="M24 2C34 14 45 29 45 44c0 11-9 18-21 18S3 55 3 44C3 29 14 14 24 2z" className="fill-gold" />
      <path d="M24 6C32 17 41 30 41 44c0 9-7 14-17 14S7 53 7 44C7 30 16 17 24 6z" className="fill-gold-soft" />
      <g className="stroke-primary" strokeWidth="1.6" strokeLinecap="round" fill="none">
        <path d="M24 50V14" />
        <path d="M24 22l-7-5M24 22l7-5M24 30l-10-6M24 30l10-6M24 38l-12-6M24 38l12-6" />
      </g>
      <path d="M17 62V51a7 7 0 0 1 14 0v11z" className="fill-primary" />
      <path d="M21 62v-9a3 3 0 0 1 6 0v9z" className="fill-gold" />
    </motion.svg>
  );
}

export function Logo({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <Gunungan className={size === "lg" ? "h-14 w-11" : "h-10 w-8"} />
      <span className="sr-only min-[400px]:hidden">Primbon NLP</span>
      <span className={`flex-col leading-tight ${size === "lg" ? "flex" : "hidden min-[400px]:flex"}`}>
        <span className={`font-serif font-bold text-primary ${size === "lg" ? "text-2xl" : "text-lg"}`}>Primbon NLP</span>
        <Aksara className="text-xs text-gold-text">{AKSARA_PRIMBON}</Aksara>
      </span>
    </Link>
  );
}
