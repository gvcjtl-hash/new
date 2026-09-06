/* =====================================================================
   REPLAY ENGINE
   .lesson = a section.  .step = one screen inside it.
   data-gate on a step blocks Next until Replay.complete() fires.
   ===================================================================== */
var Replay = (function(){
  var lessons     = Array.prototype.slice.call(document.querySelectorAll('.lesson'));
  var cmCount     = document.getElementById('cmCount');
  var cmSegs      = document.getElementById('cmSegs');
  var btnBack     = document.getElementById('btnBack');
  var btnNext     = document.getElementById('btnNext');
  var gateNote    = document.getElementById('gateNote');
  var loBadge     = document.getElementById('loBadge');
  var loBadgeNum  = document.getElementById('loBadgeNum');
  var headTitle   = document.getElementById('headTitle');
  var headLo      = document.getElementById('headLo');
  var screenTitle = document.getElementById('screenTitle');
  var scoreVal    = document.getElementById('scoreVal');
  var finalScore  = document.getElementById('finalScore');
  var seenCountEl = document.getElementById('seenCount');
  var live        = document.getElementById('live');
  var stationChip = document.getElementById('stationChip');

  var li = 0, si = 0, score = 0;
  var byLo = {};
  var pad = function(n){ return (n < 10 ? '0' : '') + n; };

  var Progress = (function(){
    var SCOPE  = 'ch4-replay';
    var LOCAL  = 'sv-' + SCOPE + '-v1';
    var remote = (window.SV && window.SV.progress) || null;
    var data   = {};

    function localLoad(){
      try { return JSON.parse(localStorage.getItem(LOCAL) || '{}') || {}; }
      catch(e){ return {}; }
    }
    function localSave(){
      try { localStorage.setItem(LOCAL, JSON.stringify(data)); } catch(e){}
    }

    return {
      source: remote ? 'supabase' : 'local',
      hydrate: function(done){
        if(remote && remote.load){
          remote.load(SCOPE, function(d){ data = d || {}; done(); });
          return;
        }
        data = localLoad();
        done();
      },
      has:  function(k){ return data[k] === 1; },
      mark: function(k){
        if(data[k] === 1) return;
        data[k] = 1;
        if(remote && remote.save) remote.save(SCOPE, data); else localSave();
      },
      clear: function(){
        data = {};
        if(remote && remote.clear) remote.clear(SCOPE); else localSave();
      }
    };
  })();

  function isSeen(l, s){ return Progress.has(l + ':' + s); }
  function markSeen(l, s){ Progress.mark(l + ':' + s); }
  function sectionCounts(l){
    var n = steps(lessons[l]).length, c = 0;
    for(var i = 0; i < n; i++) if(isSeen(l, i)) c++;
    return { total: n, seen: c };
  }
  function chapterCounts(){
    var t = 0, c = 0;
    lessons.forEach(function(_, i){ var r = sectionCounts(i); t += r.total; c += r.seen; });
    return { total: t, seen: c };
  }
  function resetSeen(){ Progress.clear(); render(); }

  function steps(l){ return Array.prototype.slice.call(l.querySelectorAll('.step')); }
  function isEnd(l){ return l.getAttribute('data-lo') === 'end'; }

  var segEls = [];
  lessons.forEach(function(l){
    if(isEnd(l)) return;
    var s = document.createElement('span');
    s.className = 'cm-seg';
    cmSegs.appendChild(s);
    segEls.push(s);
  });

  var sideNav  = document.getElementById('sideNav');
  var snList   = document.getElementById('snList');
  var navScrim = document.getElementById('navScrim');
  var navWhere = document.getElementById('navWhere');
  var tocBtn   = document.getElementById('tocBtn');
  var snSecs   = [];

  lessons.forEach(function(l, li_){
    var end = isEnd(l);
    var sec = document.createElement('li');
    sec.className = 'sn-sec';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'sn-btn';
    btn.innerHTML = '<span class="sn-n">' + (end ? '\u2713' : l.getAttribute('data-lo')) + '</span>' +
                    '<span class="sn-t">' + (l.getAttribute('data-title') || '') + '</span>' +
                    '<span class="sn-meta"></span>';
    btn.addEventListener('click', function(){ closeDrawer(); go(li_, 0); });
    sec.appendChild(btn);

    var ul = document.createElement('ul');
    ul.className = 'sn-screens';
    steps(l).forEach(function(st, si_){
      var item = document.createElement('li');
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'sn-screen';
      var code = end ? String(si_ + 1) : (l.getAttribute('data-lo') + '.' + (si_ + 1));
      b.innerHTML = '<span class="sn-code" aria-hidden="true">' + code + '</span><span>' +
                    (st.getAttribute('data-screen') || ('Screen ' + (si_ + 1))) + '</span>';
      b.addEventListener('click', function(){ closeDrawer(); go(li_, si_); });
      item.appendChild(b);
      ul.appendChild(item);
    });
    sec.appendChild(ul);

    snList.appendChild(sec);
    snSecs.push({ el: sec, btn: btn, screens: Array.prototype.slice.call(ul.querySelectorAll('.sn-screen')) });
  });

  function openDrawer(){ sideNav.classList.add('open'); navScrim.hidden = false; tocBtn.setAttribute('aria-expanded','true'); }
  function closeDrawer(){ sideNav.classList.remove('open'); navScrim.hidden = true; tocBtn.setAttribute('aria-expanded','false'); }
  tocBtn.addEventListener('click', function(){
    sideNav.classList.contains('open') ? closeDrawer() : openDrawer();
  });
  navScrim.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function(e){
    if(e.key === 'Escape' && sideNav.classList.contains('open')) closeDrawer();
  });

  function paintNav(){
    snSecs.forEach(function(s, i){
      var r = sectionCounts(i);
      s.el.classList.toggle('here', i === li);
      s.el.classList.toggle('open', i === li);
      s.el.classList.toggle('done', r.seen === r.total);
      s.btn.querySelector('.sn-meta').textContent = isEnd(lessons[i]) ? '' : r.seen + '/' + r.total;
      s.screens.forEach(function(b, j){
        b.setAttribute('aria-current', (i === li && j === si) ? 'true' : 'false');
        b.classList.toggle('seen', isSeen(i, j));
      });
    });
    var cur = lessons[li], st = steps(cur);
    navWhere.textContent = isEnd(cur)
      ? 'End of chapter'
      : (cur.getAttribute('data-station')
          ? cur.getAttribute('data-station') + ' \u00b7 ' + cur.getAttribute('data-lo') + '.' + (si + 1)
          : cur.getAttribute('data-lo') + '.' + (si + 1) + ' \u00b7 screen ' + (si + 1) + ' of ' + st.length);
  }

  function render(){
    markSeen(li, si);

    lessons.forEach(function(l, i){ l.classList.toggle('active', i === li); });
    var cur = lessons[li];
    var st = steps(cur);
    st.forEach(function(s, i){ s.classList.toggle('active', i === si); });

    var end = isEnd(cur);
    document.body.classList.toggle('ch-end', end);
    loBadgeNum.textContent = end ? '\u2713' : cur.getAttribute('data-lo');
    loBadge.classList.toggle('end', end);
    headTitle.textContent = cur.getAttribute('data-title') || '';
    headLo.innerHTML = cur.getAttribute('data-obj') || '';
    if(stationChip){
      var station = cur.getAttribute('data-station') || '';
      if(station && !end){
        stationChip.hidden = false;
        stationChip.textContent = 'Floor station · ' + station;
      } else {
        stationChip.hidden = true;
        stationChip.textContent = '';
      }
    }

    segEls.forEach(function(s, i){
      s.classList.toggle('cur', i === li);
      s.classList.toggle('done', sectionCounts(i).seen === sectionCounts(i).total);
    });

    var stepEl = st[si];
    screenTitle.textContent = (stepEl && stepEl.getAttribute('data-screen')) || '';

    var cc = chapterCounts();
    if(seenCountEl) seenCountEl.textContent = cc.seen + ' of ' + cc.total + ' screens opened';

    cmCount.textContent = end
      ? 'COMPLETE'
      : pad(si + 1) + ' / ' + pad(st.length);

    paintNav();
    paintMastery();
    if (window.__saveReplayPositionWeek4) window.__saveReplayPositionWeek4();
    if (end && window.__markLearnCompleteWeek4) window.__markLearnCompleteWeek4();

    var atStart = (li === 0 && si === 0);
    btnBack.disabled = false;
    btnBack.innerHTML = atStart ? '\u2190 Week 4 files' : '\u2190 Back';
    btnBack.setAttribute('data-exit', atStart ? '1' : '0');
    btnNext.style.visibility = end ? 'hidden' : 'visible';
    updateGate();
    if(window.__refit) window.__refit.forEach(function(f){ f(); });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function currentStep(){ return steps(lessons[li])[si]; }

  function updateGate(){
    var s = currentStep();
    if(!s) return;
    var locked = s.hasAttribute('data-gate') && s.getAttribute('data-done') !== 'true';
    btnNext.disabled = locked;
    gateNote.hidden = !locked;
  }

  function go(newLi, newSi){ li = newLi; si = newSi; render(); }

  function next(){
    var st = steps(lessons[li]);
    if(si < st.length - 1){ si++; }
    else if(li < lessons.length - 1){ li++; si = 0; }
    render();
  }
  function back(){
    if(si > 0){ si--; }
    else if(li > 0){ li--; si = Math.max(0, steps(lessons[li]).length - 1); }
    render();
  }

  btnNext.addEventListener('click', next);
  btnBack.addEventListener('click', function(){
    if(btnBack.getAttribute('data-exit') === '1'){ window.location.href = 'index.html'; return; }
    back();
  });

  document.addEventListener('keydown', function(e){
    if(e.target.closest('button, input, textarea, select')) return;
    if(e.key === 'ArrowRight' && !btnNext.disabled && btnNext.style.visibility !== 'hidden'){ next(); }
    if(e.key === 'ArrowLeft'){ back(); }
  });

  function complete(stepEl, points){
    if(stepEl.getAttribute('data-done') === 'true') return;
    stepEl.setAttribute('data-done', 'true');
    if(points){
      score += points;
      scoreVal.textContent = score;
      if(finalScore) finalScore.textContent = score;
      var les = stepEl.closest('.lesson');
      if(les){
        var lo = les.getAttribute('data-lo');
        byLo[lo] = (byLo[lo] || 0) + points;
      }
      paintMastery();
    }
    updateGate();
  }

  function paintMastery(){
    document.querySelectorAll('[data-mastery-score]').forEach(function(el){
      el.textContent = byLo[el.getAttribute('data-mastery-score')] || 0;
    });
  }

  function announce(text){ if(live) live.textContent = text; }

  var resetBtn = document.getElementById('resetSeen');
  if(resetBtn) resetBtn.addEventListener('click', function(){
    resetSeen();
    go(0, 0);
  });

  return { complete: complete, render: render, go: go, announce: announce,
           getState: function(){
             var cur = lessons[li];
             if(!cur || isEnd(cur)) return null;
             var st = steps(cur);
             var stepEl = st[si];
             return {
               lo: cur.getAttribute('data-lo'),
               page: si + 1,
               sectionTitle: cur.getAttribute('data-title') || '',
               screenTitle: (stepEl && stepEl.getAttribute('data-screen')) || ''
             };
           },
           start: function(){
             Progress.hydrate(function(){
               var at = new URLSearchParams(location.search).get('at');
               if(at){
                 var m = at.match(/^(\d+\.\d+)\.(\d+)$/);
                 if(m){
                   var targetLo = m[1], targetPage = parseInt(m[2], 10);
                   for(var i = 0; i < lessons.length; i++){
                     if(lessons[i].getAttribute('data-lo') === targetLo){
                       li = i;
                       si = Math.max(0, Math.min(targetPage - 1, steps(lessons[i]).length - 1));
                       break;
                     }
                   }
                 }
               }
               render();
             });
           } };
})();

