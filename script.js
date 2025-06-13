/**
 * Cinema Fashion - Advanced Movie Streaming Platform
 * إصدار خارق مع ميزات متقدمة وأداء فائق
 */

// Configuration Object
const config = {
    apiBaseUrl: 'https://api.cinema-fashion.com/v1',
    enableAnalytics: true,
    lazyLoadOffset: 200,
    animationDuration: 800,
    maxCacheAge: 60 * 60 * 1000, // 1 hour
    featuredRefreshInterval: 30 * 60 * 1000, // 30 minutes
    heroSliderInterval: 8000, // 8 seconds
    searchDebounceTime: 300 // 300ms
};

// State Management
const state = {
    user: null,
    preferences: {
        theme: 'dark',
        language: 'ar',
        videoQuality: 'hd',
        autoplay: false,
        subtitles: true,
        notifications: true
    },
    cache: {
        movies: {},
        series: {},
        categories: {},
        trailers: {},
        lastUpdated: null
    },
    currentPage: 1,
    isLoading: false,
    notifications: [],
    watchHistory: [],
    watchlist: [],
    recommendations: []
};

// DOM Elements Cache
const elements = {
    navbar: document.querySelector('.navbar'),
    searchInput: document.querySelector('#search-input'),
    searchBtn: document.querySelector('#search-btn'),
    searchResults: document.querySelector('#search-results'),
    menuToggle: document.querySelector('#menu-toggle'),
    navLinks: document.querySelector('.nav-links'),
    heroSlider: document.querySelector('#hero-slider'),
    trendingMovies: document.querySelector('#trending-movies'),
    exclusiveSeries: document.querySelector('#exclusive-series'),
    categoriesGrid: document.querySelector('#categories-grid'),
    recommendationsGrid: document.querySelector('#recommendations-grid'),
    trailerContainer: document.querySelector('.trailer-container'),
    mainContent: document.querySelector('.main-content'),
    videoPlayer: document.querySelector('#video-player'),
    closePlayer: document.querySelector('#close-player'),
    mainVideo: document.querySelector('#main-video'),
    playerTitle: document.querySelector('#player-title'),
    addToWatchlist: document.querySelector('#add-to-watchlist'),
    downloadBtn: document.querySelector('#download-btn'),
    qualitySelect: document.querySelector('#quality-select'),
    loginModal: document.querySelector('#login-modal'),
    registerModal: document.querySelector('#register-modal'),
    closeLogin: document.querySelector('#close-login'),
    closeRegister: document.querySelector('#close-register'),
    showRegister: document.querySelector('#show-register'),
    showLogin: document.querySelector('#show-login'),
    loginForm: document.querySelector('#login-form'),
    registerForm: document.querySelector('#register-form'),
    notificationsContainer: document.querySelector('#notifications-container')
};

