# NetHack Wiki level sources

The interactive figure uses all 14 screenshots in the [Main Page rotation](https://nethackwiki.com/wiki/Category:Main_Page_rotation), retrieved on 5 October 2026. The source archive also retains the [second Medusa’s Island layout](https://nethackwiki.com/wiki/Medusa%27s_Island#Second_version) to supply added water in a [separately archived gameplay recording](../gameplay/README.md). The layout is used only during data generation and is not included as a standalone scene in the browser payload. The wiki home page selects a screenshot from its rotation category using `MediaWiki:Common.js`.

`sources.json` records each page URL, its revision ID, the local HTML fragment, and presentation metadata. The original page and its revision history credit the individual wiki contributors. The HTML fragments contain only the source’s `.ttyscreen` or `.ttymap` element, without the surrounding page or executable scripts.

Run `python scripts/extract-wiki-maps.py` from the repository root to rebuild `map-data.js`. It uses only Python’s standard library and does not fetch the wiki. The page works from these local files without making requests to NetHack Wiki.

## Adaptations

Adapted for this project on 5 October 2026. The extraction preserves displayed characters, colors, and relative positions. The 14 terminal screenshots each have a message row, 21 map rows, and two status rows. The figure draws the map rows as graphics, with the original message above and status below. The screenshots’ unused 80th column is checked to be blank before it is removed. The source Medusa layout is padded with blank cells to the shared 79 by 21 grid before extracting the water layer.

The inline and enlarged views center the occupied extent within that grid without stretching the cells or changing relative positions. The graphical view adds original, simplified vector symbols. Source colors and text characters are retained in the data. The interface displays graphics only.

Wiki labels distinguish ambiguous symbols where available, including trees, bars, spellbooks, doors, magic missiles, jellyfish, giant eels, and water trolls. Other graphics represent broad categories. Unrecognized symbols remain text. The pickup menu in `ttymap9.html` remains text, and the obscured map is not reconstructed.

No monsters are added over the source cells. Creature graphics use the same neutral base tile as other objects, without inferring the terrain they cover.

The player is identified by the source’s link label or, for a gameplay screenshot with exactly one `@`, by that character. In `ttymap6.html`, the wiki identifies an `h` as the player. In `ttymap7.html`, one `@` is the player and the other is a shopkeeper. No player position is invented for the ambiguous Minetown screenshot or snapshots without a player symbol.

The Medusa examples motivate the study of skill coverage. They are not encounters observed in our experiments.

## Copyright and attribution

The source material is credited to NetHack Wiki contributors and the NetHack copyright holders. See [NetHack Wiki’s copyright policy](https://nethackwiki.com/wiki/NetHackWiki:Copyrights).

NetHack game content and its adaptations in this figure are distributed under the [NetHack General Public License](NGPL.txt). The wiki gives the game notice as “NetHack, Copyright 1985–2003 By Stichting Mathematisch Centrum and M. Stephenson.” The original NetHack source is available through [NetHack’s source releases](https://www.nethack.org/common/index.html). The map source fragments and the extraction and rendering code are included in this repository.

Wiki annotations and their adaptations are available under [Creative Commons Attribution-ShareAlike 3.0 Unported](https://creativecommons.org/licenses/by-sa/3.0/) where applicable. No endorsement by NetHack Wiki or the NetHack developers is implied. These notices concern the map material, not the research paper or other independent figures on the page.

## Source pages

The manifest links each example to its original page. Pinned revisions can be opened with `https://nethackwiki.com/index.php?oldid=REVISION`, using the revision recorded in `sources.json`.

| Local source | Original page |
| --- | --- |
| ttymap1.html | [Dungeon level 2](https://nethackwiki.com/wiki/Template:Random_ttymap/ttymap1) |
| ttymap2.html | [Gnomish Mines · Surrounded](https://nethackwiki.com/wiki/Template:Random_ttymap/ttymap2) |
| ttymap3.html | [Minetown · Temple](https://nethackwiki.com/wiki/Template:Random_ttymap/ttymap3) |
| ttymap4.html | [Dungeon level 2 · Kops](https://nethackwiki.com/wiki/Template:Random_ttymap/ttymap4) |
| ttymap5.html | [Minetown · Altar](https://nethackwiki.com/wiki/Template:Random_ttymap/ttymap5) |
| ttymap6.html | [Asmodeus’s lair](https://nethackwiki.com/wiki/Template:Random_ttymap/ttymap6) |
| ttymap7.html | [Dungeon level 2 · Shop](https://nethackwiki.com/wiki/Template:Random_ttymap/ttymap7) |
| ttymap8.html | [Gnomish Mines · Water nymph](https://nethackwiki.com/wiki/Template:Random_ttymap/ttymap8) |
| ttymap9.html | [Minetown · Picking up items](https://nethackwiki.com/wiki/Template:Random_ttymap/ttymap9) |
| ttymap10.html | [Sokoban](https://nethackwiki.com/wiki/Template:Random_ttymap/ttymap10) |
| ttymap11.html | [Water maze](https://nethackwiki.com/wiki/Template:Random_ttymap/ttymap11) |
| ttymap12.html | [Gnomish Mines · Magic missile](https://nethackwiki.com/wiki/Template:Random_ttymap/ttymap12) |
| ttymap13.html | [Dungeon level 15 · Wishing](https://nethackwiki.com/wiki/Template:Random_ttymap/ttymap13) |
| ttymap14.html | [The Castle](https://nethackwiki.com/wiki/Template:Random_ttymap/ttymap14) |
| medusa-2.html | [Medusa’s Island, second version](https://nethackwiki.com/wiki/Medusa%27s_Island#Second_version) |
