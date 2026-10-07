try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("WEB SECURITY LAB")
except Exception:
    pass
from flask import Flask,request,render_template_string
app=Flask(__name__)
PAGE="""<!doctype html><title>Web Security Lab</title><h1>Web Security Lab</h1><p>This application is intentionally local and educational.</p><form action="/search"><input name="q" placeholder="Search"><button>Search</button></form>{% if result %}<p>Result: {{ result }}</p>{% endif %}"""
@app.get("/")
def index(): return render_template_string(PAGE,result="")
@app.get("/search")
def search(): return render_template_string(PAGE,result=request.args.get("q",""))
if __name__=="__main__": app.run(host="127.0.0.1",port=5000,debug=False)
