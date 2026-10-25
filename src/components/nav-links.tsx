"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { MessagesSquare, ShieldCheck } from "lucide-react";
import { spring } from "@/components/motion";
import { focus } from "@/components/ui";

const base = `relative inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium transition-colors duration-150 ease-out ${focus}`;

export function NavLinks({ isAdmin }: { isAdmin: boolean }) {
  const path = usePathname();
  const links = [
    { href: "/", label: "Tanya Mbah", icon: MessagesSquare, active: path === "/" },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: ShieldCheck, active: path.startsWith("/admin") }] : []),
  ];
  return (
    <>
      {links.map(({ href, label, icon: Icon, active }) => (
        <Link
          key={href}
          href={href}
          aria-current={active ? "page" : undefined}
          aria-label={label}
          className={`${base} ${active ? "text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
        >
          {/* One pill shared across links, so it slides to the active item. */}
          {active && <motion.span layoutId="nav-pill" transition={spring} className="absolute inset-0 rounded-xl bg-primary-soft" />}
          <Icon aria-hidden="true" className="relative size-5 sm:size-4" />
          <span aria-hidden="true" className="relative hidden sm:inline">
            {label}
          </span>
        </Link>
      ))}
    </>
  );
}
