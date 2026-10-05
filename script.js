const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const gallery = document.querySelector("[data-task-gallery]");
if (gallery) {
    const video = gallery.querySelector(".task-video");
    const source = video.querySelector("source");
    const choices = [...gallery.querySelectorAll(".task-choice")];
    const title = gallery.querySelector("[data-task-title]");
    const description = gallery.querySelector("[data-task-description]");
    const family = gallery.querySelector("[data-task-family]");
    const decisions = gallery.querySelector("[data-task-decisions]");
    const current = gallery.querySelector("[data-task-current]");

    const selectTask = (choice) => {
        if (!choice) return;
        const resumePlayback = !video.paused;
        const index = choices.indexOf(choice);
        choices.forEach((item) => {
            const selected = item === choice;
            item.classList.toggle("is-active", selected);
            item.setAttribute("aria-pressed", String(selected));
        });

        video.pause();
        source.src = choice.dataset.src;
        video.poster = choice.dataset.poster || choice.querySelector("img").src;
        video.setAttribute("aria-label", `GPT-5 solves MiniHack ${choice.dataset.title.replace(" solved", "")}`);
        video.load();
        title.textContent = choice.dataset.title;
        description.textContent = choice.dataset.description;
        family.textContent = choice.dataset.family;
        decisions.textContent = choice.dataset.decisions;
        current.textContent = String(index + 1).padStart(2, "0");
        if (resumePlayback) video.play().catch(() => {});
    };

    choices.forEach((choice) => {
        choice.addEventListener("click", () => selectTask(choice));
    });
    const move = (offset) => {
        const activeIndex = choices.findIndex((choice) => choice.classList.contains("is-active"));
        selectTask(choices[(activeIndex + offset + choices.length) % choices.length]);
    };
    gallery.querySelector("[data-gallery-prev]").addEventListener("click", () => move(-1));
    gallery.querySelector("[data-gallery-next]").addEventListener("click", () => move(1));
}

const videos = [...document.querySelectorAll("video")];
videos.forEach((video) => {
    video.addEventListener("play", () => {
        videos.forEach((other) => {
            if (other !== video) other.pause();
        });
    });
});

const copyButton = document.querySelector("[data-copy-citation]");
if (copyButton) {
    const citation = document.querySelector("#citation-text");
    const status = document.querySelector("[data-copy-status]");
    copyButton.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(citation.textContent);
            status.textContent = "Citation copied to the clipboard.";
        } catch {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(citation);
            selection.removeAllRanges();
            selection.addRange(range);
            status.textContent = "Citation selected. Use your browser’s copy command to copy it.";
        }
    });
}

const article = document.querySelector(".essay");
const progress = document.querySelector(".reading-progress");
let progressScheduled = false;
const updateProgress = () => {
    progressScheduled = false;
    if (!article || !progress) return;
    const bounds = article.getBoundingClientRect();
    const distance = Math.max(1, bounds.height - window.innerHeight);
    const fraction = Math.max(0, Math.min(1, -bounds.top / distance));
    progress.style.transform = `scaleX(${fraction})`;
};
const requestProgress = () => {
    if (!progressScheduled) {
        progressScheduled = true;
        window.requestAnimationFrame(updateProgress);
    }
};
window.addEventListener("scroll", requestProgress, { passive: true });
window.addEventListener("resize", requestProgress);
window.addEventListener("load", requestProgress);
if (article && "ResizeObserver" in window) new ResizeObserver(requestProgress).observe(article);
requestProgress();

document.querySelectorAll("details").forEach((details) => {
    details.addEventListener("toggle", () => {
        if (!details.open) details.querySelectorAll("video").forEach((video) => video.pause());
        requestProgress();
    });
});

// Keep the original page's shared section links useful after the redesign.
const previousSections = {
    abstract: "motivation",
    method: "study",
    experiments: "findings",
    rollouts: "progress",
    explore: "progress",
    "zero-shot-results": "progress",
    "minihack-results": "progress",
    "cost-results": "cost",
    "mixed-control-results": "fallback",
    "rl-results": "learning",
    sft: "learning",
    "sft-results": "learning"
};
const followPreviousSection = () => {
    const target = document.getElementById(previousSections[window.location.hash.slice(1)]);
    if (target) {
        target.scrollIntoView({ behavior: prefersReducedMotion.matches ? "instant" : "smooth" });
    }
};
window.addEventListener("hashchange", followPreviousSection);
window.addEventListener("load", followPreviousSection);
