"""Static output checks for every public route and its linked local assets."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
import json

ROOT = Path(__file__).parent
project_data = json.loads((ROOT / "projects.json").read_text())
pages = [ROOT / "index.html", *(ROOT / part / "index.html" for part in
    ("work", "services", "about", "process", "contact"))]
pages += [ROOT / "work" / p["slug"] / "index.html" for p in project_data]
pages += [ROOT / "404.html", ROOT / "error.html"]

class Scan(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.canonical = []
        self.headings = []
        self.forms = []
        self.scripts = []
    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == "a": self.links.append(d.get("href", ""))
        if tag in ("script", "img", "link"):
            self.scripts.append(d.get("src", d.get("href", "")))
        if tag == "link" and d.get("rel") == "canonical":
            self.canonical.append(d.get("href"))
        if tag == "h1": self.headings.append(tag)
        if tag == "form": self.forms.append(d)

for page in pages:
    assert page.exists(), page
    content = page.read_text()
    doc = Scan()
    doc.feed(content)
    assert len(doc.headings) == 1, f"Expected one h1: {page}"
    assert len(doc.canonical) == 1, f"Expected canonical: {page}"
    assert "admin/" not in content and "IndexedDB" not in content, f"Private app reference: {page}"
    for url in doc.links + doc.scripts:
        if not url.startswith("/") or url.startswith("//"): continue
        path = urlsplit(url).path
        target = ROOT / path.lstrip("/")
        if path.endswith("/"): target /= "index.html"
        assert target.exists(), f"Broken local link {url} in {page}"
assert "mailto:hello@anzaworks.lk" in (ROOT / "contact" / "index.html").read_text()
assert len(project_data) == 5
print(f"Portfolio checks passed: {len(pages)} pages and local assets")
