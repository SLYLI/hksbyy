/* 鹤壁华康肾病专科医院官网 - 本机发布新闻渲染
 * 列表页（news.html）：按分类渲染标题列表，点击进入详情页；
 * 详情页（news-detail.html?id=xx）：渲染完整文章（正文/图片/视频）。 */
(function () {
  'use strict';
  var KEY = 'hksb_news';

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { return []; }
  }
  function esc(s) {
    return ('' + (s == null ? '' : s)).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function findNews(news, id) {
    for (var i = 0; i < news.length; i++) {
      if (String(news[i].id) === String(id)) return news[i];
    }
    return null;
  }

  var news = load();
  if (!news || !news.length) return;

  /* ===== 详情页 ===== */
  if (/news-detail\.html/i.test(location.pathname)) {
    var box = document.getElementById('newsDetail');
    if (!box) return;
    var m = location.search.match(/[?&]id=([^&]+)/);
    var item = m ? findNews(news, decodeURIComponent(m[1])) : null;
    if (!item) {
      box.innerHTML = '<div class="detail-empty">未找到该新闻：可能已被删除，或本机浏览器数据已清理。<br><a href="news.html" style="color:#0e5c42;">← 返回新闻信息</a></div>';
      return;
    }
    var html = '<article class="user-news detail">';
    html += '<h3>' + esc(item.title) + '</h3>';
    html += '<p class="un-meta">' + esc(item.date || '') + ' · ' + esc(item.cat || '医院动态') + ' · 本机发布</p>';
    if (item.content) {
      html += '<div class="un-body">' + esc(item.content).replace(/\n/g, '<br>') + '</div>';
    }
    if (item.imgs && item.imgs.length) {
      html += '<div class="un-imgs">';
      item.imgs.forEach(function (src) { html += '<img src="' + esc(src) + '" alt="新闻图片" loading="lazy">'; });
      html += '</div>';
    }
    if (item.video && item.video.src) {
      html += '<div class="un-video"><video controls preload="metadata" src="' + esc(item.video.src) + '"></video></div>';
    }
    html += '</article>';
    box.innerHTML = html;
    return;
  }

  /* ===== 列表页（news.html）===== */
  var groups = {};
  news.forEach(function (n) {
    var cat = n.cat || '医院动态';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(n);
  });
  Object.keys(groups).forEach(function (cat) {
    var cbox = document.getElementById('userNews-' + cat);
    if (!cbox) return;
    var list = groups[cat].slice().sort(function (a, b) {
      return (b.date || '').localeCompare(a.date || '');
    });
    if (!list.length) return;
    var html = '<ul class="news-list">';
    list.forEach(function (n) {
      html += '<li><span class="nd">' + esc(n.date || '') + '</span>';
      html += '<span class="n-title"><a href="news-detail.html?id=' + encodeURIComponent(n.id) + '">' + esc(n.title) + '</a></span>';
      html += '<span class="n-ex">（本机发布）</span></li>';
    });
    html += '</ul>';
    cbox.innerHTML = html;
  });
})();
