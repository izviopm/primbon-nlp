import { getUser } from "@/lib/auth";
import { Chat } from "./chat";

export default async function TanyaPage() {
  const user = await getUser();
  const nama = user.isGuest ? "Tamu" : (user.name?.split(" ")[0] ?? "Sedulur");
  return (
    <main className="flex flex-1 flex-col">
      <Chat nama={nama} isGuest={user.isGuest} />
    </main>
  );
}
