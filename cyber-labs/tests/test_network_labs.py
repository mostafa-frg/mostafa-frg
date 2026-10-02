import unittest,ipaddress
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

class LabFilesTest(unittest.TestCase):
    def test_network_projects_exist(self):
        expected=[
            "network-toolkit/nettool.py",
            "network-monitor/monitor.py",
            "subnet-planner/planner.py",
            "ipam/ipam.py",
            "vlan-lab/validate.py",
            "firewall-rule-validator/validator.py",
            "netflow-parser/flow.py",
            "topology-builder/topology.py",
        ]
        for item in expected:
            self.assertTrue((ROOT/item).exists(), item)

    def test_subnet_math(self):
        n=ipaddress.ip_network("10.20.0.0/24")
        self.assertEqual(n.num_addresses,256)
        self.assertEqual(n.prefixlen,24)

if __name__=="__main__":
    unittest.main()
