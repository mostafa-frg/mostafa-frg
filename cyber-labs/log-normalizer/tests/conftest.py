import sys
from pathlib import Path

# Allow `pytest cyber-labs/log-normalizer/tests` as well as unittest discovery from this directory.
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
