using Microsoft.EntityFrameworkCore;
using Uno.Server.Actors;
using Uno.Server.Persistence;
using Uno.Server.Rooms;
using Uno.Server.Sessions;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddSingleton<GameRegistry>();
builder.Services.AddSingleton<ConnectionRegistry>();
builder.Services.AddSingleton<DisconnectMonitor>();
builder.Services.AddHealthChecks();
builder.Services.AddSignalR()
    .AddJsonProtocol(o => o.PayloadSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase);
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins("http://localhost:3000").AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

if (builder.Environment.IsDevelopment())
{
    var connectionString = builder.Configuration.GetConnectionString("Default")
        ?? throw new InvalidOperationException("Connection string 'Default' not found.");
    builder.Services.AddDbContext<UnoDbContext>(options =>
        options.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0, 0))));
    builder.Services.AddScoped<MatchHistoryWriter>();
}

var app = builder.Build();
app.UseCors();
app.MapHealthChecks("/health");
app.MapHub<Uno.Server.Hub.GameHub>("/hub/game");
app.Run();

public partial class Program { }
