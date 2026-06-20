import type { RoomPlayerDto } from "@/lib/hub/contract";
import styles from "./PlayerList.module.css";

type PlayerListProps = {
  players: RoomPlayerDto[];
  hostId: string;
};

function avatarInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

export function PlayerList({ players, hostId }: PlayerListProps) {
  return (
    <ul className={styles.list} aria-label="Players in room">
      {players.map((player) => {
        const isHost = player.id === hostId;
        return (
          <li key={player.id} className={styles.row}>
            <span className={styles.avatar} aria-hidden>
              {avatarInitial(player.name)}
            </span>
            <span className={styles.name}>{player.name}</span>
            <span className={styles.badges}>
              {player.isBot && <span className={styles.botBadge}>Bot</span>}
              {isHost && (
                <span className={styles.hostCrown} title="Host" aria-label="Host">
                  ♔
                </span>
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
