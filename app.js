/* ======================================
   Music Lab Experiment - Application Logic
   Salganick et al. (2006) Replication
   ====================================== */
// ============================================================
// 曲データ（アンジュルム MV）
// ============================================================
const SONGS = [
    {
        id: 'taiki',
        title: '大器晩成',
        release: '2015年2月4日',
        detail: '16thシングル。アンジュルム改名後初のシングル。',
        videoId: 'KCQT4STlXz0',
    },
    {
        id: 'nanakorobi',
        title: '七転び八起き',
        release: '2014年12月17日',
        detail: '15thシングル。スマイレージからアンジュルムへの改名前最後のシングル。',
        videoId: 'hj3Xk4NHwdQ',
    },
    {
        id: '46oku',
        title: '46億年LOVE',
        release: '2018年10月31日',
        detail: '25thシングル両A面曲。',
        videoId: '2T413N56yWk',
    },
    {
        id: 'gashin',
        title: '臥薪嘗胆',
        release: '2016年4月27日',
        detail: '19thシングル。力強いロックナンバー。',
        videoId: '7T4a-3S_7Ww',
    },
    {
        id: 'tade',
        title: 'タデ食う虫もLike it!',
        release: '2018年10月31日',
        detail: '25thシングル。テレビ東京系ドラマ主題歌。',
        videoId: '6VkIMbCT3SA',
    },
    {
        id: 'yumemita',
        title: '夢見た 15年',
        release: '2019年4月10日',
        detail: '26thシングル。和田彩花卒業シングル。',
        videoId: 'kYJvG3eZc94',
    },
    {
        id: 'donden',
        title: 'ドンデンガエシ',
        release: '2015年11月11日',
        detail: '18thシングル トリプルA面。',
        videoId: 'JiV2KdEsi1M',
    },
    {
        id: 'watashi',
        title: '私を創るのは私',
        release: '2019年11月20日',
        detail: '27thシングル両A面曲。',
        videoId: 'KpBDZcil2Pg',
    },
];
// ============================================================
// 状態管理
// ============================================================
const STATE = {
    currentScreen: 'welcome',
    group: null, // 'independent' or 'social'
    participantId: null,
    ratings: {},        // { songId: rating }
    playCounts: {},     // { songId: count } — この参加者の再生回数
    startTime: null,
    endTime: null,
};
// LocalStorage キー
const STORAGE_KEY = 'musiclab_experiment_data';
// ============================================================
// ユーティリティ
// ============================================================
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}
function shuffleArray(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
function loadExperimentData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : { participants: [] };
    } catch {
        return { participants: [] };
    }
}
function saveExperimentData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function saveCurrentParticipant() {
    const data = loadExperimentData();
    const existing = data.participants.findIndex(p => p.id === STATE.participantId);
    const participantData = {
        id: STATE.participantId,
        group: STATE.group,
        ratings: { ...STATE.ratings },
        playCounts: { ...STATE.playCounts },
        startTime: STATE.startTime,
        endTime: STATE.endTime,
        timestamp: new Date().toISOString(),
    };
    if (existing >= 0) {
        data.participants[existing] = participantData;
    } else {
        data.participants.push(participantData);
    }
    saveExperimentData(data);
}
function getAccumulatedPlayCounts(group) {
    const data = loadExperimentData();
    const counts = {};
    SONGS.forEach(s => counts[s.id] = 0);
    data.participants
        .filter(p => p.group === group && p.id !== STATE.participantId)
        .forEach(p => {
            Object.entries(p.playCounts || {}).forEach(([songId, count]) => {
                counts[songId] = (counts[songId] || 0) + count;
            });
        });
    return counts;
}
function getRatingTexts(val) {
    const texts = {
        1: 'あまり好きではない',
        2: 'やや好きではない',
        3: 'ふつう',
        4: 'やや好き',
        5: 'とても好き',
    };
    return texts[val] || '';
}
// ============================================================
// パーティクル背景
// ============================================================
function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let animFrame;
    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    function createParticle() {
        return {
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: Math.random() * 2 + 0.5,
            alpha: Math.random() * 0.5 + 0.1,
            hue: Math.random() > 0.5 ? 263 : 187, // purple or cyan
        };
    }
    function init() {
        resize();
        particles = Array.from({ length: 60 }, createParticle);
    }
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${p.alpha})`;
            ctx.fill();
        });
        // Draw connections
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(124, 58, 237, ${0.05 * (1 - dist / 150)})`;
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            }
        }
        animFrame = requestAnimationFrame(draw);
    }
    init();
    draw();
    window.addEventListener('resize', () => {
        resize();
    });
}
// ============================================================
// 画面遷移
// ============================================================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(`screen-${screenId}`);
    if (screen) {
        screen.classList.add('active');
        STATE.currentScreen = screenId;
        window.scrollTo(0, 0);
    }
}
// ============================================================
// ウェルカム画面
// ============================================================
function initWelcome() {
    document.getElementById('btn-start').addEventListener('click', () => {
        showScreen('consent');
    });
}
// ============================================================
// 同意画面
// ============================================================
function initConsent() {
    document.getElementById('btn-consent').addEventListener('click', () => {
        STATE.participantId = generateId();
        STATE.startTime = new Date().toISOString();
        showScreen('assignment');
        runAssignment();
    });
    document.getElementById('btn-decline').addEventListener('click', () => {
        showScreen('welcome');
    });
}
// ============================================================
// グループ割り当て
// ============================================================
function runAssignment() {
    const title = document.getElementById('assignment-title');
    const desc = document.getElementById('assignment-desc');
    const result = document.getElementById('assignment-result');
    const badge = document.getElementById('group-badge');
    const explanation = document.getElementById('group-explanation');
    title.textContent = 'グループを割り当て中...';
    desc.textContent = 'ランダムにグループを選択しています';
    result.classList.add('hidden');
    // ランダム割り当て
    STATE.group = Math.random() < 0.5 ? 'independent' : 'social';
    // アニメーション演出
    setTimeout(() => {
        title.textContent = 'グループが決まりました！';
        desc.textContent = '';
        if (STATE.group === 'independent') {
            badge.textContent = 'Independent 群';
            badge.className = 'result-badge independent';
            explanation.innerHTML = `
                あなたは<strong>Independent群（独立群）</strong>に割り当てられました。<br>
                他の参加者の行動に関する情報は表示されません。<br>
                自分自身の判断だけで楽曲を評価してください。
            `;
        } else {
            badge.textContent = 'Social Influence 群';
            badge.className = 'result-badge social';
            explanation.innerHTML = `
                あなたは<strong>Social Influence群（社会的影響群）</strong>に割り当てられました。<br>
                各楽曲の<strong>再生回数</strong>が表示されます。<br>
                この情報も参考にしながら楽曲を評価してください。
            `;
        }
        result.classList.remove('hidden');
    }, 2500);
}
function initAssignment() {
    document.getElementById('btn-to-experiment').addEventListener('click', () => {
        showScreen('experiment');
        renderExperiment();
    });
}
// ============================================================
// 実験画面
// ============================================================
let shuffledSongs = [];
function renderExperiment() {
    const groupBadge = document.getElementById('experiment-group-badge');
    const instructionSocial = document.getElementById('instruction-social');
    if (STATE.group === 'independent') {
        groupBadge.textContent = 'INDEPENDENT';
        groupBadge.className = 'experiment-badge independent';
        instructionSocial.classList.add('hidden');
    } else {
        groupBadge.textContent = 'SOCIAL INFLUENCE';
        groupBadge.className = 'experiment-badge social';
        instructionSocial.classList.remove('hidden');
    }
    // 曲の順番をランダム化
    shuffledSongs = shuffleArray(SONGS);
    // 蓄積された再生回数を取得（social群用）
    const accumulatedPlays = getAccumulatedPlayCounts(STATE.group);
    // 各曲の初期再生カウントを0に
    SONGS.forEach(s => STATE.playCounts[s.id] = 0);
    const grid = document.getElementById('song-grid');
    grid.innerHTML = '';
    shuffledSongs.forEach((song, index) => {
        const card = document.createElement('div');
        card.className = 'song-card';
        card.id = `card-${song.id}`;
        card.dataset.songId = song.id;
        const playCountDisplay = STATE.group === 'social'
            ? `<div class="song-plays" id="plays-${song.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    ${(accumulatedPlays[song.id] || 0).toLocaleString()} 回再生
               </div>`
            : '';
        card.innerHTML = `
            <div class="song-thumbnail">
                <img src="https://img.youtube.com/vi/${song.videoId}/mqdefault.jpg" 
                     alt="${song.title}" loading="lazy">
                <div class="play-overlay">
                    <div class="play-btn-icon">
                        <svg viewBox="0 0 24 24">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                        </svg>
                    </div>
                </div>
            </div>
            <div class="song-info">
                <div class="song-title">${song.title}</div>
                <div class="song-meta">
                    <span class="song-release">${song.release}</span>
                    ${playCountDisplay}
                </div>
                <div class="song-rating-display" id="rating-display-${song.id}">
                    <span class="star-empty">★</span>
                    <span class="star-empty">★</span>
                    <span class="star-empty">★</span>
                    <span class="star-empty">★</span>
                    <span class="star-empty">★</span>
                    <span class="rating-value">未評価</span>
                </div>
            </div>
        `;
        card.addEventListener('click', () => openVideoModal(song));
        grid.appendChild(card);
    });
    updateProgress();
}
function updateSongCardRating(songId, rating) {
    const display = document.getElementById(`rating-display-${songId}`);
    if (!display) return;
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += i <= rating
            ? '<span class="star-filled">★</span>'
            : '<span class="star-empty">★</span>';
    }
    stars += `<span class="rating-value">${rating}/5</span>`;
    display.innerHTML = stars;
    const card = document.getElementById(`card-${songId}`);
    if (card) card.classList.add('rated');
}
function updatePlayCountDisplay(songId) {
    if (STATE.group !== 'social') return;
    const accumulatedPlays = getAccumulatedPlayCounts(STATE.group);
    const myPlays = STATE.playCounts[songId] || 0;
    const totalPlays = (accumulatedPlays[songId] || 0) + myPlays;
    const el = document.getElementById(`plays-${songId}`);
    if (el) {
        el.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            ${totalPlays.toLocaleString()} 回再生
        `;
    }
}
function updateProgress() {
    const rated = Object.keys(STATE.ratings).length;
    document.getElementById('rated-count').textContent = rated;
    document.getElementById('total-count').textContent = SONGS.length;
    const btnFinish = document.getElementById('btn-finish');
    // 最低3曲評価で結果を見れるようにする
    btnFinish.disabled = rated < 3;
}
// ============================================================
// 動画モーダル
// ============================================================
let currentModalSongId = null;
function openVideoModal(song) {
    const modal = document.getElementById('video-modal');
    const container = document.getElementById('video-player-container');
    const title = document.getElementById('modal-song-title');
    const detail = document.getElementById('modal-song-detail');
    currentModalSongId = song.id;
    // 再生回数カウント
    STATE.playCounts[song.id] = (STATE.playCounts[song.id] || 0) + 1;
    updatePlayCountDisplay(song.id);
    // YouTube iframeを設置
    container.innerHTML = `
        <iframe 
            src="https://www.youtube.com/embed/${song.videoId}?autoplay=1&rel=0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
        </iframe>
    `;
    title.textContent = song.title;
    detail.textContent = `${song.release} ・ ${song.detail}`;
    // 既存の評価を反映
    const currentRating = STATE.ratings[song.id] || 0;
    updateModalStars(currentRating);
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}
function closeVideoModal() {
    const modal = document.getElementById('video-modal');
    const container = document.getElementById('video-player-container');
    container.innerHTML = '';
    modal.classList.add('hidden');
    document.body.style.overflow = '';
    currentModalSongId = null;
    // 保存
    saveCurrentParticipant();
}
function updateModalStars(rating) {
    const stars = document.querySelectorAll('#modal-stars .star');
    const ratingText = document.getElementById('modal-rating-text');
    stars.forEach(star => {
        const val = parseInt(star.dataset.value);
        star.classList.toggle('active', val <= rating);
    });
    ratingText.textContent = rating > 0 ? getRatingTexts(rating) : '';
}
function initModal() {
    // 閉じるボタン
    document.getElementById('btn-close-modal').addEventListener('click', closeVideoModal);
    // バックドロップクリック
    document.querySelector('.modal-backdrop').addEventListener('click', closeVideoModal);
    // ESCキー
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeVideoModal();
    });
    // 星評価
    const stars = document.querySelectorAll('#modal-stars .star');
    stars.forEach(star => {
        star.addEventListener('mouseenter', () => {
            const val = parseInt(star.dataset.value);
            stars.forEach(s => {
                s.classList.toggle('hovered', parseInt(s.dataset.value) <= val);
            });
        });
        star.addEventListener('mouseleave', () => {
            stars.forEach(s => s.classList.remove('hovered'));
        });
        star.addEventListener('click', () => {
            const val = parseInt(star.dataset.value);
            if (currentModalSongId) {
                STATE.ratings[currentModalSongId] = val;
                updateModalStars(val);
                updateSongCardRating(currentModalSongId, val);
                updateProgress();
            }
        });
    });
    // 結果を見るボタン
    document.getElementById('btn-finish').addEventListener('click', () => {
        STATE.endTime = new Date().toISOString();
        saveCurrentParticipant();
        showScreen('results');
        renderResults();
    });
}
// ============================================================
// 結果画面
// ============================================================
function renderResults() {
    renderYourRatings();
    renderComparison();
    renderGini();
    renderStatsSummary();
}
function renderYourRatings() {
    const groupInfo = document.getElementById('your-group-info');
    groupInfo.textContent = STATE.group === 'independent'
        ? '🔵 Independent 群（再生回数非表示）'
        : '🩷 Social Influence 群（再生回数表示）';
    groupInfo.className = `your-group-info ${STATE.group}`;
    const container = document.getElementById('your-ratings');
    container.innerHTML = '';
    // 評価が高い順にソート
    const sortedSongs = [...SONGS].sort((a, b) => {
        return (STATE.ratings[b.id] || 0) - (STATE.ratings[a.id] || 0);
    });
    sortedSongs.forEach((song, i) => {
        const rating = STATE.ratings[song.id] || 0;
        const percent = (rating / 5) * 100;
        const fillClass = `fill-${(i % 3) + 1}`;
        const item = document.createElement('div');
        item.className = 'rating-bar-item';
        item.innerHTML = `
            <span class="song-name">${song.title}</span>
            <div class="rating-bar-track">
                <div class="rating-bar-fill ${fillClass}" style="width: 0%"></div>
            </div>
            <span class="rating-bar-value">${rating > 0 ? `${rating}/5` : '−'}</span>
        `;
        container.appendChild(item);
        // アニメーション
        requestAnimationFrame(() => {
            setTimeout(() => {
                item.querySelector('.rating-bar-fill').style.width = `${percent}%`;
            }, 100 + i * 80);
        });
    });
}
function renderComparison() {
    const data = loadExperimentData();
    const independentData = data.participants.filter(p => p.group === 'independent');
    const socialData = data.participants.filter(p => p.group === 'social');
    // Chart.js で棒グラフ
    const labels = SONGS.map(s => s.title);
    const independentAvgs = SONGS.map(s => {
        const ratings = independentData.map(p => p.ratings[s.id]).filter(Boolean);
        return ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    });
    const socialAvgs = SONGS.map(s => {
        const ratings = socialData.map(p => p.ratings[s.id]).filter(Boolean);
        return ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    });
    const canvas = document.getElementById('comparison-chart');
    if (canvas._chartInstance) canvas._chartInstance.destroy();
    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Independent群',
                    data: independentAvgs,
                    backgroundColor: 'rgba(6, 182, 212, 0.6)',
                    borderColor: 'rgba(6, 182, 212, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                },
                {
                    label: 'Social Influence群',
                    data: socialAvgs,
                    backgroundColor: 'rgba(244, 114, 182, 0.6)',
                    borderColor: 'rgba(244, 114, 182, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    labels: { color: '#9ca3af', font: { family: 'Inter' } }
                },
            },
            scales: {
                x: {
                    ticks: { color: '#6b7280', font: { size: 10, family: 'Inter' } },
                    grid: { color: 'rgba(255,255,255,0.04)' },
                },
                y: {
                    min: 0,
                    max: 5,
                    ticks: { color: '#6b7280', font: { family: 'Inter' } },
                    grid: { color: 'rgba(255,255,255,0.04)' },
                    title: {
                        display: true,
                        text: '平均評価',
                        color: '#6b7280',
                        font: { family: 'Inter' },
                    },
                },
            },
        },
    });
    canvas._chartInstance = chart;
    // 比較テーブル
    const tableContainer = document.getElementById('comparison-table-container');
    let html = `
        <table class="comparison-table">
            <thead>
                <tr>
                    <th>曲名</th>
                    <th>Independent群 (n=${independentData.length})</th>
                    <th>Social群 (n=${socialData.length})</th>
                    <th>差分</th>
                </tr>
            </thead>
            <tbody>
    `;
    SONGS.forEach((s, i) => {
        const indAvg = independentAvgs[i];
        const socAvg = socialAvgs[i];
        const diff = socAvg - indAvg;
        const diffColor = diff > 0 ? '#34d399' : diff < 0 ? '#ef4444' : '#6b7280';
        html += `
            <tr>
                <td>${s.title}</td>
                <td>${indAvg > 0 ? indAvg.toFixed(2) : '−'}</td>
                <td>${socAvg > 0 ? socAvg.toFixed(2) : '−'}</td>
                <td style="color:${diffColor};font-weight:600">${diff !== 0 ? (diff > 0 ? '+' : '') + diff.toFixed(2) : '−'}</td>
            </tr>
        `;
    });
    html += '</tbody></table>';
    tableContainer.innerHTML = html;
}
function calculateGini(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    if (n === 0) return 0;
    const mean = sorted.reduce((a, b) => a + b, 0) / n;
    if (mean === 0) return 0;
    let sumDiffs = 0;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            sumDiffs += Math.abs(sorted[i] - sorted[j]);
        }
    }
    return sumDiffs / (2 * n * n * mean);
}
function renderGini() {
    const data = loadExperimentData();
    const container = document.getElementById('gini-container');
    // 各群の曲別合計評価のジニ係数
    function getGroupTotalRatings(group) {
        const participants = data.participants.filter(p => p.group === group);
        return SONGS.map(s => {
            const ratings = participants.map(p => p.ratings[s.id]).filter(Boolean);
            return ratings.reduce((a, b) => a + b, 0);
        });
    }
    const indTotals = getGroupTotalRatings('independent');
    const socTotals = getGroupTotalRatings('social');
    const giniInd = calculateGini(indTotals);
    const giniSoc = calculateGini(socTotals);
    container.innerHTML = `
        <div class="gini-card independent">
            <h4>Independent群</h4>
            <div class="gini-value">${giniInd.toFixed(3)}</div>
            <div class="gini-label">ジニ係数（不平等度）</div>
        </div>
        <div class="gini-card social">
            <h4>Social Influence群</h4>
            <div class="gini-value">${giniSoc.toFixed(3)}</div>
            <div class="gini-label">ジニ係数（不平等度）</div>
        </div>
    `;
}
function renderStatsSummary() {
    const data = loadExperimentData();
    const container = document.getElementById('stats-summary');
    const totalParticipants = data.participants.length;
    const indCount = data.participants.filter(p => p.group === 'independent').length;
    const socCount = data.participants.filter(p => p.group === 'social').length;
    const allRatings = data.participants.flatMap(p => Object.values(p.ratings));
    const avgRating = allRatings.length > 0
        ? (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(2)
        : '−';
    const totalPlays = data.participants.reduce((sum, p) => {
        return sum + Object.values(p.playCounts || {}).reduce((a, b) => a + b, 0);
    }, 0);
    container.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${totalParticipants}</div>
            <div class="stat-label">総参加者数</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${indCount} / ${socCount}</div>
            <div class="stat-label">Independent / Social</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${avgRating}</div>
            <div class="stat-label">全体平均評価</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${totalPlays}</div>
            <div class="stat-label">総再生回数</div>
        </div>
    `;
}
// ============================================================
// 管理者ダッシュボード
// ============================================================
function renderAdmin() {
    const data = loadExperimentData();
    // 統計カード
    const stats = document.getElementById('admin-stats');
    const totalP = data.participants.length;
    const indP = data.participants.filter(p => p.group === 'independent').length;
    const socP = data.participants.filter(p => p.group === 'social').length;
    stats.innerHTML = `
        <div class="stat-card">
            <div class="stat-value">${totalP}</div>
            <div class="stat-label">総参加者</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${indP}</div>
            <div class="stat-label">Independent群</div>
        </div>
        <div class="stat-card">
            <div class="stat-value">${socP}</div>
            <div class="stat-label">Social群</div>
        </div>
    `;
    // 参加者テーブル
    const tableContainer = document.getElementById('admin-participants-table');
    if (totalP === 0) {
        tableContainer.innerHTML = '<p style="color: var(--text-muted);">まだ参加者データがありません。</p>';
    } else {
        let html = `
            <div style="overflow-x:auto;">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>参加者ID</th>
                        <th>群</th>
                        <th>日時</th>
                        ${SONGS.map(s => `<th>${s.title.slice(0, 6)}</th>`).join('')}
                        <th>平均</th>
                    </tr>
                </thead>
                <tbody>
        `;
        data.participants.forEach((p, idx) => {
            const ratings = SONGS.map(s => p.ratings[s.id] || '−');
            const numericRatings = SONGS.map(s => p.ratings[s.id]).filter(Boolean);
            const avg = numericRatings.length > 0
                ? (numericRatings.reduce((a, b) => a + b, 0) / numericRatings.length).toFixed(1)
                : '−';
            const groupLabel = p.group === 'independent' ? 'Ind.' : 'Soc.';
            const groupColor = p.group === 'independent' ? '#06b6d4' : '#f472b6';
            const dateStr = p.timestamp ? new Date(p.timestamp).toLocaleString('ja-JP') : '−';
            html += `
                <tr>
                    <td>${idx + 1}</td>
                    <td style="font-family:monospace;font-size:0.75rem">${p.id.slice(0, 8)}</td>
                    <td style="color:${groupColor};font-weight:600">${groupLabel}</td>
                    <td style="font-size:0.75rem">${dateStr}</td>
                    ${ratings.map(r => `<td style="text-align:center">${r}</td>`).join('')}
                    <td style="font-weight:600">${avg}</td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
        tableContainer.innerHTML = html;
    }
    // 曲別平均評価チャート
    renderAdminChart(data);
    // 累積再生回数チャート
    renderPlayCountChart(data);
}
function renderAdminChart(data) {
    const canvas = document.getElementById('admin-chart');
    if (canvas._chartInstance) canvas._chartInstance.destroy();
    const independentData = data.participants.filter(p => p.group === 'independent');
    const socialData = data.participants.filter(p => p.group === 'social');
    const labels = SONGS.map(s => s.title);
    const indAvgs = SONGS.map(s => {
        const r = independentData.map(p => p.ratings[s.id]).filter(Boolean);
        return r.length > 0 ? r.reduce((a, b) => a + b, 0) / r.length : 0;
    });
    const socAvgs = SONGS.map(s => {
        const r = socialData.map(p => p.ratings[s.id]).filter(Boolean);
        return r.length > 0 ? r.reduce((a, b) => a + b, 0) / r.length : 0;
    });
    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Independent群',
                    data: indAvgs,
                    backgroundColor: 'rgba(6, 182, 212, 0.5)',
                    borderColor: 'rgba(6, 182, 212, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                },
                {
                    label: 'Social Influence群',
                    data: socAvgs,
                    backgroundColor: 'rgba(244, 114, 182, 0.5)',
                    borderColor: 'rgba(244, 114, 182, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { labels: { color: '#9ca3af' } },
            },
            scales: {
                x: { ticks: { color: '#6b7280', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                y: { min: 0, max: 5, ticks: { color: '#6b7280' }, grid: { color: 'rgba(255,255,255,0.04)' } },
            },
        },
    });
    canvas._chartInstance = chart;
}
function renderPlayCountChart(data) {
    const canvas = document.getElementById('play-count-chart');
    if (canvas._chartInstance) canvas._chartInstance.destroy();
    const labels = SONGS.map(s => s.title);
    const indCounts = SONGS.map(s => {
        return data.participants
            .filter(p => p.group === 'independent')
            .reduce((sum, p) => sum + (p.playCounts?.[s.id] || 0), 0);
    });
    const socCounts = SONGS.map(s => {
        return data.participants
            .filter(p => p.group === 'social')
            .reduce((sum, p) => sum + (p.playCounts?.[s.id] || 0), 0);
    });
    const chart = new Chart(canvas, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Independent群 再生回数',
                    data: indCounts,
                    backgroundColor: 'rgba(6, 182, 212, 0.4)',
                    borderColor: 'rgba(6, 182, 212, 0.8)',
                    borderWidth: 1,
                    borderRadius: 4,
                },
                {
                    label: 'Social群 再生回数',
                    data: socCounts,
                    backgroundColor: 'rgba(244, 114, 182, 0.4)',
                    borderColor: 'rgba(244, 114, 182, 0.8)',
                    borderWidth: 1,
                    borderRadius: 4,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { labels: { color: '#9ca3af' } } },
            scales: {
                x: { ticks: { color: '#6b7280', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                y: { ticks: { color: '#6b7280' }, grid: { color: 'rgba(255,255,255,0.04)' } },
            },
        },
    });
    canvas._chartInstance = chart;
}
// ============================================================
// CSVエクスポート
// ============================================================
function exportCSV() {
    const data = loadExperimentData();
    if (data.participants.length === 0) {
        alert('エクスポートするデータがありません。');
        return;
    }
    const headers = [
        'participant_id', 'group', 'timestamp',
        ...SONGS.map(s => `rating_${s.id}`),
        ...SONGS.map(s => `plays_${s.id}`),
        'mean_rating',
    ];
    const rows = data.participants.map(p => {
        const ratings = SONGS.map(s => p.ratings[s.id] || '');
        const plays = SONGS.map(s => p.playCounts?.[s.id] || 0);
        const numericRatings = ratings.filter(r => r !== '');
        const mean = numericRatings.length > 0
            ? (numericRatings.reduce((a, b) => a + b, 0) / numericRatings.length).toFixed(2)
            : '';
        return [
            p.id, p.group, p.timestamp || '',
            ...ratings, ...plays,
            mean,
        ];
    });
    const csv = [
        headers.join(','),
        ...rows.map(r => r.join(',')),
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `musiclab_data_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}
// ============================================================
// 初期化
// ============================================================
function initResultsActions() {
    document.getElementById('btn-admin').addEventListener('click', () => {
        showScreen('admin');
        renderAdmin();
    });
    document.getElementById('btn-restart').addEventListener('click', () => {
        // リセットしてやり直し
        STATE.ratings = {};
        STATE.playCounts = {};
        STATE.group = null;
        STATE.participantId = null;
        STATE.startTime = null;
        STATE.endTime = null;
        showScreen('welcome');
    });
}
function initAdminActions() {
    document.getElementById('btn-export').addEventListener('click', exportCSV);
    document.getElementById('btn-reset-data').addEventListener('click', () => {
        if (confirm('⚠️ 全ての実験データを削除しますか？\nこの操作は取り消せません。')) {
            localStorage.removeItem(STORAGE_KEY);
            renderAdmin();
        }
    });
    document.getElementById('btn-back-results').addEventListener('click', () => {
        showScreen('results');
        renderResults();
    });
}
// ============================================================
// APP START
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initWelcome();
    initConsent();
    initAssignment();
    initModal();
    initResultsActions();
    initAdminActions();
});
