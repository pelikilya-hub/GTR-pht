"""Pre-renders the "living backdrop" (photo developed out of a red/white glyph matrix) as static
images for phones, where a fixed full-screen canvas makes the browser composite the whole page
into dozens of layers and run out of memory.

usage: python gen-codebg.py <ffmpeg-free python with Pillow>  (run from live-hub/)
Writes public/assets/codebg/<section>.jpg at 1170x2532 (390x844 css @3x). Mirrors SCENES and the
glyph shading of components/fx/StoryBackdrop.tsx — keep the two in sync.
"""
import random
from PIL import Image, ImageDraw, ImageFont

SCENES = {
    'top': 'places/phuket/03-aerial-beach.jpg', 'route': 'story/bangkok-night.jpg', 'rig': 'video/car-3.jpg',
    'live': 'places/phuket/05-neon-night.jpg', 'cars': 'cars/02.jpg', 'realty': 'places/samui/03-scene.jpg',
    'lines': 'places/chiangmai/01-scene.jpg', 'scales': 'places/ayutthaya/02-scene.jpg', 'places': 'story/north-mist.jpg',
    'logbook': 'places/samui/03-scene.jpg', 'gtr-reality': 'places/ayutthaya/01-scene.jpg', 'crew': 'places/pattaya/03-scene.jpg',
    'tiers': 'places/bangkok/01-scene.jpg', 'invite': 'places/phangan/02-scene.jpg', 'sponsors': 'cars/06.jpg',
}
GLYPHS = 'กขคงจฉชซญฎฐณดตถทธนบปผพฟภมยรลวศษสหอฮ0123456789ABCDEF#%&$'
W, H, CELL = 1170, 2532, 45  # 390x844 css @3x
thai = ImageFont.truetype('/usr/share/fonts/opentype/tlwg/Loma-Bold.otf', CELL - 8)
latin = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf', CELL - 9)

def cover(img, w, h):
    s = max(w / img.width, h / img.height)
    r = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    x, y = (r.width - w) // 2, (r.height - h) // 2
    return r.crop((x, y, x + w, y + h))

for key, src in SCENES.items():
    rnd = random.Random(key)
    photo = cover(Image.open('public/assets/' + src).convert('RGB'), W, H)
    out = Image.blend(Image.new('RGB', (W, H), (10, 11, 13)), photo, 0.16)
    cols, rows = W // CELL + 1, H // CELL + 1
    lum = cover(photo, cols, rows).convert('L')
    d = ImageDraw.Draw(out, 'RGBA')
    for y in range(rows):
        for x in range(cols):
            l = lum.getpixel((x, y)) / 255
            if l < 0.18:
                continue
            a = min(0.55, (l - 0.15) * 0.75) * 0.75
            col = (255, 255, 255, int(a * 255)) if l > 0.62 else (229, 35, 27, int(a * 0.9 * 255))
            g = rnd.choice(GLYPHS)
            d.text((x * CELL, y * CELL), g, font=thai if ord(g) > 0x0E00 else latin, fill=col)
    out.save(f'public/assets/codebg/{key}.jpg', quality=68, optimize=True, progressive=True)
    print(key)
