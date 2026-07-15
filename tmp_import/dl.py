import json, re, subprocess, os

with open('/tmp/pricesheet.json') as f:
    rows = json.load(f)
with_img = [r for r in rows if r.get('img')]
OUT = '/sessions/awesome-trusting-fermat/mnt/itrawala-website/tmp_import'

def extract_id(url):
    m = re.search(r'/d/([a-zA-Z0-9_-]+)', url)
    return m.group(1) if m else None

def is_html_file(path):
    if not os.path.exists(path) or os.path.getsize(path) < 5000:
        return True
    with open(path, 'rb') as fh:
        head = fh.read(300)
    return b'<html' in head.lower() or b'<!doctype' in head.lower()

results = []
for r in with_img:
    fid = extract_id(r['img'])
    out_path = os.path.join(OUT, f"{r['row']}_{re.sub(r'[^A-Za-z0-9]+','_',r['sku'])[:40]}.jpg")
    if os.path.exists(out_path) and not is_html_file(out_path):
        results.append(dict(row=r['row'], sku=r['sku'], path=out_path, size=os.path.getsize(out_path), status='cached'))
        continue
    try:
        subprocess.run(['curl', '-sL', '--max-time', '12',
                         f'https://drive.google.com/uc?export=download&id={fid}',
                         '-o', out_path], check=False, timeout=15)
    except subprocess.TimeoutExpired:
        results.append(dict(row=r['row'], sku=r['sku'], path=out_path, size=0, status='timeout'))
        print(r['row'], r['sku'], 'TIMEOUT')
        continue
    bad = is_html_file(out_path)
    size = os.path.getsize(out_path) if os.path.exists(out_path) else 0
    results.append(dict(row=r['row'], sku=r['sku'], path=out_path, size=size, status='html' if bad else 'ok'))
    print(r['row'], r['sku'], size, 'HTML' if bad else 'OK')

with open(os.path.join(OUT, 'download_results.json'), 'w') as f:
    json.dump(results, f, indent=1)
print("DONE", len(results))
