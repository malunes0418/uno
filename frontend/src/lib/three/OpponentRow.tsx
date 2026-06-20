import { Html } from "@react-three/drei";
import { CardMesh } from "./CardMesh";
import type { ClientPlayerDto } from "@/lib/hub/contract";
import { seatPosition } from "./playerSeat";

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

        return (
          <group key={p.id} position={[x, 0.05, z]} rotation={[-0.4, yaw, 0]}>
            <CardMesh color="Red" type="Zero" faceUp={false} />
            <Html
              center
              distanceFactor={8}
              style={{ pointerEvents: "none" }}
              position={[0, 0.55, 0]}
            >
              <div
                style={{
                  background: "#111",
                  color: "#fff",
                  borderRadius: "50%",
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: "bold",
                }}
              >
                {p.handCount}
              </div>
            </Html>
          </group>
        );
      })}
    </>
  );
}
