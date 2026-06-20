import * as signalR from "@microsoft/signalr";
import type {
  RuleSetDto,
  RoomDto,
  CreateRoomResult,
  JoinRoomResult,
  ClientGameStateDto,
  GameEventBatchDto,
  CommandDto,
} from "./contract";

const HUB_URL = process.env.NEXT_PUBLIC_HUB_URL ?? "http://localhost:5180/hub/game";

export type HubHandlers = {
  onRoomUpdated: (room: RoomDto) => void;
  onGameStateUpdated: (state: ClientGameStateDto) => void;
  onGameEvents: (batch: GameEventBatchDto) => void;
  onError: (message: string) => void;
};

export class GameHubClient {
  private connection: signalR.HubConnection;

  constructor(connection?: signalR.HubConnection) {
    this.connection =
      connection ??
      new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL)
        .withAutomaticReconnect()
        .build();
  }

  registerHandlers(h: HubHandlers) {
    this.connection.on("RoomUpdated", h.onRoomUpdated);
    this.connection.on("GameStateUpdated", h.onGameStateUpdated);
    this.connection.on("GameEvents", h.onGameEvents);
    this.connection.on("Error", h.onError);
  }

  async start() {
    if (this.connection.state === signalR.HubConnectionState.Disconnected)
      await this.connection.start();
  }

  async stop() {
    await this.connection.stop();
  }

  createRoom(rules: RuleSetDto, displayName: string, playerId: string) {
    return this.connection.invoke<CreateRoomResult>(
      "CreateRoom",
      rules,
      displayName,
      playerId,
    );
  }

  joinRoom(code: string, displayName: string, playerId: string) {
    return this.connection.invoke<JoinRoomResult>(
      "JoinRoom",
      code,
      displayName,
      playerId,
    );
  }

  addBot(code: string) {
    return this.connection.invoke("AddBot", code);
  }

  startGame(code: string) {
    return this.connection.invoke("StartGame", code);
  }

  sendCommand(code: string, command: CommandDto, lastSeenVersion: number) {
    return this.connection.invoke(
      "SendCommand",
      code,
      command,
      lastSeenVersion,
    );
  }

  reconnect(code: string, playerId: string, displayName: string) {
    return this.connection.invoke("Reconnect", code, playerId, displayName);
  }

  leaveRoom(code: string) {
    return this.connection.invoke("LeaveRoom", code);
  }
}
