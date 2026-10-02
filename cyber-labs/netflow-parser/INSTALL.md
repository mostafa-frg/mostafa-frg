# Installation & Verification

## Requirements
- Linux, Kali Linux, Debian/Ubuntu, or Termux
- Python 3.10+
- Bash for shell launchers
- Install `requirements.txt` when present

## Install

```bash
python3 --version
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
if [ -f requirements.txt ]; then python -m pip install -r requirements.txt; fi
```

## Verification

```bash
python3 flow.py sample_flows.csv
```

Use the included fixture/sample data for the first verification. For security-testing projects, keep deliberately vulnerable services isolated and use only authorized targets.

## Troubleshooting
- Confirm Python with `python3 --version`.
- Activate the virtual environment before installing Python packages.
- Run `python3 --help` or the script's help option to inspect CLI arguments.
- Check file paths from the project directory.

## Verification standard
A project is considered ready only after its sample command succeeds, its Python sources compile, and its automated tests pass where tests exist.
