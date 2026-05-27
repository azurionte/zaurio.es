# Demo Building Tools Desktop

This is the desktop wrapper for Demo Building Tools.

## For the person using the app

Send them this file after a build:

```text
dist/DemoBuildingToolsSetup-<version>.exe
```

They only need to double-click it. It installs for their Windows user inside `%LocalAppData%`, so it does not need admin rights.

## For building a new version

1. Update `version` in `package.json`.
2. To sign the Windows installer, set these environment variables before building:

```powershell
$env:CSC_LINK="C:\secure-path\demo-building-tools-code-signing.pfx"
$env:CSC_KEY_PASSWORD="your-certificate-password"
```

Use an OV or EV code-signing certificate from a trusted certificate authority. A self-signed certificate does not remove Windows SmartScreen warnings on other PCs.
On Windows, the build user also needs permission to create symbolic links because Electron Builder extracts its signing tools with symlinks. Enabling Windows Developer Mode is usually enough.

3. Run:

```bash
npm install
npm run build
```

For local testing without signing, run `npm run build:unsigned`.

4. Open `https://zaurio.es/admin`, go to `Payslip updates`, and upload these files from `dist`:

```text
latest.yml
DemoBuildingToolsSetup-<version>.exe
DemoBuildingToolsSetup-<version>.exe.blockmap
```

The installed app checks `https://zaurio.es/payslip-updates/latest.yml` on startup and downloads updates from there.
