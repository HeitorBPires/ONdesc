import { createServerClient } from "@supabase/ssr";
import type { CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseEnv, hasSupabaseEnv } from "./env";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

const PUBLIC_PATHS = new Set(["/login"]);

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.has(pathname);
}

export async function updateSession(request: NextRequest) {
  // APIs já validam sessão internamente via requireUser.
  // Evita autenticação duplicada e reduz custo por request.
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next({ request });
  }

  if (!hasSupabaseEnv()) {
    return NextResponse.next({ request });
  }

  const { supabaseUrl, supabaseAnonKey } = getSupabaseEnv();

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );

        response = NextResponse.next({
          request,
        });

        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const publicPath = isPublicPath(pathname);
  const isApiPath = pathname.startsWith("/api/");

  if (!user && !publicPath) {
    if (isApiPath) {
      return NextResponse.json(
        { error: "Não autorizado. Faça login para acessar este recurso." },
        { status: 401 },
      );
    }

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    const nextPath = request.nextUrl.searchParams.get("next");
    url.pathname = nextPath && nextPath.startsWith("/") ? nextPath : "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}
