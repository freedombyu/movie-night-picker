class MovieNightPicker {
            constructor() {
                this.apiKey = '8265bd1679663a7ea12ac168da84d2e8'; // Free key
                this.baseUrl = 'https://api.themoviedb.org/3';
                this.imageUrl = 'https://image.tmdb.org/t/p/w500';
                this.watchlist = JSON.parse(localStorage.getItem('movieWatchlist')) || [];
                this.currentPoll = null;
                this.currentMovies = [];
                
                this.init();
            }

            init() {
                this.setupEventListeners();
                this.loadTrendingMovies();
                this.updateWatchlist();
                this.loadTheme();
            }

            setupEventListeners() {
                // Theme toggle
                document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
                
                // Search
                document.getElementById('searchInput').addEventListener('input', (e) => {
                    if (e.target.value.length > 2) {
                        this.searchMovies(e.target.value);
                    } else if (e.target.value.length === 0) {
                        this.loadTrendingMovies();
                    }
                });

                // Controls
                document.getElementById('trendingBtn').addEventListener('click', () => this.loadTrendingMovies());
                document.getElementById('randomBtn').addEventListener('click', () => this.getRandomMovie());
                document.getElementById('createPollBtn').addEventListener('click', () => this.showPollModal());

                // Modals
                document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
                document.getElementById('closePollModal').addEventListener('click', () => this.closePollModal());
                document.getElementById('createPollFromWatchlist').addEventListener('click', () => this.createPollFromWatchlist());

                // Click outside modal to close
                window.addEventListener('click', (e) => {
                    if (e.target.classList.contains('modal')) {
                        this.closeModal();
                        this.closePollModal();
                    }
                });
            }

            async loadTrendingMovies() {
                try {
                    const response = await fetch(`${this.baseUrl}/trending/movie/week?api_key=${this.apiKey}`);
                    const data = await response.json();
                    this.currentMovies = data.results.slice(0, 12);
                    this.displayMovies(this.currentMovies);
                } catch (error) {
                    console.error('Error loading trending movies:', error);
                    document.getElementById('moviesContainer').innerHTML = '<div class="loading">❌ Error loading movies</div>';
                }
            }

            async searchMovies(query) {
                try {
                    const response = await fetch(`${this.baseUrl}/search/movie?api_key=${this.apiKey}&query=${encodeURIComponent(query)}`);
                    const data = await response.json();
                    this.currentMovies = data.results.slice(0, 12);
                    this.displayMovies(this.currentMovies);
                } catch (error) {
                    console.error('Error searching movies:', error);
                }
            }

            async getRandomMovie() {
                const genre = document.getElementById('genreSelect').value;
                const genreParam = genre ? `&with_genres=${genre}` : '';
                const randomPage = Math.floor(Math.random() * 5) + 1;
                
                try {
                    const response = await fetch(`${this.baseUrl}/discover/movie?api_key=${this.apiKey}&page=${randomPage}${genreParam}`);
                    const data = await response.json();
                    const randomMovie = data.results[Math.floor(Math.random() * data.results.length)];
                    this.showMovieDetails(randomMovie);
                } catch (error) {
                    console.error('Error getting random movie:', error);
                }
            }

            displayMovies(movies) {
                const container = document.getElementById('moviesContainer');
                
                if (movies.length === 0) {
                    container.innerHTML = '<div class="loading">🔍 No movies found</div>';
                    return;
                }

                container.innerHTML = `
                    <div class="movies-grid">
                        ${movies.map((movie, index) => `
                            <div class="movie-card" data-movie-index="${index}">
                                <img class="movie-poster" 
                                     src="${movie.poster_path ? this.imageUrl + movie.poster_path : 'https://via.placeholder.com/300x450?text=No+Image'}" 
                                     alt="${movie.title}">
                                <div class="movie-info">
                                    <div class="movie-title">${movie.title}</div>
                                    <div class="movie-rating">${movie.vote_average.toFixed(1)}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                `;
                
                // Add click listeners to movie cards
                container.querySelectorAll('.movie-card').forEach(card => {
                    card.addEventListener('click', (e) => {
                        const movieIndex = parseInt(card.getAttribute('data-movie-index'));
                        this.showMovieDetails(this.currentMovies[movieIndex]);
                    });
                });
            }

            showMovieDetails(movie) {
                const modal = document.getElementById('movieModal');
                const title = document.getElementById('modalTitle');
                const body = document.getElementById('modalBody');

                title.textContent = movie.title;
                
                const isInWatchlist = this.watchlist.some(item => item.id === movie.id);
                
                body.innerHTML = `
                    <div style="display: flex; gap: 2rem; margin-bottom: 2rem;">
                        <img src="${movie.poster_path ? this.imageUrl + movie.poster_path : 'https://via.placeholder.com/200x300?text=No+Image'}" 
                             alt="${movie.title}" 
                             style="width: 200px; height: 300px; object-fit: cover; border-radius: 10px;">
                        <div>
                            <p><strong>Rating:</strong> ${movie.vote_average.toFixed(1)}/10</p>
                            <p><strong>Release Date:</strong> ${movie.release_date || 'Unknown'}</p>
                            <p><strong>Overview:</strong></p>
                            <p>${movie.overview || 'No overview available.'}</p>
                            <button class="btn watchlist-toggle-btn" style="margin-top: 1rem;">
                                ${isInWatchlist ? '❌ Remove from Watchlist' : '➕ Add to Watchlist'}
                            </button>
                        </div>
                    </div>
                `;

                // Add event listener to the watchlist button
                const watchlistBtn = body.querySelector('.watchlist-toggle-btn');
                watchlistBtn.addEventListener('click', () => {
                    if (isInWatchlist) {
                        this.removeFromWatchlist(movie);
                    } else {
                        this.addToWatchlist(movie);
                    }
                });

                modal.style.display = 'block';
            }

            addToWatchlist(movie) {
                if (!this.watchlist.some(item => item.id === movie.id)) {
                    this.watchlist.push(movie);
                    localStorage.setItem('movieWatchlist', JSON.stringify(this.watchlist));
                    this.updateWatchlist();
                    // Update the modal to show the new state
                    this.showMovieDetails(movie);
                }
            }

            removeFromWatchlist(movie) {
                this.watchlist = this.watchlist.filter(item => item.id !== movie.id);
                localStorage.setItem('movieWatchlist', JSON.stringify(this.watchlist));
                this.updateWatchlist();
                // Update the modal to show the new state
                this.showMovieDetails(movie);
            }

            updateWatchlist() {
                const container = document.getElementById('watchlist');
                
                if (this.watchlist.length === 0) {
                    container.innerHTML = '<p>No movies in watchlist</p>';
                    return;
                }

                container.innerHTML = this.watchlist.map((movie, index) => `
                    <div class="watchlist-item">
                        <span>${movie.title}</span>
                        <button class="remove-btn" data-movie-index="${index}">
                            Remove
                        </button>
                    </div>
                `).join('');
                
                // Add event listeners to remove buttons
                container.querySelectorAll('.remove-btn').forEach((btn, index) => {
                    btn.addEventListener('click', () => {
                        this.removeFromWatchlist(this.watchlist[index]);
                    });
                });
            }

            showPollModal() {
                document.getElementById('pollModal').style.display = 'block';
            }

            createPollFromWatchlist() {
                if (this.watchlist.length < 2) {
                    alert('Add at least 2 movies to your watchlist to create a poll!');
                    return;
                }

                this.currentPoll = {
                    movies: [...this.watchlist],
                    votes: {}
                };

                this.watchlist.forEach(movie => {
                    this.currentPoll.votes[movie.id] = 0;
                });

                this.updatePollDisplay();
                this.closePollModal();
            }

            updatePollDisplay() {
                const container = document.getElementById('pollContainer');
                
                if (!this.currentPoll) {
                    container.innerHTML = '<p>No active poll</p>';
                    return;
                }

                const totalVotes = Object.values(this.currentPoll.votes).reduce((a, b) => a + b, 0);

                container.innerHTML = `
                    <div style="margin-bottom: 1rem;">
                        <strong>Total votes: ${totalVotes}</strong>
                        <button class="btn clear-poll-btn" style="margin-left: 1rem; padding: 0.25rem 0.5rem; font-size: 0.8rem;">Clear Poll</button>
                    </div>
                    ${this.currentPoll.movies.map(movie => `
                        <div class="poll-option">
                            <div>
                                <div style="font-weight: bold;">${movie.title}</div>
                                <div style="font-size: 0.9rem; color: var(--text-secondary);">
                                    Votes: ${this.currentPoll.votes[movie.id]} 
                                    ${totalVotes > 0 ? `(${Math.round(this.currentPoll.votes[movie.id] / totalVotes * 100)}%)` : ''}
                                </div>
                            </div>
                            <button class="vote-btn" data-movie-id="${movie.id}">Vote</button>
                        </div>
                    `).join('')}
                `;
                
                // Add event listeners
                const clearBtn = container.querySelector('.clear-poll-btn');
                if (clearBtn) {
                    clearBtn.addEventListener('click', () => this.clearPoll());
                }
                
                container.querySelectorAll('.vote-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const movieId = parseInt(btn.getAttribute('data-movie-id'));
                        this.vote(movieId);
                    });
                });
            }

            vote(movieId) {
                if (this.currentPoll) {
                    this.currentPoll.votes[movieId]++;
                    this.updatePollDisplay();
                }
            }

            clearPoll() {
                this.currentPoll = null;
                this.updatePollDisplay();
            }

            toggleTheme() {
                const body = document.body;
                const toggle = document.getElementById('themeToggle');
                
                if (body.getAttribute('data-theme') === 'light') {
                    body.setAttribute('data-theme', 'dark');
                    toggle.textContent = 'Light Mode';
                    localStorage.setItem('theme', 'dark');
                } else {
                    body.setAttribute('data-theme', 'light');
                    toggle.textContent = 'Dark Mode';
                    localStorage.setItem('theme', 'light');
                }
            }

            loadTheme() {
                const savedTheme = localStorage.getItem('theme') || 'light';
                document.body.setAttribute('data-theme', savedTheme);
                document.getElementById('themeToggle').textContent = 
                    savedTheme === 'dark' ? 'Light Mode' : 'Dark Mode';
            }

            closeModal() {
                document.getElementById('movieModal').style.display = 'none';
            }

            closePollModal() {
                document.getElementById('pollModal').style.display = 'none';
            }
        }

        // Initialize the app
        const app = new MovieNightPicker();