# Desktop installation and downloads

This project is intended for desktop and laptop computers running Windows, Linux, or macOS.

## Option A — Download from GitHub without Git

1. Open the repository: https://github.com/mostafa-frg/mostafa-frg
2. Select **Code → Download ZIP**.
3. Extract the ZIP to a folder you control.
4. Open PowerShell (Windows), Terminal (macOS), or a Linux terminal in the extracted folder.
5. Follow [DeskOps setup](README.md) or the [desktop CLI catalog](CLI-CATALOG.md).

## Option B — Clone with Git

```bash
git clone https://github.com/mostafa-frg/mostafa-frg.git
cd mostafa-frg/desktop
python -m deskops --help
```

Windows PowerShell:

```powershell
git clone https://github.com/mostafa-frg/mostafa-frg.git
Set-Location .\mostafa-frg\desktop
py -3 -m deskops --help
```

## Requirements

- Windows 10/11, a supported Linux desktop distribution, or macOS.
- Python 3.10+ for the DeskOps Python package.
- Git is optional when using GitHub's ZIP download.
- No account, telemetry, or cloud login is required to run local commands.

## Privacy

The DeskOps package uses the Python standard library. It does not collect profile details, device identifiers, passwords, tokens, browser data, or personal files. It does not upload command output or run a background agent. Network commands make only the explicit requests documented in their help text.

## Verify the checkout

```bash
python -m unittest discover -s tests -v
python -m deskops --help
```

On Windows, use `py -3` instead of `python` if that is how Python is registered.

## Important

Downloading source code from GitHub does not automatically grant permission to redistribute third-party tools. The catalog links to upstream projects; install each third-party program from its official source and review its license.
