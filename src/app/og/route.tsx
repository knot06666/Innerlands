import { ImageResponse } from "next/og";

export const runtime = "edge";

const imageSize = {
  width: 1200,
  height: 630
};

const fontWeights = [500, 700] as const;

export async function GET(request: Request) {
  const backgroundUrl = new URL("/nature/mist-forest.png", request.url).toString();
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
          backgroundImage: `linear-gradient(90deg, rgba(11, 25, 31, 0.88), rgba(11, 25, 31, 0.52)), url(${backgroundUrl})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
          color: "white",
          display: "flex",
          fontFamily: '"Noto Sans Thai", sans-serif',
          height: "100%",
          padding: 72,
          width: "100%"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 26, width: 760 }}>
          <div style={{ color: "rgba(255,255,255,0.68)", fontSize: 34, fontWeight: 500 }}>เว็บเดินทางผ่านธรรมชาติของใจ</div>
          <div style={{ fontSize: 92, fontWeight: 700, lineHeight: 1.06 }}>โลกข้างใน</div>
          <div style={{ color: "rgba(255,255,255,0.82)", fontSize: 38, fontWeight: 500, lineHeight: 1.45 }}>
            ค้นพบว่าโลกภายในของคุณคล้ายภูมิประเทศแบบไหน
          </div>
          <div
            style={{
              border: "2px solid rgba(255,255,255,0.24)",
              borderRadius: 999,
              color: "rgba(255,255,255,0.82)",
              display: "flex",
              fontSize: 28,
              fontWeight: 500,
              padding: "14px 26px",
              alignSelf: "flex-start"
            }}
          >
            5 คำถามสั้น ๆ เพื่อสะท้อนใจ
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
