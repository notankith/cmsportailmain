import requests

APP_ID = "1348385923585831"
APP_SECRET = "e50daed03274cc2303a9c7de8243b23a"
EXCHANGE_TOKEN = "EAATKWYZCZB1ycBPZCHH9agSXUDvmpvHqCBYfcZATRtNZCMknex8Ijxon7SGt2k9L1tYdzkdzpFojHxvHDx2WZAkYZBKqCBYndWZC2jFrYDd29yMImcdePt0x4rNAUk0kxHfI63MGnuoSTxVC3qDVGFobzEGtr9Ajx0hJNuXfk4YI5QNXP1qifdgN5zv3ajZCD1CZAIi8GK83TBRLhIsGKqAxSG9OOazyZCXtZCxqPgZDZD"

url = "https://graph.facebook.com/oauth/access_token"
params = {
    "grant_type": "fb_exchange_token",
    "client_id": "1348385923585831",
    "client_secret": "e50daed03274cc2303a9c7de8243b23a",
    "fb_exchange_token": "EAATKWYZCZB1ycBPZCHH9agSXUDvmpvHqCBYfcZATRtNZCMknex8Ijxon7SGt2k9L1tYdzkdzpFojHxvHDx2WZAkYZBKqCBYndWZC2jFrYDd29yMImcdePt0x4rNAUk0kxHfI63MGnuoSTxVC3qDVGFobzEGtr9Ajx0hJNuXfk4YI5QNXP1qifdgN5zv3ajZCD1CZAIi8GK83TBRLhIsGKqAxSG9OOazyZCXtZCxqPgZDZD"
}

response = requests.get(url, params=params)

if response.status_code == 200:
    print("Success:", response.json())
else:
    print("Error:", response.json())