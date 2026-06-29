const categories = ['general', 'technology', 'business', 'sports', 'astrology', 'science', 'entertainment'];

const categoryNav = document.getElementById('categoryNav');
const tickerText = document.getElementById('tickerText');
const heroMain = document.getElementById('heroMain');
const heroSidebar = document.getElementById('heroSidebar');
const newsGrid = document.getElementById('newsGrid');
const latestNewsList = document.getElementById('latestNewsList');
const dateLine = document.getElementById('dateLine');

function setDate() {
  dateLine.textContent = `${new Date().toLocaleDateString()} · BREAKING NEWS 24/7 · EDITION: GLOBAL`;
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getBadge(index) {
  if (index === 0) return '<span class="badge badge-breaking">BREAKING</span>';
  if (index === 1) return '<span class="badge badge-trending">TRENDING</span>';
  if (index === 3) return '<span class="badge badge-exclusive">EXCLUSIVE</span>';
  return '';
}

function renderCategoryButtons() {
  categoryNav.innerHTML = categories
    .map((cat) => `<button class="cat-btn" data-category="${cat}">${cat.charAt(0).toUpperCase() + cat.slice(1)}</button>`)
    .join('');

  categoryNav.querySelectorAll('.cat-btn').forEach((btn) => {
    btn.addEventListener('click', () => loadCategory(btn.dataset.category));
  });
}

function showSpinner() {
  heroMain.innerHTML = '<div class="spinner"></div>';
  heroSidebar.innerHTML = '';
  newsGrid.innerHTML = '';
  latestNewsList.innerHTML = '';
}

function renderLatestNews(articles) {
  latestNewsList.innerHTML = articles.slice(0, 5).map((article) => `
    <article class="latest-item" data-url="${article.url}">
      <div class="latest-meta">${article.source?.name || 'Unknown'} · ${timeAgo(article.publishedAt)}</div>
      <h3>${article.title}</h3>
    </article>
  `).join('');

  latestNewsList.querySelectorAll('.latest-item').forEach((item) => {
    item.addEventListener('click', () => window.open(item.dataset.url, '_blank', 'noopener,noreferrer'));
  });
}

function renderNews(articles) {
  const heroArticle = articles[0];
  heroMain.innerHTML = `
    <article class="news-card hero-card" data-url="${heroArticle.url}">
      ${getBadge(0)}
      <div class="news-meta">${heroArticle.source?.name || 'Unknown'} · ${timeAgo(heroArticle.publishedAt)}</div>
      <h2>${heroArticle.title}</h2>
      <p>${heroArticle.description}</p>
    </article>
  `;

  heroSidebar.innerHTML = [1, 2]
    .map((index) => {
      const article = articles[index];
      return `
        <article class="news-card side-card" data-url="${article.url}">
          ${getBadge(index)}
          <div class="news-meta">${article.source?.name || 'Unknown'} · ${timeAgo(article.publishedAt)}</div>
          <h3>${article.title}</h3>
        </article>
      `;
    })
    .join('');

  newsGrid.innerHTML = articles.slice(3, 12).map((article, index) => `
    <article class="news-card" data-url="${article.url}">
      ${getBadge(index + 3)}
      <div class="news-meta">${article.source?.name || 'Unknown'} · ${timeAgo(article.publishedAt)}</div>
      <h3>${article.title}</h3>
      <p>${article.description}</p>
    </article>
  `).join('');

  document.querySelectorAll('.news-card').forEach((card) => {
    card.addEventListener('click', () => window.open(card.dataset.url, '_blank', 'noopener,noreferrer'));
  });

  renderLatestNews(articles);
}

function updateTicker(articles) {
  tickerText.textContent = articles.slice(0, 6).map((article) => article.title).join(' · ');
}

async function loadCategory(cat) {
  showSpinner();
  try {
    const response = await fetch(`/api/news?category=${cat}`);
    if (!response.ok) throw new Error('Unable to load headlines');
    const articles = await response.json();
    renderNews(articles);
    updateTicker(articles);
  } catch (error) {
    heroMain.innerHTML = `<div class="error">${error.message}</div>`;
    heroSidebar.innerHTML = '';
    newsGrid.innerHTML = '';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  setDate();
  renderCategoryButtons();
  loadCategory('general');
});
