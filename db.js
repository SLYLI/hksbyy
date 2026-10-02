/* 鹤壁华康肾病专科医院官网 - 云数据库访问层（Supabase REST）
 * 所有新闻与统计数据优先存云端数据库（跨设备共享、不怕丢），
 * 云端不可用时自动回退到本机浏览器 localStorage，页面功能不受影响。 */
(function () {
  'use strict';

  var BASE = 'https://jrettlcajcrfbawikcbe.supabase.co/rest/v1';
  var KEY = 'sb_publishable_ksEaxmM1cON_UiXAs7cpFg_DGcjA-22';

  function req(method, path, body, timeoutMs) {
    var t = timeoutMs || 6000;
    var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, t) : null;
    var opts = {
      method: method,
      headers: {
        'apikey': KEY,
        'Authorization': 'Bearer ' + KEY,
        'Content-Type': 'application/json'
      },
      signal: ctrl ? ctrl.signal : undefined
    };
    if (body !== undefined && body !== null) opts.body = JSON.stringify(body);
    return fetch(BASE + path, opts).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      var ct = r.headers.get('content-type') || '';
      if (ct.indexOf('json') >= 0) return r.json();
      return r.text().then(function (txt) { return txt ? JSON.parse(txt) : null; });
    }).then(function (v) {
      if (timer) clearTimeout(timer);
      return v;
    }, function (e) {
      if (timer) clearTimeout(timer);
      throw e;
    });
  }

  function enc(s) { return encodeURIComponent(s); }

  var HKDB = {
    online: true,

    /* ================= 新闻 ================= */
    listNews: function () {
      return req('GET', '/news?select=*&order=date.desc&limit=200').catch(function () { return null; });
    },
    getNews: function (id) {
      return req('GET', '/news?select=*&id=eq.' + enc(id) + '&limit=1').catch(function () { return null; });
    },
    insertNews: function (item) {
      return req('POST', '/news', item, 8000);
    },
    updateNews: function (id, item) {
      return req('PATCH', '/news?id=eq.' + enc(id), item, 8000);
    },
    deleteNews: function (id) {
      return req('DELETE', '/news?id=eq.' + enc(id), null, 8000);
    },
    clearNewsAll: function () {
      return req('DELETE', '/news?id=neq.0', null, 10000);
    },

    /* ================= 访问统计 =================
     * 结构：一行 = (day, kind, page, target, cnt)
     * kind: 'pv' 页面访问 / 'click' 站内点击 */
    addStat: function (kind, page, target) {
      /* 先查该键当日计数，再 +1（并发场景有极小概率丢计数，可接受） */
      var q = '/stats?select=cnt&day=eq.' + enc(today()) + '&kind=eq.' + enc(kind) + '&page=eq.' + enc(page || '') + '&target=eq.' + enc(target || '');
      return req('GET', q).then(function (rows) {
        if (rows && rows.length) {
          return req('PATCH', q, { cnt: rows[0].cnt + 1 }, 8000);
        }
        return req('POST', '/stats', { day: today(), kind: kind, page: page || '', target: target || '', cnt: 1 }, 8000);
      }).catch(function () { return null; });
    },
    loadStats: function () {
      /* 读取全部统计（近 1 年），返回行数组 */
      var q = '/stats?select=day,kind,page,target,cnt&day=gte.' + enc(yesterday365());
      return req('GET', q).catch(function () { return null; });
    },
    clearStats: function () {
      return req('DELETE', '/stats?day=gte.2020-01-01', null, 10000).catch(function () { return null; });
    }
  };

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function today() {
    var d = new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function yesterday365() {
    var d = new Date(Date.now() - 365 * 24 * 3600 * 1000);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  window.HKDB = HKDB;
})();
