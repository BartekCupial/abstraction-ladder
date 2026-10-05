#!/usr/bin/env python3
"""Build the viewer data from archived NetHack terminal HTML fragments.

Uses only Python's standard library. Source files, revision IDs, and attribution
are kept in figures/wiki and figures/gameplay. No network request is needed.
"""

from html.parser import HTMLParser
import json
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIRS = [ROOT / "figures/wiki", ROOT / "figures/gameplay"]
WIDTH, HEIGHT = 79, 21
COLORS = {
    "blue": "#0000aa", "green": "#00aa00", "cyan": "#00aaaa",
    "red": "#aa0000", "magenta": "#aa00aa", "brown": "#aa5500",
    "lightgray": "#aaaaaa", "darkgray": "#555555",
    "brightblue": "#5555ff", "brightgreen": "#55ff55",
    "brightcyan": "#55ffff", "orange": "#ff5555",
    "brightmagenta": "#ff55ff", "yellow": "#ffff55", "white": "#ffffff",
}


class MapParser(HTMLParser):
    """Read display cells, inheriting the wiki's colors and linked labels."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = [("root", "#aaaaaa", "")]
        self.lines = [[]]

    def handle_starttag(self, tag, attrs):
        if tag == "br":
            self.lines.append([])
            return
        if tag in ("img", "hr", "meta", "link", "input"):
            return
        attrs = dict(attrs)
        _, color, label = self.stack[-1]
        for cls in attrs.get("class", "").split():
            if cls.startswith("clr-"):
                color = COLORS[cls.removeprefix("clr-")]
        if tag == "a":
            label = attrs.get("title", "")
        self.stack.append((tag, color, label))

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag != "br":
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index][0] == tag:
                del self.stack[index:]
                return

    def handle_data(self, data):
        _, color, label = self.stack[-1]
        # These fragments use <br> for visible line breaks. Literal newlines
        # between HTML elements are formatting, not additional terminal rows.
        for char in data.replace("\xa0", " ").replace("\n", "").replace("\r", ""):
            self.lines[-1].append((char, color, label))


def extract_scene(source, source_dir):
    parser = MapParser()
    parser.feed((source_dir / source["file"]).read_text(encoding="utf-8"))
    lines = parser.lines
    while lines and not lines[-1]:
        lines.pop()
    screenshot = source["type"] == "screenshot"
    if screenshot:
        assert len(lines) == 24, (source["id"], len(lines))
        map_lines = lines[1:22]
        # The 80-column terminal includes a trailing blank outside its map.
        assert all(len(row) == 80 and row[-1][0] == " " for row in map_lines)
        map_lines = [row[:WIDTH] for row in map_lines]
    else:
        map_lines = lines
    assert len(map_lines) <= HEIGHT
    assert all(len(row) <= WIDTH for row in map_lines)

    rows = []
    colors = []
    labels = {}
    linked_players = []
    at_signs = []
    for y in range(HEIGHT):
        line = map_lines[y] if y < len(map_lines) else []
        line = line + [(" ", None, "")] * (WIDTH - len(line))
        rows.append("".join(char for char, _, _ in line))
        colors.append([color if char != " " else None for char, color, _ in line])
        for x, (char, color, label) in enumerate(line):
            if char == " ":
                continue
            if label:
                labels[f"{x},{y}"] = label
            if screenshot and label.lower() in {"you", "player", "hero"}:
                linked_players.append([x, y])
            if char == "@":
                at_signs.append([x, y])
    assert len(linked_players) <= 1
    # Explicit wiki labels take priority, including a polymorphed 'h' player.
    # Multiple unlabelled @ signs are left ambiguous, never all marked as heroes.
    player = linked_players[0] if linked_players else (
        at_signs[0] if screenshot and len(at_signs) == 1 else None)
    message = "".join(cell[0] for cell in lines[0]).rstrip() if screenshot else ""
    status = ["".join(cell[0] for cell in line).rstrip() for line in lines[-2:]] if screenshot else []
    revision_url = source.get("revisionUrl") or (
        f"https://nethackwiki.com/index.php?oldid={source['revision']}")
    return {
        "name": source["name"], "group": source["group"], "type": source["type"],
        "width": WIDTH, "height": HEIGHT,
        "source": {"title": source["title"], "url": source["url"],
                   "revisionUrl": revision_url},
        "note": source["note"], "player": player,
        "overlays": source.get("overlays", []), "message": message, "status": status,
        "rows": rows, "colors": colors, "labels": labels,
    }


def main():
    scenes = {}
    reveals = {}
    for source_dir in SOURCE_DIRS:
        manifest = json.loads((source_dir / "sources.json").read_text())
        scenes.update({source["id"]: extract_scene(source, source_dir)
                       for source in manifest["sources"]})
        reveals.update({source["id"]: source["terrainReveal"]
                        for source in manifest["sources"] if "terrainReveal" in source})
    for scene_id, reveal in reveals.items():
        scene = scenes[scene_id]
        layout = scenes[reveal["layout"]]
        dx, dy = reveal["offset"]
        # Keep the capture intact and store added terrain in a separate layer.
        # Only selected layout glyphs may fill blank cells in the recording.
        rows = [[" "] * WIDTH for _ in range(HEIGHT)]
        for y, row in enumerate(layout["rows"]):
            for x, char in enumerate(row):
                tx, ty = x + dx, y + dy
                if char not in reveal["glyphs"] or not (0 <= tx < WIDTH and 0 <= ty < HEIGHT):
                    continue
                if scene["rows"][ty][tx] == " ":
                    rows[ty][tx] = char
        scene["terrainReveal"] = {
            "rows": ["".join(row) for row in rows],
            "source": layout["source"], "note": reveal["note"],
        }
    # Layouts supply revealed terrain but are not standalone viewer scenes.
    scenes = {key: scene for key, scene in scenes.items() if scene["type"] == "screenshot"}
    header = (
        "// Generated by scripts/extract-wiki-maps.py; do not edit by hand.\n"
        "// Sources and attribution in figures/wiki/README.md and figures/gameplay/README.md.\n"
        "// Original glyphs and colors on a 79 × 21 grid, with added terrain in a separate layer.\n"
    )
    # Compact color arrays keep the static payload small and preserve readable rows.
    output = json.dumps(scenes, ensure_ascii=False, indent=2)
    output = re.sub(r'\[\n\s+((?:"#[a-f0-9]+"|null)(?:,\n\s+(?:"#[a-f0-9]+"|null))*)\n\s+\]',
                    lambda m: "[" + re.sub(r"\s+", "", m[1]) + "]", output)
    (ROOT / "map-data.js").write_text(header + "window.nethackMapScenes = " + output + ";\n", encoding="utf-8")
    for key, scene in scenes.items():
        print(f"{key}: {scene['name']}, {sum(c != ' ' for row in scene['rows'] for c in row)} glyphs, player {scene['player']}")


if __name__ == "__main__":
    main()
