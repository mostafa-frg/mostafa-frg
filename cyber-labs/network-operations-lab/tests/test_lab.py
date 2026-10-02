import ipaddress
from pathlib import Path

def test_lab_network():
    net = ipaddress.ip_network("10.60.0.0/24")
    assert ipaddress.ip_address("10.60.0.10") in net
    assert ipaddress.ip_address("10.60.0.53") in net

def test_compose_exists():
    assert Path(__file__).parents[1].joinpath("docker-compose.yml").exists()
