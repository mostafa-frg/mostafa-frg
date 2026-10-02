from flask import Flask,request,jsonify
app=Flask(__name__)
USERS={"1":{"id":"1","name":"Alice","role":"user"},"2":{"id":"2","name":"Bob","role":"admin"}}

@app.get("/api/user/<uid>")
def user(uid):
    token=request.headers.get("Authorization","")
    if token!="Bearer lab-user-token":
        return jsonify(error="unauthorized"),401
    if uid not in USERS: return jsonify(error="not_found"),404
    # Training endpoint: intentionally demonstrates an authorization flaw.
    return jsonify(USERS[uid])

@app.get("/api/secure-user/<uid>")
def secure_user(uid):
    token=request.headers.get("Authorization","")
    if token!="Bearer lab-user-token": return jsonify(error="unauthorized"),401
    if uid!="1": return jsonify(error="forbidden"),403
    return jsonify(USERS[uid])

if __name__=="__main__": app.run("127.0.0.1",5001,debug=False)
