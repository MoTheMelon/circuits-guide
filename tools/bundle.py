#!/usr/bin/env python3
"""Bundle the multi-page site into ONE self-contained HTML file.

Every page (home + each topic) goes into the same document; app.js shows one
at a time and routes on the URL hash (#mosfet, #solenoid, ...). Useful for
sharing a single file or publishing as a Claude artifact.

Usage:  python3 tools/bundle.py            -> dist/circuits-guide.html
        python3 tools/bundle.py out.html
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
read = lambda p: open(os.path.join(ROOT, p), encoding="utf-8").read()

index = read("index.html")
# script order is taken from index.html so the bundle always matches the site
srcs = re.findall(r'<script src="\./([^"]+)"></script>', index)
fonts = "\n".join(re.findall(r"<link (?:rel=\"preconnect\"|href=\"https://fonts)[^>]*>", index))
css = read("assets/css/style.css")
js = "\n".join(f"/* ---- {s} ---- */\n" + read(s) for s in srcs)

topics = json.loads(read("assets/js/topics.js").split("const TOPICS = ")[1].strip().rstrip(";"))

home = re.search(r"<main>\s*(.*?)\s*</main>", index, re.S).group(1)
views = [f'<div class="view" data-id="">\n{home}\n</div>']
for t in topics:
    page = read(f"topics/{t['id']}.html")
    art = re.search(r"<article[^>]*>.*?</article>", page, re.S).group(0)
    art = art.replace('class="topic wrap"', 'class="topic wrap view"', 1).replace("<article ", "<article hidden ", 1)
    views.append(art)

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Circuits Field Guide</title>
{fonts}
<style>
{css}
</style>
</head>
<body data-bundle="1" data-page="">
<main>
{chr(10).join(views)}
</main>
<script>{{
{js}
}}</script>
</body>
</html>
"""
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "dist", "circuits-guide.html")
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
open(out, "w", encoding="utf-8").write(html)
print(f"wrote {out} ({len(html)//1024} KB, {len(topics)} topics)")
