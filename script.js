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
    const previous = gallery.querySelector("[data-gallery-prev]");
    const next = gallery.querySelector("[data-gallery-next]");

    const selectTask = (choice, shouldPlay = true) => {
        const index = choices.indexOf(choice);

        choices.forEach((item) => {
            const isSelected = item === choice;
            item.classList.toggle("is-active", isSelected);
            item.setAttribute("aria-pressed", String(isSelected));
        });

        video.pause();
        source.src = choice.dataset.src;
        video.setAttribute("aria-label", `GPT-5 solves MiniHack ${choice.dataset.title.replace(" solved", "")}`);
        video.load();

        title.textContent = choice.dataset.title;
        description.textContent = choice.dataset.description;
        family.textContent = choice.dataset.family;
        decisions.textContent = choice.dataset.decisions;
        current.textContent = String(index + 1).padStart(2, "0");

        choice.scrollIntoView({ behavior: "smooth", block: "nearest" });

        if (shouldPlay) {
            video.play().catch(() => {
                // The selected video remains ready when autoplay is unavailable.
            });
        }
    };

    choices.forEach((choice) => {
        choice.addEventListener("click", () => selectTask(choice));
    });

    previous.addEventListener("click", () => {
        const activeIndex = choices.findIndex((choice) => choice.classList.contains("is-active"));
        selectTask(choices[(activeIndex - 1 + choices.length) % choices.length]);
    });

    next.addEventListener("click", () => {
        const activeIndex = choices.findIndex((choice) => choice.classList.contains("is-active"));
        selectTask(choices[(activeIndex + 1) % choices.length]);
    });
}

const videos = [...document.querySelectorAll("video")];

videos.forEach((video) => {
    video.addEventListener("play", () => {
        videos.forEach((otherVideo) => {
            if (otherVideo !== video) {
                otherVideo.pause();
            }
        });
    });
});
