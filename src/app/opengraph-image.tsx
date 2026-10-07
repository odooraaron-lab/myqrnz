import { ImageResponse } from "next/og";
import { site } from "@/config/site";
import { OG_SIZE, ogFonts } from "@/lib/og";
import { qrSvg } from "@/lib/qr";

export const alt = "myQR — online store and QR code for market stalls and small shops";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  const qr = qrSvg(`${site.url}/?qr`, { fg: "#191c3a", margin: 1 });
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: "#f3f4f0", padding: 72, fontFamily: "Archivo" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, paddingRight: 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 40, color: "#191c3a" }}>
            <div style={{ display: "flex", width: 34, height: 34, border: "6px solid #2546f0", padding: 6 }}>
              <div style={{ width: "100%", height: "100%", background: "#2546f0" }} />
            </div>
            <span style={{ fontWeight: 500 }}>my</span>
            <span style={{ fontWeight: 800, marginLeft: -12 }}>QR</span>
          </div>
          <div style={{ display: "flex", fontSize: 70, fontWeight: 800, lineHeight: 1.02, color: "#191c3a", letterSpacing: -2 }}>
            Your market stall, open online all week.
          </div>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 500, color: "#525774" }}>
            One setup fee. No monthly fees. Made in New Zealand.
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 380,
            background: "#ffffff",
            border: "3px solid #191c3a",
            padding: 30,
            transform: "rotate(-1.5deg)",
          }}
        >
          <div style={{ fontSize: 22, color: "#525774", fontWeight: 500 }}>Scan to shop online</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: "#191c3a", marginTop: 6 }}>Your shop</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/svg+xml;utf8,${encodeURIComponent(qr)}`}
            width={316}
            height={316}
            style={{ marginTop: 18 }}
            alt=""
          />
          <div style={{ fontSize: 22, fontWeight: 800, color: "#191c3a", marginTop: 14, alignSelf: "center" }}>
            {`yourname.${site.rootDomain.split(":")[0]}`}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}
