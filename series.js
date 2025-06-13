document.addEventListener('DOMContentLoaded', function() {
    // الحصول على معرف المسلسل من URL
    const urlParams = new URLSearchParams(window.location.search);
    const seriesId = urlParams.get('id');
    
    // إذا كان هناك معرف مسلسل، جلب بياناته
    if (seriesId) {
        loadSeriesData(seriesId);
    } else {
        // إعادة توجيه إذا لم يكن هناك معرف مسلسل
        window.location.href = 'index.html';
    }
});

async function loadSeriesData(seriesId) {
    try {
        // عرض مؤشر التحميل
        document.body.classList.add('loading');
        
        // جلب بيانات المسلسل (في الواقع الفعلي، ستكون هذه استدعاء API)
        const series = await fetchSeriesById(seriesId);
        
        // عرض بيانات المسلسل في الصفحة
        displaySeriesData(series);
        
        // جلب وتعبئة الحلقات
        const episodes = await fetchEpisodes(seriesId);
        displayEpisodes(episodes);
        
        // جلب وتعبئة المسلسلات المشابهة
        const relatedSeries = await fetchRelatedSeries(seriesId);
        displayRelatedSeries(relatedSeries);
        
    } catch (error) {
        console.error('Error loading series data:', error);
        alert('حدث خطأ أثناء تحميل بيانات المسلسل');
    } finally {
        // إخفاء مؤشر التحميل
        document.body.classList.remove('loading');
    }
}

// دالة وهمية لجلب بيانات المسلسل (في الواقع الفعلي ستكون استدعاء API)
async function fetchSeriesById(seriesId) {
    // محاكاة جلب البيانات من الخادم
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // بيانات وهمية للمسلسل
    return {
        id: seriesId,
        title: "مسلسل الاختبار",
        description: "قصة المسلسل تدور حول مجموعة من الأشخاص الذين يواجهون تحديات كبيرة في حياتهم اليومية، حيث تختبرهم الأحداث في مواقف صعبة تظهر حقيقتهم ومدى قدرتهم على التكيف مع الظروف الصعبة.",
        rating: 8.5,
        releaseYear: 2023,
        genres: ["دراما", "تشويق"],
        country: "عربي",
        posterUrl: "https://via.placeholder.com/300x450/333/fff?text=مسلسل+الاختبار",
        seasons: 2,
        isExclusive: true
    };
}

// دالة وهمية لجلب الحلقات
async function fetchEpisodes(seriesId) {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return [
        {
            id: "e1",
            title: "بداية الاختبار",
            description: "الحلقة الأولى من المسلسل حيث تبدأ الأحداث بالتصاعد",
            season: 1,
            episodeNumber: 1,
            thumbnail: "https://via.placeholder.com/300x170/333/fff?text=الحلقة+1",
            duration: "45:00",
            releaseDate: "2023-01-01"
        },
        {
            id: "e2",
            title: "التحدي الكبير",
            description: "يواجه الأبطال تحدياً كبيراً يغير مجرى الأحداث",
            season: 1,
            episodeNumber: 2,
            thumbnail: "https://via.placeholder.com/300x170/333/fff?text=الحلقة+2",
            duration: "42:30",
            releaseDate: "2023-01-08"
        }
    ];
}

// دالة وهمية لجلب المسلسلات المشابهة
async function fetchRelatedSeries(seriesId) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
        {
            id: "s101",
            title: "مسلسل الاختبار 2",
            rating: 8.1,
            posterUrl: "https://via.placeholder.com/300x450/333/fff?text=مسلسل+1",
            seasons: 1
        },
        {
            id: "s102",
            title: "التحدي الكبير",
            rating: 7.9,
            posterUrl: "https://via.placeholder.com/300x450/333/fff?text=مسلسل+2",
            seasons: 2
        },
        {
            id: "s103",
            title: "نقطة التحول",
            rating: 8.3,
            posterUrl: "https://via.placeholder.com/300x450/333/fff?text=مسلسل+3",
            seasons: 1
        }
    ];
}

// عرض بيانات المسلسل في الصفحة
function displaySeriesData(series) {
    document.title = `سينما فاشن - ${series.title}`;
    
    const seriesPoster = document.querySelector('.series-poster img');
    const seriesTitle = document.querySelector('.series-info h1');
    const seriesMeta = document.querySelector('.series-meta');
    const seriesDescription = document.querySelector('.series-description');
    
    seriesPoster.src = series.posterUrl;
    seriesPoster.alt = series.title;
    seriesTitle.textContent = series.title;
    
    seriesMeta.innerHTML = `
        <span><i class="fas fa-star"></i> ${series.rating}/10</span>
        <span><i class="fas fa-calendar-alt"></i> ${series.releaseYear}</span>
        <span><i class="fas fa-tag"></i> ${series.genres.join('، ')}</span>
        <span><i class="fas fa-flag"></i> ${series.country}</span>
    `;
    
    seriesDescription.textContent = series.description;
}

// عرض الحلقات في الصفحة
function displayEpisodes(episodes) {
    const episodesGrid = document.querySelector('.episodes-grid');
    
    episodesGrid.innerHTML = episodes.map(episode => `
        <div class="episode-card">
            <div class="episode-thumbnail">
                <img src="${episode.thumbnail}" alt="${episode.title}">
                <span class="episode-number">الحلقة ${episode.episodeNumber}</span>
                <div class="episode-overlay">
                    <a href="#" class="btn btn-primary" data-episode-id="${episode.id}">
                        <i class="fas fa-play"></i> مشاهدة
                    </a>
                    <a href="#" class="btn btn-outline" data-episode-id="${episode.id}">
                        <i class="fas fa-download"></i> تحميل
                    </a>
                </div>
            </div>
            <div class="episode-info">
                <h4>${episode.title}</h4>
                <p>${episode.description}</p>
            </div>
        </div>
    `).join('');
}

// عرض المسلسلات المشابهة
function displayRelatedSeries(relatedSeries) {
    const seriesGrid = document.querySelector('.series-grid');
    
    seriesGrid.innerHTML = relatedSeries.map(series => `
        <a href="series.html?id=${series.id}" class="series-card">
            <img src="${series.posterUrl}" alt="${series.title}">
            <div class="series-info">
                <h3>${series.title}</h3>
                <div class="series-meta">
                    <span><i class="fas fa-star"></i> ${series.rating}</span>
                    <span><i class="fas fa-tv"></i> S${series.seasons}</span>
                </div>
            </div>
        </a>
    `).join('');
}