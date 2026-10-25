import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Logo } from "@/components/jawa";
import { NavLinks } from "@/components/nav-links";
import { focus } from "@/components/ui";
import { getUser } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

const navLink = `inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-colors duration-150 ease-out hover:bg-muted hover:text-foreground cursor-pointer ${focus}`;

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="relative z-20 overflow-hidden border-b bg-card/90 backdrop-blur">
        <div aria-hidden="true" className="pattern-kawung absolute inset-0 text-gold-text" />
        <div className="relative mx-auto flex h-14 max-w-6xl items-center gap-2 px-4 sm:gap-4">
          <Logo />
          <nav aria-label="Menu utama" className="ml-auto flex items-center gap-1 sm:ml-4 sm:flex-1">
            <NavLinks isAdmin={user.isAdmin} />
          </nav>
          <div className="flex items-center gap-1">
            <Link href="/akun" className={`${navLink} pl-1.5`} aria-label={`Profil saya (${user.isGuest ? "Tamu" : (user.name ?? user.email)})`}>
              <span aria-hidden="true">
                <Avatar path={user.avatarPath} gender={user.gender} size="sm" />
              </span>
              <span aria-hidden="true" className="hidden max-w-40 truncate lg:inline">
                {user.isGuest ? "Tamu" : (user.name ?? user.email)}
              </span>
            </Link>
            <SignOutButton className={navLink} isGuest={user.isGuest} />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
