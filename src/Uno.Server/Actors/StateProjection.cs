using Uno.Engine.State;
using Uno.Server.Contracts;

namespace Uno.Server.Actors;

public static class StateProjection
{
    public static ClientGameStateDto Project(string roomCode, GameState state, string viewerId)
    {
        var players = state.Players.Select(p => new ClientPlayerDto(
            p.Id,
            p.Name,
            p.Id == viewerId ? p.Hand.Select(DtoMappers.ToDto).ToList() : null,
            p.Hand.Count,
            p.HasCalledUno,
            p.Connected,
            p.IsBot,
            p.Score)).ToList();

        var visibleDiscard = state.DiscardPile.TakeLast(5).Select(DtoMappers.ToDto).ToList();

        return new ClientGameStateDto(
            roomCode,
            viewerId,
            DtoMappers.ToDto(state.Rules),
            players,
            DtoMappers.ToDto(state.TopCard),
            visibleDiscard,
            state.ActiveColor.ToString(),
            state.CurrentPlayerIndex,
            state.Direction,
            state.PendingDraw,
            state.Phase.ToString(),
            state.Version,
            state.DrawPile.Count(),
            state.PendingWildPlayerId,
            state.Challenge is not null);
    }
}
