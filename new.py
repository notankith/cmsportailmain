import requests

# ===== INPUT =====
TOKEN = "EAAM6yP9Q6r8BP1dToxEV6OQMWaxXZApTtG5FnOOfzH1cmDLpO7RtPfLszxWTcHio8ZCZCLZCMIoiJ4Fi3J5Vx7e9pTLPVdPB4A7SW8ATqBg81umSiDekrpRHMHLoH24NILYeKo0tZBC3CHBmERQLY8lV1JFnazIynxsQbhKQagke4ZCPZAmmmxd5lVb2pOrbWGxp4eZBcvYBQOMhqWLNESwyHoqQU5qrfPRlyYr611PwIrgZD"  # can be User or Page token
APP_ID = "909059881495231"
APP_SECRET = "090f7fae83273ff2be78be0e21208d63"

# ===== FUNCTION TO DEBUG TOKEN =====
def debug_token(token):
    url = "https://graph.facebook.com/debug_token"
    params = {
        "input_token": token,
        "access_token": f"{APP_ID}|{APP_SECRET}"  # App token needed to debug
    }
    resp = requests.get(url, params=params).json()
    
    if "error" in resp:
        print("❌ Error:", resp["error"]["message"])
        return

    data = resp.get("data", {})
    print("✅ Token Info:")
    print("  App ID:", data.get("app_id"))
    print("  Type:", data.get("type"))  # USER or PAGE
    print("  Expires at:", data.get("expires_at"))
    print("  Is valid:", data.get("is_valid"))
    print("  Scopes / Permissions:", data.get("scopes"))
    print("  User ID:", data.get("user_id"))

# ===== RUN =====
debug_token(TOKEN)
