$(document).ready(function () {
    const cdnUrl = "https://cdn2.imissreine.com";
    loadJsonData("/static/home/json/submissions.json")
        .then(submissions => renderSubmissions(cdnUrl, submissions))
        .catch(error => console.error("Error loading submissions:", error));
});

async function loadJsonData(jsonPath) {
    const response = await fetch(jsonPath);
    if (!response.ok) throw new Error("Failed to fetch submissions: " + response.status);
    return await response.json();
}

function renderSubmissions(cdnUrl, submissions) {
    const container = $("#submission_container");
    container.html("");
    let modalsHtml = "";

    submissions.forEach(function (submission) {
        const name = submission.Name || "Anonymous";
        const socialMedia = submission.SocialMedia || "";
        const messages = submission.Message || [];
        const tags = submission.Tag || [];
        const art = Array.isArray(submission.Art)
            ? submission.Art.filter(file => !file.toUpperCase().startsWith("AD_"))
            : [];

        if (art.length === 0) return;

        const combinedMessage = Array.isArray(messages)
            ? messages.filter(Boolean).join("\n\n")
            : messages || "";

        const thumbnailUrl = buildCdnUrl(cdnUrl, art[0]);
        const modalId = createSafeId(name);

        container.append(createGalleryCard(modalId, thumbnailUrl, name));
        modalsHtml += createSubmissionModal(
            modalId,
            cdnUrl,
            art,
            name,
            combinedMessage,
            socialMedia,
            tags
        );
    });

    $("body").append(modalsHtml);
}

function buildCdnUrl(cdnUrl, fileName) {
    return cdnUrl + "/" + encodeURIComponent(fileName);
}

function createSafeId(value) {
    return encodeURIComponent(value)
        .replace(/%/g, "-")
        .replace(/[^a-zA-Z0-9-_]/g, "-");
}

function createGalleryCard(modalId, thumbnailUrl, name) {
    return `
        <article class="submission-card">
            <button type="button" class="submission-card-button" onclick="showModal('${modalId}')">
                <img src="${thumbnailUrl}" alt="Submission by ${escapeHtml(name)}"
                    class="submission-thumbnail" loading="lazy" decoding="async"
                    oncontextmenu="return false;" ondragstart="return false;">
                <div class="submission-card-info">
                    <h2 class="submission-card-name">${escapeHtml(name)}</h2>
                </div>
            </button>
        </article>
    `;
}

function createSubmissionModal(modalId, cdnUrl, artFiles, name, message, socialMedia, tags) {
    const socialHtml = createSocialMediaHtml(socialMedia);
    let slidesHtml = "";

    artFiles.forEach(function (fileName, index) {
        const url = buildCdnUrl(cdnUrl, fileName);

        slidesHtml += `
            <div class="carousel-slide ${index === 0 ? "is-current" : ""}" data-index="${index}">
                <div class="loading-spinner"><div class="spinner"></div></div>
                <img data-src="${url}" alt="${escapeHtml(fileName)}"
                    class="carousel-image lazyload"
                    oncontextmenu="return false;" ondragstart="return false;">
            </div>
        `;
    });

    const controls = artFiles.length > 1
        ? `
            <button type="button" class="carousel-button carousel-previous"
                onclick="previousSlide('${modalId}')">&#10094;</button>
            <button type="button" class="carousel-button carousel-next"
                onclick="nextSlide('${modalId}')">&#10095;</button>
            <div class="carousel-counter">
                <span id="carousel-current-${modalId}">1</span> / ${artFiles.length}
            </div>
        `
        : "";

    return `
        <div class="modal submission-modal" id="modal-${modalId}"
            data-current-index="0" data-slide-count="${artFiles.length}">
            <div class="modal-background" onclick="closeModal('${modalId}')"></div>
            <div class="modal-content submission-modal-content">
                <div class="submission-carousel">
                    <div class="carousel-slides">${slidesHtml}</div>
                    ${controls}
                </div>
                <div class="submission-info">
                    <h2 class="submission-name">${escapeHtml(name)}</h2>
                    <hr>
                    ${message ? `<div class="submission-message">${formatMessage(message)}</div>` : ""}
                    ${socialHtml ? `<div class="social-media-links">${socialHtml}</div>` : ""}
                </div>
            </div>
            <button class="modal-close is-large" aria-label="close"
                onclick="closeModal('${modalId}')"></button>
        </div>
    `;
}

