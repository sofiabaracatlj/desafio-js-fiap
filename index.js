function search() {
    const query = document.getElementById('searchInput').value;
    const dailyLimits = getDailyLimits();

    fetchVideos(query).then(videos => {
        let videoCopy = videos;
        const result = calculateDaysToWatchAllVideos(videos, dailyLimits);
        handleTitles(videoCopy);
        document.getElementById('daysToWatch').innerText = `Days to watch all videos: ${result.days}`;
        
    });
}

function fetchVideos(query) {
    const apiKey = 'AIzaSyBpzt6pNvbgnDCKEu2_w7C-hm9Fjd7N3vk'; // Replace with actual API key
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&order=viewCount&q=${encodeURIComponent(query)}&type=video&videoDefinition=high&key=${apiKey}&maxResults=50`;

    let allVideos = [];
    let nextPageToken = '';

    const fetchPage = (pageToken) => {
        const pageUrl = `${url}&pageToken=${pageToken}`;
        return fetch(pageUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                const videoIds = data.items.map(item => item.id.videoId).join(',');
                return getVideoDetails(videoIds).then(videoDetails => {
                    const videoDurations = videoDetails.items.map(item => ({
                        duration: parseDuration(item.contentDetails.duration),
                        title: item.snippet.title,
                        description: item.snippet.description,
                        thumbnail: item.snippet.thumbnails.default.url
                    }));
                    allVideos = allVideos.concat(videoDurations);
                    nextPageToken = data.nextPageToken;
                    if (allVideos.length < 200 && nextPageToken) {
                        return fetchPage(nextPageToken);
                    }
                    return allVideos;
                });
            })
            .catch(error => {
                console.error('There has been a problem with your fetch operation:', error);
            });
    };

    return fetchPage(nextPageToken);
}

function getDailyLimits() {
    let dailyLimits = [];
    for (let i = 1; i <= 7; i++) {
        const input = document.getElementById(`day${i}`);
        dailyLimits.push(parseInt(input.value) || 0);
    }

    return dailyLimits;
}

function getVideoDetails(videoIds) {
    const apiKey = 'AIzaSyBpzt6pNvbgnDCKEu2_w7C-hm9Fjd7N3vk'; // Replace with your actual API key
    const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds}&key=${apiKey}`;

    return fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            return data;
        })
        .catch(error => {
            console.error('There has been a problem with your fetch operation:', error);
        });
}

function parseDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = (parseInt(match?.[1]) || 0);
    const minutes = (parseInt(match?.[2]) || 0);
    const seconds = (parseInt(match?.[3]) || 0);
    return hours * 60 + minutes + seconds / 60;
}

function calculateDaysToWatchAllVideos(videoDetails, dailyLimits) {
    let totalDays = 0;
    let lastDayWatched = -1;
    let videoCopy = [...videoDetails];
    while (videoCopy.length > 0) {
        dailyLimits.forEach((limit, day) => {
            if (limit === 0) {
                return;
            }
            for (let i = 0; i < videoCopy.length; i++) {
                const video = videoCopy[i];
                if (lastDayWatched === day) {
                    videoCopy.splice(i, 1);
                    return;
                }
                if (video.duration <= limit) {
                    limit -= video.duration;
                    videoCopy.splice(i, 1);
                    lastDayWatched = day;
                } else {
                    totalDays++;
                    return;
                }
            }
        });
    }

    return { days: totalDays };
}

function getTopWords(text, topN) {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const wordCounts = words.reduce((counts, word) => {
        counts[word] = (counts[word] || 0) + 1;
        return counts;
    }, {});

    const sortedWords = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]);
    topWords = sortedWords.slice(0, topN).map(word => word[0]);
    document.getElementById('topWords').innerText = `Top ${topN} words: ${topWords.join(', ')}`;
}


async function handleTitles(videos){
    let titlesAndDescriptions = "";
    await videos.map(video => {
        titlesAndDescriptions = titlesAndDescriptions + `${video.title || ''} ${video.description || ''} `;
    })
    getTopWords(titlesAndDescriptions, 5);
}