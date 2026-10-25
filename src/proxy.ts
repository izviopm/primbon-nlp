import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the Supabase session cookie and sends logged-out visitors to /login.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const isLogin = request.nextUrl.pathname.startsWith("/login");
  // getUser() in lib/auth.ts sends a stale session (user deleted) here: clear it instead of bouncing back to /.
  if (isLogin && request.nextUrl.searchParams.has("keluar")) {
    await supabase.auth.signOut({ scope: "local" });
    return response;
  }
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims && !isLogin) {
    // API callers (the chat) need a status code, not an HTML login page.
    if (request.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "Silakan masuk dulu." }, { status: 401 });
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (data?.claims && isLogin) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)"],
};
