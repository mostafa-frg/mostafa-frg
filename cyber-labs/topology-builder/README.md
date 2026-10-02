# Network Topology Builder

Turns a CSV inventory into a Graphviz DOT topology. It models device-to-device links and keeps topology generation separate from live discovery.

## Run
```bash
python topology.py sample_links.csv > topology.dot
dot -Tpng topology.dot -o topology.png
```
