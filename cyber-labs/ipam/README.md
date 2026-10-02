# IPAM Lab

Small IPv4 address-management tool backed by CSV. It allocates the first available address from a network while excluding network/broadcast and already assigned addresses.

## Run
```bash
python ipam.py init 192.168.50.0/24
python ipam.py add 192.168.50.0/24 printer-01 192.168.50.20
python ipam.py list
```
