$(document).ready(function () {
    initStreamTracker();
    initStreamTabs();
    const cdnUrl = "https://cdn2.imissreine.com";

    loadJsonData("/static/home/json/submissions.json")
        .then(submissions => {
            renderSubmissions(cdnUrl, submissions);
            renderMessages(submissions);
        })
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

function createMessageNote(name, message) {
    return `
        <article class="message-note">
            <p>${formatMessage(message)}</p>
            <strong>— ${escapeHtml(name)}</strong>
        </article>
    `;
}

function renderMessages(submissions) {
    const container = $("#birthday_messages");
    container.html("");

    submissions.forEach(function (submission) {
        const name = submission.Name || "Anonymous";
        const messages = submission.Message || [];

        const combinedMessage = Array.isArray(messages)
            ? messages.filter(Boolean).join("\n\n")
            : messages || "";

        if (!combinedMessage) return;

        container.append(createMessageNote(name, combinedMessage));
    });
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

function checkSelection() {
    const month = document.getElementById('month-select').value;
    const day = document.getElementById('day-select').value;
    document.getElementById('confirm-selection').disabled = !(month && day);
}

document.addEventListener('DOMContentLoaded', checkSelection);

function updateResult() {
    const month = document.getElementById('month-select').value;
    const day = document.getElementById('day-select').value;
    const language = document.getElementById('language-select').value;
    const image = document.getElementById('reine-image');
    const imageUrlInput = document.getElementById('image-url');

    if (!month || !day) {
        alert("Please select both month and day.");
        return;
    }

    const imageUrl = `/generate-image/?month=${encodeURIComponent(month)}&day=${encodeURIComponent(day)}&language=${encodeURIComponent(language)}&disposition=inline`;

    image.src = imageUrl;
    imageUrlInput.value = imageUrl;
}

function downloadImage() {
    const month = document.getElementById('month-select').value;
    const day = document.getElementById('day-select').value;
    const language = document.getElementById('language-select').value;

    if (!month || !day) {
        alert("Please select both month and day.");
        return;
    }

    const downloadUrl = `/generate-image/?month=${encodeURIComponent(month)}&day=${encodeURIComponent(day)}&language=${encodeURIComponent(language)}&disposition=attachment`;
    window.location.href = downloadUrl;
}

function parseISODate(dateString) {
    const date = new Date(dateString);

    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

function getYoutubeThumbnail(id) {
    return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
}

function createStreamCard(video, label = "") {
    return `
        <article class="stream-card">
            <a href="https://www.youtube.com/watch?v=${video.id}"
                target="_blank" rel="noopener noreferrer">

                <img src="${getYoutubeThumbnail(video.id)}"
                    alt="${escapeHtml(video.title)}"
                    loading="lazy">

                <div class="stream-card-content">
                    ${label ? `<span class="stream-label">${label}</span>` : ""}
                    <h3>${escapeHtml(video.title)}</h3>
                    ${video.published_at
                        ? `<time>${parseISODate(video.published_at)}</time>`
                        : ""}
                </div>
            </a>
        </article>
    `;
}

function loadReineVideos(channel, apiKey, reineuuu, lfgreine) {
    $.ajax({
        url: `https://holodex.net/api/v2/channels/${channel}/videos`,
        headers: { "X-APIKEY": apiKey },
        timeout: 20000,

        success: function (res) {
            const live = res.filter(video =>
                video.status === "live" &&
                video.type === "stream"
            );

            const upcoming = res.filter(video =>
                video.status === "upcoming"
            );

            const past = res.filter(video =>
                video.status === "past" &&
                video.type === "stream"
            ).slice(0, 6);

            if (live.length) {
                $("#live-status").html(`
                    <div class="status-character">
                        <img src="${lfgreine}" alt="Reine LFG">
                    </div>

                    <div>
                        <span class="status-label">LIVE NOW</span>
                        <h3>SHE'S HERE!!!</h3>
                        <p>LET'S GOOOOO — NOW WATCH HER</p>
                    </div>
                `);

                $("#live-streams").html(`
                    <div class="stream-group">
                        <h3 class="stream-group-title">Current Livestream</h3>

                        <div class="stream-grid">
                            ${live.map(video =>
                                createStreamCard(video, "LIVE")
                            ).join("")}
                        </div>
                    </div>
                `);
            } else {
                $("#live-status").html(`
                    <div class="status-character">
                        <img src="${reineuuu}" alt="Reine">
                    </div>

                    <div>
                        <span class="status-label">OFFLINE</span>
                        <h3>I MISS REINE</h3>
                        <p>uuuuuuuuuuuu</p>
                    </div>
                `);

                $("#live-streams").html("");
            }

            if (upcoming.length) {
                $("#upcoming-streams").html(`
                    <div class="stream-group">
                        <h3 class="stream-group-title">Upcoming Livestreams</h3>

                        <div class="stream-grid">
                            ${upcoming.map(video =>
                                createStreamCard(video, "UPCOMING")
                            ).join("")}
                        </div>
                    </div>
                `);
            } else {
                $("#upcoming-streams").html("");
            }

            if (past.length) {
                $("#past-videos").html(`
                    <div class="stream-grid">
                        ${past.map(video =>
                            createStreamCard(video)
                        ).join("")}
                    </div>
                `);
            } else {
                $("#past-videos").html("<p>No recent livestreams found.</p>");
            }
        },

        error: function () {
            $("#live-status").html(
                "<p>Failed to load stream information.</p>"
            );

            $("#live-streams").html("");
            $("#upcoming-streams").html("");

            $("#past-videos").html(
                "<p>Failed to load recent livestreams.</p>"
            );
        }
    });
}

function loadReineCollabs(channel, apiKey, smolReine) {
    $.ajax({
        url: `https://holodex.net/api/v2/channels/${channel}/collabs`,
        headers: { "X-APIKEY": apiKey },
        timeout: 20000,

        success: function (res) {
            const live = res.filter(video =>
                video.status === "live" &&
                video.type === "stream"
            );

            const past = res.filter(video =>
                video.status === "past" &&
                video.type === "stream"
            ).slice(0, 6);

            if (live.length) {
                $("#live-collabs").html(`
                    <div class="collab-live">
                        <img src="${smolReine}" alt="Smol Reine">

                        <div>
                            <span class="status-label">LIVE COLLAB</span>

                            <h3>
                                She's in
                                <a href="https://www.youtube.com/channel/${live[0].channel.id}"
                                    target="_blank"
                                    rel="noopener noreferrer">
                                    ${escapeHtml(live[0].channel.name)}
                                </a>'s channel!
                            </h3>

                            <p>LET'S GOOOOO</p>
                        </div>
                    </div>
                `);
            } else {
                $("#live-collabs").html("");
            }

            if (past.length) {
                $("#past-collabs-videos").html(`
                    <div class="stream-grid">
                        ${past.map(video =>
                            createStreamCard(video)
                        ).join("")}
                    </div>
                `);
            } else {
                $("#past-collabs-videos").html(
                    "<p>No recent collabs found.</p>"
                );
            }
        },

        error: function () {
            $("#live-collabs").html("");

            $("#past-collabs-videos").html(
                "<p>Failed to load collabs.</p>"
            );
        }
    });
}

function loadPlaylist(playlistId, apiKey, container) {
    $.ajax({
        url: "https://youtube.googleapis.com/youtube/v3/playlistItems",
        data: {
            part: "contentDetails,snippet",
            maxResults: 50,
            playlistId: playlistId,
            key: apiKey
        },
        timeout: 20000,

        success: function (res) {
            const cards = res.items.map(item => {
                const video = {
                    id: item.contentDetails.videoId,
                    title: item.snippet.title,
                    published_at: item.contentDetails.videoPublishedAt
                };

                return createStreamCard(video);
            }).join("");

            $(container).html(`
                <div class="stream-grid">
                    ${cards}
                </div>
            `);
        },

        error: function () {
            $(container).html(
                "<p>Failed to load videos.</p>"
            );
        }
    });
}

function initStreamTabs() {
    $(".stream-tab").on("click", function () {
        $(".stream-tab").removeClass("is-active");
        $(".stream-tab-content").removeClass("is-active");

        $(this).addClass("is-active");
        $("#" + $(this).data("tab")).addClass("is-active");
    });
}

function initStreamTracker() {
    const youtubeKey = document.getElementById("youtube-api-key")?.value;
    const holodexKey = document.getElementById("holodex-api-key")?.value;
    const reineuuu = document.getElementById("reineuuu")?.value;
    const lfgreine = document.getElementById("lfgreine")?.value;
    const smolReine = document.getElementById("smol_reine")?.value;

    if (!holodexKey) return;

    const channel = "UChgTyjG-pdNvxxhdsXfHQ5Q";
    const oriSongs = "PLImqk9B7uZvD1V1wjJQ3PPVmPLsSkoP-B";
    const coverSongs = "PLImqk9B7uZvCiAToT79-heLOII99c9yKh";

    $("#youtube-api-key, #holodex-api-key").remove();

    loadReineVideos(channel, holodexKey, reineuuu, lfgreine);
    loadReineCollabs(channel, holodexKey, smolReine);

    if (youtubeKey) {
        loadPlaylist(oriSongs, youtubeKey, "#ori-songs-list");
        loadPlaylist(coverSongs, youtubeKey, "#cover-songs-list");
    }
}