// Initialize the Application
class CinemaApp {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.loadData();
        this.setupServiceWorker();
        this.setupAnalytics();
        this.startPeriodicUpdates();
    }

    init() {
        // Load user preferences from localStorage
        this.loadPreferences();
        
        // Apply theme
        document.documentElement.setAttribute('data-theme', state.preferences.theme);
        
        // Initialize UI components
        this.initHeroSlider();
        this.initLazyLoading();
        this.initIntersectionObserver();
        
        // Check for new notifications
        this.checkNotifications();
        
        // Check if user is logged in
        this.checkAuthStatus();
    }

    setupEventListeners() {
        // Navigation
        elements.menuToggle.addEventListener('click', this.toggleMobileMenu.bind(this));
        
        // Search functionality
        elements.searchBtn.addEventListener('click', this.handleSearch.bind(this));
        elements.searchInput.addEventListener('input', this.debounce(this.handleSearchInput.bind(this), config.searchDebounceTime));
        elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        
        // Scroll events
        window.addEventListener('scroll', this.handleScroll.bind(this));
        
        // Dropdown menus
        document.querySelectorAll('.dropdown > a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const menu = link.nextElementSibling;
                menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
            });
        });
        
        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.style.display = 'none';
                });
            }
        });
        
        // Play button events
        document.addEventListener('click', (e) => {
            if (e.target.closest('.play-btn')) {
                e.preventDefault();
                const mediaCard = e.target.closest('[data-media-id]');
                this.playMedia(mediaCard.dataset.mediaId, mediaCard.dataset.mediaType);
            }
        });
        
        // Video player controls
        elements.closePlayer.addEventListener('click', this.closeVideoPlayer.bind(this));
        elements.addToWatchlist.addEventListener('click', this.toggleWatchlist.bind(this));
        elements.downloadBtn.addEventListener('click', this.downloadMedia.bind(this));
        elements.qualitySelect.addEventListener('change', this.changeVideoQuality.bind(this));
        
        // Auth modals
        elements.closeLogin.addEventListener('click', () => this.toggleModal('login', false));
        elements.closeRegister.addEventListener('click', () => this.toggleModal('register', false));
        elements.showRegister.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleModal('login', false);
            this.toggleModal('register', true);
        });
        elements.showLogin.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleModal('register', false);
            this.toggleModal('login', true);
        });
        
        // Form submissions
        elements.loginForm.addEventListener('submit', this.handleLogin.bind(this));
        elements.registerForm.addEventListener('submit', this.handleRegister.bind(this));
    }

    // Data Management
    async loadData() {
        try {
            this.showLoader();
            
            // Check cache first
            if (this.isCacheValid()) {
                const cachedData = JSON.parse(localStorage.getItem('mediaCache'));
                state.cache = cachedData;
                this.renderMedia(state.cache.movies, state.cache.series, state.cache.categories);
                return;
            }
            
            // Fetch fresh data
            const [movies, series, categories] = await Promise.all([
                this.fetchMedia('movies'),
                this.fetchMedia('series'),
                this.fetchCategories()
            ]);
            
            // Update cache
            state.cache = {
                movies: this.processMediaData(movies),
                series: this.processMediaData(series),
                categories: categories,
                lastUpdated: new Date()
            };
            
            // Save to localStorage
            localStorage.setItem('mediaCache', JSON.stringify(state.cache));
            
            // Render UI
            this.renderMedia(state.cache.movies, state.cache.series, state.cache.categories);
            
            // Load trailers after main content
            this.loadTrailers();
            
            // Load recommendations if user is logged in
            if (state.user) {
                this.loadRecommendations();
            }
            
        } catch (error) {
            console.error('Failed to load data:', error);
            this.showError('حدث خطأ في تحميل البيانات. يرجى المحاولة لاحقاً.');
        } finally {
            this.hideLoader();
        }
    }

    async fetchMedia(type) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        return Array(12).fill(0).map((_, i) => ({
            id: type === 'movies' ? `m${i}` : `s${i}`,
            title: type === 'movies' ? `فيلم ${i + 1}` : `مسلسل ${i + 1}`,
            rating: Math.random() * 3 + 7, // 7-10
            releaseDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
            posterUrl: `https://via.placeholder.com/300x450/333/fff?text=${type === 'movies' ? 'Movie' : 'Series'}+${i + 1}`,
            type: type === 'movies' ? 'movie' : 'series',
            genre: ['أكشن', 'دراما', 'مغامرة', 'كوميدي', 'رومانسي'].sort(() => 0.5 - Math.random()).slice(0, 2),
            description: 'وصف قصير للمحتوى هنا. يمكن أن يكون هذا الفيلم أو المسلسل من أفضل ما شاهدت هذا العام.',
            isExclusive: Math.random() > 0.5,
            isNew: Math.random() > 0.7
        }));
    }
    
    async fetchCategories() {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return [
            { id: 'action', name: 'أكشن', imageUrl: 'https://via.placeholder.com/300x200/333/fff?text=أكشن' },
            { id: 'horror', name: 'رعب', imageUrl: 'https://via.placeholder.com/300x200/333/fff?text=رعب' },
            { id: 'comedy', name: 'كوميدي', imageUrl: 'https://via.placeholder.com/300x200/333/fff?text=كوميدي' },
            { id: 'drama', name: 'دراما', imageUrl: 'https://via.placeholder.com/300x200/333/fff?text=دراما' },
            { id: 'romance', name: 'رومانسي', imageUrl: 'https://via.placeholder.com/300x200/333/fff?text=رومانسي' },
            { id: 'scifi', name: 'خيال علمي', imageUrl: 'https://via.placeholder.com/300x200/333/fff?text=خيال+علمي' }
        ];
    }

    processMediaData(data) {
        return data.map(item => ({
            ...item,
            formattedRating: this.formatRating(item.rating),
            releaseYear: new Date(item.releaseDate).getFullYear(),
            isNew: this.isNewRelease(item.releaseDate)
        }));
    }

    // Cache Management
    isCacheValid() {
        const cachedData = localStorage.getItem('mediaCache');
        if (!cachedData) return false;
        
        const parsedData = JSON.parse(cachedData);
        if (!parsedData.lastUpdated) return false;
        
        const cacheAge = new Date() - new Date(parsedData.lastUpdated);
        return cacheAge < config.maxCacheAge;
    }

    // UI Rendering
    renderMedia(movies, series, categories) {
        this.renderTrendingMovies(movies);
        this.renderExclusiveSeries(series);
        this.renderCategories(categories);
    }

    renderTrendingMovies(movies) {
        elements.trendingMovies.innerHTML = movies
            .sort((a, b) => b.rating - a.rating)
            .slice(0, 8)
            .map(movie => this.createMediaCard(movie))
            .join('');
        
        this.initLazyLoadImages();
    }

    renderExclusiveSeries(series) {
        elements.exclusiveSeries.innerHTML = series
            .filter(s => s.isExclusive)
            .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
            .slice(0, 8)
            .map(show => this.createMediaCard(show))
            .join('');
        
        this.initLazyLoadImages();
    }
    
    renderCategories(categories) {
        elements.categoriesGrid.innerHTML = categories
            .map(category => `
                <a href="category.html?id=${category.id}" class="category-card" style="background-image: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.7)), url('${category.imageUrl}')">
                    <h3>${category.name}</h3>
                </a>
            `)
            .join('');
    }
    
    renderRecommendations(recommendations) {
        elements.recommendationsGrid.innerHTML = recommendations
            .slice(0, 8)
            .map(item => this.createMediaCard(item))
            .join('');
        
        this.initLazyLoadImages();
    }

    createMediaCard(item) {
        return `
             <a href="${item.type === 'movie' ? 'movie.html' : 'series.html'}?id=${item.id}" class="movie-card" data-media-id="${item.id}" data-media-type="${item.type}">
                <img class="lazy" data-src="${item.posterUrl}" alt="${item.title}">
                <div class="movie-info">
                    <h3>${item.title}</h3>
                    <div class="movie-meta">
                        <span class="rating">${item.formattedRating}</span>
                        <span><i class="fas fa-calendar-alt"></i> ${item.releaseYear}</span>
                    </div>
                </div>
                <div class="movie-overlay">
                    <div class="overlay-content">
                        <button class="play-btn"><i class="fas fa-play"></i></button>
                        <h3>${item.title}</h3>
                        <div class="movie-meta">
                            <span><i class="fas fa-star"></i> ${item.rating.toFixed(1)}</span>
                            <span><i class="fas fa-calendar-alt"></i> ${item.releaseYear}</span>
                        </div>
                        <p>${item.genre.join(' • ')}</p>
                        <p class="description">${item.description}</p>
                        <div class="actions">
                            <button class="btn btn-primary"><i class="fas fa-play"></i> شاهد الآن</button>
                            ${item.isNew ? '<span class="badge">جديد</span>' : ''}
                        </div>
                    </div>
                </div>
            </div>
			
        `;
    }

    // Hero Slider
    initHeroSlider() {
        // Mock data for featured content
        const featuredContent = [
            {
                title: "الممر",
                description: "قصة حقيقية عن بطولات الجيش المصري خلال حرب الاستنزاف",
                rating: 8.5,
                year: 2019,
                genre: ["أكشن", "حرب", "دراما"],
                imageUrl: "https://via.placeholder.com/1920x600/333/fff?text=فيلم+الاسبوع",
                mediaId: "m123",
                type: "movie"
            },
            {
                title: "مسلسل الاختيار",
                description: "قصة حياة الشهيد أحمد المنسي وأبطال القوات المسلحة في مواجهة الإرهاب",
                rating: 9.2,
                year: 2020,
                genre: ["دراما", "حربي", "سيرة ذاتية"],
                imageUrl: "https://via.placeholder.com/1920x600/333/fff?text=مسلسل+الاسبوع",
                mediaId: "s456",
                type: "series"
            }
        ];
        
        elements.heroSlider.innerHTML = featuredContent.map((item, index) => `
            <div class="slide ${index === 0 ? 'active' : ''}" 
                 style="background-image: linear-gradient(to left, rgba(0,0,0,0.1), rgba(0,0,0,0.8)), url('${item.imageUrl}')"
                 data-media-id="${item.mediaId}"
                 data-media-type="${item.type}">
                <div class="container">
                    <div class="slide-content">
                        <span class="category">${item.type === 'movie' ? 'فيلم الأسبوع' : 'مسلسل الأسبوع'}</span>
                        <h1>${item.title}</h1>
                        <div class="meta">
                            <span><i class="fas fa-star"></i> ${item.rating}/10</span>
                            <span><i class="fas fa-clock"></i> ${item.year}</span>
                            <span><i class="fas fa-tag"></i> ${item.genre.join('، ')}</span>
                        </div>
                        <p>${item.description}</p>
                        <div class="actions">
                            <button class="btn btn-primary play-hero" data-media-id="${item.mediaId}" data-media-type="${item.type}">
                                <i class="fas fa-play"></i> شاهد الآن
                            </button>
                            <button class="btn btn-outline">
                                <i class="fas fa-info-circle"></i> التفاصيل
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Add event listeners to hero play buttons
        document.querySelectorAll('.play-hero').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.playMedia(btn.dataset.mediaId, btn.dataset.mediaType);
            });
        });
        
        // Start slider animation
        this.startHeroSlider();
    }
    
    startHeroSlider() {
        const slides = document.querySelectorAll('.slide');
        let currentSlide = 0;
        
        setInterval(() => {
            slides[currentSlide].classList.remove('active');
            currentSlide = (currentSlide + 1) % slides.length;
            slides[currentSlide].classList.add('active');
        }, config.heroSliderInterval);
    }

    // Lazy Loading
    initLazyLoading() {
        this.lazyLoadObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    this.lazyLoadObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: `${config.lazyLoadOffset}px`
        });
    }

    initLazyLoadImages() {
        document.querySelectorAll('img.lazy').forEach(img => {
            this.lazyLoadObserver.observe(img);
        });
    }

    // Intersection Observer for Animations
    initIntersectionObserver() {
        this.animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                    this.animationObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1
        });
        
        document.querySelectorAll('.movie-card, .section-header, .category-card').forEach(el => {
            this.animationObserver.observe(el);
        });
    }

    // Trailer Loading
    async loadTrailers() {
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const trailers = [
                {
                    id: "t1",
                    title: "ترايلر فيلم الممر",
                    youtubeId: "example123",
                    featured: true
                }
            ];
            
            const featuredTrailer = trailers.find(t => t.featured);
            if (featuredTrailer) {
                elements.trailerContainer.innerHTML = `
                    <iframe width="560" height="315" 
                        src="https://www.youtube.com/embed/${featuredTrailer.youtubeId}?rel=0&modestbranding=1" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                    </iframe>
                `;
            }
        } catch (error) {
            console.error('Failed to load trailers:', error);
        }
    }
    
    // Recommendations
    async loadRecommendations() {
        try {
            // Simulate API call based on user watch history
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Mock recommendations
            state.recommendations = [
                ...state.cache.movies.filter(m => m.rating > 8.5).slice(0, 4),
                ...state.cache.series.filter(s => s.rating > 8.5).slice(0, 4)
            ];
            
            this.renderRecommendations(state.recommendations);
        } catch (error) {
            console.error('Failed to load recommendations:', error);
        }
    }

    // User Interactions
    debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
    
    handleSearchInput() {
        const query = elements.searchInput.value.trim();
        if (query.length > 2) {
            this.showSearchResults(query);
        } else {
            elements.searchResults.style.display = 'none';
        }
    }
    
    async showSearchResults(query) {
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Mock search results
            const results = [
                ...state.cache.movies.filter(m => m.title.includes(query)).slice(0, 3),
                ...state.cache.series.filter(s => s.title.includes(query)).slice(0, 3)
            ];
            
            if (results.length > 0) {
                elements.searchResults.innerHTML = results.map(item => `
                    <a href="${item.type === 'movie' ? 'movie.html' : 'series.html'}?id=${item.id}" class="search-result-item">
                        <img src="${item.posterUrl}" alt="${item.title}">
                        <div class="search-result-info">
                            <h4>${item.title}</h4>
                            <p>${item.type === 'movie' ? 'فيلم' : 'مسلسل'} • ${item.releaseYear}</p>
                        </div>
                    </a>
                `).join('');
                
                elements.searchResults.style.display = 'block';
            } else {
                elements.searchResults.innerHTML = '<div class="search-result-item">لا توجد نتائج</div>';
                elements.searchResults.style.display = 'block';
            }
        } catch (error) {
            console.error('Search failed:', error);
        }
    }
    
    handleSearch() {
        const query = elements.searchInput.value.trim();
        if (query) {
            // In a real app, this would navigate to search results
            console.log('Searching for:', query);
            this.showNotification(`نتائج البحث عن: ${query}`);
            elements.searchResults.style.display = 'none';
        }
    }

    playMedia(mediaId, mediaType) {
        // In a real app, this would fetch the actual video URL
        console.log(`Playing ${mediaType}:`, mediaId);
        
        // Mock video data
        const media = [...state.cache.movies, ...state.cache.series].find(m => m.id === mediaId);
        
        if (media) {
            elements.playerTitle.textContent = media.title;
            elements.mainVideo.src = 'https://example.com/video.mp4'; // Replace with actual video URL
            elements.videoPlayer.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Check if media is in watchlist
            const inWatchlist = state.watchlist.some(item => item.id === mediaId);
            elements.addToWatchlist.innerHTML = inWatchlist ? 
                '<i class="fas fa-check"></i> في قائمة المشاهدة' : 
                '<i class="fas fa-plus"></i> قائمة المشاهدة';
            
            // Add to watch history
            this.addToWatchHistory(media);
        }
    }
    
    closeVideoPlayer() {
        elements.videoPlayer.classList.remove('active');
        elements.mainVideo.pause();
        document.body.style.overflow = 'auto';
    }
    
    toggleWatchlist() {
        const mediaId = elements.playerTitle.textContent;
        const media = [...state.cache.movies, ...state.cache.series].find(m => m.title === mediaId);
        
        if (media) {
            const index = state.watchlist.findIndex(item => item.id === media.id);
            
            if (index === -1) {
                state.watchlist.push(media);
                elements.addToWatchlist.innerHTML = '<i class="fas fa-check"></i> في قائمة المشاهدة';
                this.showNotification('تمت الإضافة إلى قائمة المشاهدة', 'success');
            } else {
                state.watchlist.splice(index, 1);
                elements.addToWatchlist.innerHTML = '<i class="fas fa-plus"></i> قائمة المشاهدة';
                this.showNotification('تمت الإزالة من قائمة المشاهدة', 'info');
            }
            
            // Save to localStorage
            localStorage.setItem('watchlist', JSON.stringify(state.watchlist));
        }
    }
    
    downloadMedia() {
        const mediaId = elements.playerTitle.textContent;
        const quality = elements.qualitySelect.value;
        console.log(`Downloading ${mediaId} in ${quality}p quality`);
        this.showNotification('جاري تحضير الملف للتحميل...', 'info');
    }
    
    changeVideoQuality() {
        const quality = elements.qualitySelect.value;
        console.log('Changing video quality to:', quality);
        // In a real app, this would switch the video source
    }
    
    addToWatchHistory(media) {
        // Check if already in history
        const existingIndex = state.watchHistory.findIndex(item => item.id === media.id);
        
        if (existingIndex !== -1) {
            // Move to top
            state.watchHistory.splice(existingIndex, 1);
        }
        
        // Add to beginning
        state.watchHistory.unshift(media);
        
        // Keep only last 20 items
        if (state.watchHistory.length > 20) {
            state.watchHistory.pop();
        }
        
        // Save to localStorage
        localStorage.setItem('watchHistory', JSON.stringify(state.watchHistory));
        
        // Update recommendations
        this.loadRecommendations();
    }

    toggleMobileMenu() {
        elements.navLinks.classList.toggle('show');
        elements.menuToggle.innerHTML = elements.navLinks.classList.contains('show') ? 
            '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
    }

    handleScroll() {
        // Navbar effect
        if (window.scrollY > 50) {
            elements.navbar.classList.add('scrolled');
        } else {
            elements.navbar.classList.remove('scrolled');
        }
        
        // Infinite scroll (pagination)
        if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 500 && 
            !state.isLoading) {
            this.loadMoreContent();
        }
    }

    async loadMoreContent() {
        if (state.isLoading) return;
        
        state.isLoading = true;
        state.currentPage++;
        
        try {
            // Simulate API call for pagination
            const newMovies = await this.fetchPaginatedData('movies', state.currentPage);
            const newSeries = await this.fetchPaginatedData('series', state.currentPage);
            
            if (newMovies.length > 0) {
                elements.trendingMovies.innerHTML += newMovies
                    .map(movie => this.createMediaCard(movie))
                    .join('');
                this.initLazyLoadImages();
            }
            
            if (newSeries.length > 0) {
                elements.exclusiveSeries.innerHTML += newSeries
                    .map(show => this.createMediaCard(show))
                    .join('');
                this.initLazyLoadImages();
            }
            
        } catch (error) {
            console.error('Failed to load more content:', error);
            state.currentPage--; // Revert page on error
        } finally {
            state.isLoading = false;
        }
    }

    // Authentication
    checkAuthStatus() {
        const userData = localStorage.getItem('user');
        if (userData) {
            state.user = JSON.parse(userData);
            this.updateAuthUI();
        }
    }
    
    updateAuthUI() {
        if (state.user) {
            // Update nav links
            const loginLink = document.querySelector('a[href="login.html"]');
            if (loginLink) {
                loginLink.innerHTML = '<i class="fas fa-user"></i> حسابي';
                loginLink.href = 'account.html';
            }
        }
    }
    
    toggleModal(modal, show) {
        const modalElement = modal === 'login' ? elements.loginModal : elements.registerModal;
        if (show) {
            modalElement.classList.add('active');
            document.body.style.overflow = 'hidden';
        } else {
            modalElement.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }
    
    handleLogin(e) {
        e.preventDefault();
        const email = e.target.querySelector('input[type="email"]').value;
        const password = e.target.querySelector('input[type="password"]').value;
        
        // Simulate login
        setTimeout(() => {
            state.user = {
                id: 'user123',
                name: 'مستخدم سينما فاشن',
                email: email,
                avatar: 'https://via.placeholder.com/150/333/fff?text=User'
            };
            
            localStorage.setItem('user', JSON.stringify(state.user));
            this.toggleModal('login', false);
            this.showNotification('تم تسجيل الدخول بنجاح', 'success');
            this.updateAuthUI();
            this.loadRecommendations();
        }, 1000);
    }
    
    handleRegister(e) {
        e.preventDefault();
        const name = e.target.querySelector('input[type="text"]').value;
        const email = e.target.querySelector('input[type="email"]').value;
        const password = e.target.querySelector('input[type="password"]').value;
        
        // Simulate registration
        setTimeout(() => {
            state.user = {
                id: 'user123',
                name: name,
                email: email,
                avatar: 'https://via.placeholder.com/150/333/fff?text=User'
            };
            
            localStorage.setItem('user', JSON.stringify(state.user));
            this.toggleModal('register', false);
            this.showNotification('تم إنشاء الحساب بنجاح', 'success');
            this.updateAuthUI();
            this.loadRecommendations();
        }, 1000);
    }

    // Utility Functions
    formatRating(rating) {
        const stars = Math.round(rating / 2);
        return Array(5).fill(0).map((_, i) => 
            `<i class="fas fa-star${i < stars ? '' : '-half-alt'}"></i>`
        ).join('');
    }

    isNewRelease(releaseDate) {
        const release = new Date(releaseDate);
        const now = new Date();
        const diffTime = now - release;
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays < 30; // New if less than 30 days old
    }

    // User Preferences
    loadPreferences() {
        const savedPrefs = localStorage.getItem('userPreferences');
        if (savedPrefs) {
            state.preferences = JSON.parse(savedPrefs);
        }
        
        const watchlist = localStorage.getItem('watchlist');
        if (watchlist) {
            state.watchlist = JSON.parse(watchlist);
        }
        
        const watchHistory = localStorage.getItem('watchHistory');
        if (watchHistory) {
            state.watchHistory = JSON.parse(watchHistory);
        }
    }

    savePreferences() {
        localStorage.setItem('userPreferences', JSON.stringify(state.preferences));
    }

    // UI Helpers
    showLoader() {
        document.body.classList.add('loading');
    }

    hideLoader() {
        document.body.classList.remove('loading');
    }

    showError(message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.innerHTML = `
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
            <button class="close-btn"><i class="fas fa-times"></i></button>
        `;
        
        document.body.appendChild(errorEl);
        
        errorEl.querySelector('.close-btn').addEventListener('click', () => {
            errorEl.remove();
        });
        
        setTimeout(() => errorEl.remove(), 5000);
    }

    showNotification(message, type = 'info') {
        const notification = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date()
        };
        
        state.notifications.push(notification);
        this.renderNotification(notification);
    }

    renderNotification(notification) {
        const notificationEl = document.createElement('div');
        notificationEl.className = `notification ${notification.type}`;
        notificationEl.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(notification.type)}"></i>
            <span>${notification.message}</span>
            <button class="close-btn"><i class="fas fa-times"></i></button>
        `;
        
        elements.notificationsContainer.appendChild(notificationEl);
        
        notificationEl.querySelector('.close-btn').addEventListener('click', () => {
            notificationEl.remove();
            this.removeNotification(notification.id);
        });
        
        setTimeout(() => {
            notificationEl.classList.add('fade-out');
            setTimeout(() => {
                notificationEl.remove();
                this.removeNotification(notification.id);
            }, 500);
        }, 5000);
    }

    removeNotification(id) {
        state.notifications = state.notifications.filter(n => n.id !== id);
    }

    getNotificationIcon(type) {
        const icons = {
            info: 'info-circle',
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'times-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Service Worker
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js').then(
                    registration => {
                        console.log('ServiceWorker registration successful');
                    }, 
                    err => {
                        console.log('ServiceWorker registration failed: ', err);
                    }
                );
            });
        }
    }

    // Analytics
    setupAnalytics() {
        if (config.enableAnalytics) {
            window.addEventListener('load', () => {
                // Initialize analytics SDK
                console.log('Analytics initialized');
            });
        }
    }

    // Periodic Updates
    startPeriodicUpdates() {
        setInterval(() => {
            this.checkNewContent();
        }, config.featuredRefreshInterval);
    }

    async checkNewContent() {
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const lastUpdate = new Date();
            
            if (lastUpdate > new Date(state.cache.lastUpdated)) {
                this.showNotification('يتوفر محتوى جديد!', 'success');
                this.loadData();
            }
        } catch (error) {
            console.error('Failed to check for updates:', error);
        }
    }

    checkNotifications() {
        // Simulate fetching notifications
        setTimeout(() => {
            this.showNotification('مرحباً بك في سينما فاشن! استمتع بأفضل الأفلام والمسلسلات.', 'info');
        }, 3000);
    }
}

