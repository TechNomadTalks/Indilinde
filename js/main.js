(function () {
  'use strict';
  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mqMob = matchMedia('(max-width: 960px)');
  var STATUS_OK = ['now', 'growing', 'planned'];

  /* Loader */
  var loader = $('#loader');
  if (loader && document.body.dataset.page === 'home') {
    document.documentElement.style.scrollBehavior = 'auto';
    var t0 = Date.now();
    var hideLoader = function () {
      if (loader.classList.contains('done')) return;
      loader.classList.add('done');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          if (loader.parentNode) loader.parentNode.removeChild(loader);
          document.documentElement.style.scrollBehavior = '';
        });
      });
    };
    window.addEventListener('load', function () { setTimeout(hideLoader, Math.max(0, 2200 - (Date.now() - t0))); });
    setTimeout(hideLoader, 3200);
  } else if (loader) {
    loader.remove();
  }

  /* Nav */
  var nav = $('#nav');
  var onNav = function () { nav.classList.toggle('scrolled', scrollY > 10); };
  addEventListener('scroll', onNav, { passive: true }); onNav();
  var menu = $('#menu');
  var backdrop = $('#menuBackdrop');
  var setMenu = function (o) {
    menu.classList.toggle('open', o);
    if (backdrop) backdrop.classList.toggle('open', o);
    menu.setAttribute('aria-hidden', String(!o));
    document.body.style.overflow = o ? 'hidden' : '';
  };
  $('#menuBtn').addEventListener('click', function () { setMenu(true); });
  $('#menuClose').addEventListener('click', function () { setMenu(false); });
  if (backdrop) backdrop.addEventListener('click', function () { setMenu(false); });
  $$('#menu nav a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  var backTop = $('#backTop');
  if (backTop) {
    addEventListener('scroll', function () {
      backTop.classList.toggle('show', scrollY > 400);
    }, { passive: true });
    backTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
  }

  /* Active section highlight while scrolling (home page only) */
  var sectionIds = ['about', 'learn', 'visit', 'community', 'conservation', 'support', 'contact'];
  var navMap = {};
  $$('.nav-links a').forEach(function (a) { navMap[a.getAttribute('href').slice(1)] = a; });
  var spyT = false;
  if (document.body.dataset.page === 'home') {
    addEventListener('scroll', function () {
      if (spyT) return; spyT = true;
      requestAnimationFrame(function () {
        spyT = false;
        var cur = '';
        for (var i = 0; i < sectionIds.length; i++) {
          var el = document.getElementById(sectionIds[i]);
          if (el && el.getBoundingClientRect().top <= innerHeight * .45) cur = sectionIds[i];
        }
        $$('.nav-links a').forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + cur); });
      });
    }, { passive: true });
  }

  /* Reveal */
  if (reduced) { $$('.reveal').forEach(function (el) { el.classList.add('in'); }); }
  else {
    var rIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); rIO.unobserve(e.target); } });
    }, { threshold: .1 });
    $$('.reveal').forEach(function (el) { rIO.observe(el); });
  }

  /* 3D tree scroll effect on projects timeline */
  var tree3d = $('.tree-3d');
  if (tree3d && mqMob.matches === false) {
    var treeFoliage = tree3d.querySelector('.tree-foliage');
    var treeTimer = false;
    addEventListener('scroll', function () {
      if (treeTimer) return;
      treeTimer = true;
      requestAnimationFrame(function () {
        treeTimer = false;
        var sec = $('#timeline');
        if (!sec) return;
        var r = sec.getBoundingClientRect();
        var h = sec.offsetHeight - innerHeight;
        var p = h > 0 ? Math.min(1, Math.max(0, (-r.top) / h)) : 0;
        var ry = p * 25 - 12;
        var rx = p * 8 - 4;
        tree3d.style.transform = 'rotateY(' + ry.toFixed(2) + 'deg) rotateX(' + rx.toFixed(2) + 'deg)';
        if (treeFoliage) {
          var s = 1 + p * 0.25;
          treeFoliage.style.transform = 'scale(' + s.toFixed(3) + ')';
        }
      });
    }, { passive: true });
  }

  /* Accordions */
  $$('.prog-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.closest('.prog').classList.toggle('open');
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* Chain draw */
  var chainSec = $('#how'), chainPath = $('#chainPath');
  if (chainPath && chainSec) {
    var chainNodes = $$('.chain-node'), chainL = chainPath.getTotalLength(), chainLens;
    chainPath.style.strokeDasharray = chainL;
    chainPath.style.strokeDashoffset = chainL;
    chainLens = chainNodes.map(function (n) {
      var cx = +n.getAttribute('data-x'), cy = +n.getAttribute('data-y'), best = 0, bd = Infinity;
      for (var s = 0; s <= 300; s++) {
        var p = chainPath.getPointAtLength(chainL * s / 300);
        var d = (p.x - cx) * (p.x - cx) + (p.y - cy) * (p.y - cy);
        if (d < bd) { bd = d; best = chainL * s / 300; }
      }
      return best;
    });
    var cT = false;
    var cUpd = function () {
      cT = false;
      var r = chainSec.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      var p = Math.min(1, Math.max(0, (innerHeight * .92 - r.top) / (r.height * .9 + innerHeight * .35)));
      chainPath.style.strokeDashoffset = chainL * (1 - p);
      chainNodes.forEach(function (n, i) { n.classList.toggle('lit', p * chainL >= chainLens[i] - 4); });
    };
    addEventListener('scroll', function () { if (!cT) { cT = true; requestAnimationFrame(cUpd); } }, { passive: true });
    cUpd();
  }

  /* Toast */
  var toast = $('#toast'), toastMsg = $('#toastMsg'), toastT;
  function showToast(m) {
    toastMsg.textContent = m; toast.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove('show'); }, 2400);
  }

  /* Panorama (desktop) */
  var stage = $('#stage');
  if (stage) {
    var view = $('#stageView'), mover = $('#stageMover'), inner = $('#stageInner');
    var VBW = 1600, VBH = 900;
    var st = { x: 0, y: 0, z: 1 }, S = 1, RW = 0, RH = 0, vw = 0, vh = 0;
    function fit() {
      vw = view.clientWidth || 0; vh = view.clientHeight || 0;
      if (!vw || !vh) return;
      S = Math.max(vw / VBW, vh / VBH);
      RW = VBW * S; RH = VBH * S;
      mover.style.width = RW + 'px'; mover.style.height = RH + 'px';
      apply(false);
    }
    function clampPan() {
      var hx = Math.max(0, (RW * st.z - vw) / 2), hy = Math.max(0, (RH * st.z - vh) / 2);
      st.x = Math.max(-hx, Math.min(hx, st.x));
      st.y = Math.max(-hy, Math.min(hy, st.y));
    }
    function apply(anim) {
      clampPan();
      inner.style.transition = (anim && !reduced) ? 'transform .9s cubic-bezier(.5,0,.2,1)' : 'none';
      inner.style.transform = 'translate(' + st.x.toFixed(1) + 'px,' + st.y.toFixed(1) + 'px) scale(' + st.z.toFixed(3) + ')';
      inner.style.setProperty('--z', st.z.toFixed(3));
    }
    function centerOn(vx, vy, z) {
      st.z = Math.max(1, Math.min(2.6, z || st.z));
      st.x = -((vx * S) - RW / 2) * st.z;
      st.y = -((vy * S) - RH / 2) * st.z;
      apply(true);
    }
    var drag = null;
    view.addEventListener('pointerdown', function (e) {
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, sx: st.x, sy: st.y, on: e.pointerType === 'mouse', moved: false };
      stopTour();
    });
    view.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.on) {
        if (!drag.moved && Math.abs(dx) < 8) return;
        if (Math.abs(dx) < Math.abs(dy)) { drag = null; return; }
      }
      drag.moved = true;
      view.classList.add('dragging');
      if (view.setPointerCapture) { try { view.setPointerCapture(e.pointerId); } catch (err) {} }
      st.x = drag.sx + dx;
      st.y = drag.on ? drag.sy + dy : drag.sy;
      apply(false);
    });
    var endDrag = function () { drag = null; view.classList.remove('dragging'); };
    view.addEventListener('pointerup', endDrag);
    view.addEventListener('pointercancel', endDrag);
    $('#zin').addEventListener('click', function () { stopTour(); st.z = Math.min(2.6, st.z * 1.25); apply(true); });
    $('#zout').addEventListener('click', function () { stopTour(); st.z = Math.max(1, st.z / 1.25); apply(true); });
    $('#zreset').addEventListener('click', function () { stopTour(); closePanel(); st.z = 1; st.x = 0; st.y = 0; apply(true); clearActive(); });

    function hex(c) { return [parseInt(c.slice(1,3),16), parseInt(c.slice(3,5),16), parseInt(c.slice(5,7),16)]; }
    function mix(a, b, k) {
      var A = hex(a), B = hex(b), r = [];
      for (var i = 0; i < 3; i++) r.push(Math.round(A[i] + (B[i]-A[i])*k));
      return 'rgb(' + r.join(',') + ')';
    }
    var DAY={sky:'#d9e8ec',sky2:'#e9f0e6',sun:'#fff3c9',hillA:'#a9bda4',hillB:'#7fa07c',land1:'#6f9350',land2:'#5c8044',pad:'#a5875e',road:'#b0956c',trail:'#e6d9b2',fol1:'#3e6b2c',fol2:'#55863a',fol3:'#7f9a3e',trunk:'#6b4a2f',water:'#6f98a8',warm:'#ffb066',warmO:0},
        DAWN={sky:'#f2d4a0',sky2:'#f7e3bd',sun:'#ffbd7a',hillA:'#b39a8e',hillB:'#8f7f74',land1:'#7d8a55',land2:'#67744a',pad:'#a08262',road:'#a98e6d',trail:'#d9c6a0',fol1:'#4a6b3a',fol2:'#5d7d43',fol3:'#8a9350',trunk:'#5f4330',water:'#d9a97e',warm:'#ff9d5c',warmO:.18},
        DUSK={sky:'#efb57e',sky2:'#f4c895',sun:'#ff9d4d',hillA:'#b08a7a',hillB:'#8a6a5e',land1:'#77754a',land2:'#615c3d',pad:'#9a7c5e',road:'#a08060',trail:'#d4bd92',fol1:'#46603a',fol2:'#567243',fol3:'#857f45',trunk:'#5a4030',water:'#d98f63',warm:'#ff8d4d',warmO:.22};
    var sunG = $('#sunG'), sunPend = null;
    function setSun(t) {
      var A, B, k;
      if (t < .5) { A = DAWN; B = DAY; k = t*2; } else { A = DAY; B = DUSK; k = (t-.5)*2; }
      for (var key in DAY) {
        if (key === 'warmO') stage.style.setProperty('--c-warmO', (A.warmO+(B.warmO-A.warmO)*k).toFixed(3));
        else stage.style.setProperty('--c-'+key, mix(A[key], B[key], k));
      }
      sunG.setAttribute('transform','translate('+(-60+(VBW+120)*t).toFixed(1)+' '+(620-Math.sin(Math.PI*t)*470).toFixed(1)+')');
    }
    $('#sunSlider').addEventListener('input', function (e) {
      var v = e.target.value/100;
      if (sunPend !== null) return;
      sunPend = requestAnimationFrame(function(){ sunPend = null; setSun(v); });
    });
    setSun(.32);

    var SPOTS = [
      { id:'parking',  name:'Entrance & parking',     status:'now',     x:470,  y:622, title:'Where the road ends',                 text:'Roughly 600 m of access road has been cleared up the mountain, ending at a parking area. The bakkie and tractor park here; from here, everything happens on foot.' },
      { id:'ablution', name:'Ablution block',         status:'now',     x:585,  y:640, title:'First structure, under construction', text:'A small ablution block is being built on communal land, the first structure on site and the step that makes camping possible.' },
      { id:'solar',    name:'Solar power',            status:'growing', x:652,  y:646, title:'Powered by the sun',                  text:'Solar panels behind the ablution block are being installed to run lights, pumps and tools. The site stays off-grid and low impact.' },
      { id:'camping',  name:'Camping lawns',          status:'growing', x:775,  y:668, title:'Grassy sites near the entrance',      text:'Level grassland set aside for tents, with a boma gathering circle. Sites open once the ablution block is finished.' },
      { id:'plans',    name:'Planning & stakes',      status:'now',     x:1006, y:628, title:'Marking out what comes next',         text:'New learning structures are planned with the community. Stakes and string mark the footprints while the site plan is checked on the ground.' },
      { id:'rondavels',name:'Learning rondavels',     status:'planned', x:930,  y:606, title:'Built by hand, the old way',          text:'A cluster of rondavels and a beehive hut will be built with traditional materials and techniques: built as training, then used as classrooms.' },
      { id:'gardens',  name:'Growing area',           status:'growing', x:615,  y:712, title:'First beds in the ground',            text:'Demonstration beds with maize and vegetables, a shade tunnel, compost and a windmill pumping water. Residents are already planting and learning here.' },
      { id:'craft',    name:'Craft & workshop space', status:'planned', x:1090, y:668, title:'Where makers teach',                  text:'Covered space for craft workshops: beadwork, grass work, clay, leather and wood, taught by local craftspeople.' },
      { id:'forest',   name:'Indigenous forest patch',status:'now',     x:1390, y:586, title:'Protected, not developed',            text:'The mountain\u2019s indigenous vegetation is mapped and left alone. Forest patches, aloes and grassland stay untouched.' },
      { id:'summit',   name:'Summit viewpoint',       status:'growing', x:520,  y:188, title:'The top of kwaNguza',                 text:'The high point of the mountain: grassland, wind and wide views across the Umzumbe valleys.' }
    ];
    SPOTS.forEach(function (s) { if (STATUS_OK.indexOf(s.status) === -1) s.status = 'planned'; });
    var markersBox = $('#markers'), chipsBox = $('#chips');
    var panel = $('#hotPanel'), panelPill = $('#panelPill'), panelTitle = $('#panelTitle'), panelText = $('#panelText');
    var markerEls = SPOTS.map(function (s) {
      var b = document.createElement('button');
      b.className = 'marker m-' + s.status;
      b.style.left = (s.x/VBW*100).toFixed(2)+'%';
      b.style.top = (s.y/VBH*100).toFixed(2)+'%';
      b.setAttribute('aria-label', s.name);
      b.addEventListener('click', function (ev) { ev.stopPropagation(); focusOn(s); });
      markersBox.appendChild(b); return b;
    });
    var chipEls = SPOTS.map(function (s) {
      var b = document.createElement('button');
      b.className = 'chip';
      var d = document.createElement('span'); d.className = 'dot '+s.status;
      b.appendChild(d); b.appendChild(document.createTextNode(s.name));
      b.addEventListener('click', function () { focusOn(s); });
      chipsBox.appendChild(b); return b;
    });
    function clearActive() {
      markerEls.forEach(function (el) { el.classList.remove('active'); });
      chipEls.forEach(function (el) { el.classList.remove('active'); });
    }
    function openPanel(s) {
      panelPill.className = 'pill '+s.status;
      panelPill.textContent = s.status==='now'?'Underway':(s.status==='growing'?'Growing':'Planned');
      panelTitle.textContent = s.title;
      panelText.textContent = s.text;
      panel.classList.add('show');
    }
    function closePanel() { panel.classList.remove('show'); }
    $('#panelClose').addEventListener('click', function(){ closePanel(); stopTour(); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') { closePanel(); stopTour(); setMenu(false); } });
    var panelT;
    function focusOn(s, zoom) {
      stopTour(); closePanel(); clearActive();
      markerEls[SPOTS.indexOf(s)].classList.add('active');
      chipEls[SPOTS.indexOf(s)].classList.add('active');
      centerOn(s.x, s.y, zoom || (s.id==='summit'?1.9:2.1));
      clearTimeout(panelT);
      panelT = setTimeout(function(){ openPanel(s); }, reduced?60:800);
    }
    var tourT = null, tourIdx = 0;
    function startTour() {
      stopTour(); closePanel();
      st.z=1; st.x=0; st.y=0; apply(true);
      tourIdx = 0;
      var step = function () { focusOn(SPOTS[tourIdx]); tourIdx=(tourIdx+1)%SPOTS.length; tourT=setTimeout(step,4300); };
      step();
    }
    function stopTour(){ clearTimeout(tourT); tourT=null; }
    view.addEventListener('pointerdown', stopTour);
    $('#tourChip').addEventListener('click', startTour);
    $('#tourCta').addEventListener('click', function () {
      if (mqMob.matches) document.getElementById('siteCarousel').scrollIntoView({behavior:reduced?'auto':'smooth',block:'start'});
      else startTour();
    });
    function syncLabel(){
      var l = document.getElementById('tourCtaLabel');
      if (l) l.textContent = mqMob.matches ? 'See the site, card by card' : 'Take the site tour';
    }
    syncLabel();
    if (mqMob.addEventListener) mqMob.addEventListener('change', syncLabel);
    new IntersectionObserver(function (es) {
      es.forEach(function (e) { stage.classList.toggle('is-off', !e.isIntersecting); });
    }, { threshold:.02 }).observe(stage);
    addEventListener('resize', fit);
    fit();
    window.addEventListener('load', fit);
  }

  /* Mobile carousel */
  var mTrack = $('#mcTrack');
  if (mTrack) {
    var slides = [].slice.call(mTrack.children);
    var dotsBox = $('#mcDots');
    var dots = slides.map(function (_, i) {
      var d = document.createElement('button');
      d.className = 'mc-dot';
      d.setAttribute('aria-label', 'Go to slide '+(i+1));
      d.addEventListener('click', function () { goTo(i); });
      dotsBox.appendChild(d); return d;
    });
    var cur = -1;
    slides.forEach(function (s) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (!e.isIntersecting) return;
          var i = slides.indexOf(e.target);
          if (i !== cur) { cur = i; dots.forEach(function (d, k) { d.classList.toggle('on', k===i); }); }
        });
      }, { root: mTrack, threshold:.6 }).observe(s);
    });
    function goTo(i) {
      var s = slides[i];
      mTrack.scrollTo({ left: s.offsetLeft-(mTrack.clientWidth-s.offsetWidth)/2, behavior:reduced?'auto':'smooth' });
    }
  }

  /* Dotted tree */
  var treeBox = $('#treeBox'), treeSpace = $('#treeSpace');
  if (treeBox && treeSpace) {
    var dotsG = $('#treeDots'), NS = 'http://www.w3.org/2000/svg';
    function lcg(seed){ var s=seed%2147483647; if(s<=0)s+=2147483646; return function(){ s=s*16807%2147483647; return (s-1)/2147483646; }; }
    function addDot(x,y,r,cls,t){
      var c = document.createElementNS(NS,'circle');
      c.setAttribute('cx',x.toFixed(1)); c.setAttribute('cy',y.toFixed(1)); c.setAttribute('r',r.toFixed(2));
      c.setAttribute('class','tdot '+cls);
      c.style.setProperty('--t',t.toFixed(3));
      dotsG.appendChild(c);
    }
    (function build(){
      var rnd = lcg(20250419), CX=300, BASE=588, i;
      for (i=0;i<54;i++) addDot(CX+(rnd()-.5)*260, BASE+4+rnd()*14, 1.5+rnd()*1.1, rnd()<.5?'t-ground':'t-grass', .02+rnd()*.08);
      for (i=0;i<20;i++) addDot(CX+(rnd()-.5)*150, BASE+2+rnd()*6, 1.2+rnd()*.9, 't-grass', .04+rnd()*.1);
      var trunk=[];
      for (i=0;i<34;i++){ var k=i/33;
        trunk.push([CX-5+Math.sin(k*2.2)*4-k*4, BASE-k*168, 3.4-k*1.1]);
        trunk.push([CX+5+Math.sin(k*2.2+1)*4+k*3, BASE-k*162, 3.2-k*1.1]);
      }
      trunk.forEach(function(p,idx){ addDot(p[0]+(rnd()-.5)*2.5,p[1],p[2]*(.85+rnd()*.3),'t-trunk',.08+(idx/trunk.length)*.2); });
      var tips=[];
      for (var b=0;b<7;b++){
        var side=b%2===0?-1:1, sk=.45+(b/7)*.55;
        var px=CX+side*4, py=BASE-sk*165;
        var ang=-Math.PI/2+side*(.35+rnd()*.5)-side*sk*.2;
        var len=70+rnd()*60, steps=15;
        for (i=1;i<=steps;i++){
          var kk=i/steps;
          ang+=(rnd()-.5)*.12-side*.015;
          px+=Math.cos(ang)*(len/steps); py+=Math.sin(ang)*(len/steps);
          addDot(px+(rnd()-.5)*4, py+(rnd()-.5)*4, 2.4-kk*1.1+rnd()*.4, 't-branch', .26+kk*.18+rnd()*.05);
          if (i===Math.floor(steps*.62)||i===steps){ tips.push([px,py]); if(i===Math.floor(steps*.62)){px+=(rnd()-.5)*10;py-=4;} }
        }
        var a2=ang+(rnd()<.5?-1:1)*(.5+rnd()*.4), qx=px, qy=py;
        for (i=0;i<8;i++){ qx+=Math.cos(a2)*6; qy+=Math.sin(a2)*6; addDot(qx+(rnd()-.5)*3,qy+(rnd()-.5)*3,1.5+rnd()*.5,'t-branch',.42+rnd()*.14); }
        tips.push([qx,qy]);
      }
      tips.forEach(function (tip) {
        var n=15+Math.floor(rnd()*6);
        for (var j=0;j<n;j++){
          var a=rnd()*Math.PI*2, rr=Math.sqrt(rnd())*34;
          var lx=tip[0]+Math.cos(a)*rr, ly=tip[1]+Math.sin(a)*rr*.72;
          var roll=rnd(), cls=roll<.38?'t-leafA':(roll<.74?'t-leafB':(roll<.9?'t-leafC':(roll<.96?'t-gold':'t-clay')));
          addDot(lx,ly,1.4+rnd()*1.3,cls,.5+rnd()*.36);
        }
      });
      for (i=0;i<6;i++) addDot(380+rnd()*150, 90+rnd()*90, 1.6+rnd()*.8, 't-bird', .9+rnd()*.08);
    })();
    var lastP=-1, tTick=false;
    function treeUpd(){
      tTick=false;
      if (reduced) return;
      var rect = treeSpace.getBoundingClientRect();
      var total = rect.height - innerHeight;
      if (total<=0) return;
      var p = Math.min(1, Math.max(0, -rect.top/total));
      p = Math.round(p*200)/200;
      if (Math.abs(p-lastP)<.005) return;
      lastP=p;
      treeBox.style.setProperty('--p', p.toFixed(3));
    }
    addEventListener('scroll', function(){ if(!tTick){ tTick=true; requestAnimationFrame(treeUpd); } }, {passive:true});
    addEventListener('resize', function(){ lastP=-1; treeUpd(); });
    if (reduced) { var h=document.getElementById('treeHint'); if(h) h.style.display='none'; }
    else { treeBox.style.setProperty('--p', 0); lastP=0; }
  }

  /* Contact form: buttons scroll to the form and pre-select the topic */
  var fTopic = $('#fTopic');
  $$('[data-topic]').forEach(function (a) {
    a.addEventListener('click', function () {
      var t = a.getAttribute('data-topic');
      if (fTopic) {
        for (var i = 0; i < fTopic.options.length; i++) {
          if (fTopic.options[i].text === t) { fTopic.selectedIndex = i; break; }
        }
        var f = fTopic.closest('.field');
        if (f) { f.classList.add('flash'); setTimeout(function () { f.classList.remove('flash'); }, 1600); }
      }
    });
  });

  /* CSRF token */
  var csrfToken = null;
  if (document.body) {
    csrfToken = sessionStorage.getItem('csrf_token');
    if (!csrfToken) {
      csrfToken = Array.from(new Uint8Array(32)).map(function(b) { return b.toString(16).padStart(2, '0'); }).join('');
      sessionStorage.setItem('csrf_token', csrfToken);
    }
    var csrfField = $('#csrfToken');
    if (csrfField) csrfField.value = csrfToken;
  }

  /* Simple math CAPTCHA */
  var captchaAnswer = null;
  function generateCaptcha() {
    var a = Math.floor(Math.random() * 10) + 1;
    var b = Math.floor(Math.random() * 10) + 1;
    captchaAnswer = a + b;
    var qEl = $('#captchaQuestion');
    if (qEl) qEl.textContent = a + ' + ' + b + ' = ?';
  }
  generateCaptcha();

  /* Client-side rate limiting: max 3 submissions per 15 minutes */
  function checkRateLimit() {
    var key = 'form_submissions';
    var now = Date.now();
    var subs = JSON.parse(sessionStorage.getItem(key) || '[]');
    var windowMs = 15 * 60 * 1000;
    var recent = subs.filter(function(t) { return now - t < windowMs; });
    if (recent.length >= 3) {
      return false;
    }
    recent.push(now);
    sessionStorage.setItem(key, JSON.stringify(recent));
    return true;
  }

  /* Form endpoint: set FORM_ENDPOINT to your SMTP endpoint URL when deployed.
     Leave empty to use the built-in mailto fallback. */
  var FORM_ENDPOINT = '';
  var form = $('#contactForm');
  if (form) {
    var okBox = $('#formOk');
    function fieldOk(id, test) {
      var input = document.getElementById(id), f = input.closest('.field');
      var good = test(input.value);
      f.classList.toggle('bad', !good);
      return good;
    }
    function showOk(title, sub) {
      okBox.textContent = '';
      var b = document.createElement('strong'); b.textContent = title; okBox.appendChild(b);
      if (sub) { var s = document.createElement('small'); s.textContent = sub; okBox.appendChild(s); }
      okBox.classList.add('show');
    }
    function mailto(name,email,phone,org,topic,message) {
      var to = org==='Enhlanhleni Development NPO' ? 'enhlanhleni@indilinde.org.za' : 'hello@indilinde.org.za';
      var subject = 'Website enquiry: '+topic;
      var body = 'Name: '+name+'\nEmail: '+email+(phone?'\nPhone: '+phone:'')+'\nOrganisation: '+org+'\nTopic: '+topic+'\n\n'+message;
      location.href = 'mailto:'+to+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
      showOk('Your email app should have opened.', 'The message is ready to send to '+to+'.');
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      okBox.classList.remove('show');
      var hp = document.getElementById('fHp');
      if (hp && hp.value) { showOk('Thank you.'); return; }

      /* Rate limiting */
      if (!checkRateLimit()) {
        showToast('Too many submissions. Please wait 15 minutes before trying again.');
        return;
      }

      /* CSRF check */
      var tokenField = document.getElementById('csrfToken');
      if (!tokenField || !tokenField.value || tokenField.value !== sessionStorage.getItem('csrf_token')) {
        showToast('Security check failed. Please refresh and try again.');
        return;
      }

      /* CAPTCHA check */
      var captchaInput = document.getElementById('fCaptcha');
      if (!captchaInput || parseInt(captchaInput.value, 10) !== captchaAnswer) {
        showToast('Please answer the security question correctly.');
        captchaInput.closest('.field').classList.add('bad');
        generateCaptcha();
        return;
      }

      var name=$('#fName').value.trim(), email=$('#fEmail').value.trim(),
          phone=$('#fPhone').value.trim(), org=$('#fOrg').value,
          topic=fTopic.value, message=$('#fMsg').value.trim();
      var ok = true;
      ok = fieldOk('fName', function(v){ return v.length>1; }) && ok;
      ok = fieldOk('fEmail', function(v){ return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v); }) && ok;
      if ($('#fPhone').value.trim()) ok = fieldOk('fPhone', function(v){ return v.length >= 10; }) && ok;
      ok = fieldOk('fMsg', function(v){ return v.length>4; }) && ok;
      if (!ok) { showToast('Please check the highlighted fields'); generateCaptcha(); return; }
      if (FORM_ENDPOINT) {
        fetch(FORM_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':csrfToken},
          body: JSON.stringify({name:name,email:email,phone:phone,org:org,topic:topic,message:message,captcha:captchaAnswer})
        }).then(function(r){ if(!r.ok) throw new Error(); return r.json(); })
          .then(function(){ form.reset(); showOk('Message sent. Siyabonga!','We will reply to '+email+' soon.'); generateCaptcha(); })
          .catch(function(){ mailto(name,email,phone,org,topic,message); generateCaptcha(); });
      } else {
        mailto(name,email,phone,org,topic,message);
        generateCaptcha();
      }
    });
  }
})();
