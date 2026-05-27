# Payslip Creator Desktop

This is the desktop wrapper for the Zaurio payslip converter.

## For the person using the app

Send them this file after a build:

```text
dist/Payslip Creator Setup <version>.exe
```

They only need to double-click it. It installs for their Windows user inside `%LocalAppData%`, so it does not need admin rights.

## For building a new version

1. Update `version` in `package.json`.
2. Run:

```bash
npm install
npm run build
```

3. Open `https://zaurio.es/admin`, go to `Payslip updates`, and upload these files from `dist`:

```text
latest.yml
Payslip Creator Setup <version>.exe
Payslip Creator Setup <version>.exe.blockmap
```

The installed app checks `https://zaurio.es/payslip-updates/latest.yml` on startup and downloads updates from there.
