try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("CTF WEB LAB")
except Exception:
    pass
from flask import Flask,render_template_string
app=Flask(__name__)
PAGE="""<h1>Local Web CTF</h1><p>Challenge: access-control review</p><p><a href="/profile/1">Profile 1</a> | <a href="/profile/2">Profile 2</a></p>{% if profile %}<pre>{{ profile }}</pre>{% endif %}"""
PROFILES={"1":{"user":"alice","role":"user","flag":"LAB{access_control_review}"},"2":{"user":"admin","role":"admin","flag":"LAB{admin_profile}"}}
@app.get("/")
def index(): return render_template_string(PAGE)
@app.get("/profile/<pid>")
def profile(pid): return render_template_string(PAGE,profile=PROFILES.get(pid,{"error":"not found"}))
if __name__=="__main__": app.run("127.0.0.1",5002,debug=False)
