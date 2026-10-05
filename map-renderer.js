// Level cells are copied from archived screenshots and a gameplay recording.
// Source labels identify specific creatures without adding new placements.
// The Medusa scene adds water from the matching wiki layout beneath the capture.
// Other graphics show broad categories, not inferred item identities.
(() => {
    const viewer = document.querySelector("[data-map-viewer]");
    const scenes = window.nethackMapScenes;
    if (!viewer || !scenes) return;

    const surface = viewer.querySelector("[data-map-surface]");
    const message = viewer.querySelector("[data-map-message]");
    const playerStats = viewer.querySelector("[data-map-stats]");
    const status = viewer.querySelector("[data-map-status]");
    const dialog = document.querySelector("[data-map-dialog]");
    const expandButton = viewer.querySelector("[data-map-expand]");
    const sceneSelect = viewer.querySelector("[data-map-select]");
    const sceneCount = viewer.querySelector("[data-map-count]");
    const sourceLink = viewer.querySelector("[data-map-source]");
    const playbackButton = viewer.querySelector("[data-map-playback]");
    const progress = viewer.querySelector("[data-map-progress]");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sceneIds = [
        "medusa-encounter",
        ...Object.keys(scenes).filter((id) => id.startsWith("wiki-"))
    ];
    const namespace = "http://www.w3.org/2000/svg";
    const tileSize = 24;
    let activeScene = sceneIds[0];
    const sceneDuration = 8000;
    let autoplay = !reducedMotion.matches;
    let inView = false;
    let playbackFrame = null;
    let lastFrameTime = null;
    let elapsed = 0;

    const svgElement = (name, attributes = {}, text) => {
        const element = document.createElementNS(namespace, name);
        Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
        if (text !== undefined) element.textContent = text;
        return element;
    };

    // Original vector symbols, each drawn on a 24 × 24 cell.
    const artwork = {
        floor: '<path fill="#28333e" d="M0 0h24v24H0z"/><path stroke="#34414d" d="M0 23.5h24M23.5 0v24"/><path stroke="#3c4853" d="M5 6h3M16 17h2"/>',
        wall: '<path fill="#56616b" d="M0 0h24v24H0z"/><path fill="#6c7984" d="M0 0h24v4H0z"/><path stroke="#303b46" stroke-width="2" d="M0 12h24M12 3v9M5 12v12M22 12v12"/>',
        corridor: '<path fill="#333c43" d="M0 0h24v24H0z"/><path fill="#74808a" d="m12 10 2 2-2 2-2-2z"/>',
        water: '<path fill="#173f60" d="M0 0h24v24H0z"/><path fill="none" stroke="#4c8bad" stroke-width="1.2" d="M2 8q3-3 6 0t6 0t6 0M5 17q3-3 6 0t6 0"/>',
        trap: '<path fill="#504334" stroke="#d9ad65" stroke-width="1.5" d="m12 3 10 18H2z"/><path stroke="#f4d9a8" stroke-width="2" d="M12 9v5"/><circle cx="12" cy="18" r="1" fill="#f4d9a8"/>',
        amulet: '<path fill="none" stroke="#d7c28d" stroke-width="1.5" d="M6 3v5a6 6 0 0 0 12 0V3"/><path fill="#87c0bd" stroke="#d9eece" d="m12 11 5 5-5 6-5-6z"/>',
        door: '<rect x="3" y="2" width="18" height="21" rx="1" fill="#b98b54"/><path stroke="#634729" stroke-width="1.5" d="M4 6h16M4 18h16M8 3v19M15 3v19"/><circle cx="17" cy="12" r="1.5" fill="#f7da92"/>',
        openDoor: '<path fill="#b98b54" d="M3 2h18v3H3zM3 5h3v17H3zM18 5h3v17h-3z"/><path fill="#805b38" stroke="#d4ae77" d="m6 5 7 4v13l-7-2z"/><circle cx="11" cy="15" r="1" fill="#f7da92"/>',
        grave: '<path fill="#8a969f" stroke="#c2cbd2" d="M6 21V10a6 6 0 0 1 12 0v11z"/><path stroke="#4b5a67" stroke-width="2" d="M12 8v8M9 11h6M3 22h18"/>',
        player: '<circle cx="12" cy="12" r="10.5" fill="#2855a1" stroke="#82baff"/><circle cx="12" cy="8" r="3" fill="#e7f3ff"/><path fill="#e7f3ff" d="M8 12h8l2 7H6z"/>',
        creature: '<path fill="#77ac76" stroke="#b7d4a6" d="m5 5 4 2h6l4-2v11l-3 4H8l-3-4z"/><path fill="#132c2a" d="M8 10h3v3H8zM14 10h3v3h-3z"/><path stroke="#e2ebc0" d="M10 16h5"/>',
        medusa: '<circle cx="12" cy="12" r="11" fill="#4c294f" stroke="#edc476"/><path fill="#ae83c9" stroke="#ebc2ed" d="m9 13 6 0 4 8H5z"/><path fill="none" stroke="#98ce7c" stroke-width="2" stroke-linecap="round" d="M8 9C1 9 3 2 7 4m3 2C5 1 13 0 12 5m2 1c2-6 8-3 5 1m-3 2c6-5 8 1 4 3"/><ellipse cx="12" cy="10" rx="4.5" ry="5" fill="#b2d798"/><path stroke="#382137" stroke-width="1.5" d="M9 9h2m2 0h2m-4 4h2"/>',
        eel: '<path fill="none" stroke="#202a45" stroke-width="7" stroke-linecap="round" d="M3 18c6 7 5-14 12-11s8 7 4 10"/><path fill="none" stroke="#9daeee" stroke-width="4" stroke-linecap="round" d="M3 18c6 7 5-14 12-11s8 7 4 10"/><path fill="#d0d9ff" d="m16 12 6 1-1 6-5-2z"/><circle cx="20" cy="14" r="1" fill="#15253b"/>',
        jellyfish: '<path fill="none" stroke="#ebadf3" stroke-width="1.6" stroke-linecap="round" d="M7 12q-3 4 0 9m5-9q3 4 0 10m5-10q-2 5 1 8"/><path fill="#af8bce" stroke="#efd4fc" d="M4 12a8 9 0 0 1 16 0q-8 4-16 0z"/><path fill="none" stroke="#f5e0ff" d="M7 9q1-4 4-4"/>',
        waterTroll: '<path fill="#4b968c" stroke="#afe0cb" d="m5 6 3 2 1-4h6l1 4 3-2 2 8-4 1 1 6h-5l-1-5-1 5H6l1-6-4-1z"/><path fill="#132f36" d="M8 9h3v2H8zM13 9h3v2h-3z"/><path stroke="#e1ebce" stroke-width="2" d="m9 12 1 3m5-3-1 3"/>',
        stairsUp: '<path fill="none" stroke="#b5c9dc" stroke-width="2" d="M3 20h6v-5h6v-5h6V4"/><path fill="none" stroke="#eaf1f8" stroke-width="1.5" d="M5 10V3m-3 3 3-3 3 3"/>',
        stairsDown: '<path fill="none" stroke="#b5c9dc" stroke-width="2" d="M3 4v6h6v5h6v5h6"/><path fill="none" stroke="#eaf1f8" stroke-width="1.5" d="M18 3v7m-3-3 3 3 3-3"/>',
        potion: '<path fill="#c68bdd" stroke="#ebcbf6" d="M9 4h6v6l4 5v4l-2 2H7l-2-2v-4l4-5z"/><path stroke="#f4e7ca" stroke-width="3" d="M9 4h6"/><path stroke="#f3dfff" d="M8 15v3"/>',
        scroll: '<path fill="#e2d5ae" stroke="#ad9469" d="M6 4h13v14H8l-2 3H4V7z"/><path fill="#bba578" d="M15 18v3H5l3-3z"/><path stroke="#7e745c" d="M9 8h7M9 11h5M9 14h6"/>',
        ring: '<circle cx="12" cy="14" r="6" fill="none" stroke="#e5bf69" stroke-width="2.5"/><path fill="#b5e2e0" d="m12 3 4 4-4 4-4-4z"/>',
        gem: '<path fill="#b2d9ee" stroke="#e3f5fc" d="m12 3 7 8-7 10-7-10z"/><path fill="none" stroke="#6197b8" d="M5 11h14M12 3l-2 8 2 10 2-10z"/>',
        food: '<path fill="#bb8765" stroke="#e0b28e" d="M5 9q7-9 14 0v8q-7 6-14 0z"/><path stroke="#edc7a2" stroke-width="2" d="m9 7-1 6m6-7-1 7"/>',
        weapon: '<path fill="#bfced8" stroke="#ebf2f6" d="m17 3 4 1-1 4-9 9-3-3z"/><path stroke="#d5ac70" stroke-width="2.5" d="m5 12 7 7m-7 0 4-4"/>',
        armor: '<path fill="#91aabd" stroke="#d3e1e9" d="m7 4 5 3 5-3 5 6-4 3v7H6v-7l-4-3z"/><path stroke="#5d788c" d="M12 8v11M7 14h10"/>',
        tool: '<rect x="4" y="7" width="16" height="14" rx="2" fill="#b39973" stroke="#dfccaa"/><path fill="none" stroke="#dfccaa" stroke-width="2" d="M8 7V4h8v3"/><path stroke="#685941" d="M5 12h14M12 11v4"/>',
        boulder: '<path fill="#8a9196" stroke="#b4bdc5" d="m7 4 9 1 5 7-4 8-10 1-5-7z"/><path fill="#a5adb3" d="m7 4 9 1-4 5-9 4z"/>',
        gold: '<ellipse cx="12" cy="15" rx="8" ry="5" fill="#bc9039"/><ellipse cx="12" cy="11" rx="8" ry="5" fill="#e2c574" stroke="#f5e3a3"/><path stroke="#a78434" d="M9 11h6"/>',
        spellbook: '<rect x="5" y="3" width="15" height="18" rx="2" fill="#956bb0" stroke="#d8b5eb"/><path stroke="#ebd5f6" d="M8 4v16m4-11h5m-2-2v4"/>',
        wand: '<path stroke="#c6a578" stroke-width="3" d="m5 20 12-13"/><path fill="#dcebf9" d="m19 2 1 4 3 1-4 1-1 4-1-4-4-1 4-1z"/>',
        fountain: '<path fill="none" stroke="#78bfd8" stroke-width="2" d="M5 10q0-6 7-6t7 6M12 4v11"/><path fill="#68869e" stroke="#c0d9e7" d="M3 12h18q-2 6-9 6t-9-6M9 18h6v3H9z"/>',
        altar: '<path fill="#9094a3" stroke="#d7d9e3" d="M3 9h18v5H3zM6 14h3v7H6zM15 14h3v7h-3z"/><path fill="#d9c18e" d="m12 2 4 5h-8z"/>',
        tree: '<path fill="#91754d" d="M10 15h4v7h-4z"/><path fill="#578563" stroke="#a4c293" d="m12 2 8 10h-4l5 6H3l5-6H4z"/>',
        bars: '<path stroke="#95a6b6" stroke-width="2" d="M5 2v20M12 2v20M19 2v20M2 7h20M2 17h20"/>',
        beam: '<path stroke="#5a98e6" stroke-width="7" opacity=".4" d="M12 0v24"/><path stroke="#d2ecff" stroke-width="2" d="M12 0v24"/>',
        lava: '<path fill="#69342d" d="M0 0h24v24H0z"/><path fill="none" stroke="#f3a15c" stroke-width="2" d="M1 7q4-3 8 0t8 0t8 0M-3 17q4-3 8 0t8 0t8 0"/>'
    };

    const symbols = {
        ".": ["floor", "Floor"], "·": ["floor", "Floor"], "#": ["corridor", "Corridor"],
        "^": ["trap", "Trap"], '"': ["amulet", "Amulet or web"],
        "-": ["wall", "Wall"], "|": ["wall", "Wall"], "+": ["door", "Closed door"],
        "@": ["creature", "Humanoid"], "G": ["creature", "Creature"],
        "<": ["stairsUp", "Stairs up"], ">": ["stairsDown", "Stairs down"],
        "!": ["potion", "Potion"], "?": ["scroll", "Scroll"], "=": ["ring", "Ring"],
        "*": ["gem", "Gem or stone"], "%": ["food", "Food or corpse"],
        ")": ["weapon", "Weapon"], "[": ["armor", "Armor"], "(": ["tool", "Tool or container"],
        "0": ["boulder", "Boulder"], "$": ["gold", "Gold"],
        "/": ["wand", "Wand"], "{": ["fountain", "Fountain"], "_": ["altar", "Altar"],
        "▒": ["door", "Closed door"]
    };

    const describeCell = (scene, character, color, x, y) => {
        const hint = scene.labels[`${x},${y}`] || "";
        if (scene.overlays.some((box) => x >= box.x && x < box.x + box.width && y >= box.y && y < box.y + box.height)) return ["interface", "Menu text"];
        if (scene.player && x === scene.player[0] && y === scene.player[1]) return ["player", "Player"];
        // Source labels disambiguate characters that depend on display settings.
        const namedKinds = { "Tree": "tree", "Iron bars": "bars", "Magic missile": "beam", "Spellbook": "spellbook", "Fountain": "fountain", "Altar": "altar", "Moat": "water", "Water": "water", "Medusa": "medusa", "Jellyfish": "jellyfish", "Giant eel": "eel", "Water troll": "waterTroll" };
        if (namedKinds[hint]) return [namedKinds[hint], hint];
        if (hint === "Secret door") return ["wall", "Secret door"];
        if ((character === "-" || character === "|") && (hint === "Door" || color === "#aa5500")) return ["openDoor", "Open door"];
        if (character === "|") return ["wall", "Wall"];
        if (/^[┌┐└┘├┤┬┴┼─│]$/.test(character)) return ["wall", "Wall"];
        if (character === "}") {
            if (["#0000aa", "#5555ff"].includes(color)) return ["water", "Water"];
            if (["#aa0000", "#ff5555"].includes(color)) return ["lava", "Lava"];
            return [null, "Water or lava"];
        }
        if (character === "+" && hint !== "Door") {
            if (color !== "#aa5500") return ["spellbook", "Spellbook"];
            return ["door", "Door or spellbook"];
        }
        // Warning numbers locate a threat without identifying the creature.
        if (/^[1-5]$/.test(character)) return [null, "Monster warning"];
        if (/^[a-zA-Z&;:']$/.test(character)) return ["creature", "Creature or statue"];
        return symbols[character] || [null, hint || `Symbol ${character}`];
    };

    const defs = svgElement("defs");
    Object.entries(artwork).forEach(([name, markup]) => {
        const symbol = svgElement("g", { id: `dungeon-tile-${name}` });
        symbol.innerHTML = markup;
        defs.append(symbol);
    });

    const graphic = (name) => svgElement("use", { href: `#dungeon-tile-${name}` });
    const ascii = (character, color) => svgElement("text", {
        x: 12, y: 17, fill: color || "#bbbbbb", "text-anchor": "middle", class: "map-ascii-cell"
    }, character);

    const updateStatus = () => {
        const scene = scenes[activeScene];
        const playerDescription = scene.player
            ? " The player is marked by a blue circle."
            : " No player position is identified in this source.";
        status.textContent = `${scene.name}, example ${sceneIds.indexOf(activeScene) + 1} of ${sceneIds.length}.`;
        const monsterDescription = Object.values(scene.labels).includes("Medusa")
            ? " The player stands beside Medusa as her gaze is reflected by a shield."
            : "";
        const terrainDescription = scene.terrainReveal ? ` ${scene.terrainReveal.note}` : "";
        surface.querySelector("svg").setAttribute("aria-label", `${scene.name}, simplified graphical symbols.${monsterDescription}${playerDescription}${terrainDescription}`);
    };

    const renderScene = () => {
        const scene = scenes[activeScene];
        const svg = svgElement("svg", {
            viewBox: `0 0 ${scene.width * tileSize} ${scene.height * tileSize}`,
            role: "img", class: "map-grid"
        });
        svg.append(defs);
        const cells = svgElement("g", { "aria-hidden": "true" });
        const bounds = { left: scene.width, right: -1, top: scene.height, bottom: -1 };
        scene.rows.forEach((row, y) => {
            [...row].forEach((recordedCharacter, x) => {
                const revealedCharacter = scene.terrainReveal?.rows[y][x] || " ";
                const revealed = recordedCharacter === " " && revealedCharacter !== " ";
                const character = revealed ? revealedCharacter : recordedCharacter;
                if (character === " ") return;
                bounds.left = Math.min(bounds.left, x);
                bounds.right = Math.max(bounds.right, x);
                bounds.top = Math.min(bounds.top, y);
                bounds.bottom = Math.max(bounds.bottom, y);
                const color = revealed ? "#0000aa" : scene.colors[y][x];
                const [kind, label] = describeCell(scene, character, color, x, y);
                const cell = svgElement("g", { transform: `translate(${x * tileSize} ${y * tileSize})`, "data-kind": kind || "symbol" });
                if (revealed) cell.setAttribute("data-revealed-terrain", "true");
                const cellDescription = revealed ? `${label} · Added from the wiki layout` : (kind === "player" ? label : scene.labels[`${x},${y}`] || label);
                cell.append(svgElement("title", {}, `${character} · ${cellDescription}`));
                const graphical = svgElement("g", { class: "map-graphical-cell" });
                if (kind && !["wall", "corridor", "water", "lava", "interface"].includes(kind)) graphical.append(graphic("floor"));
                graphical.append(kind && kind !== "interface" ? graphic(kind) : ascii(character, color));
                if (kind === "medusa") {
                    graphical.append(svgElement("text", {
                        x: 12, y: -4, "text-anchor": "middle", class: "map-monster-label"
                    }, "Medusa"));
                }
                cell.append(graphical);
                cells.append(cell);
            });
        });
        // Center the displayed extent without changing source coordinates or cell scale.
        // The viewport remains 79 × 21 cells in every scene.
        const originColumn = (bounds.left + bounds.right + 1 - scene.width) / 2;
        const originRow = (bounds.top + bounds.bottom + 1 - scene.height) / 2;
        svg.setAttribute("viewBox", `${originColumn * tileSize} ${originRow * tileSize} ${scene.width * tileSize} ${scene.height * tileSize}`);
        svg.append(cells);
        surface.replaceChildren(svg);
        // Both inline and enlarged views size the same fixed grid through CSS.
        svg.style.setProperty("--map-columns", scene.width);
        sceneSelect.value = activeScene;
        sceneCount.textContent = `${sceneIds.indexOf(activeScene) + 1} / ${sceneIds.length}`;
        sourceLink.href = scene.source.url;
        sourceLink.textContent = scene.name;
        message.textContent = scene.message;
        playerStats.textContent = scene.status.join("\n");
        // Layout diagrams have no player state. Clear both fields when switching
        // to them so a previous screenshot's message or stats never carry over.
        message.setAttribute("aria-hidden", String(!scene.message));
        playerStats.setAttribute("aria-hidden", String(!scene.status.length));
        updateStatus();
        requestAnimationFrame(() => centerOnColumn(scene.player ? scene.player[0] + 0.5 : (bounds.left + bounds.right + 1) / 2));
    };

    const groups = new Map();
    sceneIds.forEach((id) => {
        const scene = scenes[id];
        if (!groups.has(scene.group)) {
            const group = document.createElement("optgroup");
            group.label = scene.group;
            sceneSelect.append(group);
            groups.set(scene.group, group);
        }
        const option = document.createElement("option");
        option.value = id;
        option.textContent = scene.name;
        groups.get(scene.group).append(option);
    });
    const resetProgress = () => {
        elapsed = 0;
        lastFrameTime = null;
        progress.style.transform = "scaleX(0)";
    };
    const selectScene = (id) => {
        if (!scenes[id]) return;
        resetProgress();
        if (activeScene !== id) {
            activeScene = id;
            renderScene();
        }
    };
    const nextScene = () => selectScene(sceneIds[(sceneIds.indexOf(activeScene) + 1) % sceneIds.length]);

    const tick = (time) => {
        if (lastFrameTime !== null) elapsed += time - lastFrameTime;
        lastFrameTime = time;
        if (elapsed >= sceneDuration) nextScene();
        progress.style.transform = `scaleX(${elapsed / sceneDuration})`;
        playbackFrame = requestAnimationFrame(tick);
    };
    const updatePlayback = () => {
        const playing = autoplay && inView && !document.hidden && document.activeElement !== sceneSelect;
        viewer.dataset.autoplay = String(autoplay);
        const label = autoplay ? "Pause automatic level changes" : "Play automatic level changes";
        playbackButton.setAttribute("aria-label", label);
        playbackButton.title = label;
        // Automatic transitions should not interrupt screen reader narration.
        status.setAttribute("aria-live", playing ? "off" : "polite");
        if (playing && playbackFrame === null) {
            lastFrameTime = null;
            playbackFrame = requestAnimationFrame(tick);
        } else if (!playing) {
            cancelAnimationFrame(playbackFrame);
            playbackFrame = null;
            lastFrameTime = null;
        }
    };
    sceneSelect.addEventListener("change", () => selectScene(sceneSelect.value));
    sceneSelect.addEventListener("focus", updatePlayback);
    sceneSelect.addEventListener("blur", updatePlayback);
    viewer.querySelector("[data-map-previous]").addEventListener("click", () => selectScene(sceneIds[(sceneIds.indexOf(activeScene) - 1 + sceneIds.length) % sceneIds.length]));
    viewer.querySelector("[data-map-next]").addEventListener("click", nextScene);
    playbackButton.addEventListener("click", () => {
        autoplay = !autoplay;
        updatePlayback();
    });
    document.addEventListener("visibilitychange", updatePlayback);
    reducedMotion.addEventListener("change", () => {
        if (reducedMotion.matches) {
            autoplay = false;
            updatePlayback();
        }
    });
    const visibilityObserver = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting && entry.intersectionRatio >= 0.25;
        updatePlayback();
    }, { threshold: [0, 0.25] });

    let placeholder;
    let returnFocus;
    let pointerStart;
    let pointerMoved = false;
    let closingColumn = 0;

    const visibleColumn = () => {
        const svg = surface.querySelector("svg");
        const cellWidth = svg.getBoundingClientRect().width / scenes[activeScene].width;
        return svg.viewBox.baseVal.x / tileSize + (surface.scrollLeft + surface.clientWidth / 2) / cellWidth;
    };

    const centerOnColumn = (column) => {
        const svg = surface.querySelector("svg");
        const cellWidth = svg.getBoundingClientRect().width / scenes[activeScene].width;
        surface.scrollLeft = Math.max(0, (column - svg.viewBox.baseVal.x / tileSize) * cellWidth - surface.clientWidth / 2);
    };

    const openMap = () => {
        if (dialog.open) return;
        const column = visibleColumn();
        returnFocus = document.activeElement === expandButton ? expandButton : surface;
        // Move the live viewer to preserve its controls and avoid duplicate SVG IDs.
        placeholder = document.createElement("div");
        placeholder.style.height = `${viewer.getBoundingClientRect().height}px`;
        const style = getComputedStyle(viewer);
        placeholder.style.marginTop = style.marginTop;
        placeholder.style.marginBottom = style.marginBottom;
        viewer.before(placeholder);
        dialog.append(viewer);
        document.documentElement.classList.add("map-dialog-open");
        dialog.showModal();
        expandButton.setAttribute("aria-label", "Close enlarged level view");
        expandButton.title = "Close enlarged level view";
        expandButton.removeAttribute("aria-haspopup");
        surface.setAttribute("role", "region");
        surface.setAttribute("aria-label", "Level view, scroll horizontally to explore");
        surface.removeAttribute("aria-haspopup");
        surface.removeAttribute("aria-controls");
        centerOnColumn(column);
        expandButton.focus({ preventScroll: true });
    };

    dialog.addEventListener("close", () => {
        // A closed dialog has no layout, so restore its saved visible center.
        placeholder.replaceWith(viewer);
        document.documentElement.classList.remove("map-dialog-open");
        expandButton.setAttribute("aria-label", "Enlarge level view");
        expandButton.title = "Enlarge level view";
        expandButton.setAttribute("aria-haspopup", "dialog");
        surface.setAttribute("role", "button");
        surface.setAttribute("aria-label", "Enlarge NetHack level view");
        surface.setAttribute("aria-haspopup", "dialog");
        surface.setAttribute("aria-controls", dialog.id);
        centerOnColumn(closingColumn);
        returnFocus.focus({ preventScroll: true });
    });

    const closeMap = () => {
        closingColumn = visibleColumn();
        dialog.close();
    };
    dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        closeMap();
    });
    expandButton.addEventListener("click", () => dialog.open ? closeMap() : openMap());

    surface.addEventListener("pointerdown", (event) => {
        pointerStart = { x: event.clientX, y: event.clientY, scroll: surface.scrollLeft };
        pointerMoved = false;
    });
    surface.addEventListener("pointermove", (event) => {
        if (pointerStart && Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 8) pointerMoved = true;
    });
    surface.addEventListener("pointercancel", () => { pointerMoved = true; });
    surface.addEventListener("click", () => {
        if (pointerMoved || (pointerStart && Math.abs(surface.scrollLeft - pointerStart.scroll) > 8)) return;
        openMap();
    });
    surface.addEventListener("keydown", (event) => {
        if (!dialog.open && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            openMap();
        }
    });

    const outsideDialog = (event) => {
        const bounds = dialog.getBoundingClientRect();
        return event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom;
    };
    let backdropPress = false;
    dialog.addEventListener("pointerdown", (event) => { backdropPress = event.target === dialog && outsideDialog(event); });
    dialog.addEventListener("click", (event) => {
        if (backdropPress && event.target === dialog && outsideDialog(event)) closeMap();
    });

    renderScene();
    viewer.hidden = false;
    updatePlayback();
    visibilityObserver.observe(surface);
})();
