import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const REMOTE_API_BASE = "https://boutique.multimedia-services.fr";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slot: string }> }
) {
  try {
    const { slot } = await context.params;

    const remoteUrl = `${REMOTE_API_BASE}/api/display-messages/${encodeURIComponent(
      slot
    )}`;

    const res = await fetch(remoteUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    });

    console.log(`Proxying request for slot "${slot}" to remote URL: ${remoteUrl}`);
    console.log('Remote response', res.status);

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: `Remote HTTP ${res.status}`,
          data: [],
        },
        { status: res.status }
      );
    }

    const json = await res.json();

    return NextResponse.json(json, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? "Proxy error",
        data: [],
      },
      { status: 500 }
    );
  }
}