/* ---------- shared helpers ---------- */
function sceneLayer(scene, state){
  if(!scene) return;
  var target = scene.querySelector('.scene-layer[data-state="' + state + '"]');
  if(!target || target.getAttribute('data-failed') === '1'){
    target = scene.querySelector('.scene-layer[data-state="base"]');
  }
  scene.querySelectorAll('.scene-layer').forEach(function(l){
    l.classList.toggle('is-on', l === target);
  });
}

function makeNextButton(label){
  var b = document.createElement('button');
  b.type = 'button';
  b.className = 'btn ghost';
  b.textContent = label;
  b.hidden = true;
  return b;
}

/* ---------- stamp decision ---------- */
document.querySelectorAll('[data-activity="stamp"]').forEach(function(wrap){
  var stepEl = wrap.closest('.step');
  var answer = wrap.getAttribute('data-answer');
  var points = parseInt(wrap.getAttribute('data-points') || '0', 10);
  var verdict = stepEl.querySelector('.verdict');
  wrap.querySelectorAll('.stamp').forEach(function(btn){
    btn.addEventListener('click', function(){
      if(wrap.getAttribute('data-locked') === 'true') return;
      wrap.setAttribute('data-locked', 'true');
      var key = btn.getAttribute('data-key');
      var right = key === answer;

      wrap.querySelectorAll('.stamp').forEach(function(b){
        b.disabled = true;
        if(b === btn) b.classList.add('picked');
      });

      if(verdict){
        verdict.querySelectorAll('p').forEach(function(p){
          var tagged = false, mine = false;
          for(var i = 0; i < p.attributes.length; i++){
            var n = p.attributes[i].name;
            if(n.indexOf('data-verdict-') !== 0) continue;
            tagged = true;
            if(n === 'data-verdict-' + key) mine = true;
          }
          if(tagged) p.hidden = !mine;
        });
        verdict.hidden = false;
        verdict.focus();
      }

      Replay.announce(right ? 'Correct.' : 'Not quite. Read the verdict.');
      Replay.complete(stepEl, right ? points : 0);
    });
  });
});

/* ---------- single choice ---------- */
document.querySelectorAll('[data-activity="choice"]').forEach(function(wrap){
  var stepEl = wrap.closest('.step');
  var points = parseInt(wrap.getAttribute('data-points') || '0', 10);
  var verdict = stepEl.querySelector('.verdict');

  wrap.querySelectorAll('.choice').forEach(function(btn){
    btn.addEventListener('click', function(){
      if(wrap.getAttribute('data-locked') === 'true') return;
      wrap.setAttribute('data-locked', 'true');
      var right = btn.getAttribute('data-correct') === 'true';

      wrap.querySelectorAll('.choice').forEach(function(b){
        b.disabled = true;
        if(b.getAttribute('data-correct') === 'true') b.classList.add('good');
        else if(b === btn) b.classList.add('bad');
      });

      if(verdict){
        verdict.hidden = false;
        verdict.focus();
      }

      Replay.announce(right ? 'Correct.' : 'Not quite. The correct answer is highlighted.');
      Replay.complete(stepEl, right ? points : 0);
    });
  });
});

