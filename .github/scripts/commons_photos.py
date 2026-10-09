import json, os, re, sys, time, urllib.parse, urllib.request
UA = "GTR-PHT-LiveHub/1.0 (https://github.com/pelikilya-hub/GTR-pht; asset bootstrap)"
SLOTS = {
  "cars/01": ["car graveyard junkyard", "car cemetery"],
  "cars/02": ["abandoned cars junkyard rust", "scrapyard cars"],
  "cars/03": ["Nissan Skyline GT-R R34 parked", "Nissan Skyline GT-R parked"],
  "cars/04": ["JDM car meet night parking", "car meet parking lot night"],
  "cars/05": ["Toyota Supra A80 parked", "Toyota Supra MK4"],
  "cars/06": ["impound lot cars", "car impound lot"],
  "cars/07": ["barn find classic car", "old car barn"],
  "cars/08": ["Bangkok used car market", "used car lot Thailand"],
  "cars/09": ["Porsche 911 classic parked street", "classic Porsche 911 parked"],
  "cars/10": ["Mazda RX-7 FD parked", "Mazda RX-7"],
  "drone/01": ["DJI Mavic in flight", "DJI drone flying"],
  "drone/02": ["quadcopter drone flying sky", "FPV drone flying"],
  "story/01": ["Phuket night aerial city lights", "Patong night aerial"],
  "story/02": ["Thailand highway night light trails", "Bangkok expressway night"],
  "story/03": ["Chiang Mai mountains mist", "Doi Inthanon mist"],
}
OK = ("cc0", "cc by", "cc-by", "public domain", "pd")
def get(u):
    with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": UA}), timeout=60) as r: return r.read()
def search(term):
    q = urllib.parse.urlencode({"action": "query", "format": "json", "generator": "search", "gsrsearch": f"filetype:bitmap {term}", "gsrnamespace": 6, "gsrlimit": 20, "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata", "iiurlwidth": 1600})
    d = json.loads(get("https://commons.wikimedia.org/w/api.php?" + q))
    for p in sorted(d.get("query", {}).get("pages", {}).values(), key=lambda p: p.get("index", 99)):
        ii = (p.get("imageinfo") or [{}])[0]
        if ii.get("mime") != "image/jpeg" or ii.get("width", 0) < 1400 or ii.get("height", 0) < 800 or ii.get("width", 0) < ii.get("height", 0): continue
        md = ii.get("extmetadata", {}); lic = (md.get("LicenseShortName", {}).get("value") or "").lower()
        if any(lic.startswith(x) or x in lic for x in OK): return p["title"], ii, md
out = sys.argv[1]; credits = {}
for slot, terms in SLOTS.items():
    hit = None
    for term in terms:
        try: hit = search(term)
        except Exception as e: print("err", slot, e)
        if hit: break
        time.sleep(1)
    if not hit: print("MISS", slot); continue
    title, ii, md = hit
    path = os.path.join(out, slot + ".jpg"); os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "wb").write(get(ii["thumburl"]))
    strip = lambda x: re.sub("<[^>]+>", "", x or "").strip()
    credits[slot + ".jpg"] = {"title": title, "page": ii.get("descriptionurl"), "author": strip(md.get("Artist", {}).get("value")), "license": md.get("LicenseShortName", {}).get("value"), "licenseUrl": md.get("LicenseUrl", {}).get("value")}
    print("OK", slot, title); time.sleep(1)
json.dump(credits, open(os.path.join(out, "CREDITS.json"), "w"), ensure_ascii=False, indent=1)
