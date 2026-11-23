(function () {
  'use strict';

  var I = window.ISI;
  var $ = function (s) { return document.querySelector(s); };
  var TOTAL = 5;
  var sekarang = 0;
  var kurangGerak = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.title = I.judulTab;

  /* =====================================================
     Isi teks dari isi.js
  ===================================================== */
  $('#s0-atas').textContent = I.kabut.atas;
  $('#s0-judul').textContent = I.kabut.judul;
  $('#s0-sub').textContent = I.kabut.sub;
  $('#s0-petunjuk').textContent = I.kabut.petunjuk;
  $('#s0-lewati').textContent = I.kabut.lewati;
  $('#s0-lanjut').textContent = I.kabut.lanjut;

  $('#s1-judul').textContent = I.doa.judul;
  $('#s1-petunjuk').textContent = I.doa.petunjuk;
  $('#s1-lanjut').textContent = I.doa.lanjut;

  $('#s2-petunjuk').textContent = I.surat.petunjuk;
  $('#s2-lanjut').textContent = I.surat.lanjut;

  $('#s3-judul').textContent = I.rajut.judul;
  $('#s3-petunjuk').textContent = I.rajut.petunjuk;
  $('#tahan').textContent = I.rajut.tombol;
  $('#tambahan').textContent = I.rajut.tambahan;
  $('#s3-lanjut').textContent = I.rajut.lanjut;

  $('#s4-judul').textContent = I.penutup.judul;
  $('#hujanLagi').textContent = I.penutup.hujanLagi;
  $('#ulang').textContent = I.penutup.ulang;

  I.penutup.baris.forEach(function (t, i) {
    var p = document.createElement('p');
    p.textContent = t;
    p.style.animationDelay = (1.2 + i * 1.6) + 's';
    $('#s4-baris').appendChild(p);
  });

  /* titik penanda halaman */
  var titikWadah = $('#titik');
  for (var d = 0; d < TOTAL; d++) { titikWadah.appendChild(document.createElement('i')); }

  /* =====================================================
     Hujan di latar (canvas)
  ===================================================== */
  var rc = $('#hujan');
  var rx = rc.getContext('2d');
  var W = 0, H = 0;
  var MAX = kurangGerak ? 90 : 260;
  var tetes = [];
  var riak = [];
  var intensitas = 1;
  var target = 1;

  function ukur() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    rc.width = W * dpr;
    rc.height = H * dpr;
    rx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function buatTetes(awal) {
    return {
      x: Math.random() * (W + 200) - 100,
      y: awal ? Math.random() * H : -20 - Math.random() * H * 0.3,
      l: 10 + Math.random() * 18,
      v: 9 + Math.random() * 9,
      o: 0.18 + Math.random() * 0.35,
      g: H * (0.72 + Math.random() * 0.27)
    };
  }

  function tambahRiak(x, y, besar, bulat) {
    riak.push({ x: x, y: y, r: 1, max: besar ? 60 + Math.random() * 30 : 14 + Math.random() * 16, a: besar ? 0.55 : 0.3, e: bulat ? 1 : 0.35 });
  }

  function mulaiHujan() {
    ukur();
    tetes = [];
    for (var i = 0; i < MAX; i++) tetes.push(buatTetes(true));
  }

  var terakhir = performance.now();
  function bingkaiHujan(t) {
    var dt = Math.min(40, t - terakhir) / 16.67;
    terakhir = t;
    intensitas += (target - intensitas) * 0.02 * dt;
    if (Math.abs(target - intensitas) < 0.002) intensitas = target;

    rx.clearRect(0, 0, W, H);

    var n = Math.floor(MAX * intensitas * (W < 600 ? 0.6 : 1));
    rx.lineWidth = 1.2;
    rx.lineCap = 'round';
    for (var i = 0; i < n; i++) {
      var d = tetes[i];
      d.y += d.v * dt;
      d.x += d.v * 0.12 * dt;
      if (d.y >= d.g) {
        if (Math.random() < 0.45) tambahRiak(d.x, d.g, false, false);
        tetes[i] = buatTetes(false);
        continue;
      }
      rx.strokeStyle = 'rgba(190,210,255,' + d.o + ')';
      rx.beginPath();
      rx.moveTo(d.x, d.y);
      rx.lineTo(d.x - d.l * 0.12, d.y - d.l);
      rx.stroke();
    }

    for (var j = riak.length - 1; j >= 0; j--) {
      var r = riak[j];
      r.r += (r.e === 1 ? 1.4 : 0.55) * dt;
      r.a -= (r.e === 1 ? 0.009 : 0.012) * dt;
      if (r.a <= 0 || r.r > r.max) { riak.splice(j, 1); continue; }
      rx.strokeStyle = 'rgba(200,220,255,' + r.a + ')';
      rx.lineWidth = 1.2;
      rx.beginPath();
      rx.ellipse(r.x, r.y, r.r, r.r * r.e, 0, 0, Math.PI * 2);
      rx.stroke();
    }

    if (gainNode && suaraNyala) gainNode.gain.value = 0.2 * intensitas;

    requestAnimationFrame(bingkaiHujan);
  }

  window.addEventListener('resize', function () {
    ukur();
    for (var i = 0; i < tetes.length; i++) tetes[i].g = H * (0.72 + Math.random() * 0.27);
    ukurKabut();
  });

  /* sentuhan di mana saja membuat riak */
  document.addEventListener('pointerdown', function (e) {
    tambahRiak(e.clientX, e.clientY, true, true);
    setTimeout(function () { tambahRiak(e.clientX, e.clientY, true, true); }, 160);
  });

  /* =====================================================
     Suara hujan (dibuat langsung, tanpa file)
  ===================================================== */
  var ac = null, gainNode = null, suaraNyala = false;
  var tombolSuara = $('#suara');
  tombolSuara.textContent = I.suara.mati;

  function siapSuara() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    ac = new AC();
    var panjang = ac.sampleRate * 4;
    var buf = ac.createBuffer(1, panjang, ac.sampleRate);
    var data = buf.getChannelData(0);
    var b0 = 0, b1 = 0, b2 = 0;
    for (var i = 0; i < panjang; i++) {
      var putih = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + putih * 0.099046;
      b1 = 0.963 * b1 + putih * 0.2965164;
      b2 = 0.57 * b2 + putih * 1.0526913;
      data[i] = (b0 + b1 + b2 + putih * 0.1848) * 0.2;
    }
    var sumber = ac.createBufferSource();
    sumber.buffer = buf;
    sumber.loop = true;
    var hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 260;
    var lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 5200;
    gainNode = ac.createGain();
    gainNode.gain.value = 0;
    sumber.connect(hp);
    hp.connect(lp);
    lp.connect(gainNode);
    gainNode.connect(ac.destination);
    sumber.start();
    return true;
  }

  tombolSuara.addEventListener('click', function () {
    if (!ac && !siapSuara()) return;
    if (ac.state === 'suspended') ac.resume();
    suaraNyala = !suaraNyala;
    if (!suaraNyala && gainNode) gainNode.gain.value = 0;
    tombolSuara.textContent = suaraNyala ? I.suara.nyala : I.suara.mati;
  });

  /* =====================================================
     Pindah antar scene
  ===================================================== */
  var scenes = document.querySelectorAll('.scene');
  var titik = titikWadah.querySelectorAll('i');
  var timerReda = null;

  function pergi(n) {
    sekarang = n;
    for (var i = 0; i < scenes.length; i++) scenes[i].classList.toggle('aktif', i === n);
    for (var k = 0; k < titik.length; k++) {
      titik[k].className = k === n ? 'ini' : (k < n ? 'sudah' : '');
    }
    clearTimeout(timerReda);
    if (n === 4) {
      document.body.classList.add('reda');
      timerReda = setTimeout(function () { target = 0; }, 1200);
    } else {
      document.body.classList.remove('reda');
      if (n === 0) target = 1;
      else if (n === 1) target = 0.9;
      else if (n === 2) target = 0.75;
      else if (n === 3) target = rajutSelesai ? 0.4 : 0.65;
    }
    scenes[n].scrollTop = 0;
  }

  /* =====================================================
     Scene 1, kaca berkabut
  ===================================================== */
  var kabut = $('#kabut');
  var kx = kabut.getContext('2d');
  var KS = 0.5;
  var kabutSelesai = false;
  var menghapus = false;
  var lx = 0, ly = 0, hitungGerak = 0;

  function ukurKabut() {
    if (kabutSelesai) return;
    kabut.width = Math.max(1, Math.floor(window.innerWidth * KS));
    kabut.height = Math.max(1, Math.floor(window.innerHeight * KS));
    gambarKabut();
  }

  function gambarKabut() {
    var w = kabut.width, h = kabut.height;
    kx.globalCompositeOperation = 'source-over';
    var g = kx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, 'rgba(176,194,218,0.95)');
    g.addColorStop(1, 'rgba(138,160,192,0.96)');
    kx.fillStyle = g;
    kx.fillRect(0, 0, w, h);
    var jumlah = Math.floor(w * h / 900);
    for (var i = 0; i < jumlah; i++) {
      var x = Math.random() * w, y = Math.random() * h, r = 0.6 + Math.random() * 2.2;
      kx.fillStyle = 'rgba(235,242,255,' + (0.08 + Math.random() * 0.16) + ')';
      kx.beginPath();
      kx.arc(x, y, r, 0, Math.PI * 2);
      kx.fill();
    }
  }

  function hapusTitik(x, y) {
    kx.globalCompositeOperation = 'destination-out';
    kx.lineCap = 'round';
    kx.lineJoin = 'round';
    kx.lineWidth = 40;
    kx.strokeStyle = 'rgba(0,0,0,1)';
    kx.beginPath();
    kx.moveTo(lx, ly);
    kx.lineTo(x, y);
    kx.stroke();
    lx = x; ly = y;
  }

  function posisi(e) {
    var rect = kabut.getBoundingClientRect();
    return { x: (e.clientX - rect.left) * (kabut.width / rect.width), y: (e.clientY - rect.top) * (kabut.height / rect.height) };
  }

  function cekBersih() {
    var w = kabut.width, h = kabut.height;
    var px = kx.getImageData(0, 0, w, h).data;
    var total = 0, bening = 0;
    for (var y = 0; y < h; y += 6) {
      for (var x = 0; x < w; x += 6) {
        total++;
        if (px[(y * w + x) * 4 + 3] < 70) bening++;
      }
    }
    if (bening / total > 0.34) bukaKabut();
  }

  function bukaKabut() {
    if (kabutSelesai) return;
    kabutSelesai = true;
    kabut.classList.add('hilang');
    $('#s0-petunjuk').classList.add('pudar');
    $('#s0-lewati').hidden = true;
    setTimeout(function () { $('#s0-lanjut').hidden = false; }, 900);
  }

  kabut.addEventListener('pointerdown', function (e) {
    menghapus = true;
    kabut.setPointerCapture(e.pointerId);
    var p = posisi(e);
    lx = p.x; ly = p.y;
    hapusTitik(p.x + 0.1, p.y + 0.1);
  });
  kabut.addEventListener('pointermove', function (e) {
    if (!menghapus || kabutSelesai) return;
    var p = posisi(e);
    hapusTitik(p.x, p.y);
    hitungGerak++;
    if (hitungGerak % 14 === 0) cekBersih();
  });
  function lepas() { menghapus = false; if (!kabutSelesai) cekBersih(); }
  kabut.addEventListener('pointerup', lepas);
  kabut.addEventListener('pointercancel', lepas);

  setTimeout(function () { if (!kabutSelesai) $('#s0-lewati').hidden = false; }, 7000);
  $('#s0-lewati').addEventListener('click', bukaKabut);
  $('#s0-lanjut').addEventListener('click', function () { pergi(1); });

  /* =====================================================
     Scene 2, tetes doa
  ===================================================== */
  var wadah = $('#tetesWadah');
  var kartu = $('#kartuDoa');
  var jumlahDoa = I.doa.daftar.length;
  var terbuka = 0;

  function setKartu(teks, awal) {
    kartu.innerHTML = '';
    var p = document.createElement('p');
    p.textContent = teks;
    kartu.appendChild(p);
    kartu.className = 'kartu' + (awal ? ' awal' : '');
    void kartu.offsetWidth;
    if (!awal) kartu.classList.add('muncul');
  }
  function setHitung() {
    $('#hitung').textContent = I.doa.hitung.replace('{n}', terbuka).replace('{total}', jumlahDoa);
  }
  setKartu(I.doa.awal, true);
  setHitung();

  I.doa.daftar.forEach(function (teks, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'tetes';
    b.setAttribute('aria-label', 'Tetes doa ' + (i + 1));
    b.style.setProperty('--lama', (3.2 + Math.random() * 2.4).toFixed(1) + 's');
    b.style.setProperty('--tunda', (-Math.random() * 3).toFixed(1) + 's');
    b.style.marginTop = (Math.random() * 14).toFixed(0) + 'px';
    b.addEventListener('click', function () {
      if (!b.classList.contains('terbuka')) {
        b.classList.add('terbuka');
        terbuka++;
        setHitung();
        if (terbuka === jumlahDoa) {
          setTimeout(function () { $('#s1-lanjut').hidden = false; }, 1200);
        }
      }
      setKartu(teks, false);
    });
    wadah.appendChild(b);
  });
  $('#s1-lanjut').addEventListener('click', function () { pergi(2); });

  /* =====================================================
     Scene 3, surat
  ===================================================== */
  var amplop = $('#amplop');
  var surat = $('#surat');
  var suratIsi = $('#suratIsi');

  function tambahP(teks, kelas, tunda) {
    var p = document.createElement('p');
    if (kelas) p.className = kelas;
    p.textContent = teks;
    p.style.animationDelay = tunda + 's';
    suratIsi.appendChild(p);
  }
  var t0 = 0.8;
  tambahP(I.surat.kepada, 'kepada', t0);
  I.surat.paragraf.forEach(function (t, i) { tambahP(t, '', t0 + 0.9 + i * 1.3); });
  var akhir = t0 + 0.9 + I.surat.paragraf.length * 1.3;
  tambahP(I.surat.salam, 'salam', akhir);
  tambahP(I.surat.dari, 'dari', akhir + 0.7);

  amplop.addEventListener('click', function () {
    amplop.classList.add('buka');
    $('#s2-petunjuk').style.display = 'none';
    setTimeout(function () {
      amplop.classList.add('hilang');
      surat.hidden = false;
    }, 900);
    setTimeout(function () {
      amplop.style.display = 'none';
      $('#s2-lanjut').hidden = false;
    }, 1900);
  });
  $('#s2-lanjut').addEventListener('click', function () { pergi(3); });

  /* =====================================================
     Scene 4, merajut sendu
  ===================================================== */
  var benang = $('#benang');
  var jarum = $('#jarum');
  var panjangBenang = benang.getTotalLength();
  benang.style.strokeDasharray = panjangBenang;
  benang.style.strokeDashoffset = panjangBenang;

  var kataEl = [];
  var kalimat = $('#kalimat');
  I.rajut.kalimat.split(' ').forEach(function (w) {
    var s = document.createElement('span');
    s.textContent = w + ' ';
    kalimat.appendChild(s);
    kataEl.push(s);
  });

  var progres = 0;
  var menahan = false;
  var rajutSelesai = false;
  var tombolTahan = $('#tahan');
  var tTerakhir = 0;

  function gambarRajut() {
    benang.style.strokeDashoffset = panjangBenang * (1 - progres);
    var pt = benang.getPointAtLength(panjangBenang * progres);
    jarum.setAttribute('cx', pt.x);
    jarum.setAttribute('cy', pt.y);
    for (var i = 0; i < kataEl.length; i++) {
      kataEl[i].classList.toggle('nyala', (i + 1) / kataEl.length <= progres + 0.001);
    }
  }

  function loopRajut(t) {
    var dt = Math.min(50, t - tTerakhir);
    tTerakhir = t;
    if (menahan && !rajutSelesai && sekarang === 3) {
      progres = Math.min(1, progres + dt / 5200);
      gambarRajut();
      if (progres >= 1) selesaiRajut();
    }
    requestAnimationFrame(loopRajut);
  }

  function selesaiRajut() {
    rajutSelesai = true;
    menahan = false;
    tombolTahan.classList.remove('ditahan');
    tombolTahan.hidden = true;
    target = 0.4;
    setTimeout(function () { $('#tambahan').classList.add('nyala'); }, 700);
    setTimeout(function () { $('#s3-lanjut').hidden = false; }, 2600);
  }

  function mulaiTahan() { if (!rajutSelesai) { menahan = true; tombolTahan.classList.add('ditahan'); } }
  function selesaiTahan() { menahan = false; tombolTahan.classList.remove('ditahan'); }

  tombolTahan.addEventListener('pointerdown', function (e) { tombolTahan.setPointerCapture(e.pointerId); mulaiTahan(); });
  tombolTahan.addEventListener('pointerup', selesaiTahan);
  tombolTahan.addEventListener('pointercancel', selesaiTahan);
  tombolTahan.addEventListener('pointerleave', selesaiTahan);
  tombolTahan.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  tombolTahan.addEventListener('keydown', function (e) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); mulaiTahan(); }
  });
  tombolTahan.addEventListener('keyup', function (e) {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); selesaiTahan(); }
  });
  $('#s3-lanjut').addEventListener('click', function () { pergi(4); });

  /* =====================================================
     Scene 5, reda
  ===================================================== */
  $('#hujanLagi').addEventListener('click', function () {
    clearTimeout(timerReda);
    document.body.classList.remove('reda');
    target = 1;
    setTimeout(function () {
      document.body.classList.add('reda');
      timerReda = setTimeout(function () { target = 0; }, 9000);
    }, 9000);
  });

  $('#ulang').addEventListener('click', function () {
    window.location.reload();
  });

  /* =====================================================
     Mulai
  ===================================================== */
  mulaiHujan();
  ukurKabut();
  pergi(0);
  requestAnimationFrame(function (t) { terakhir = t; tTerakhir = t; bingkaiHujan(t); });
  requestAnimationFrame(loopRajut);
})();
