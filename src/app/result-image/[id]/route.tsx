import { ImageResponse } from "next/og";
import { results } from "@/data/quiz";
import type { NatureWorldId } from "@/types/quiz";

export const runtime = "edge";

const imageSize = {
  width: 1080,
  height: 1920
};

const fontWeights = [400, 500, 600, 700] as const;

export async function GET(request: Request, { params }: { params: { id: string } }) {
  if (!isNatureWorldId(params.id)) {
    return new Response("Not found", { status: 404 });
  }

  const result = results[params.id];
  const backgroundUrl = new URL(result.imageUrl, request.url).toString();
  const fonts = await Promise.all(
    fontWeights.map(async (weight) => ({
      data: await fetch(new URL(`/fonts/noto-sans-thai-${weight}.ttf`, request.url)).then((response) => response.arrayBuffer()),
      name: "Noto Sans Thai",
      style: "normal" as const,
      weight
    }))
  );

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          backgroundImage: `linear-gradient(180deg, rgba(11, 25, 31, 0.44), rgba(11, 25, 31, 0.72) 58%, rgba(11, 25, 31, 0.94)), url(${backgroundUrl})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          color: "white",
          display: "flex",
          fontFamily: '"Noto Sans Thai", "Leelawadee UI", sans-serif',
          height: "100%",
          justifyContent: "center",
          padding: 74,
          width: "100%"
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.12)",
            border: "2px solid rgba(255, 255, 255, 0.22)",
            borderRadius: 34,
            display: "flex",
            flexDirection: "column",
            gap: 34,
            padding: "82px 54px",
            width: "100%"
          }}
        >
          <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 34, fontWeight: 500 }}>โลกธรรมชาติของฉัน</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 78, fontWeight: 700, lineHeight: 1.14 }}>{result.worldName}</div>
            <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 35, fontWeight: 500 }}>{result.relatedNature}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.22)", height: 2, width: "100%" }} />
          <div style={{ color: "rgba(255,255,255,0.9)", fontSize: 42, fontWeight: 600, lineHeight: 1.48 }}>{result.poster.quote}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ color: "rgba(255,255,255,0.86)", fontSize: 38, fontWeight: 600 }}>ทำไมคุณถึงได้โลกนี้</div>
            <div style={{ color: "rgba(255,255,255,0.82)", fontSize: 38, fontWeight: 400, lineHeight: 1.5 }}>{result.poster.summary}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ color: "rgba(255,255,255,0.86)", fontSize: 38, fontWeight: 600 }}>พลังของคุณ</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 18 }}>
              {result.strengths.map((strength) => (
                <div
                  key={strength}
                  style={{
                    background: "rgba(255,255,255,0.16)",
                    borderRadius: 999,
                    color: "rgba(255,255,255,0.84)",
                    fontSize: 31,
                    fontWeight: 500,
                    padding: "12px 28px"
                  }}
                >
                  {strength}
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ color: "rgba(255,255,255,0.86)", fontSize: 38, fontWeight: 600 }}>ในวันที่คุณเหนื่อย</div>
            <div style={{ color: "rgba(255,255,255,0.82)", fontSize: 38, fontWeight: 400, lineHeight: 1.5 }}>{result.poster.tiredMessage}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 26 }}>
            <div style={{ color: "rgba(255,255,255,0.72)", fontSize: 30, fontWeight: 500 }}>โลกข้างใน</div>
            <div style={{ color: "rgba(255,255,255,0.52)", fontSize: 25, fontWeight: 400 }}>
              ประสบการณ์สะท้อนใจ ไม่ใช่การประเมินทางจิตวิทยา
            </div>
            <div style={{ color: "rgba(255,255,255,0.42)", fontSize: 23, fontWeight: 400 }}>made by knotji</div>
          </div>
        </div>
      </div>
    ),
    {
      ...imageSize,
      fonts,
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    }
  );
}

function isNatureWorldId(id: string): id is NatureWorldId {
  return id in results;
}
