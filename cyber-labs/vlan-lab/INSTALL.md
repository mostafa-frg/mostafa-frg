# Installation & Verification

## Requirements

- Linux, Kali Linux, Debian/Ubuntu, or Termux
- Python 3.10+ where the project is Python-based
- Bash for shell launchers
- Install project dependencies from `requirements.txt` when present.

## Install

From this directory:

```bash
python3 --version
python3 -m pip install -r requirements.txt 2>/dev/null || true
```

For a clean environment, use a Python virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
[ -f requirements.txt ] && python -m pip install -r requirements.txt
```

## Verification

Run:

```bash
python3 validate.py sample_switch.csv
```

The command is designed to use the included sample data or a bounded localhost test where applicable.

## Production-style workflow

1. Install dependencies in an isolated environment.
2. Validate the sample input.
3. Run the tool against authorized data only.
4. Save the output as an artifact.
5. Review findings before acting on them.
6. Run the repository test suite before committing changes.

No project in this lab should be treated as authorization to access systems you do not own or administer.
