"""Fetch free-licensed photos of the route's cities from Wikimedia Commons (one-off)."""
import json, os, sys, time, urllib.parse, urllib.request

UA = "GTR-PHT-LiveHub/1.0 (https://github.com/pelikilya-hub/GTR-pht; asset bootstrap)"
SLOTS = {
    "phuket/01-big-buddha": ["Big Buddha Phuket", "Phuket Big Buddha statue"],
    "phuket/02-longtail-sunset": ["longtail boat sunset Phuket", "longtail boat Thailand sunset"],
    "phuket/03-aerial-beach": ["Patong beach aerial", "Kata beach Phuket view"],
    "phuket/04-villas": ["Kamala beach Phuket", "Phuket resort pool villa"],
    "phuket/05-neon-night": ["Bangla Road Patong night", "Patong night street"],
    "samui/01-scene": ["Wat Plai Laem Ko Samui", "Wat Plai Laem"],
    "samui/02-scene": ["Chaweng beach Ko Samui", "Ko Samui beach"],
    "samui/03-scene": ["Big Buddha Ko Samui", "Wat Phra Yai Samui"],
    "phangan/01-scene": ["Haad Rin Ko Pha Ngan", "Ko Pha Ngan beach"],
    "phangan/02-scene": ["Thong Nai Pan Ko Pha Ngan", "Ko Pha Ngan bay"],
    "phangan/03-scene": ["Ko Pha Ngan sunset", "Ko Pha Ngan viewpoint"],
    "chiangmai/01-scene": ["Wat Phra That Doi Suthep", "Doi Suthep temple"],
    "chiangmai/02-scene": ["Wat Chedi Luang Chiang Mai", "Wat Chedi Luang"],
    "chiangmai/03-scene": ["Chiang Mai old city gate", "Tha Phae Gate"],
    "ayutthaya/01-scene": ["Wat Chaiwatthanaram", "Wat Chaiwatthanaram Ayutthaya"],
    "ayutthaya/02-scene": ["Wat Mahathat Ayutthaya Buddha head tree", "Wat Mahathat Ayutthaya"],
    "ayutthaya/03-scene": ["Wat Phra Si Sanphet", "Ayutthaya historical park"],
    "bangkok/01-scene": ["Wat Arun Bangkok", "Wat Arun night"],
    "bangkok/02-scene": ["Bangkok skyline night", "Bangkok skyline"],
    "bangkok/03-scene": ["Yaowarat Road night", "Bangkok Chinatown night"],
}
OK_LIC = ("cc0", "cc by", "cc-by", "public domain", "pd")

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()

def search(term):
    q = urllib.parse.urlencode({
        "action": "query", "format": "json", "generator": "search",
        "gsrsearch": f"filetype:bitmap {term}", "gsrnamespace": 6, "gsrlimit": 12,
        "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata", "iiurlwidth": 1280,
    })
    d = json.loads(get("https://commons.wikimedia.org/w/api.php?" + q))
    pages = sorted(d.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 99))
    for p in pages:
        ii = (p.get("imageinfo") or [{}])[0]
        if ii.get("mime") != "image/jpeg": continue
        w, h = ii.get("width", 0), ii.get("height", 0)
        if w < 1200 or h < 700 or w < h: continue
        md = ii.get("extmetadata", {})
        lic = (md.get("LicenseShortName", {}).get("value") or "").lower()
        if not any(lic.startswith(x) or x in lic for x in OK_LIC): continue
        return p["title"], ii, md
    return None

out = sys.argv[1]
credits = {}
for slot, terms in SLOTS.items():
    hit = None
    for term in terms:
        try:
            hit = search(term)
        except Exception as e:
            print("search error", slot, term, e)
        if hit: break
        time.sleep(1)
    if not hit:
        print("MISS", slot); continue
    title, ii, md = hit
    path = os.path.join(out, slot + ".jpg")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "wb").write(get(ii["thumburl"]))
    strip = lambda s: __import__("re").sub("<[^>]+>", "", s or "").strip()
    credits[slot + ".jpg"] = {
        "title": title,
        "page": ii.get("descriptionurl"),
        "author": strip(md.get("Artist", {}).get("value")),
        "license": md.get("LicenseShortName", {}).get("value"),
        "licenseUrl": md.get("LicenseUrl", {}).get("value"),
    }
    print("OK", slot, title, credits[slot + ".jpg"]["license"])
    time.sleep(1)
json.dump(credits, open(os.path.join(out, "CREDITS.json"), "w"), ensure_ascii=False, indent=1)
