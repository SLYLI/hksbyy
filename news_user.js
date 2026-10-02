/* 鹤壁华康肾病专科医院官网 - 新闻渲染（云端数据库优先 + 本机镜像回退）
 * 列表页（news.html）：按分类渲染标题列表，点击进入详情页；
 * 详情页（news-detail.html?id=xx）：渲染完整文章（正文/图片/视频）。 */
(function () {
  'use strict';
  var KEY = 'hksb_news';

  function loadLocal() {
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
  function normRow(r) {
    var imgs = [];
    try { imgs = JSON.parse(r.imgs || '[]'); } catch (e) { imgs = []; }
    var v = r.video ? { src: r.video, type: (r.video.indexOf('http') === 0 ? 'url' : 'file') } : null;
    return { id: r.id, title: r.title, date: r.date, cat: r.cat || '医院动态', content: r.content || '', imgs: imgs, video: v };
  }
  function mergeNews(cloud, local) {
    var out = (cloud || []).slice();
    var ids = {};
    out.forEach(function (n) { ids[String(n.id)] = true; });
    for (var i = 0; i < local.length; i++) {
      if (!ids[String(local[i].id)]) out.push(local[i]);
    }
    return out;
  }
  function sortedByDate(arr) {
    return arr.slice().sort(function (a, b) { return (b.date || '').localeCompare(a.date || ''); });
  }

  var isDetail = /news-detail\.html/i.test(location.pathname);
  var local = loadLocal();

  /* ===== 详情页 ===== */
  if (isDetail) {
    var box = document.getElementById('newsDetail');
    if (!box) return;
    var m = location.search.match(/[?&]id=([^&]+)/);
    var want = m ? decodeURIComponent(m[1]) : null;
    var renderItem = function (item) {
      if (!item) {
        box.innerHTML = '<div class="detail-empty">未找到该新闻：可能已被删除。<br><a href="news.html" style="color:#0e5c42;">← 返回新闻信息</a></div>';
        return;
      }
      var html = '<article class="user-news detail">';
      html += '<h3>' + esc(item.title) + '</h3>';
      html += '<p class="un-meta">' + esc(item.date || '') + ' · ' + esc(item.cat || '医院动态') + ' · 医院发布</p>';
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
    };
    if (!want) { renderItem(null); }
    else {
      var hit = findNews(local, want);
      if (hit) renderItem(hit);
      else if (window.HKDB) {
        box.innerHTML = '<div class="detail-empty" style="color:#b5a678;">正在加载…</div>';
        HKDB.getNews(want).then(function (rows) {
          if (rows && rows.length) renderItem(normRow(rows[0]));
          else renderItem(null);
        }, function () { renderItem(null); });
      } else renderItem(null);
    }
    return;
  }

  /* ===== 列表页（news.html）===== */
  function renderList(news) {
    var groups = {};
    news.forEach(function (n) {
      var cat = n.cat || '医院动态';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(n);
    });
    Object.keys(groups).forEach(function (cat) {
      var cbox = document.getElementById('userNews-' + cat);
      if (!cbox) return;
      var list = sortedByDate(groups[cat]);
      if (!list.length) return;
      var html = '<ul class="news-list">';
      list.forEach(function (n) {
        html += '<li><span class="nd">' + esc(n.date || '') + '</span>';
        html += '<span class="n-title"><a href="news-detail.html?id=' + encodeURIComponent(n.id) + '">' + esc(n.title) + '</a></span>';
        html += '<span class="n-ex">（医院发布）</span></li>';
      });
      html += '</ul>';
      cbox.innerHTML = html;
    });
  }

  if (local.length) renderList(local);
  if (window.HKDB) {
    HKDB.listNews().then(function (rows) {
      if (!rows) return;
      var cloud = rows.map(normRow);
      if (!cloud.length && !local.length) return;
      renderList(mergeNews(cloud, local));
    }, function () {});
  }
})();
