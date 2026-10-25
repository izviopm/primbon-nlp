import type { Metadata } from "next";
import { KeyRound, Lock, UserRound } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Reveal } from "@/components/motion";
import { Card, PageTitle, SectionTitle } from "@/components/ui";
import { getUser } from "@/lib/auth";
import { PasswordForm } from "./password-form";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Profil saya" };

export default async function ProfilePage() {
  const { email, name, gender, avatarPath, isGuest } = await getUser();
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-8">
      <Reveal className="flex flex-col gap-6">
        <PageTitle sub="Nama dan fotomu tampil di header aplikasi.">Profil saya</PageTitle>
        {isGuest ? (
          <Card className="flex flex-col items-center gap-4 text-center">
            <Avatar gender={null} size="lg" />
            <div className="flex flex-col gap-1">
              <p className="font-serif text-xl font-semibold">Tamu</p>
              <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                <Lock aria-hidden="true" className="size-4" /> Akun tamu dipakai bersama, jadi profil dan password tidak bisa diubah.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">Ingin akun sendiri dengan kuota AI lebih besar? Minta admin membuatkannya.</p>
          </Card>
        ) : (
          <>
            <Card>
              <SectionTitle icon={UserRound}>Profil</SectionTitle>
              <ProfileForm name={name} gender={gender} email={email} avatarPath={avatarPath} />
            </Card>
            <Card>
              <SectionTitle icon={KeyRound}>Ganti password</SectionTitle>
              <PasswordForm />
            </Card>
          </>
        )}
      </Reveal>
    </main>
  );
}
