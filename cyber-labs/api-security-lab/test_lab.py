import unittest
from app import app
class SecurityLabTests(unittest.TestCase):
 def setUp(self): self.c=app.test_client()
 def test_auth_required(self):
  self.assertEqual(self.c.get("/api/user/1").status_code,401)
 def test_vulnerable_endpoint_isolated(self):
  r=self.c.get("/api/user/2",headers={"Authorization":"Bearer lab-user-token"})
  self.assertEqual(r.status_code,200)
 def test_secure_endpoint_blocks_other_user(self):
  r=self.c.get("/api/secure-user/2",headers={"Authorization":"Bearer lab-user-token"})
  self.assertEqual(r.status_code,403)
if __name__=="__main__": unittest.main()
