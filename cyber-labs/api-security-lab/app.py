try:  # Mosta start-up banner (optional; shown only on an interactive terminal)
    import sys as _sys
    from pathlib import Path as _Path
    _sys.path.insert(0, str(_Path(__file__).resolve().parents[1] / "common"))
    import mosta_banner as _mosta_banner
    _mosta_banner.show("API SECURITY LAB")
except Exception:
    pass
from flask import Flask,request,jsonify
app=Flask(__name__)
USERS={"1":{"id":"1","name":"Alice","role":"user"},"2":{"id":"2","name":"Bob","role":"admin"}}
LAB_TOKEN="Bearer lab-user-token"
def authorized(): return request.headers.get("Authorization","")==LAB_TOKEN
@app.get("/api/user/<uid>")
def user(uid):
    if not authorized(): return jsonify(error="unauthorized"),401
    if uid not in USERS: return jsonify(error="not_found"),404
    return jsonify(USERS[uid])
@app.get("/api/secure-user/<uid>")
def secure_user(uid):
    if not authorized(): return jsonify(error="unauthorized"),401
    if uid!="1": return jsonify(error="forbidden"),403
    return jsonify(USERS[uid])
if __name__=="__main__": app.run("127.0.0.1",5001,debug=False)
