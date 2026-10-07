# File Integrity Monitor

Records a SHA-256 baseline of a directory and reports files that were **added, removed, modified**, or had their **permissions changed**. Read-only and offline; standard library only.

## Use

```bash
python3 fim.py init  /etc/myapp --baseline myapp.json --exclude "*.log"
python3 fim.py check /etc/myapp --baseline myapp.json          # exit 0 clean, 1 changes, 2 tampered baseline
python3 fim.py check /etc/myapp --baseline myapp.json --json   # machine-readable
python3 fim.py show  --baseline myapp.json
```

With the Mosta command layer: `mfim init DIR` / `mfim check DIR`.

## Protect the baseline (optional)

```bash
export MOSTA_FIM_KEY='a-long-secret'
python3 fim.py init DIR     # baseline is signed with HMAC-SHA256
python3 fim.py check DIR    # exit 2 if the baseline itself was edited
```

## Notes

- Symlinks are not followed; only regular files are hashed.
- The baseline file is excluded from its own scan.
- Detection is only as trustworthy as the baseline: store it (and the key) somewhere an attacker cannot write.
- Use only on systems you are authorized to monitor.
