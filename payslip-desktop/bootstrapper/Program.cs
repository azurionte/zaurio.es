using System;
using System.Diagnostics;
using System.IO;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text.RegularExpressions;

const string feed = "https://zaurio.es/payslip-updates/latest.yml";
const string origin = "https://zaurio.es/payslip-updates/";
using var client = new HttpClient { Timeout = TimeSpan.FromMinutes(15) };
client.DefaultRequestHeaders.UserAgent.ParseAdd("DBT-Bootstrapper/1.0");
try
{
    Console.WriteLine("Demo Building Tools - latest version installer");
    Console.WriteLine("Checking release manifest...");
    var manifest = await client.GetStringAsync(feed);
    // electron-builder's generic provider writes path and sha512 fields to latest.yml.
    var match = Regex.Match(manifest, @"(?m)^path:\s*['""]?(DemoBuildingToolsSetup-[0-9A-Za-z._-]+\.exe)['""]?\s*$");
    var hash = Regex.Match(manifest, @"(?m)^sha512:\s*['""]?([A-Za-z0-9+/=]+)['""]?\s*$");
    if (!match.Success || !hash.Success) throw new InvalidDataException("Invalid release manifest.");
    var fileName = match.Groups[1].Value;
    var expected = Convert.FromBase64String(hash.Groups[1].Value);
    if (expected.Length != 64) throw new InvalidDataException("Invalid SHA-512 digest.");
    var temp = Path.Combine(Path.GetTempPath(), "DBT-Installer-" + Guid.NewGuid().ToString("N"));
    Directory.CreateDirectory(temp);
    var destination = Path.Combine(temp, fileName);
    try
    {
        Console.WriteLine("Downloading " + fileName + "...");
        using (var response = await client.GetAsync(origin + Uri.EscapeDataString(fileName), HttpCompletionOption.ResponseHeadersRead))
        {
            response.EnsureSuccessStatusCode();
            await using var input = await response.Content.ReadAsStreamAsync();
            await using var output = File.Create(destination);
            await input.CopyToAsync(output);
        }
        Console.WriteLine("Verifying package integrity...");
        await using (var stream = File.OpenRead(destination))
        {
            var actual = await SHA512.HashDataAsync(stream);
            if (!CryptographicOperations.FixedTimeEquals(actual, expected))
                throw new InvalidDataException("Installer checksum mismatch. Installation cancelled.");
        }
        Console.WriteLine("Starting installation...");
        using var process = Process.Start(new ProcessStartInfo(destination) { UseShellExecute = true })
            ?? throw new InvalidOperationException("Could not start installer.");
        await process.WaitForExitAsync();
        if (process.ExitCode != 0) throw new InvalidOperationException("Installer returned code " + process.ExitCode);
        Console.WriteLine("Installation completed.");
    }
    finally
    {
        try { Directory.Delete(temp, recursive: true); } catch (IOException) { }
        catch (UnauthorizedAccessException) { }
    }
}
catch (Exception ex)
{
    Console.Error.WriteLine("DBT installation failed: " + ex.Message);
    Console.Error.WriteLine("Press Enter to close.");
    Console.ReadLine();
    Environment.ExitCode = 1;
}
