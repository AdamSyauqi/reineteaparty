function openTab(evt, tabName) {
    var i, x, tablinks;
    x = document.getElementsByClassName("content-tab");
    for (i = 0; i < x.length; i++) {
        x[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tab");
    for (i = 0; i < x.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" is-active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " is-active";
  }

var mep_loud = document.getElementById("punch-sound-1");
mep_loud.volume = 0.7;

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}
const csrftoken = getCookie('csrftoken');

$(document).ready(function() {
    $('#click-button').click(function() {
        // Select a random audio element
        var sounds = ['punch-sound-1', 'punch-sound-2', 'punch-sound-3', 'punch-sound-4'];
        var randomSoundId = sounds[Math.floor(Math.random() * sounds.length)];
        var audioElement = document.getElementById(randomSoundId);
        audioElement.play();

        // Add animation class to the icon
        $('#punch-icon').addClass('punch-animation');

        // Remove animation class after animation ends
        setTimeout(function() {
            $('#punch-icon').removeClass('punch-animation');
        }, 300);

        $.ajax({
            url: incrementCounterUrl,  // Use the global variable for the URL
            type: "POST",
            headers: {'X-CSRFToken': csrftoken},
            data: {
                csrfmiddlewaretoken: csrftoken,  // Explicitly add CSRF token to data
            },
            success: function(data) {
                $('#counter').text(data.count);
            },
            error: function(xhr, errmsg, err) {
                console.log(xhr.status + ": " + xhr.responseText);
            }
        });
    });

    $(window).on('scroll', function() {
        var footerOffsetTop = $('footer').offset().top;
        var containerHeight = $('#tonjok-box').outerHeight();
        var scrollTop = $(window).scrollTop();
        var windowHeight = $(window).height();

        // Calculate the bottom offset of the floating container
        var containerBottom = scrollTop + windowHeight - containerHeight - 20; // 20px buffer

        if (containerBottom + containerHeight >= footerOffsetTop) {
            $('#tonjok-box').css({
                position: 'absolute',
                top: footerOffsetTop - containerHeight - 20 + 'px',
                bottom: 'auto'
            });
        } else {
            $('#tonjok-box').css({
                position: 'fixed',
                bottom: '20px',
                right: '20px',
                top: 'auto'
            });
        }
    });
    $('#toggle-button').click(function() {
        $('#main-content').toggle('fast', function() {
            // Update the icon based on visibility
            if ($('#main-content').is(':visible')) {
                $('#eye-icon').html('<i class="fas fa-eye"></i>');
                $('#toggle-tab').hide(); // Ensure the tab is completely hidden
            } else {
                $('#eye-icon').html('<i class="fas fa-eye-slash"></i>');
                $('#toggle-tab').show();
            }
        });
    });

    const apiKey = document.getElementById('youtube-api-key').value;
    document.getElementById('youtube-api-key').outerHTML = "";
    const holodexApiKey = document.getElementById('holodex-api-key').value;
    document.getElementById('holodex-api-key').outerHTML = "";

    const channel = 'UChgTyjG-pdNvxxhdsXfHQ5Q';
    const oriSongs = 'PLImqk9B7uZvD1V1wjJQ3PPVmPLsSkoP-B';
    const coverSongs = 'PLImqk9B7uZvCiAToT79-heLOII99c9yKh';

    function parseISODate(dateString) {
        const date = new Date(dateString);
        const day = date.getDate();
        const month = date.getMonth() + 1; // Months are zero-based
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    // channel info
    $.ajax({
        url: `https://holodex.net/api/v2/channels/${channel}`,
        headers: { 'X-APIKEY': holodexApiKey },
        timeout: 20000,
        success: function(res) {
            $(`#channel-info`).html(`<a class="youtube_link" target="_blank" rel="noopener noreferrer" href="https://www.youtube.com/@PavoliaReine"> <div class="title"> <div class="media"> <div class="media-left"> <figure class="image is-48x48"> <img src="${res.photo}" alt="Reine Youtube image"> </figure> </div> <div class="media-content"> <p class="title is-4"> ${res.name}</p> </div> </div> </div> <p>${res.description.split(`【`)[0]}</p> </a>`)
            $(`#statistics`).html(`<div class="level">
              <div class="level-item has-text-centered">
                <div>
                  <p class="heading">View Count</p>
                  <p class="title">${res.view_count.toLocaleString()}</p>
                </div>
              </div>
              <div class="level-item has-text-centered">
                <div>
                  <p class="heading">Video Count</p>
                  <p class="title">${res.video_count}</p>
                </div>
              </div>
              <div class="level-item has-text-centered">
                <div>
                  <p class="heading">Subscribers</p>
                  <p class="title">${res.subscriber_count.toLocaleString()}</p>
                </div>
              </div>
              <div class="level-item has-text-centered">
                <div>
                  <p class="heading">Clips Count</p>
                  <p class="title">${res.clip_count}</p>
                </div>
              </div>
            </div>`)
        },
        error: function() {
            $(`#channel-info`).html(`Failed to load data, please refresh the page \n Is the Holodex API taking too long?`)
            $(`#statistics`).html(`Failed to load data, please refresh the page \n Is the Holodex API taking too long?`)
        }
    })

    // collabs
    $.ajax({
        url: `https://holodex.net/api/v2/channels/${channel}/collabs`,
        headers: { 'X-APIKEY': holodexApiKey },
        timeout: 20000,
        success: function(res) {
            let live_collab_videos = []
            let live_collab_counter = 0
            let past_collab_videos = []
            let past_collab_counter = 0

            var smol_reine = document.getElementById('smol_reine').value;

            res.forEach(video => {
                if (video.status == 'live' && video.type == 'stream') {
                    live_collab_videos.push(video)
                    live_collab_counter += 1
                }
                else if (video.status == 'past' && video.type == 'stream' && past_collab_counter < 5) {
                    past_collab_videos.push(video)
                    past_collab_counter += 1
                }
            })

            if (live_collab_counter > 0) {
                $(`.live_collabs`).html(`
                    <br>
                    <div class="columns is-centered">
                        <img src="${smol_reine}" alt="Reine Smol">
                    </div>
                    <h1 class="title has-text-centered">
                        <strong>SHE'S IN <a href="https://www.youtube.com/channel/${live_collab_videos[0].channel.id}" target="_blank" rel="noopener noreferrer">${live_collab_videos[0].channel.name}</a>'s CHANNEL</strong>
                    </h1>
                    <p class="subtitle has-text-centered">
                        LET'S GOOOOO <br> NOW WATCH HER</p>
                `)
            }
            else {
                $(`.live_collabs`).html(``)
            }
            
            if (past_collab_counter > 0) {
                let past_collab_content = `<div style="width: 100%; margin: auto;">`;

                past_collab_videos.forEach(video => {
                    past_collab_content += `
                    <div class="box">
                    <a class="youtube_link" href="https://www.youtube.com/watch?v=${video.id}" target="_blank" rel="noopener noreferrer">
                        <article class="media">
                            <div class="media-left">
                                <figure class="image">
                                    <img src="https://img.youtube.com/vi/${video.id}/default.jpg" width="480" height="360" alt="Thumbnail Image">
                                </figure>
                            </div>
                            <div class="media-content">
                                <div class="content">
                                    <p>
                                    <strong>${video.title}</strong> <br> <small>${parseISODate(video.published_at)}</small>
                                    </p>
                                </div>
                            </div>
                        </article>
                    </a>
                </div>`;
                })

                $(`#past_collabs_videos`).html(past_collab_content)
            }

        },
        error: function() {
            $(`.live_collabs`).html(`Failed to load data, please refresh the page \n Is the Holodex API taking too long?`)
            $(`#past_collabs_videos`).html(`Failed to load data, please refresh the page \n Is the Holodex API taking too long?`)
        }
    })

    // livestreams, upcoming, and videos
    $.ajax({
        url: `https://holodex.net/api/v2/channels/${channel}/videos`,
        headers: { 'X-APIKEY': holodexApiKey },
        timeout: 20000,
        success: function(res) {
            let live_videos = []
            let live_counter = 0
            let upcoming_videos = []
            let upcoming_counter = 0

            let past_videos = []
            let past_counter = 0

            var lfgreine = document.getElementById('lfgreine').value;
            var reineuuu = document.getElementById('reineuuu').value;

            res.forEach(video => {
                if (video.status == "upcoming") {
                    upcoming_videos.push(video)
                    upcoming_counter += 1
                }
                else if (video.status == "live") {
                    live_videos.push(video)
                    live_counter += 1
                }
            })

            res.forEach(video => {
                if (video.status == "past" && video.type == "stream" && past_counter < 5) {
                    past_videos.push(video)
                    past_counter += 1
                }
            })

            if (live_counter > 0) {
                $(`.check-live`).html(`
                    <div class="columns is-centered">
                        <img src="${lfgreine}" alt="Reine LFG">
                    </div>
                    <h1 class="title has-text-centered">
                        <strong>SHE'S HERE!!!</strong>
                    </h1>
                    <p class="subtitle has-text-centered">
                        LET'S GOOOOO <br> NOW WATCH HER
                    </p>`
                )

                let livestream_content = `
                <h1 class="title has-text-centered">
                    Current Livestream
                </h1>
                <div style="width: 100%; margin: auto;">`;

                live_videos.forEach(video => {
                    livestream_content += `
                    <div class="box">
                        <a class="youtube_link" href="https://www.youtube.com/watch?v=${video.id}" target="_blank" rel="noopener noreferrer">
                            <article class="media">
                                <div class="media-left">
                                    <figure class="image">
                                        <img src="https://img.youtube.com/vi/${video.id}/default.jpg" width="480" height="360" alt="Thumbnail Image">
                                    </figure>
                                </div>
                                <div class="media-content">
                                    <div class="content">
                                        <p>
                                            <strong>${video.title}</strong> <br> <small>${parseISODate(video.published_at)}</small>
                                        </p>
                                    </div>
                                </div>
                            </article>
                        </a>
                    </div>`;
                })

                livestream_content += `</div>`;
                $(`.livestream`).html(livestream_content)
            }
            else if (live_counter == 0) {
                $(`.check-live`).html(`
                    <div class="columns is-centered">
                        <img src="${reineuuu}" alt="Reine UUUU">
                    </div>
                    <h1 class="title has-text-centered">
                        <strong>I MISS REINE</strong>
                    </h1>
                    <p class="subtitle has-text-centered">
                        uuuuuuuuuuuu
                    </p>`
                )
                $(`.livestream`).html(``)
            }
            
            if (upcoming_counter > 0) {
                let upcoming_content = `
                <br>
                <h1 class="title has-text-centered">
                    Upcoming Livestreams
                </h1>
                <div style="width: 100%; margin: auto;">`;

                upcoming_videos.forEach(video => {
                    upcoming_content += `
                    <div class="box">
                        <a class="youtube_link" href="https://www.youtube.com/watch?v=${video.id}" target="_blank" rel="noopener noreferrer">
                            <article class="media">
                                <div class="media-left">
                                    <figure class="image">
                                        <img src="https://img.youtube.com/vi/${video.id}/default.jpg" width="480" height="360" alt="Thumbnail Image">
                                    </figure>
                                </div>
                                <div class="media-content">
                                    <div class="content">
                                        <p>
                                            <strong>${video.title}</strong> <br> <small>${parseISODate(video.published_at)}</small>
                                        </p>
                                    </div>
                                </div>
                            </article>
                        </a>
                    </div>`;
                })

                upcoming_content += `</div>`;
                $(`.upcoming`).html(upcoming_content)
            }
            else if (upcoming_counter == 0) {
                $(`.upcoming`).html(``)
            }

            if (past_counter > 0) {
                let past_content = `
                <div style="width: 100%; margin: auto;">`;

                past_videos.forEach(video => {
                    past_content += `
                    <div class="box">
                    <a class="youtube_link" href="https://www.youtube.com/watch?v=${video.id}" target="_blank" rel="noopener noreferrer">
                        <article class="media">
                            <div class="media-left">
                                <figure class="image">
                                    <img src="https://img.youtube.com/vi/${video.id}/default.jpg" width="480" height="360" alt="Thumbnail Image">
                                </figure>
                            </div>
                            <div class="media-content">
                                <div class="content">
                                    <p>
                                    <strong>${video.title}</strong> <br> <small>${parseISODate(video.published_at)}</small>
                                    </p>
                                </div>
                            </div>
                        </article>
                    </a>
                </div>`;
                })

                $(`#past_videos`).html(past_content)
            }
        },
        error: function() {
            $(`.check-live`).html(`Failed to load data, please refresh the page \n Is the Holodex API taking too long?`)
            $(`.upcoming`).html(``)
            $(`#past_videos`).html(`Failed to load data, please refresh the page \n Is the Holodex API taking too long?`)
        }
    })

    // Fetch original songs
    $.ajax({
        url: `https://youtube.googleapis.com/youtube/v3/playlistItems?part=contentDetails&part=snippet&maxResults=50&playlistId=${oriSongs}&key=${apiKey}`,
        timeout: 20000,
        success: function(res) {
            res = res.items
            let ori_songs_videos = []

            res.forEach(video => {
                ori_songs_videos.push(video)
            })

            let ori_songs_content = `<div style="width: 100%; margin: auto;">`;

            ori_songs_videos.forEach(video => {
                ori_songs_content += `
                <div class="box">
                    <a class="youtube_link" href="https://www.youtube.com/watch?v=${video.contentDetails.videoId}" target="_blank" rel="noopener noreferrer">
                    <article class="media">
                        <div class="media-left">
                        <figure class="image">
                            <img src="${video.snippet.thumbnails.default.url}" width="480" height="360" alt="Thumbnail Image">
                        </figure>
                        </div>
                        <div class="media-content">
                        <div class="content">
                            <p>
                            <strong>${video.snippet.title}</strong> <br> <small>${parseISODate(video.contentDetails.videoPublishedAt)}</small>
                            </p>
                        </div>
                        </div>
                    </article>
                    </a>
                </div>`;
            })

            $(`#ori_songs_list`).html(ori_songs_content)
        },
        error: function() {
            $(`#ori_songs_list`).html(`Failed to load data, please refresh the page \n Is the Holodex API taking too long?`)
        }
    });

    // Fetch cover songs
    $.ajax({
        url: `https://youtube.googleapis.com/youtube/v3/playlistItems?part=contentDetails&part=snippet&maxResults=50&playlistId=${coverSongs}&key=${apiKey}`,
        timeout: 20000,
        success: function(res) {
            res = res.items
            let cover_songs_videos = []

            res.forEach(video => {
                cover_songs_videos.push(video)
            })

            let cover_songs_content = `<div style="width: 100%; margin: auto;">`;

            cover_songs_videos.forEach(video => {
                cover_songs_content += `
                <div class="box">
                    <a class="youtube_link" href="https://www.youtube.com/watch?v=${video.contentDetails.videoId}" target="_blank" rel="noopener noreferrer">
                    <article class="media">
                        <div class="media-left">
                        <figure class="image">
                            <img src="${video.snippet.thumbnails.default.url}" width="480" height="360" alt="Thumbnail Image">
                        </figure>
                        </div>
                        <div class="media-content">
                        <div class="content">
                            <p>
                            <strong>${video.snippet.title}</strong> <br> <small>${parseISODate(video.contentDetails.videoPublishedAt)}</small>
                            </p>
                        </div>
                        </div>
                    </article>
                    </a>
                </div>`;
            })

            $(`#cover_songs_list`).html(cover_songs_content)
        },
        error: function() {
            $(`#cover_songs_list`).html(`Failed to load data, please refresh the page \n Is the Holodex API taking too long?`)
        }
    });
});

function updateResult() {
    const month = document.getElementById('month-select').value;
    const day = document.getElementById('day-select').value;
    const language = document.getElementById('language-select').value;
    if (month && day && language) {
        const imageUrl = `${window.location.origin}/generate-image/?month=${encodeURIComponent(month)}&day=${encodeURIComponent(day)}&language=${encodeURIComponent(language)}&disposition=inline`;
        document.getElementById('reine-image').src = imageUrl;
        document.getElementById('image-url').value = imageUrl; // Store the image URL

        // document.getElementById('twitter-image').setAttribute("content", imageUrl);
        // document.getElementById('twitter-desc').setAttribute("content", "Check your Khodam with Reine!");
    } else {
        alert("Please select both month and day.");
    }
}

function checkSelection() {
    const monthSelect = document.getElementById('month-select').value;
    const daySelect = document.getElementById('day-select').value;
    const button = document.getElementById('confirm-selection'); // Make sure this is specific enough or use an ID.

    if (monthSelect && daySelect) {
        button.disabled = false; // Enable the button if both selections are made
    } else {
        button.disabled = true; // Disable the button if selections are incomplete
    }
}

// Call checkSelection on page load to set initial state
document.addEventListener('DOMContentLoaded', checkSelection);

function downloadImage() {
    const imageUrl = document.getElementById('image-url').value;
    const month = document.getElementById('month-select').value;
    const day = document.getElementById('day-select').value;
    const language = document.getElementById('language-select').value;
    if (imageUrl) {
        downloadUrl = `/generate-image/?month=${encodeURIComponent(month)}&day=${encodeURIComponent(day)}&language=${encodeURIComponent(language)}&disposition=attachment`
        window.location.href = downloadUrl;
    } else {
        alert("Please confirm your selection first.");
    }
}

document.getElementById('scrollToKhodamButton').addEventListener('click', function() {
    document.getElementById('khodam').scrollIntoView({ behavior: 'smooth' });
});