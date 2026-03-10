import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
          borderRadius: 40,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
        }}
      >
        {/* Antenna */}
        <div
          style={{
            width: 10,
            height: 28,
            background: "#22d3ee",
            borderRadius: 5,
            marginBottom: 4,
          }}
        />
        {/* Robot head */}
        <div
          style={{
            width: 110,
            height: 75,
            background: "#0f172a",
            border: "4px solid #334155",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 20,
          }}
        >
          {/* Left eye */}
          <div
            style={{
              width: 22,
              height: 22,
              background: "#22d3ee",
              borderRadius: 5,
              boxShadow: "0 0 12px #22d3ee",
            }}
          />
          {/* Right eye */}
          <div
            style={{
              width: 22,
              height: 22,
              background: "#22d3ee",
              borderRadius: 5,
              boxShadow: "0 0 12px #22d3ee",
            }}
          />
        </div>
        {/* Neck */}
        <div
          style={{
            width: 44,
            height: 12,
            background: "#334155",
            borderRadius: 6,
            marginTop: 4,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
