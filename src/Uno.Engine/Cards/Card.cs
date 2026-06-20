namespace Uno.Engine.Cards;

public record Card(Color Color, CardType Type)
{
    public bool IsWild => Type is CardType.Wild or CardType.WildDrawFour;
    public bool IsAction => Type is CardType.Skip or CardType.Reverse or CardType.DrawTwo;
    public bool IsNumber => Type <= CardType.Nine;

    public int ScoreValue => Type switch
    {
        CardType.Wild or CardType.WildDrawFour => 50,
        CardType.Skip or CardType.Reverse or CardType.DrawTwo => 20,
        _ => (int)Type // Zero..Nine map to 0..9
    };
}