/* ---------- multi-round quizzes ---------- */
document.querySelectorAll('[data-activity="rounds"]').forEach(function(wrap){
  var stepEl = wrap.closest('.step');
  var points = parseInt(wrap.getAttribute('data-points') || '0', 10);
  var rounds = Array.prototype.slice.call(wrap.querySelectorAll('.round'));
  if(!rounds.length) return;

  var countEl  = wrap.querySelector('.rh-count');
  var scoreEl  = wrap.querySelector('.rh-score');
  var nextWrap = wrap.querySelector('.rounds-next');
  var nextBtn  = wrap.querySelector('[data-rounds-next]');
  var nextLabel = (nextBtn && nextBtn.textContent) || 'Next \u2192';
  var at = 0, got = 0, answered = 0, finished = false;
  var history = [];

  function escapeHtml(s){
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function noun(round){
    var label = round.querySelector('.rp-label');
    var word = label ? label.textContent.trim().split(/\s+/)[0] : '';
    return word || 'Item';
  }
  function promptText(round){
    var p = round.querySelector('.round-prompt p');
    return p ? p.textContent.trim() : '';
  }
  function correctText(round){
    var b = round.querySelector('.ropt[data-correct="true"]');
    return b ? b.textContent.trim() : '';
  }
  function whyText(round){
    var why = round.querySelector('.round-why');
    return why ? why.textContent.trim() : '';
  }
  function setNextReady(on, label){
    if(!nextBtn) return;
    nextBtn.disabled = !on;
    if(label) nextBtn.textContent = label;
  }
  function paintHud(){
    if(countEl) countEl.textContent = noun(rounds[at]) + ' ' + (at + 1) + ' of ' + rounds.length;
    if(scoreEl) scoreEl.textContent = got + ' of ' + rounds.length + ' right';
  }
  function show(n){
    at = n;
    rounds.forEach(function(r, j){ r.classList.toggle('active', j === n); });
    setNextReady(false, nextLabel);
    paintHud();
  }
  function renderReview(earned){
    var html = '<div class="hd-score">' + got + ' of ' + rounds.length + ' right \u00b7 ' + earned + ' points</div>' +
      '<p class="kc-review-head">Answer summary</p>' +
      '<ul class="kc-review-list">';
    history.forEach(function(row, i){
      var miss = !row.right;
      var givenLine = row.right
        ? '<span class="ok">' + escapeHtml(row.given) + ' \u2713</span>'
        : '<span class="no">' + escapeHtml(row.given) + ' \u2717</span>';
      html += '<li class="' + (miss ? 'is-miss' : '') + '">' +
        '<span class="pr-kicker">' + escapeHtml(noun(rounds[i]) + ' ' + (i + 1)) + '</span>' +
        '<p class="pr-claim">' + escapeHtml(row.q) + '</p>' +
        '<div class="pr-meta">' +
          '<div><b>Your answer:</b> ' + givenLine + '</div>' +
          '<div><b>Correct answer:</b> ' + escapeHtml(row.correct) + '</div>' +
        '</div>' +
        (row.why ? '<div class="pr-why"><b>Reasoning:</b> ' + escapeHtml(row.why) + '</div>' : '') +
      '</li>';
    });
    html += '</ul>';
    return html;
  }
  function finish(){
    if(finished) return;
    finished = true;
    if(nextWrap) nextWrap.hidden = true;
    setNextReady(false, nextLabel);
    if(nextBtn) nextBtn.hidden = true;
    var hud = wrap.querySelector('.rounds-hud');
    if(hud) hud.hidden = true;
    rounds.forEach(function(r){ r.classList.remove('active'); });
    var earned = Math.round(points * got / rounds.length);
    var done = document.createElement('div');
    done.className = 'rounds-done kc-review';
    done.innerHTML = renderReview(earned);
    wrap.appendChild(done);
    Replay.announce('Set complete. ' + got + ' of ' + rounds.length + ' right. Review your answers.');
    Replay.complete(stepEl, earned);
  }

  rounds.forEach(function(round){
    var why = round.querySelector('.round-why');
    round.querySelectorAll('.ropt').forEach(function(btn){
      btn.addEventListener('click', function(){
        if(round.getAttribute('data-locked') === 'true') return;
        round.setAttribute('data-locked', 'true');
        var right = btn.getAttribute('data-correct') === 'true';
        if(right) got++;
        answered++;
        history.push({
          q: promptText(round),
          given: btn.textContent.trim(),
          correct: correctText(round),
          why: whyText(round),
          right: right
        });

        round.querySelectorAll('.ropt').forEach(function(b){
          b.disabled = true;
          if(b.getAttribute('data-correct') === 'true') b.classList.add('good');
          else if(b === btn) b.classList.add('bad');
        });

        if(why) why.hidden = false;
        paintHud();
        Replay.announce(right ? 'Correct.' : 'Not quite. The correct answer is highlighted.');
        setNextReady(true, answered >= rounds.length ? 'See summary \u2192' : nextLabel);
        if(nextWrap) nextWrap.hidden = false;
      });
    });
  });

  if(nextBtn) nextBtn.addEventListener('click', function(){
    if(nextBtn.disabled) return;
    if(answered >= rounds.length){
      finish();
      return;
    }
    if(nextWrap) nextWrap.hidden = true;
    for(var k = 1; k <= rounds.length; k++){
      var j = (at + k) % rounds.length;
      if(rounds[j].getAttribute('data-locked') !== 'true'){
        show(j);
        var first = rounds[j].querySelector('.ropt');
        if(first) first.focus();
        return;
      }
    }
  });

  show(0);
});

/* ---------- 2.5 image-or-equity ladder ---------- */
document.querySelectorAll('[data-activity="order"]').forEach(function(wrap){
  var stepEl = wrap.closest('.step');
  var points = parseInt(wrap.getAttribute('data-points') || '0', 10);
  var rungs  = Array.prototype.slice.call(wrap.querySelectorAll('.rung'));
  if(!rungs.length) return;

  var countEl = wrap.querySelector('.ld-count');
  var resetBtn = wrap.querySelector('.ld-reset');
  var done    = wrap.querySelector('.ladder-done');
  var stepsEl = wrap.querySelector('[data-ld-steps]');
  var earnedEl = wrap.querySelector('[data-ld-earned]');
  var picks = [];
  var locked = false;

  function paintHud(){
    if(countEl) countEl.textContent = picks.length + ' of ' + rungs.length + ' placed';
    if(resetBtn) resetBtn.hidden = picks.length === 0 || locked;
  }

  function reset(){
    picks = [];
    locked = false;
    rungs.forEach(function(r){
      r.removeAttribute('data-pick');
      r.disabled = false;
    });
    if(done) done.hidden = true;
    if(stepsEl) stepsEl.innerHTML = '';
    paintHud();
  }

  function finish(){
    locked = true;
    if(resetBtn) resetBtn.hidden = true;
    rungs.forEach(function(r){ r.disabled = true; });

    var right = 0;
    if(stepsEl){
      stepsEl.innerHTML = '';
      var ordered = rungs.slice().sort(function(a, b){
        return parseInt(a.getAttribute('data-rank'), 10) - parseInt(b.getAttribute('data-rank'), 10);
      });
      ordered.forEach(function(rung, i){
        var rank = parseInt(rung.getAttribute('data-rank'), 10);
        var placed = picks.indexOf(rung) + 1;
        var good = placed === rank;
        if(good) right++;
        var row = document.createElement('div');
        row.className = 'ld-step' + (good ? '' : ' miss');
        row.innerHTML =
          '<span class="ld-n">' + rank + '</span>' +
          '<div class="ld-t">' +
            '<b>' + (rung.getAttribute('data-label') || '') + '</b> &mdash; ' + rung.textContent +
            '<span class="ld-w">' + (rung.getAttribute('data-why') || '') + '</span>' +
            (good ? '' : '<span class="ld-tag">You placed this as step ' + placed + '</span>') +
          '</div>';
        stepsEl.appendChild(row);
      });
    }

    var earned = Math.round(points * right / rungs.length);
    if(earnedEl){
      earnedEl.textContent = right === rungs.length
        ? 'Sequence complete \u00b7 ' + earned + ' points'
        : right + ' of ' + rungs.length + ' in the right place \u00b7 ' + earned + ' points';
    }
    if(done) done.hidden = false;

    Replay.announce(right === rungs.length
      ? 'Path complete. All ' + rungs.length + ' steps in order.'
      : 'Path graded. ' + right + ' of ' + rungs.length + ' in the right place.');
    Replay.complete(stepEl, earned);
  }

  rungs.forEach(function(rung){
    rung.addEventListener('click', function(){
      if(locked || rung.getAttribute('data-pick')) return;
      picks.push(rung);
      rung.setAttribute('data-pick', String(picks.length));
      paintHud();
      if(picks.length >= rungs.length) finish();
    });
  });

  if(resetBtn) resetBtn.addEventListener('click', function(){
    if(locked) return;
    reset();
    Replay.announce('Path cleared. Start again.');
  });

  paintHud();
});

/* ---------- Michelin claim cards ---------- */
document.querySelectorAll('[data-activity="flipset"]').forEach(function(wrap){
  var stepEl = wrap.closest('.step');
  var points = parseInt(wrap.getAttribute('data-points') || '0', 10);
  var cards  = Array.prototype.slice.call(wrap.querySelectorAll('.flip-card'));
  var countEl = stepEl.querySelector('.flipset-count');
  var payoff  = stepEl.querySelector('[data-flipset-payoff], [data-flip-payoff]');
  var stage   = stepEl.querySelector('[data-room-stage]');
  var roomSeats = wrap.hasAttribute('data-room-seats');
  var turned = 0;

  cards.forEach(function(card){
    card.addEventListener('click', function(){
      var open = card.classList.toggle('is-flipped');
      card.setAttribute('aria-pressed', open ? 'true' : 'false');
      if(!open || card.getAttribute('data-seen') === '1') return;

      card.setAttribute('data-seen', '1');
      turned++;
      if(countEl){
        countEl.textContent = roomSeats
          ? (turned + ' of ' + cards.length + ' nameplates turned')
          : (turned + ' of ' + cards.length + ' turned over');
      }
      if(roomSeats){
        var seat = card.getAttribute('data-seat');
        var slot = seat && stepEl.querySelector('[data-seat-slot="' + seat + '"]');
        if(slot){
          var frame = slot.querySelector('.seat-frame');
          var srcImg = card.querySelector('.art img');
          if(frame && srcImg){
            var dest = frame.querySelector('img');
            if(!dest){
              dest = document.createElement('img');
              dest.alt = '';
              frame.appendChild(dest);
            }
            dest.src = srcImg.currentSrc || srcImg.getAttribute('src');
            dest.alt = seat;
          }
          slot.classList.remove('is-arriving');
          void slot.offsetWidth;
          slot.classList.add('is-filled', 'is-arriving');
          Replay.announce(seat + ' seated at the table.');
        }
      }
      if(turned < cards.length) return;

      if(stage) stage.classList.add('is-complete');
      if(payoff) payoff.hidden = false;
      Replay.announce(roomSeats ? 'Buying center seated.' : ('All ' + cards.length + ' claims turned over.'));
      Replay.complete(stepEl, points);
    });
  });
});

/* Teach-only flips (no Replay.complete — pair with a gated tray on the same step) */
document.querySelectorAll('[data-teach-flips]').forEach(function(wrap){
  var stepEl = wrap.closest('.step');
  var cards = Array.prototype.slice.call(wrap.querySelectorAll('.flip-card'));
  var countEl = stepEl && stepEl.querySelector('[data-teach-count]');
  var payoff = stepEl && stepEl.querySelector('[data-teach-payoff]');
  var turned = 0;
  cards.forEach(function(card){
    card.addEventListener('click', function(){
      var open = card.classList.toggle('is-flipped');
      card.setAttribute('aria-pressed', open ? 'true' : 'false');
      if(!open || card.getAttribute('data-seen') === '1') return;
      card.setAttribute('data-seen', '1');
      turned++;
      if(countEl) countEl.textContent = turned + ' of ' + cards.length + ' turned over';
      if(turned >= cards.length && payoff) payoff.hidden = false;
    });
  });
});

/* ---------- stamp desk (generic multi-item stamp) ---------- */
document.querySelectorAll('[data-activity="stamp-desk"]').forEach(function(wrap){
  var stepEl = wrap.closest('.step');
  var points = parseInt(wrap.getAttribute('data-points') || '0', 10);
  var nextLabel = wrap.getAttribute('data-next-label') || 'Next call \u2192';
  var doneLabel = wrap.getAttribute('data-done-label') || 'Close the hotline \u2192';
  var doneMsg = wrap.getAttribute('data-done-msg') || 'The hotline is quiet.';
  var unitWord = wrap.getAttribute('data-unit') || 'Call';
  var deck = Array.prototype.slice.call(wrap.querySelectorAll('.hl-data li')).map(function(li){
    return {
      kicker:   li.getAttribute('data-kicker') || '',
      headline: li.getAttribute('data-headline') || '',
      deck:     li.getAttribute('data-deck') || '',
      category: li.getAttribute('data-category') || '',
      why:      li.getAttribute('data-why') || '',
      not:      li.getAttribute('data-not') || ''
    };
  });
  if(!deck.length) return;

  var area = wrap.querySelector('.hl-deck');
  var hud = wrap.querySelector('.hl-hud');
  var countEl = wrap.querySelector('.hl-count');
  var scoreEl = wrap.querySelector('.hl-score');
  var stage = wrap.querySelector('[data-hl-stage]');
  var doors = Array.prototype.slice.call(wrap.querySelectorAll('.hl-door'));
  var tallies = {};
  doors.forEach(function(d){ tallies[d.getAttribute('data-category') || ''] = 0; });
  var at = 0, got = 0, locked = false, firstTry = true;
  var history = [];

  function escapeHtml(s){
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function renderVerdict(item){
    var html = '<b class="ok">Correct</b><span class="call-stamped">Stamped \u2014 ' + escapeHtml(item.category) + '</span>';
    if(item.why){
      html += '<span class="clip-why"><b>Why ' + escapeHtml(item.category) + ':</b> ' + escapeHtml(item.why) + '</span>';
    }
    if(item.not){
      var parts = item.not.split('|').map(function(p){ return p.trim(); }).filter(Boolean);
      if(parts.length){
        html += '<ul class="clip-not">';
        parts.forEach(function(part){
          var colon = part.indexOf(':');
          var label = colon > -1 ? part.slice(0, colon).trim() : part;
          var reason = colon > -1 ? part.slice(colon + 1).trim() : '';
          html += '<li><b>Not ' + escapeHtml(label) + ':</b> ' + escapeHtml(reason) + '</li>';
        });
        html += '</ul>';
      }
    }
    return html;
  }

  function paintHud(){
    if(countEl) countEl.textContent = unitWord + ' ' + Math.min(at + 1, deck.length) + ' of ' + deck.length;
    if(scoreEl) scoreEl.textContent = got + ' of ' + deck.length + ' first-stamp correct';
    doors.forEach(function(door){
      var cat = door.getAttribute('data-category');
      var n = door.querySelector('[data-hl-n]');
      if(!n) return;
      n.textContent = String(tallies[cat] || 0);
      n.classList.toggle('on', (tallies[cat] || 0) > 0);
    });
  }

  function setNextReady(on, label){
    nextBtn.disabled = !on;
    nextBtn.classList.remove('is-done');
    if(label) nextBtn.textContent = label;
  }

  function ensureLog(){
    if(!history[at]){
      history[at] = {
        kicker: deck[at].kicker,
        headline: deck[at].headline,
        correct: deck[at].category,
        theirFirst: null,
        why: deck[at].why
      };
    }
    return history[at];
  }

  function deal(){
    locked = false;
    firstTry = true;
    wrap.classList.remove('is-resolved');
    setNextReady(false, nextLabel);
    ensureLog();
    doors.forEach(function(d){
      d.disabled = false;
      d.classList.remove('hit-ok', 'hit-no', 'is-buzz', 'is-stamp');
    });
    area.innerHTML = '';
    var item = deck[at];
    var card = document.createElement('div');
    card.className = 'call-card';
    card.innerHTML =
      '<span class="call-kicker"></span>' +
      '<h4 class="call-hed"></h4>' +
      '<p class="call-deck"></p>' +
      '<p class="call-hint">Stamp the matching pad below.</p>' +
      '<div class="call-verdict" hidden></div>';
    card.querySelector('.call-kicker').textContent = item.kicker;
    card.querySelector('.call-hed').textContent = item.headline;
    card.querySelector('.call-deck').textContent = item.deck;
    area.appendChild(card);
    paintHud();
    return card;
  }

  function renderReview(earned){
    var html = '<div class="hd-score">First-stamp correct ' + got + ' of ' + deck.length + '</div>' +
      '<p>' + earned + ' points. ' + escapeHtml(doneMsg) + '</p>' +
      '<p class="kc-review-head">Stamp summary</p>' +
      '<ul class="kc-review-list">';
    history.forEach(function(row, i){
      if(!row) return;
      var given = row.theirFirst || '—';
      var clean = given === row.correct;
      var givenLine = clean
        ? '<span class="ok">' + escapeHtml(given) + ' \u2713</span>'
        : '<span class="no">' + escapeHtml(given) + ' \u2717</span>';
      html += '<li class="' + (clean ? '' : 'is-miss') + '">' +
        '<span class="pr-kicker">' + escapeHtml(row.kicker || (unitWord + ' ' + (i + 1))) + '</span>' +
        '<p class="pr-claim">' + escapeHtml(row.headline) + '</p>' +
        '<div class="pr-meta">' +
          '<div><b>Your stamp:</b> ' + givenLine + '</div>' +
          '<div><b>Correct stamp:</b> ' + escapeHtml(row.correct) + '</div>' +
        '</div>' +
        (row.why ? '<div class="pr-why"><b>Reasoning:</b> ' + escapeHtml(row.why) + '</div>' : '') +
      '</li>';
    });
    html += '</ul>';
    return html;
  }

  function finish(){
    setNextReady(false, doneLabel);
    nextBtn.classList.add('is-done');
    var earned = Math.round(points * got / deck.length);
    area.innerHTML = '';
    wrap.classList.add('is-resolved', 'is-review');
    var done = document.createElement('div');
    done.className = 'hl-done kc-review';
    done.innerHTML = renderReview(earned);
    area.appendChild(done);
    doors.forEach(function(d){ d.disabled = true; });
    if(stage) stage.classList.add('is-complete');
    if(countEl) countEl.textContent = deck.length + ' of ' + deck.length + ' stamped';
    if(scoreEl) scoreEl.textContent = 'First-stamp correct ' + got + ' of ' + deck.length;
    Replay.announce('Stamp desk complete. First-stamp correct ' + got + ' of ' + deck.length + '. Review your stamps.');
    Replay.complete(stepEl, earned);
  }

  /* Next lives in the sticky HUD — no bottom scroll chase */
  var nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'hl-next';
  nextBtn.disabled = true;
  nextBtn.textContent = nextLabel;
  if(hud){
    var meta = document.createElement('div');
    meta.className = 'hl-meta';
    while(hud.firstChild) meta.appendChild(hud.firstChild);
    hud.appendChild(meta);
    hud.appendChild(nextBtn);
  } else {
    wrap.insertBefore(nextBtn, wrap.firstChild);
  }

  var card = deal();

  doors.forEach(function(door){
    door.addEventListener('click', function(){
      if(locked) return;
      var picked = door.getAttribute('data-category');
      var item = deck[at];
      var right = picked === item.category;

      var log = ensureLog();
      if(!log.theirFirst) log.theirFirst = picked;

      if(!right){
        door.classList.remove('is-buzz', 'hit-no');
        void door.offsetWidth;
        door.classList.add('hit-no', 'is-buzz');
        card.classList.remove('is-buzz');
        void card.offsetWidth;
        card.classList.add('is-buzz');
        firstTry = false;
        var retry = card.querySelector('.call-retry');
        if(!retry){
          retry = document.createElement('p');
          retry.className = 'call-retry';
          card.appendChild(retry);
        }
        retry.innerHTML = '<b>Try again</b> Wrong pad — read the brief and stamp again.';
        Replay.announce('Try again. Wrong pad.');
        window.setTimeout(function(){
          door.classList.remove('hit-no', 'is-buzz');
        }, 480);
        return;
      }

      locked = true;
      if(firstTry) got++;
      tallies[item.category] = (tallies[item.category] || 0) + 1;
      door.classList.add('hit-ok', 'is-stamp');
      doors.forEach(function(d){ d.disabled = true; });
      wrap.classList.add('is-resolved');

      var retryNote = card.querySelector('.call-retry');
      if(retryNote) retryNote.remove();
      var hint = card.querySelector('.call-hint');
      if(hint) hint.remove();
      var verdict = card.querySelector('.call-verdict');
      if(verdict){
        verdict.hidden = false;
        verdict.innerHTML = renderVerdict(item);
      }
      paintHud();
      Replay.announce('Correct. Stamped ' + item.category + '.');

      setNextReady(true, at + 1 >= deck.length ? doneLabel : nextLabel);
      nextBtn.focus();
      try{ nextBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }catch(e){}
    });
  });

  nextBtn.addEventListener('click', function(){
    if(nextBtn.disabled) return;
    if(at + 1 >= deck.length){
      finish();
      return;
    }
    at++;
    card = deal();
  });
});

/* ---------- pitch board · deck vs shredder ---------- */
document.querySelectorAll('[data-activity="pitch-board"]').forEach(function(wrap){
  var stepEl = wrap.closest('.step');
  var points = parseInt(wrap.getAttribute('data-points') || '0', 10);
  var canRetry = wrap.hasAttribute('data-retry');
  var nextLabel = wrap.getAttribute('data-next-label') || 'Next brief \u2192';
  var doneLabel = wrap.getAttribute('data-done-label') || 'See board review \u2192';
  var doneMsg = wrap.getAttribute('data-done-msg') || 'Board cleared.';
  var unitWord = wrap.getAttribute('data-unit') || 'Brief';
  var deck = Array.prototype.slice.call(wrap.querySelectorAll('.pb-data li')).map(function(li){
    var bin = li.getAttribute('data-bin') || 'pitch';
    if(bin === 'greenlight' || bin === 'keep') bin = 'pitch';
    if(bin === 'kill' || bin === 'spike') bin = 'shred';
    return {
      bin: bin,
      kicker: li.getAttribute('data-kicker') || '',
      claim: li.getAttribute('data-claim') || '',
      why: li.getAttribute('data-why') || ''
    };
  });
  if(!deck.length) return;

  var cork = wrap.querySelector('[data-pb-cork]');
  var hud = wrap.querySelector('.pb-hud');
  var countEl = wrap.querySelector('.pb-count');
  var scoreEl = wrap.querySelector('.pb-score');
  var panicFill = wrap.querySelector('[data-pb-panic]');
  var panicState = wrap.querySelector('[data-pb-panic-state]');
  var memo = wrap.querySelector('[data-pb-memo]');
  var memoText = wrap.querySelector('[data-pb-memo-text]');
  var bins = {
    pitch: wrap.querySelector('[data-bin="pitch"]'),
    shred: wrap.querySelector('[data-bin="shred"]')
  };
  var binNs = {
    pitch: wrap.querySelector('[data-bin-n="pitch"]'),
    shred: wrap.querySelector('[data-bin-n="shred"]')
  };
  var sendBtns = Array.prototype.slice.call(wrap.querySelectorAll('[data-send]'));
  var at = 0, got = 0, locked = false, firstTry = true, cardEl = null, finished = false;
  var panic = 15;
  var tallies = { pitch: 0, shred: 0 };
  var history = [];
  var memoTimer = null;
  var drag = null;

  var MEMOS = [
    'Where is the final pitch deck? The conference room is already filling.',
    'Please tell me statistics is not on slide three.',
    'Client just asked if Got Milk? was a targeting study. Fix this.',
    'If another myth makes the deck, I am sending Sam into the meeting alone.',
    'Inbox: “Can we see the research page before lunch?” Panic rising.',
    'Legal poked their head in. Shred the myths. Keep the textbook.'
  ];

  function escapeHtml(s){
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }
  function binLabel(k){ return k === 'shred' ? 'Shredder' : 'Client Pitch Deck'; }
  function panicLevel(v){
    if(v >= 75) return { id: 'panicking', label: 'Panicking' };
    if(v >= 50) return { id: 'restless', label: 'Restless' };
    if(v >= 25) return { id: 'watching', label: 'Watching' };
    return { id: 'cool', label: 'Cool' };
  }
  function paintPanic(){
    if(panicFill){
      panicFill.style.width = panic + '%';
      panicFill.classList.remove('is-spike');
      void panicFill.offsetWidth;
      panicFill.classList.add('is-spike');
    }
    var lvl = panicLevel(panic);
    if(panicState){
      panicState.textContent = lvl.label;
      panicState.setAttribute('data-level', lvl.id);
    }
  }
  function showMemo(line){
    if(!memo || !memoText) return;
    memoText.textContent = line;
    memo.hidden = false;
    if(memoTimer) window.clearTimeout(memoTimer);
    memoTimer = window.setTimeout(function(){ memo.hidden = true; }, 4200);
  }
  function bumpPanic(delta, withMemo){
    panic = clamp(panic + delta, 0, 100);
    paintPanic();
    if(withMemo && delta > 0){
      showMemo(MEMOS[Math.floor(Math.random() * MEMOS.length)]);
    }
  }
  function paintHud(){
    if(countEl) countEl.textContent = unitWord + ' ' + Math.min(at + 1, deck.length) + ' of ' + deck.length;
    if(scoreEl) scoreEl.textContent = got + ' of ' + deck.length + ' first-sort clean';
    Object.keys(binNs).forEach(function(k){
      if(!binNs[k]) return;
      binNs[k].textContent = String(tallies[k] || 0);
      binNs[k].classList.toggle('on', (tallies[k] || 0) > 0);
    });
  }
  function setNextReady(on, label){
    nextBtn.disabled = !on;
    nextBtn.classList.remove('is-done');
    if(label) nextBtn.textContent = label;
  }
  function setBinsEnabled(on){
    sendBtns.forEach(function(b){ b.disabled = !on; });
  }
  function ensureLog(){
    var item = deck[at];
    if(!history[at]){
      history[at] = {
        kicker: item.kicker,
        claim: item.claim,
        correct: item.bin,
        theirFirst: null,
        theirFinal: null,
        clean: true,
        why: item.why
      };
    }
    return history[at];
  }
  function deal(){
    locked = false;
    firstTry = true;
    wrap.classList.remove('is-review');
    setNextReady(false, nextLabel);
    setBinsEnabled(true);
    Object.keys(bins).forEach(function(k){ if(bins[k]) bins[k].classList.remove('is-hot', 'is-accept'); });
    if(memo) memo.hidden = true;
    cork.innerHTML = '';
    ensureLog();
    var item = deck[at];
    cardEl = document.createElement('article');
    cardEl.className = 'pb-card';
    cardEl.setAttribute('aria-grabbed', 'false');
    cardEl.innerHTML =
      '<span class="pb-pin" aria-hidden="true"></span>' +
      '<span class="pb-kicker"></span>' +
      '<p class="pb-claim"></p>' +
      '<p class="pb-drag-hint">Drag to a bin · or tap a button below</p>';
    cardEl.querySelector('.pb-kicker').textContent = item.kicker;
    cardEl.querySelector('.pb-claim').textContent = item.claim;
    cork.appendChild(cardEl);
    bindCard(cardEl);
    paintHud();
    return cardEl;
  }
  function renderReview(earned){
    var lvl = panicLevel(panic);
    var html = '<div class="pd-score">First-sort clean ' + got + ' of ' + deck.length + ' · ' + earned + ' pts</div>' +
      '<p>Client ended <b>' + escapeHtml(lvl.label.toLowerCase()) + '</b>. ' + escapeHtml(doneMsg) + '</p>' +
      '<p class="pb-review-head">Board summary</p>' +
      '<ul class="pb-review-list">';
    history.forEach(function(row, i){
      if(!row) return;
      var clean = !!row.clean;
      var their = row.theirFirst || row.theirFinal || '—';
      var theirLine = clean
        ? '<span class="ok">' + escapeHtml(binLabel(row.theirFinal || their)) + ' ✓</span>'
        : '<span class="no">' + escapeHtml(binLabel(their)) + ' ✗</span> → corrected to <b>' + escapeHtml(binLabel(row.theirFinal || row.correct)) + '</b>';
      html += '<li class="' + (clean ? '' : 'is-miss') + '">' +
        '<span class="pr-kicker">' + escapeHtml(row.kicker || (unitWord + ' ' + (i + 1))) + '</span>' +
        '<div class="pr-meta">' +
          '<div><b>Question:</b> ' + escapeHtml(row.claim) + '</div>' +
          '<div><b>Correct answer:</b> ' + escapeHtml(binLabel(row.correct)) + '</div>' +
          '<div><b>Your answer:</b> ' + theirLine + '</div>' +
        '</div>' +
        (row.why ? '<div class="pr-why"><b>Reasoning:</b> ' + escapeHtml(row.why) + '</div>' : '') +
      '</li>';
    });
    html += '</ul>';
    return html;
  }
  function resetSet(){
    finished = false;
    at = 0; got = 0; panic = 15;
    tallies = { pitch: 0, shred: 0 };
    history = [];
    locked = false;
    firstTry = true;
    cardEl = null;
    wrap.classList.remove('is-review');
    nextBtn.classList.remove('is-done');
    setNextReady(false, nextLabel);
    setBinsEnabled(true);
    if(memo) memo.hidden = true;
    paintPanic();
    deal();
    Replay.announce('Board reset. Try again.');
  }
  function finish(){
    if(finished) return;
    finished = true;
    setNextReady(false, doneLabel);
    nextBtn.classList.add('is-done');
    setBinsEnabled(false);
    wrap.classList.add('is-review');
    var earned = Math.round(points * got / deck.length);
    if(panic <= 24) earned = Math.min(points, earned + 2);
    cork.innerHTML = '';
    var done = document.createElement('div');
    done.className = 'pb-done';
    done.innerHTML = renderReview(earned);
    if(canRetry){
      var retry = document.createElement('button');
      retry.type = 'button';
      retry.className = 'pb-retry-btn';
      retry.textContent = got === deck.length ? 'Practice again' : 'Try again';
      retry.addEventListener('click', resetSet);
      done.appendChild(retry);
    }
    cork.appendChild(done);
    if(countEl) countEl.textContent = deck.length + ' of ' + deck.length + ' sorted';
    if(scoreEl) scoreEl.textContent = 'First-sort clean ' + got + ' of ' + deck.length;
    Replay.announce('Pitch board complete. First-sort clean ' + got + ' of ' + deck.length + '.');
    Replay.complete(stepEl, earned);
    try{ done.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }catch(err){}
  }

  function clearDrag(){
    if(!drag) return;
    if(drag.card){
      drag.card.classList.remove('is-dragging');
      drag.card.style.transform = '';
      drag.card.style.zIndex = '';
      drag.card.setAttribute('aria-grabbed', 'false');
    }
    Object.keys(bins).forEach(function(k){ if(bins[k]) bins[k].classList.remove('is-hot'); });
    drag = null;
  }

  function binFromPoint(x, y){
    var el = document.elementFromPoint(x, y);
    if(!el) return null;
    var bin = el.closest('[data-bin]');
    return bin ? bin.getAttribute('data-bin') : null;
  }

  function bindCard(card){
    card.addEventListener('pointerdown', function(e){
      if(locked || e.button) return;
      if(e.target.closest('button')) return;
      card.setPointerCapture(e.pointerId);
      drag = {
        card: card,
        startX: e.clientX,
        startY: e.clientY,
        moved: false
      };
      card.classList.add('is-dragging');
      card.setAttribute('aria-grabbed', 'true');
    });
    card.addEventListener('pointermove', function(e){
      if(!drag || drag.card !== card) return;
      var dx = e.clientX - drag.startX;
      var dy = e.clientY - drag.startY;
      if(Math.abs(dx) + Math.abs(dy) > 6) drag.moved = true;
      card.style.transform = 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (dx * 0.03) + 'deg) scale(1.03)';
      var over = binFromPoint(e.clientX, e.clientY);
      Object.keys(bins).forEach(function(k){
        if(bins[k]) bins[k].classList.toggle('is-hot', over === k);
      });
    });
    card.addEventListener('pointerup', function(e){
      if(!drag || drag.card !== card) return;
      var over = binFromPoint(e.clientX, e.clientY);
      var moved = drag.moved;
      clearDrag();
      if(moved && over) attempt(over);
    });
    card.addEventListener('pointercancel', function(){ clearDrag(); });
  }

  function attempt(dest){
    if(locked || !cardEl || finished) return;
    var item = deck[at];
    var right = dest === item.bin;
    var log = ensureLog();

    if(!right){
      firstTry = false;
      if(!log.theirFirst) log.theirFirst = dest;
      log.clean = false;
      bumpPanic(22, true);
      cardEl.classList.remove('is-buzz');
      void cardEl.offsetWidth;
      cardEl.classList.add('is-buzz');
      var retry = cardEl.querySelector('.pb-retry');
      if(!retry){
        retry = document.createElement('p');
        retry.className = 'pb-retry';
        cardEl.appendChild(retry);
      }
      retry.textContent = dest === 'shred'
        ? 'That belongs in the pitch deck. Buzz. Pull it back.'
        : 'That is a myth. Buzz. Shred it before the client reads it.';
      Replay.announce('Wrong bin. Try again.');
      return;
    }

    locked = true;
    setBinsEnabled(false);
    if(!log.theirFirst) log.theirFirst = dest;
    log.theirFinal = dest;
    log.clean = firstTry;
    if(firstTry){
      got++;
      bumpPanic(-12, false);
    } else {
      bumpPanic(-6, false);
    }
    tallies[dest] = (tallies[dest] || 0) + 1;
    if(bins[dest]) {
      bins[dest].classList.remove('is-hot');
      bins[dest].classList.add('is-accept');
    }
    var retryNote = cardEl.querySelector('.pb-retry');
    if(retryNote) retryNote.remove();
    var hint = cardEl.querySelector('.pb-drag-hint');
    if(hint) hint.remove();
    var verdict = document.createElement('div');
    verdict.className = 'pb-verdict';
    verdict.textContent = item.why;
    cardEl.appendChild(verdict);
    cardEl.classList.add(dest === 'pitch' ? 'is-fly-pitch' : 'is-fly-shred');
    paintHud();
    Replay.announce(dest === 'pitch' ? 'Filed in the pitch deck.' : 'Shredded.');
    window.setTimeout(function(){
      setNextReady(true, at + 1 >= deck.length ? doneLabel : nextLabel);
      nextBtn.focus();
      try{ nextBtn.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }catch(err){}
    }, 280);
  }

  var nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'pb-next';
  nextBtn.disabled = true;
  nextBtn.textContent = nextLabel;
  if(hud) hud.appendChild(nextBtn);

  sendBtns.forEach(function(btn){
    btn.addEventListener('click', function(){
      attempt(btn.getAttribute('data-send'));
    });
  });
  Object.keys(bins).forEach(function(k){
    if(!bins[k]) return;
    bins[k].addEventListener('click', function(e){
      if(e.target.closest('.pb-send')) return;
      attempt(k);
    });
  });

  nextBtn.addEventListener('click', function(){
    if(nextBtn.disabled) return;
    if(at + 1 >= deck.length){
      finish();
      return;
    }
    at++;
    deal();
  });

  paintPanic();
  deal();
});

/* ---------- light table sorter ---------- */
document.querySelectorAll('[data-activity="sorter"]').forEach(function(wrap){
  var stepEl = wrap.closest('.step');
  var points = parseInt(wrap.getAttribute('data-points') || '0', 10);
  var items = Array.prototype.slice.call(wrap.querySelectorAll('.sort-data li')).map(function(li){
    return {
      text:   li.textContent.trim(),
      answer: li.getAttribute('data-answer'),
      why:    li.getAttribute('data-why') || '',
      hint:   li.getAttribute('data-hint') || ''
    };
  });
  if(!items.length) return;

  var itemEl  = wrap.querySelector('.sort-item');
  var countEl = wrap.querySelector('.sort-count');
  var scoreEl = wrap.querySelector('.sort-score');
  var hintBtn = wrap.querySelector('.hint-toggle');
  var hintPanel = wrap.querySelector('.hint-panel');
  var hintItem  = wrap.querySelector('.hint-item');
  var scene  = wrap.querySelector('.scene');
  var plates = Array.prototype.slice.call(wrap.querySelectorAll('.hot.plate'));
  var note   = stepEl.querySelector('.scene-note');
  var nextBtn = makeNextButton('Next item \u2192');
  itemEl.parentNode.insertBefore(nextBtn, itemEl.nextSibling);

  var at = 0, got = 0, locked = false, attempted = false;
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  plates.forEach(function(p){
    if(!p.querySelector('.pile-stack')){
      var stack = document.createElement('span');
      stack.className = 'pile-stack';
      stack.setAttribute('aria-hidden', 'true');
      p.appendChild(stack);
    }
  });

  function paint(){
    locked = false;
    attempted = false;
    itemEl.classList.remove('shake', 'is-flying');
    plates.forEach(function(p){ p.classList.remove('flash-ok', 'flash-no', 'receiving', 'shake-plate'); });
    if(countEl) countEl.textContent = 'Item ' + (at + 1) + ' of ' + items.length;
    if(scoreEl) scoreEl.textContent = got + ' filed correctly';
    itemEl.innerHTML = '<span class="si-label">Item ' + (at + 1) + ' of ' + items.length + '</span>' +
                       '<span class="si-text"></span><p class="si-why" hidden></p>';
    itemEl.querySelector('.si-text').textContent = items[at].text;
    if(hintItem) hintItem.textContent = items[at].hint;
  }

  function showWhy(right){
    var why = itemEl.querySelector('.si-why');
    why.hidden = false;
    why.innerHTML = '<b class="' + (right ? 'ok' : '') + '">' +
                    (right ? 'Correct' : 'Try again') + '</b> ';
    why.appendChild(document.createTextNode(items[at].why));
  }

  function addPileChip(plate){
    var stack = plate.querySelector('.pile-stack');
    if(!stack) return;
    var chip = document.createElement('span');
    chip.className = 'pile-chip';
    stack.appendChild(chip);
  }

  function flyBrief(plate, ok, done){
    if(reduceMotion){
      if(ok) addPileChip(plate);
      done();
      return;
    }
    var from = itemEl.getBoundingClientRect();
    var to = plate.getBoundingClientRect();
    var flyer = document.createElement('div');
    flyer.className = 'sort-flyer ' + (ok ? 'ok' : 'no');
    flyer.textContent = items[at].text;
    flyer.style.left = from.left + 'px';
    flyer.style.top = from.top + 'px';
    flyer.style.width = Math.min(from.width, 280) + 'px';
    document.body.appendChild(flyer);
    itemEl.classList.add('is-flying');
    plate.classList.add('receiving');
    flyer.getBoundingClientRect();
    var dx = (to.left + to.width / 2) - (from.left + Math.min(from.width, 280) / 2);
    var dy = (to.top + to.height * 0.32) - from.top;
    flyer.style.transform = 'translate(' + dx + 'px,' + dy + 'px) scale(.28) rotate(' + (ok ? '-4' : '6') + 'deg)';
    flyer.style.opacity = ok ? '0.2' : '0';
    setTimeout(function(){
      flyer.remove();
      itemEl.classList.remove('is-flying');
      plate.classList.remove('receiving');
      if(ok) addPileChip(plate);
      done();
    }, 430);
  }

  function finish(){
    nextBtn.hidden = true;
    plates.forEach(function(p){ p.disabled = true; });
    sceneLayer(scene, 'done');
    var earned = Math.round(points * got / items.length);
    if(note){
      note.hidden = false;
      note.classList.add(got === items.length ? 'ok' : 'no');
      note.innerHTML = '<b>' + got + ' of ' + items.length + ' filed correctly on the first try.</b> ' +
        (wrap.getAttribute('data-done-msg') || 'Sorting complete. Read the why notes — that is the learning.');
    }

    var labelFor = {};
    plates.forEach(function(p){
      labelFor[p.getAttribute('data-key')] = p.getAttribute('data-label') || p.getAttribute('data-key');
    });
    var rows = items.map(function(it, i){
      var key = it.answer || '';
      var cat = labelFor[key] || key;
      var catClass = 'sr-cat' + (key ? ' ' + key : '');
      return '<li><span class="' + catClass + '">' + cat + '</span><p class="sr-text">' +
             '<b>' + (i + 1) + '.</b> ' + it.text.replace(/</g, '&lt;') + '</p></li>';
    }).join('');

    var done = document.createElement('div');
    done.className = 'sort-done';
    done.innerHTML = '<div class="sd-score">' + earned + ' points</div>' +
                     '<p class="sd-note">' + (wrap.getAttribute('data-done-msg') || 'Both trays are full. Read the why notes — that is the learning.') + '</p>' +
                     '<div class="sort-review"><h4>Filing summary</h4><ol>' + rows + '</ol></div>';
    itemEl.parentNode.insertBefore(done, nextBtn);
    itemEl.hidden = true;
    Replay.announce('Sorting complete. ' + got + ' of ' + items.length + ' filed correctly.');
    Replay.complete(stepEl, earned);
  }

  plates.forEach(function(plate){
    plate.addEventListener('click', function(){
      if(locked) return;
      locked = true;
      var right = plate.getAttribute('data-key') === items[at].answer;

      if(!right){
        attempted = true;
        plate.classList.add('flash-no', 'shake-plate');
        itemEl.classList.add('shake');
        showWhy(false);
        sceneLayer(scene, 'fail');
        Replay.announce('Try again. Wrong tray.');
        setTimeout(function(){
          itemEl.classList.remove('shake');
          plate.classList.remove('flash-no', 'shake-plate');
          locked = false;
        }, 520);
        return;
      }

      if(!attempted) got++;
      attempted = true;
      plate.classList.add('flash-ok');
      if(scoreEl) scoreEl.textContent = got + ' filed correctly';
      flyBrief(plate, true, function(){
        showWhy(true);
        sceneLayer(scene, 's1');
        Replay.announce('Correct.');
        if(at + 1 >= items.length) finish();
        else nextBtn.hidden = false;
      });
    });
  });

  nextBtn.addEventListener('click', function(){
    nextBtn.hidden = true;
    at++;
    sceneLayer(scene, 'base');
    paint();
    itemEl.focus && itemEl.focus();
  });

  if(hintBtn && hintPanel) hintBtn.addEventListener('click', function(){
    var open = hintPanel.hidden;
    hintPanel.hidden = !open;
    hintBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    hintBtn.textContent = open ? 'Hide the hint' : 'Need a hint?';
  });

  paint();
});

/* ---------- hotspot scene ---------- */
document.querySelectorAll('[data-activity="hotspot"]').forEach(function(scene){
  var stepEl = scene.closest('.step');
  var points = parseInt(scene.getAttribute('data-points') || '0', 10);
  var answer = scene.getAttribute('data-sequence');
  var settle = parseInt(scene.getAttribute('data-settle') || '0', 10);
  var note   = stepEl.querySelector('.scene-note');
  var hots   = Array.prototype.slice.call(scene.querySelectorAll('.hot'));
  var tries = 0, finished = false;

  function say(html, ok){
    if(!note) return;
    note.hidden = false;
    note.classList.remove('ok', 'no');
    note.classList.add(ok ? 'ok' : 'no');
    note.innerHTML = html;
  }

  hots.forEach(function(hot){
    hot.addEventListener('click', function(){
      if(finished) return;
      tries++;
      var right = hot.getAttribute('data-key') === answer;

      hots.forEach(function(h){ h.classList.remove('flash-ok', 'flash-no'); });
      hot.classList.add(right ? 'flash-ok' : 'flash-no');
      say(hot.getAttribute(right ? 'data-ok' : 'data-no') || '', right);

      if(!right){
        sceneLayer(scene, 'fail');
        Replay.announce('Not that mark. Read the rubric, then pick again.');
        return;
      }

      finished = true;
      hots.forEach(function(h){ h.disabled = true; });
      sceneLayer(scene, 'settle');
      setTimeout(function(){
        sceneLayer(scene, 'done');
        scene.classList.add('finished');
      }, settle || 0);
      Replay.announce('Correct. The rubric is below the scene.');
      Replay.complete(stepEl, tries === 1 ? points : Math.round(points / 2));
    });
  });
});

/* ---------- newspaper clippings ---------- */
document.querySelectorAll('.clip-trigger').forEach(function(btn){
  var panel = document.getElementById(btn.getAttribute('aria-controls'));
  if(!panel) return;

  function set(open){
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  btn.addEventListener('click', function(){ set(panel.hidden); });
  var close = panel.querySelector('.clip-close');
  if(close) close.addEventListener('click', function(){ set(false); btn.focus(); });
});

/* ---------- inline video ---------- */
document.querySelectorAll('.video-wrap').forEach(function(wrap){
  var video = wrap.querySelector('video');
  var play  = wrap.querySelector('.video-play');
  if(!video || !play) return;

  play.addEventListener('click', function(){
    video.controls = true;
    var p = video.play();
    if(p && p.catch) p.catch(function(){ video.controls = true; });
  });
  video.addEventListener('playing', function(){ play.hidden = true; });
  video.addEventListener('pause', function(){ play.hidden = false; });
  video.addEventListener('ended', function(){ play.hidden = false; });
});


Replay.start();
