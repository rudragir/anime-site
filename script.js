
    // ---------- CONFIG ----------
    const JIKAN_BASE = 'https://api.jikan.moe/v4';
    const scriptURL = 'https://script.google.com/macros/s/AKfycbzGtnOcQYRIQMJIgj-PNyLkfJM4tBXySu_Mq0ECZHAD1WH0SRQhNGvjuqpEeGxnw1Os/exec';

    const MODES = {
      anime: {
        topUrl: `${JIKAN_BASE}/top/anime?filter=airing&limit=12`,
        searchUrl: (q) => `${JIKAN_BASE}/anime?q=${encodeURIComponent(q)}&limit=1`,
        heroWord: 'AIRING',
        sectionLabel: 'ANIME FILE NO. ＿＿＿',
        epLabel: 'EPISODES',
        epShort: 'EP',
        searchPlaceholder: 'Search an anime title + ENTER...',
        watchedLabel: 'EP WATCHED',
        statusLabel: 'WATCHING',
        getEpisodes: (a) => a.episodes,
        getDate: (a) => a.aired?.string
      },
      manga: {
        topUrl: `${JIKAN_BASE}/top/manga?filter=publishing&limit=12`,
        searchUrl: (q) => `${JIKAN_BASE}/manga?q=${encodeURIComponent(q)}&limit=1`,
        heroWord: 'PUBLISHING',
        sectionLabel: 'MANGA FILE NO. ＿＿＿',
        epLabel: 'CHAPTERS',
        epShort: 'CH',
        searchPlaceholder: 'Search a manga title + ENTER...',
        watchedLabel: 'CH READ',
        statusLabel: 'READING',
        getEpisodes: (a) => a.chapters,
        getDate: (a) => a.published?.string
      }
    };
    let currentMode = 'anime';
    let currentPage = 'home';
    let currentItem = null;
    let currentItemMode = 'anime';

    // ---------- HELPERS ----------
    function populateInfo(item){
      if(!item) return;
      currentItem = item;
      currentItemMode = currentMode;
      const cfg = MODES[currentMode];
      document.getElementById('anime-img').src = item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '';
      document.getElementById('anime-title').textContent = item.title || 'UNKNOWN';
      document.getElementById('form-title').value = item.title || '';
      document.getElementById('anime-status').textContent = item.status || '—';
      document.getElementById('release-date').textContent = cfg.getDate(item) || '—';
      document.getElementById('ep-label').textContent = cfg.epLabel;
      document.getElementById('total-episodes').textContent = cfg.getEpisodes(item) ?? '?';
      document.getElementById('anime-score').textContent = item.score ? ('★ ' + item.score) : 'N/A';
      document.getElementById('anime-plot').textContent = item.synopsis ? item.synopsis.slice(0, 600) : 'No synopsis available.';

      const tagWrap = document.getElementById('genre-tags');
      tagWrap.innerHTML = '';
      (item.genres || []).concat(item.themes || []).forEach(g => {
        const pill = document.createElement('span');
        pill.className = 'genre-pill';
        pill.textContent = g.name;
        tagWrap.appendChild(pill);
      });
    }

    function renderCard(item, index){
      const cfg = MODES[currentMode];
      const card = document.createElement('div');
      card.className = 'panel-card';

      const badge = document.createElement('div');
      badge.className = 'rank-badge';
      badge.textContent = index + 1;
      card.appendChild(badge);

      const img = document.createElement('img');
      img.src = item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '';
      img.alt = item.title;
      card.appendChild(img);

      const body = document.createElement('div');
      body.className = 'card-body';
      body.innerHTML = `
        <p class="card-title">${item.title}</p>
        <div class="card-meta">
          <span>${cfg.epShort} ${cfg.getEpisodes(item) ?? '?'}</span>
          <span class="score-chip">★ ${item.score ?? 'N/A'}</span>
        </div>`;
      card.appendChild(body);

      card.addEventListener('click', () => {
        populateInfo(item);
        document.querySelector('.info-section').scrollIntoView({ behavior:'smooth', block:'start' });
      });
      return card;
    }

    // ---------- CAROUSEL ----------
    let carouselIndex = 0;
    const CARDS_PER_VIEW = () => window.innerWidth < 640 ? 1 : (window.innerWidth < 1000 ? 2 : 3);

    function updateCarouselButtons(totalCards){
      const prevBtn = document.getElementById('prev-btn');
      const nextBtn = document.getElementById('next-btn');
      prevBtn.disabled = carouselIndex <= 0;
      nextBtn.disabled = carouselIndex >= totalCards - CARDS_PER_VIEW();
    }

    function scrollToCard(){
      const wrap = document.getElementById('popular-anime');
      const card = wrap.children[carouselIndex];
      if(card){ wrap.scrollTo({ left: card.offsetLeft - wrap.offsetLeft, behavior: 'smooth' }); }
    }

    function setupCarouselNav(totalCards){
      const prevBtn = document.getElementById('prev-btn');
      const nextBtn = document.getElementById('next-btn');
      carouselIndex = 0;
      updateCarouselButtons(totalCards);
      prevBtn.onclick = () => {
        carouselIndex = Math.max(0, carouselIndex - 1);
        scrollToCard();
        updateCarouselButtons(totalCards);
      };
      nextBtn.onclick = () => {
        carouselIndex = Math.min(totalCards - CARDS_PER_VIEW(), carouselIndex + 1);
        scrollToCard();
        updateCarouselButtons(totalCards);
      };
    }

    async function loadTopList(){
      const wrap = document.getElementById('popular-anime');
      const cfg = MODES[currentMode];
      wrap.innerHTML = '<p class="loading-text">Loading the chart...</p>';
      try{
        const res = await fetch(cfg.topUrl);
        if(!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        wrap.innerHTML = '';
        (data.data || []).forEach((item, i) => wrap.appendChild(renderCard(item, i)));
        if(data.data && data.data.length){
          populateInfo(data.data[0]);
          setupCarouselNav(data.data.length);
        }
      }catch(err){
        wrap.innerHTML = '<p class="error-text">Couldn\'t load the chart right now. Try again in a moment!</p>';
        document.getElementById('prev-btn').disabled = true;
        document.getElementById('next-btn').disabled = true;
        console.error('Top list fetch failed:', err);
      }
    }

    // ---------- MODE SWITCHING ----------
    function applyModeText(){
      const cfg = MODES[currentMode];
      document.body.dataset.mode = currentMode;
      document.getElementById('hero-title-word').textContent = cfg.heroWord;
      document.getElementById('section-label-text').textContent = cfg.sectionLabel;
      document.getElementById('ep-watched-label').textContent = cfg.watchedLabel;
      document.getElementById('watching-label').textContent = cfg.statusLabel;
      document.getElementById('you-label').textContent = currentMode === 'anime' ? 'YOUR ANIME LIST' : 'YOUR MANGA LIST';
      searchbox.placeholder = cfg.searchPlaceholder;
      document.querySelectorAll('.mode-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === currentMode);
      });
    }

    document.querySelectorAll('.mode-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        if(btn.dataset.mode === currentMode) return;
        currentMode = btn.dataset.mode;
        applyModeText();
        if(currentPage === 'you'){ renderYouList(); } else { loadTopList(); }
      });
    });

    // ---------- YOU LIST (localStorage) ----------
    const YOU_LIST_KEY = 'mangaWorldYouList';

    function getYouList(){
      try{ return JSON.parse(localStorage.getItem(YOU_LIST_KEY)) || []; }
      catch(e){ return []; }
    }

    function saveYouList(list){
      localStorage.setItem(YOU_LIST_KEY, JSON.stringify(list));
    }

    function upsertYouEntry(entry){
      const list = getYouList();
      const i = list.findIndex(e => e.mode === entry.mode && e.title === entry.title);
      if(i >= 0){ list[i] = entry; } else { list.push(entry); }
      saveYouList(list);
    }

    function removeYouEntry(mode, title){
      const list = getYouList().filter(e => !(e.mode === mode && e.title === title));
      saveYouList(list);
      renderYouList();
    }

    function viewYouEntry(entry){
      const cfg = MODES[entry.mode];
      if(currentMode !== entry.mode){ currentMode = entry.mode; applyModeText(); }
      populateInfo({
        title: entry.title,
        images: { jpg: { large_image_url: entry.image } },
        status: entry.animeStatus,
        synopsis: entry.synopsis,
        genres: (entry.genres || []).map(name => ({ name })),
        score: entry.officialScore,
        aired: { string: entry.releaseDate },
        published: { string: entry.releaseDate },
        episodes: entry.totalEp,
        chapters: entry.totalEp
      });
      setPage('home');
      document.querySelector('.info-section').scrollIntoView({ behavior:'smooth', block:'start' });
    }

    function renderYouList(){
      const wrap = document.getElementById('you-list');
      const list = getYouList().filter(e => e.mode === currentMode);
      wrap.innerHTML = '';
      if(!list.length){
        const empty = document.createElement('p');
        empty.className = 'you-empty';
        empty.textContent = currentMode === 'anime'
          ? "Nothing tracked yet — find something on Home and hit SUBMIT!!"
          : "No manga tracked yet — find something on Home and hit SUBMIT!!";
        wrap.appendChild(empty);
        return;
      }
      list.slice().reverse().forEach(entry => {
        const cfg = MODES[entry.mode];
        const card = document.createElement('div');
        card.className = 'you-card';
        card.innerHTML = `
          <div class="you-card-top">
            <img src="${entry.image || ''}" alt="${entry.title}">
            <div class="you-meta">
              <p class="you-card-title">${entry.title}</p>
              <span class="you-status-pill">${entry.watchStatus.toUpperCase()}</span>
              <div class="you-progress">${cfg.epShort} ${entry.watched ?? 0} / ${entry.totalEp ?? '?'}</div>
              <div class="you-score">YOUR SCORE: ★ ${entry.yourScore}</div>
            </div>
          </div>
          <div class="you-card-body">
            <span class="you-rating-word">RATING: ${entry.rating.toUpperCase()}</span>
            ${entry.review ? `<p class="you-review">"${entry.review}"</p>` : ''}
            <div class="you-card-actions">
              <button type="button" class="you-btn view">VIEW</button>
              <button type="button" class="you-btn remove">REMOVE</button>
            </div>
          </div>`;
        card.querySelector('.view').addEventListener('click', () => viewYouEntry(entry));
        card.querySelector('.remove').addEventListener('click', () => removeYouEntry(entry.mode, entry.title));
        wrap.appendChild(card);
      });
    }

    // ---------- PAGE SWITCHING ----------
    function setPage(page){
      currentPage = page;
      document.getElementById('home-page').style.display = page === 'home' ? '' : 'none';
      document.getElementById('you-page').style.display = page === 'you' ? '' : 'none';
      document.querySelectorAll('.page-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.page === page);
      });
      if(page === 'you'){ renderYouList(); }
    }

    document.querySelectorAll('.page-tab').forEach(btn => {
      btn.addEventListener('click', () => setPage(btn.dataset.page));
    });

    // ---------- SEARCH ----------
    const searchbox = document.getElementById('search-box-input');
    searchbox.addEventListener('keyup', async (event) => {
      if(event.key !== 'Enter') return;
      const q = searchbox.value.trim();
      if(!q) return;
      const cfg = MODES[currentMode];
      searchbox.placeholder = 'Searching...';
      try{
        const res = await fetch(cfg.searchUrl(q));
        if(!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        const item = data.data && data.data[0];
        if(!item){
          searchbox.placeholder = `Not found in ${currentMode} — try another title`;
          return;
        }
        populateInfo(item);
        document.querySelector('.info-section').scrollIntoView({ behavior:'smooth', block:'start' });
        searchbox.value = '';
        searchbox.placeholder = cfg.searchPlaceholder;
      }catch(err){
        searchbox.placeholder = 'Search failed — try again';
        console.error('Search fetch failed:', err);
      }
    });

    // ---------- TRACKER FORM SUBMISSION ----------
    const form = document.forms['submit-to-google-sheet'];
    const submittedEl = document.getElementById('submitted');
    form.addEventListener('submit', e => {
      e.preventDefault();

      if(currentItem){
        const cfg = MODES[currentItemMode];
        const watchStatusVal = form.querySelector('input[name="watch-status"]:checked')?.value || 'watching';
        const entry = {
          mode: currentItemMode,
          title: currentItem.title,
          image: currentItem.images?.jpg?.large_image_url || currentItem.images?.jpg?.image_url || '',
          synopsis: currentItem.synopsis || '',
          genres: (currentItem.genres || []).concat(currentItem.themes || []).map(g => g.name),
          officialScore: currentItem.score || null,
          releaseDate: cfg.getDate(currentItem) || '',
          totalEp: cfg.getEpisodes(currentItem) ?? null,
          animeStatus: currentItem.status || '',
          watched: document.getElementById('chapters-read').value || 0,
          watchStatus: watchStatusVal,
          rating: document.getElementById('rating-inp').value,
          yourScore: document.getElementById('your-score').value,
          review: document.getElementById('review-textarea').value.trim(),
          savedAt: Date.now()
        };
        upsertYouEntry(entry);
      }

      fetch(scriptURL, { method: 'POST', body: new FormData(form) })
        .then(() => { submittedEl.textContent = 'Saved to your list ✓'; })
        .catch(error => { submittedEl.textContent = 'Saved locally (sheet sync failed)'; console.error('Error!', error.message); });
    });

    // ---------- INIT ----------
    applyModeText();
    setPage('home');
    loadTopList();
    window.addEventListener('resize', () => {
      const total = document.getElementById('popular-anime').children.length;
      if(total) updateCarouselButtons(total);
    });
  