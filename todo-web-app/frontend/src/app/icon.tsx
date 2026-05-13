import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)",
          borderRadius: 7,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        {/* Antenna */}
        <div
          style={{
            width: 2,
            height: 5,
            background: "#22d3ee",
            borderRadius: 2,
            marginBottom: 1,
          }}
        />
        {/* Robot head */}
        <div
          style={{
            width: 20,
            height: 13,
            background: "#0f172a",
            border: "1.5px solid #334155",
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 4,
          }}
        >
          {/* Left eye */}
          <div
            style={{
              width: 4,
              height: 4,
              background: "#22d3ee",
              borderRadius: 1,
            }}
          />
          {/* Right eye */}
          <div
            style={{
              width: 4,
              height: 4,
              background: "#22d3ee",
              borderRadius: 1,
            }}
          />
        </div>
        {/* Neck */}
        <div
          style={{
            width: 8,
            height: 2,
            background: "#334155",
            borderRadius: 1,
            marginTop: 1,
          }}
        />
      </div>
    ),
    { ...size }
  );
}
