using Uno.Server.Rooms;
using Uno.Server.Sessions;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<GameRegistry>();
builder.Services.AddSingleton<ConnectionRegistry>();
builder.Services.AddHealthChecks();
builder.Services.AddSignalR()
    .AddJsonProtocol(o => o.PayloadSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase);
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins("http://localhost:3000").AllowAnyHeader().AllowAnyMethod().AllowCredentials()));
var app = builder.Build();
app.UseCors();
app.MapHealthChecks("/health");
app.MapHub<Uno.Server.Hub.GameHub>("/hub/game");
app.Run();

public partial class Program { }
