import csv
import requests
from datetime import datetime, timedelta
from tkinter import Tk
from tkinter.filedialog import askopenfilename

# ===== CONFIG =====
PAGE_ID = "228482657011871"
PAGE_TOKEN = "EAAM6yP9Q6r8BP5JUSm3zj9kAdnjcu3dFYOtoLgzHA2EoZCZCpnIkeXGfClnZAm4UoQK6GQIOvrZAhdyDnScGXo1qmXr4ANgxPNymRWCgGcdk5DOZBfZAFilU1r1ZCZALnsLaf2PWERhdb8Pzte2HrAkRJMfZCc9dlcILxx1tMD3GczQIOO4H9dxnW194rSwoKpJCsW1IaQi4ZD"
CSV_OUTPUT = "scheduled_output.csv"

# Fixed schedule times for tomorrow
REEL_TIMES = ["00:00", "02:00", "04:00", "06:00"]
POST_TIMES = ["00:30","01:00","01:30","02:30","03:00","03:30","04:30","05:00","05:30","06:30"]

# ===== FUNCTIONS =====
def upload_thumbnail_local(file_path):
    """Upload local thumbnail image to Facebook and return photo ID"""
    try:
        with open(file_path, "rb") as f:
            files = {"source": f}
            data = {"published": False, "access_token": PAGE_TOKEN}
            response = requests.post(f"https://graph.facebook.com/v17.0/{PAGE_ID}/photos", files=files, data=data)
        result = response.json()
        return result.get("id")
    except Exception as e:
        print(f"Thumbnail upload failed: {e}")
        return None

def schedule_post(message, link, post_type, scheduled_time, thumbnail_path=None):
    """Schedules a post or video on Facebook"""
    timestamp = int(scheduled_time.timestamp())
    
    if post_type.lower() == "video":
        url = f"https://graph.facebook.com/v17.0/{PAGE_ID}/videos"
        payload = {
            "description": message,
            "file_url": link,
            "published": False,
            "scheduled_publish_time": timestamp,
            "access_token": PAGE_TOKEN
        }
        if thumbnail_path:
            thumb_id = upload_thumbnail_local(thumbnail_path)
            if thumb_id:
                payload["thumb"] = thumb_id
    else:
        url = f"https://graph.facebook.com/v17.0/{PAGE_ID}/feed"
        payload = {
            "message": message,
            "link": link,
            "published": False,
            "scheduled_publish_time": timestamp,
            "access_token": PAGE_TOKEN
        }

    response = requests.post(url, data=payload)
    try:
        result = response.json()
    except Exception as e:
        result = {"error": f"Failed to parse response: {e}", "status_code": response.status_code}
    
    print(f"Scheduled {post_type} at {scheduled_time.strftime('%Y-%m-%d %H:%M')}: {result}")
    return result

# ===== MAIN =====
def main():
    # File picker for input CSV
    Tk().withdraw()
    csv_input = askopenfilename(title="Select your input CSV", filetypes=[("CSV Files", "*.csv")])
    if not csv_input:
        print("No file selected. Exiting.")
        return

    # Read CSV
    with open(csv_input, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        items = list(reader)

    # Separate posts and videos
    posts = [item for item in items if item['Media Type'].lower() == 'image'][:10]
    reels = [item for item in items if item['Media Type'].lower() == 'video'][:4]

    # Schedule date = tomorrow
    tomorrow = datetime.now().date() + timedelta(days=1)

    scheduled_data = []

    # Schedule reels with thumbnail popup
    for i, reel in enumerate(reels):
        if i >= len(REEL_TIMES):
            break
        hour, minute = map(int, REEL_TIMES[i].split(":"))
        scheduled_time = datetime.combine(tomorrow, datetime.min.time()) + timedelta(hours=hour, minutes=minute)

        # --- Thumbnail picker popup ---
        Tk().withdraw()  # hide root window
        print(f"Select thumbnail for video: {reel['File Name']}")
        thumbnail_path = askopenfilename(title=f"Select thumbnail for {reel['File Name']}", filetypes=[("Image Files", "*.jpg *.jpeg *.png")])
        if not thumbnail_path:
            print("No thumbnail selected. Scheduling without thumbnail.")
            thumbnail_path = None

        # Schedule the video
        result = schedule_post(
            reel['Description'],
            reel['Media Link'],
            reel['Media Type'],
            scheduled_time,
            thumbnail_path=thumbnail_path
        )
        reel['scheduled_time'] = scheduled_time.strftime("%Y-%m-%d %H:%M:%S")
        reel['response'] = result
        scheduled_data.append(reel)

    # Schedule posts
    for i, post in enumerate(posts):
        if i >= len(POST_TIMES):
            break
        hour, minute = map(int, POST_TIMES[i].split(":"))
        scheduled_time = datetime.combine(tomorrow, datetime.min.time()) + timedelta(hours=hour, minutes=minute)
        result = schedule_post(post['Description'], post['Media Link'], post['Media Type'], scheduled_time)
        post['scheduled_time'] = scheduled_time.strftime("%Y-%m-%d %H:%M:%S")
        post['response'] = result
        scheduled_data.append(post)

    # Save output CSV
    fieldnames = list(scheduled_data[0].keys())
    with open(CSV_OUTPUT, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(scheduled_data)

    print(f"\nScheduling complete. Check {CSV_OUTPUT} for full responses.")

if __name__ == "__main__":
    main()
