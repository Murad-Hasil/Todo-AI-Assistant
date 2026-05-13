import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const TECH = ["Next.js", "FastAPI", "Kubernetes", "Kafka", "Dapr"];

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#0f172a",
          display: "flex",
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Right-side glow bleed */}
        <div
          style={{
            position: "absolute",
            right: -60,
            top: 0,
            width: 620,
            height: 630,
            background:
              "radial-gradient(ellipse at 75% 50%, rgba(30,27,75,0.9) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* Cyan halo behind robot */}
        <div
          style={{
            position: "absolute",
            right: 160,
            top: 90,
            width: 400,
            height: 400,
            background:
              "radial-gradient(circle, rgba(34,211,238,0.07) 0%, transparent 65%)",
            borderRadius: "50%",
            display: "flex",
          }}
        />

        {/* ── LEFT CONTENT ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "0 0 0 80px",
            width: 660,
            height: 630,
            position: "relative",
          }}
        >
          {/* Badge */}
          <div
            style={{
              display: "flex",
              marginBottom: 28,
            }}
          >
            <div
              style={{
                padding: "7px 16px",
                border: "1px solid rgba(34,211,238,0.45)",
                borderRadius: 20,
                color: "#22d3ee",
                fontSize: 13,
                letterSpacing: "0.12em",
                fontWeight: 700,
                display: "flex",
              }}
            >
              ⚡ ENTERPRISE AI PLATFORM
            </div>
          </div>

          {/* Headline */}
          <div
            style={{
              fontSize: 74,
              fontWeight: 800,
              color: "#f8fafc",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              display: "flex",
            }}
          >
            The Architecture
          </div>
          <div
            style={{
              fontSize: 74,
              fontWeight: 800,
              color: "#22d3ee",
              lineHeight: 1.05,
              letterSpacing: "-0.025em",
              marginBottom: 28,
              display: "flex",
            }}
          >
            of Intelligence
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 20,
              color: "#94a3b8",
              marginBottom: 44,
              letterSpacing: "0.03em",
              display: "flex",
            }}
          >
            Event-Driven · Cloud Native · AI-Powered
          </div>

          {/* Tech badges */}
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {TECH.map((t) => (
              <div
                key={t}
                style={{
                  padding: "7px 15px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.11)",
                  borderRadius: 7,
                  color: "#cbd5e1",
                  fontSize: 14,
                  fontWeight: 500,
                  display: "flex",
                }}
              >
                {t}
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT: ROBOT VISUALIZATION ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            position: "relative",
          }}
        >
          {/* Outer ring */}
          <div
            style={{
              position: "absolute",
              width: 360,
              height: 360,
              border: "1px solid rgba(34,211,238,0.09)",
              borderRadius: "50%",
              display: "flex",
            }}
          />
          {/* Middle ring */}
          <div
            style={{
              position: "absolute",
              width: 260,
              height: 260,
              border: "1px solid rgba(34,211,238,0.14)",
              borderRadius: "50%",
              display: "flex",
            }}
          />
          {/* Inner ring */}
          <div
            style={{
              position: "absolute",
              width: 170,
              height: 170,
              border: "1px solid rgba(34,211,238,0.22)",
              borderRadius: "50%",
              display: "flex",
            }}
          />

          {/* Robot */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
              position: "relative",
            }}
          >
            {/* Antenna */}
            <div
              style={{
                width: 8,
                height: 30,
                background: "#22d3ee",
                borderRadius: 4,
                marginBottom: 4,
                display: "flex",
              }}
            />
            {/* Head */}
            <div
              style={{
                width: 100,
                height: 72,
                background: "#0f172a",
                border: "3px solid #334155",
                borderRadius: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  background: "#22d3ee",
                  borderRadius: 5,
                  display: "flex",
                }}
              />
              <div
                style={{
                  width: 20,
                  height: 20,
                  background: "#22d3ee",
                  borderRadius: 5,
                  display: "flex",
                }}
              />
            </div>
            {/* Neck */}
            <div
              style={{
                width: 36,
                height: 10,
                background: "#334155",
                borderRadius: 5,
                display: "flex",
              }}
            />
          </div>

          {/* Floating nodes */}
          <div
            style={{
              position: "absolute",
              top: 62,
              right: 38,
              width: 11,
              height: 11,
              background: "#22d3ee",
              borderRadius: "50%",
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 58,
              left: 28,
              width: 9,
              height: 9,
              background: "#818cf8",
              borderRadius: "50%",
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 88,
              left: 52,
              width: 6,
              height: 6,
              background: "#22d3ee",
              borderRadius: "50%",
              opacity: 0.55,
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: 90,
              right: 55,
              width: 8,
              height: 8,
              background: "#818cf8",
              borderRadius: "50%",
              opacity: 0.65,
              display: "flex",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: 160,
              right: 15,
              width: 6,
              height: 6,
              background: "#22d3ee",
              borderRadius: "50%",
              opacity: 0.4,
              display: "flex",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
