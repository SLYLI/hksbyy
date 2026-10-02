/* 鹤壁华康肾病专科医院官网 - 每日点击量统计（本地统计）
 * 记录：每日页面访问量(PV) + 站内链接点击量
 * 数据保存在当前浏览器 localStorage，按天独立统计。
 * 说明：此为本机浏览器内统计；更换电脑/浏览器/清除缓存后数据从新开始，
 *       如需跨设备每日汇总请使用统计平台或部署到服务器后接入。 */
(function () {
  'use strict';

  var KEY = 'hksb_stats';

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { return {}; }
  }

  function save(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); }
    catch (e) { console.warn('[统计] 本地存储不可用（file:// 模式部分浏览器限制）：' + e.message); }
  }

  function bump(section, key, n) {
    var s = load();
    var day = today();
    if (!s[day]) s[day] = { pv: {}, click: {} };
    if (!s[day][section]) s[day][section] = {};
    if (!s[day][section][key]) s[day][section][key] = 0;
    s[day][section][key] += n;
    save(s);
  }

  /* 页面访问 PV */
  var page = (location.pathname.split('/').pop() || 'index.html');
  if (page === '' || page === 'stats.html') { /* 统计页自身不计 PV */ }
  else { bump('pv', page, 1); }

  /* 站内链接点击（捕获阶段） */
  document.addEventListener('click', function (e) {
    var el = e.target;
    var a = null;
    while (el && el !== document) {
      if (el.tagName === 'A') { a = el; break; }
      el = el.parentNode;
    }
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href) return;
    if (href.charAt(0) === '#' || href.indexOf('javascript:') === 0) return;
    if (/^https?:\/\//i.test(href) || href.indexOf('//') === 0) return; /* 站外不记 */
    var target = href.split('#')[0].split('?')[0];
    target = target.split('/').pop();
    if (!target) return;
    var label = (a.innerText || '').trim().replace(/\s+/g, ' ') || target;
    if (label.length > 24) label = label.slice(0, 24) + '…';
    bump('click', target + '｜' + label, 1);
  }, true);
})();
