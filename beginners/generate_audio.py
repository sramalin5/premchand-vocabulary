"""Create local natural Hindi sentence recordings and service word timings."""
import asyncio
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parents[1] / 'premchand_work' / 'tts_dependencies'))
import edge_tts

VOICE = 'hi-IN-SwaraNeural'

async def main():
    stories = json.loads((ROOT / 'stories.json').read_text(encoding='utf-8'))
    output = ROOT / 'audio'
    output.mkdir(exist_ok=True)
    semaphore = asyncio.Semaphore(3)
    async def record(story, number, sentence):
        stem = f"{story['number']:02d}-{number:02d}"
        mp3 = output / f'{stem}.mp3'
        metadata = output / f'{stem}.json'
        if mp3.exists() and metadata.exists() and mp3.stat().st_size > 1000:
            return
        async with semaphore:
            for attempt in range(3):
                try:
                    boundaries = []
                    communication = edge_tts.Communicate(sentence['hi'], VOICE, rate='-12%', boundary='WordBoundary')
                    with mp3.open('wb') as audio:
                        async for chunk in communication.stream():
                            if chunk['type'] == 'audio':
                                audio.write(chunk['data'])
                            elif chunk['type'] == 'WordBoundary':
                                boundaries.append({'start': chunk['offset'] / 10000000, 'duration': chunk['duration'] / 10000000, 'text': chunk['text']})
                    if not boundaries or mp3.stat().st_size < 1000:
                        raise RuntimeError('Missing audio or word timings')
                    metadata.write_text(json.dumps({'voice': VOICE, 'text': sentence['hi'], 'words': boundaries}, ensure_ascii=False, indent=2), encoding='utf-8')
                    print(f'Recorded {stem}: {len(boundaries)} boundaries', flush=True)
                    return
                except Exception:
                    if attempt == 2:
                        raise
                    await asyncio.sleep(2 * (attempt + 1))
    tasks = [(s, i, line) for s in stories for i, line in enumerate(s['sentences'], 1)]
    if '--sample' in sys.argv:
        tasks = tasks[:1]
    await asyncio.gather(*(record(*item) for item in tasks))
    print(f'Complete: {len(tasks)} sentences, {VOICE}', flush=True)

asyncio.run(main())