// Helper function for simulated pagination
CinemaApp.prototype.fetchPaginatedData = async function(type, page) {
    // In a real app, this would be an actual API call
    console.log(`Fetching page ${page} of ${type}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate paginated data
    const allItems = type === 'movies' ? 
        Array(12).fill(0).map((_, i) => ({
            id: `m${page}${i}`,
            title: `فيلم ${page}-${i}`,
            rating: Math.random() * 3 + 7, // 7-10
            releaseDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
            posterUrl: `https://via.placeholder.com/300x450/333/fff?text=Movie+${page}-${i}`,
            type: 'movie',
            genre: ['أكشن', 'دراما', 'مغامرة'].sort(() => 0.5 - Math.random()).slice(0, 2),
            description: 'وصف قصير للفيلم هنا',
            isExclusive: Math.random() > 0.7
        })) :
        Array(12).fill(0).map((_, i) => ({
            id: `s${page}${i}`,
            title: `مسلسل ${page}-${i}`,
            rating: Math.random() * 3 + 7, // 7-10
            releaseDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
            posterUrl: `https://via.placeholder.com/300x450/333/fff?text=Series+${page}-${i}`,
            type: 'series',
            genre: ['دراما', 'رومانسي', 'تشويق'].sort(() => 0.5 - Math.random()).slice(0, 2),
            description: 'وصف قصير للمسلسل هنا',
            isExclusive: Math.random() > 0.5
        }));
    
    return allItems.slice((page - 1) * 6, page * 6);
};

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const app = new CinemaApp();
    
    // Make app globally available for debugging
    window.CinemaApp = app;
});
