"""Optimize generated originals for the website; retain source PNGs."""
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageOps

ROOT = Path(__file__).resolve().parent
sources = json.loads((ROOT / 'image-sources.json').read_text(encoding='utf-8'))
manifest = json.loads((ROOT / 'illustrations.json').read_text(encoding='utf-8'))
(ROOT / 'images').mkdir(exist_ok=True)
sheet = Image.new('RGB', (1200, 20 * 170 // 4), '#faf7f0')
draw = ImageDraw.Draw(sheet)
for number, source in enumerate(sources, 1):
    image = Image.open(source).convert('RGB')
    image.thumbnail((1200, 800), Image.Resampling.LANCZOS)
    image.save(ROOT / manifest[number-1]['file'], 'JPEG', quality=87, optimize=True)
    thumb = ImageOps.contain(image, (280, 140))
    x = ((number-1) % 4) * 300
    y = ((number-1) // 4) * 170
    sheet.paste(thumb, (x, y))
    draw.text((x+8, y+143), f"{number:02d} - {Path(manifest[number-1]['file']).stem[3:]}", fill='#253b37')
sheet.save(ROOT / 'illustrations-contact-sheet.jpg', quality=90)
print(f'Prepared {len(sources)} illustrations and a contact sheet.')
