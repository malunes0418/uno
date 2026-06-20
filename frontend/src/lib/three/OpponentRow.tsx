import { Html } from "@react-three/drei";
import { CardMesh } from "./CardMesh";
import type { ClientPlayerDto } from "@/lib/hub/contract";
import { seatPosition } from "./playerSeat";

function opponentFanLayers(handCount: number): number {
  if (handCount <= 0) return 0;
  return Math.min(5, Math.max(3, handCount));
}

export function OpponentRow({
  players,
  viewerId,
}: {
  players: ClientPlayerDto[];
  viewerId: string;
}) {
  const viewerIndex = players.findIndex((p) => p.id === viewerId);
  const total = players.length;

  return (
    <>
      {players.map((p, i) => {
        if (p.id === viewerId) return null;
        const [x, , z] = seatPosition(viewerIndex >= 0 ? viewerIndex : 0, i, total);
        const yaw = Math.atan2(-x, -z);
        const layers = opponentFanLayers(p.handCount);
        const spread = 0.14;
        const start = -((layers - 1) * spread) / 2;

        return (
          <group key={p.id} position={[x, 0.05, z]} rotation={[-0.4, yaw, 0]}>
            {Array.from({ length: layers }, (_, j) => (
              <group
                key={j}
                position={[start + j * spread, j * 0.002, -j * 0.025]}
                rotation={[0, 0, (j - (layers - 1) / 2) * 0.07]}
              >
                <CardMesh color="Red" type="Zero" faceUp={false} />
              </group>
            ))}
            <Html
              center
              distanceFactor={8}
              style={{ pointerEvents: "none" }}
              position={[0, 0.55, 0]}
            >
              <div
                style={{
                  background: "rgba(12, 18, 28, 0.88)",
                  color: "#f5f7fa",
                  padding: "4px 10px",
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  textAlign: "center",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.45)",
                  lineHeight: 1.3,
                }}
              >
                <div>{p.name}</div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    opacity: 0.75,
                    marginTop: 1,
                  }}
                >
                  {p.handCount} {p.handCount === 1 ? "card" : "cards"}
                </div>
              </div>
            </Html>
          </group>
        );
      })}
    </>
  );
}