function showModal(modalId) {
    $("#modal-" + modalId).addClass("is-active");
    loadCurrentSlide(modalId);
}

function closeModal(modalId) {
    $("#modal-" + modalId).removeClass("is-active");
}

function loadCurrentSlide(modalId) {
    const modal = $("#modal-" + modalId);
    const index = parseInt(modal.attr("data-current-index"), 10);
    const slide = modal.find('.carousel-slide[data-index="' + index + '"]');
    const image = slide.find("img.carousel-image");
    const spinner = slide.find(".loading-spinner");

    if (image.attr("src")) {
        spinner.hide();
        updateModalLayout(modalId, image[0]);
        return;
    }

    spinner.show();
    image.attr("src", image.attr("data-src"));

    image.one("load", function () {
        spinner.hide();
        image.removeClass("lazyload");
        updateModalLayout(modalId, this);
    });
}

function nextSlide(modalId) {
    const modal = $("#modal-" + modalId);
    const count = parseInt(modal.attr("data-slide-count"), 10);
    let index = parseInt(modal.attr("data-current-index"), 10) + 1;
    if (index >= count) index = 0;
    changeSlide(modalId, index);
}

function previousSlide(modalId) {
    const modal = $("#modal-" + modalId);
    const count = parseInt(modal.attr("data-slide-count"), 10);
    let index = parseInt(modal.attr("data-current-index"), 10) - 1;
    if (index < 0) index = count - 1;
    changeSlide(modalId, index);
}

function changeSlide(modalId, index) {
    const modal = $("#modal-" + modalId);

    modal.find(".carousel-slide").removeClass("is-current");
    modal.find('.carousel-slide[data-index="' + index + '"]').addClass("is-current");
    modal.attr("data-current-index", index);

    const counter = $("#carousel-current-" + modalId);
    if (counter.length) counter.text(index + 1);

    loadCurrentSlide(modalId);
}

function createSocialMediaHtml(value) {
    if (!value) return "";

    return value
        .split("|")
        .map(entry => entry.trim())
        .filter(Boolean)
        .map(function (entry) {
            if (entry.startsWith("http://") || entry.startsWith("https://")) {
                const icon = getSocialMediaIcon(entry);
                const prefix = icon === "link" ? "fas" : "fab";

                return `
                    <a href="${escapeHtml(entry)}" target="_blank"
                        rel="noopener noreferrer" class="social-media-link">
                        <i class="${prefix} fa-${icon}"></i>
                    </a>
                `;
            }

            return `
                <span class="discord-link">
                    <i class="fab fa-discord"></i>
                    <span class="discord-tooltip">${escapeHtml(entry)}</span>
                </span>
            `;
        })
        .join("");
}

function getSocialMediaIcon(link) {
    const lower = link.toLowerCase();
    if (lower.includes("youtube.com")) return "youtube";
    if (lower.includes("twitter.com") || lower.includes("x.com")) return "twitter";
    if (lower.includes("instagram.com")) return "instagram";
    if (lower.includes("facebook.com")) return "facebook";
    if (lower.includes("tiktok.com")) return "tiktok";
    return "link";
}

function formatMessage(message) {
    return escapeHtml(message).replace(/\n/g, "<br>");
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

$(document).on("keydown", function (event) {
    if (event.key === "Escape") $(".submission-modal.is-active").removeClass("is-active");
});

function updateModalLayout(modalId, image) {
    const modal = $("#modal-" + modalId);
    if (!image.naturalWidth || !image.naturalHeight) return;

    const ratio = image.naturalWidth / image.naturalHeight;
    modal.toggleClass("is-ultrawide", ratio >= 2);
}