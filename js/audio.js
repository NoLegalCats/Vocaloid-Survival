// =========================================================================
    // 1. FIREFOX-COMPATIBLE WEB AUDIO SYNTHESIZER + HTML5 WAV FALLBACK & RANDOM BGM PLAYER
    // =========================================================================
    const SoundFX = {
      ctx: null,
      masterGain: null,
      muted: false,
      lastShootTime: 0,
      lastBoomTime: 0,
      lastDingTime: 0,
      fallbackPools: {},

      // Генерирует мини-WAV в памяти для мгновенного фоллбэка в Firefox, если AudioContext ещё просыпается
      _buildWavPool(freqStart, freqEnd, durSec, waveType = 'sawtooth', vol = 0.25) {
        const sr = 22050;
        const n = Math.max(100, Math.floor(sr * durSec));
        const buf = new ArrayBuffer(44 + n * 2);
        const view = new DataView(buf);
        const writeStr = (off, s) => { for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i)); };
        writeStr(0, 'RIFF');
        view.setUint32(4, 36 + n * 2, true);
        writeStr(8, 'WAVE');
        writeStr(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sr, true);
        view.setUint32(28, sr * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeStr(36, 'data');
        view.setUint32(40, n * 2, true);
        let phase = 0;
        for (let i = 0; i < n; i++) {
          const p = i / n;
          const freq = freqStart + (freqEnd - freqStart) * (p * p);
          phase += (2 * Math.PI * freq) / sr;
          let s = Math.sin(phase);
          if (waveType === 'square') s = s >= 0 ? 0.8 : -0.8;
          else if (waveType === 'sawtooth') s = ((phase / Math.PI) % 2) - 1;
          const env = (1 - p) * vol;
          const pcm = Math.max(-1, Math.min(1, s * env));
          view.setInt16(44 + i * 2, pcm * 32767, true);
        }
        const blob = new Blob([buf], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        const pool = [];
        for (let k = 0; k < 4; k++) {
          const a = new Audio(url);
          a.volume = 0.55;
          pool.push(a);
        }
        return { pool, idx: 0 };
      },

      _playFallback(key, freqStart, freqEnd, durSec, waveType, vol) {
        try {
          if (!this.fallbackPools[key]) {
            this.fallbackPools[key] = this._buildWavPool(freqStart, freqEnd, durSec, waveType, vol);
          }
          const entry = this.fallbackPools[key];
          const audioEl = entry.pool[entry.idx % entry.pool.length];
          entry.idx++;
          audioEl.currentTime = 0;
          audioEl.play().catch(() => {});
        } catch (e) {}
      },

      init() {
        try {
          if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
              this.ctx = new AudioCtx();
              this.masterGain = this.ctx.createGain();
              this.masterGain.gain.value = 0.85;
              this.masterGain.connect(this.ctx.destination);
            }
          }
          if (this.ctx && (this.ctx.state === 'suspended' || this.ctx.state === 'interrupted')) {
            this.ctx.resume().catch(() => {});
          }
        } catch (e) {}
      },

      playShoot(freq = 320, dur = 0.05, type = 'sawtooth', vol = 0.085) {
        if (this.muted) return;
        const nowMs = performance.now();
        if (nowMs - this.lastShootTime < 35) return;
        this.lastShootTime = nowMs;
        this.init();
        if (!this.ctx || this.ctx.state !== 'running') {
          this._playFallback('shoot', freq, 65, dur, type, 0.28);
          return;
        }
        try {
          const now = Math.max(0, this.ctx.currentTime) + 0.005;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(Math.max(40, freq), now);
          osc.frequency.exponentialRampToValueAtTime(55, now + dur);
          gain.gain.setValueAtTime(Math.max(0.01, vol * 2.2), now);
          gain.gain.linearRampToValueAtTime(0.001, now + dur);
          osc.connect(gain);
          gain.connect(this.masterGain || this.ctx.destination);
          osc.start(now);
          osc.stop(now + dur + 0.01);
        } catch (e) {
          this._playFallback('shoot', freq, 65, dur, type, 0.28);
        }
      },

      playLaser(freq = 920, dur = 0.13) {
        if (this.muted) return;
        const nowMs = performance.now();
        if (nowMs - this.lastShootTime < 42) return;
        this.lastShootTime = nowMs;
        this.init();
        if (!this.ctx || this.ctx.state !== 'running') {
          this._playFallback('laser', freq, 180, dur, 'sine', 0.32);
          return;
        }
        try {
          const now = Math.max(0, this.ctx.currentTime) + 0.005;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(Math.max(80, freq), now);
          osc.frequency.exponentialRampToValueAtTime(180, now + dur);
          gain.gain.setValueAtTime(0.11, now);
          gain.gain.linearRampToValueAtTime(0.001, now + dur);
          osc.connect(gain);
          gain.connect(this.masterGain || this.ctx.destination);
          osc.start(now);
          osc.stop(now + dur + 0.01);
        } catch (e) {
          this._playFallback('laser', freq, 180, dur, 'sine', 0.32);
        }
      },

      playBoom(dur = 0.28, vol = 0.16) {
        if (this.muted) return;
        const nowMs = performance.now();
        if (nowMs - this.lastBoomTime < 50) return;
        this.lastBoomTime = nowMs;
        this.init();
        if (!this.ctx || this.ctx.state !== 'running') {
          this._playFallback('boom', 145, 28, dur, 'triangle', 0.45);
          return;
        }
        try {
          const now = Math.max(0, this.ctx.currentTime) + 0.005;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(145, now);
          osc.frequency.exponentialRampToValueAtTime(24, now + dur);
          gain.gain.setValueAtTime(Math.max(0.02, vol * 1.9), now);
          gain.gain.linearRampToValueAtTime(0.001, now + dur);
          osc.connect(gain);
          gain.connect(this.masterGain || this.ctx.destination);
          osc.start(now);
          osc.stop(now + dur + 0.01);
        } catch (e) {
          this._playFallback('boom', 145, 28, dur, 'triangle', 0.45);
        }
      },

      playPlushSquash() {
        if (this.muted) return;
        const nowMs = performance.now();
        if (nowMs - this.lastBoomTime < 48) return;
        this.lastBoomTime = nowMs;
        this.init();
        if (!this.ctx || this.ctx.state !== 'running') {
          this._playFallback('squash', 300, 65, 0.20, 'sine', 0.35);
          return;
        }
        try {
          const now = Math.max(0, this.ctx.currentTime) + 0.005;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(65, now + 0.20);
          gain.gain.setValueAtTime(0.15, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.20);
          osc.connect(gain);
          gain.connect(this.masterGain || this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.21);
        } catch (e) {}
      },

      playXpDing(pitchMultiplier = 1) {
        if (this.muted) return;
        const nowMs = performance.now();
        if (nowMs - this.lastDingTime < 28) return;
        this.lastDingTime = nowMs;
        this.init();
        if (!this.ctx || this.ctx.state !== 'running') {
          this._playFallback('ding', 580, 820, 0.06, 'sine', 0.22);
          return;
        }
        try {
          const now = Math.max(0, this.ctx.currentTime) + 0.005;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(580 * pitchMultiplier, now);
          osc.frequency.setValueAtTime(820 * pitchMultiplier, now + 0.025);
          gain.gain.setValueAtTime(0.065, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.065);
          osc.connect(gain);
          gain.connect(this.masterGain || this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.075);
        } catch (e) {}
      },

      playLevelUp(isLegendary = false) {
        if (this.muted) return;
        this.init();
        if (!this.ctx || this.ctx.state !== 'running') {
          this._playFallback('lvlup', 523, 1046, 0.25, 'triangle', 0.4);
          return;
        }
        try {
          const notes = isLegendary
            ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
            : [523.25, 659.25, 783.99, 1046.5];
          const baseNow = Math.max(0, this.ctx.currentTime) + 0.005;
          notes.forEach((n, idx) => {
            const now = baseNow + idx * 0.055;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(n, now);
            gain.gain.setValueAtTime(0.13, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.17);
            osc.connect(gain);
            gain.connect(this.masterGain || this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.18);
          });
        } catch (e) {}
      }
    };

    // Разблокируем звук в Firefox / Chrome при первом же клике или нажатии клавиши в любой точке окна!
    ['pointerdown', 'mousedown', 'keydown', 'click', 'touchstart'].forEach(evtName => {
      window.addEventListener(evtName, () => {
        SoundFX.init();
      }, { passive: true, capture: true });
    });

    // =========================================================================
    // 1.5. BACKGROUND MUSIC PLAYER (Plays tracks from `music/` in random order!)
    // =========================================================================
    const MusicPlayer = {
      tracks: [],            // Индексированный список активных треков: { id, filename, name, url, source, entry, file }
      trackMap: new Map(),   // O(1) индекс по id (filename в нижнем регистре)
      shuffledQueue: [],
      audioEl: null,
      activeBlobUrl: null,
      volume: 0.35,
      isPlaying: false,
      isGamePaused: false,
      initialized: false,
      dirHandle: null,
      _savedHandlePendingGesture: null,
      isSyncing: false,
      _hasCompletedInitialSync: false,
      _bgSyncTimer: null,
      _knownCandidateFilenames: new Map(), // id_lower -> exactFilename
      currentTrackId: null,
      currentTrackName: '',
      EXACT_FILES_KEY: 'vocaloid_music_exact_files_v6',
      NOTIFIED_MISSING_KEY: 'vocaloid_music_notified_missing_v7',
      VOLUME_STORAGE_KEY: 'vocaloid_music_volume_v1',
      DEFAULT_STARTER_FILES: [
        '01_cyber_bridge_beat.wav',
        '02_triple_baka_rush.wav',
        '03_neon_overdrive.wav'
      ],

      _getIDB() {
        return new Promise((resolve) => {
          if (!window.indexedDB) return resolve(null);
          try {
            const req = indexedDB.open('vocaloid_music_db_v3', 1);
            req.onupgradeneeded = () => {
              const db = req.result;
              if (!db.objectStoreNames.contains('handles')) db.createObjectStore('handles');
              if (!db.objectStoreNames.contains('files')) db.createObjectStore('files');
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
          } catch (e) { resolve(null); }
        });
      },

      async _savePersistedHandle(handle) {
        try {
          const db = await this._getIDB();
          if (!db) return;
          const tx = db.transaction('handles', 'readwrite');
          tx.objectStore('handles').put(handle, 'music_folder_handle');
        } catch (e) {}
      },

      async _loadPersistedHandle() {
        try {
          const db = await this._getIDB();
          if (!db) return null;
          return new Promise(resolve => {
            const tx = db.transaction('handles', 'readonly');
            const req = tx.objectStore('handles').get('music_folder_handle');
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
          });
        } catch (e) { return null; }
      },

      async _savePersistedFilesMap(fileList) {
        try {
          const db = await this._getIDB();
          if (!db) return;
          const tx = db.transaction('files', 'readwrite');
          const store = tx.objectStore('files');
          store.clear();
          for (const f of fileList) {
            if (f && f.name && this._isAudioFilename(f.name)) {
              store.put(f, f.name.toLowerCase());
            }
          }
        } catch (e) {}
      },

      async _loadPersistedFilesMap() {
        const map = new Map();
        try {
          const db = await this._getIDB();
          if (!db) return map;
          return new Promise(resolve => {
            const tx = db.transaction('files', 'readonly');
            const store = tx.objectStore('files');
            const req = store.getAll();
            req.onsuccess = () => {
              const arr = req.result || [];
              arr.forEach(f => {
                if (f && f.name && this._isAudioFilename(f.name)) {
                  map.set(f.name.toLowerCase(), f);
                }
              });
              resolve(map);
            };
            req.onerror = () => resolve(map);
          });
        } catch (e) { return map; }
      },

      _isAudioFilename(name) {
        const clean = String(name || '').trim().split('?')[0].split('#')[0];
        return /\.(mp3|wav|ogg|oga|opus|flac|m4a|aac|mp4|webm|weba|wma|mka|ape|wv)$/i.test(clean);
      },

      _safeDecodeURIComponent(str) {
        const s = String(str || '');
        try {
          return decodeURIComponent(s.replace(/%(?![0-9A-Fa-f]{2})/g, '%25'));
        } catch (e) {
          return s;
        }
      },

      _extractCleanFilename(pathOrUrl) {
        let raw = String(pathOrUrl || '').trim().split('?')[0].split('#')[0];
        raw = raw.replace(/^music\//i, '').replace(/\/+$/, '').split('/').pop().split('\\').pop();
        return this._safeDecodeURIComponent(raw).trim();
      },

      _cleanDisplayName(filename) {
        const fn = this._extractCleanFilename(filename);
        return fn.replace(/\.[^.]+$/, '');
      },

      _buildSafeMusicUrl(filenameOrPath) {
        const raw = String(filenameOrPath || '').trim();
        if (raw.startsWith('blob:') || raw.startsWith('data:') || raw.startsWith('http://') || raw.startsWith('https://')) {
          return raw;
        }
        const cleanFile = this._extractCleanFilename(raw);
        return 'music/' + encodeURIComponent(cleanFile);
      },

      _buildRawMusicUrl(filenameOrPath) {
        const cleanFile = this._extractCleanFilename(filenameOrPath);
        return 'music/' + cleanFile.replace(/%/g, '%25').replace(/#/g, '%23').replace(/\?/g, '%3F');
      },

      _parsePlaylistTextContent(rawText) {
        const result = [];
        if (!rawText || typeof rawText !== 'string') return result;
        const trimmed = rawText.trim().replace(/^\uFEFF/, '');

        // 1. Попытка распарсить JSON-массив (чистый JSON или внутри window.MUSIC_PLAYLIST_JSON = [...])
        const bracketStart = trimmed.indexOf('[');
        const bracketEnd = trimmed.lastIndexOf(']');
        if (bracketStart !== -1 && bracketEnd > bracketStart) {
          try {
            const jsonSlice = trimmed.slice(bracketStart, bracketEnd + 1);
            const arr = JSON.parse(jsonSlice);
            if (Array.isArray(arr)) {
              arr.forEach(item => {
                const fn = this._extractCleanFilename(typeof item === 'string' ? item : (item && item.file));
                if (this._isAudioFilename(fn)) result.push(fn);
              });
              if (result.length > 0) return result;
            }
          } catch (e) {}
        }

        // 2. Построчный разбор (.txt или нестрогий список)
        trimmed.split(/\r?\n/).forEach(line => {
          let cl = line.trim();
          if (!cl || cl.startsWith('//') || cl.startsWith('#') || cl.startsWith('window.') || cl === '[' || cl === '];' || cl === ']') return;
          cl = cl.replace(/^["']|["'],?$|,$/g, '').trim();
          const fn = this._extractCleanFilename(cl);
          if (this._isAudioFilename(fn)) {
            result.push(fn);
          }
        });
        return result;
      },

      _loadExactCachedFiles() {
        try {
          const raw = localStorage.getItem(this.EXACT_FILES_KEY);
          if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
              return arr.map(s => this._extractCleanFilename(s)).filter(s => this._isAudioFilename(s));
            }
          }
        } catch (e) {}
        return null;
      },

      _loadNotifiedMissingSet() {
        try {
          const raw = localStorage.getItem(this.NOTIFIED_MISSING_KEY);
          if (raw) {
            const arr = JSON.parse(raw);
            if (Array.isArray(arr)) {
              return new Set(arr.map(s => this._extractCleanFilename(s).toLowerCase()));
            }
          }
        } catch (e) {}
        return new Set();
      },

      _saveNotifiedMissingSet(setObj) {
        try {
          localStorage.setItem(this.NOTIFIED_MISSING_KEY, JSON.stringify(Array.from(setObj)));
        } catch (e) {}
      },

      _saveExactCachedFiles() {
        try {
          const filenames = this.tracks.map(t => t.filename);
          localStorage.setItem(this.EXACT_FILES_KEY, JSON.stringify(filenames));
          window.MUSIC_PLAYLIST_JSON = [...filenames];
          window.MUSIC_FOLDER_TRACKS = filenames.map(fn => 'music/' + fn);
          filenames.forEach(fn => this._knownCandidateFilenames.set(fn.toLowerCase(), fn));
        } catch (e) {}
      },

      _buildPlaylistFilesContent() {
        const nl = String.fromCharCode(10);
        const sortedNames = this.tracks
          .slice()
          .sort((a, b) => a.filename.localeCompare(b.filename))
          .map(t => t.filename);
        const txtContent = sortedNames.join(nl) + nl;
        const jsonItems = sortedNames.map(fn => '  "' + fn.replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"');
        const jsonContent = [
          'window.MUSIC_PLAYLIST_JSON = [',
          jsonItems.join(',' + nl),
          '];',
          'window.MUSIC_FOLDER_TRACKS = window.MUSIC_PLAYLIST_JSON;',
          ''
        ].join(nl);
        return { txtContent, jsonContent, filenames: sortedNames };
      },

      async _resolveMusicDirectoryHandle(requestWrite = false) {
        let baseHandle = this.dirHandle;
        if (!baseHandle) return null;
        try {
          if (typeof baseHandle.queryPermission === 'function') {
            const desiredMode = requestWrite ? 'readwrite' : 'read';
            let perm = await baseHandle.queryPermission({ mode: desiredMode });
            if (perm !== 'granted' && requestWrite && typeof baseHandle.requestPermission === 'function') {
              try { perm = await baseHandle.requestPermission({ mode: 'readwrite' }); } catch (e) {}
            }
            if (perm !== 'granted') {
              perm = await baseHandle.queryPermission({ mode: 'read' });
              if (perm !== 'granted') return null;
            }
          }
          if (baseHandle.name && baseHandle.name.toLowerCase() !== 'music' && typeof baseHandle.getDirectoryHandle === 'function') {
            try {
              const subMusic = await baseHandle.getDirectoryHandle('music', { create: false });
              if (subMusic) return subMusic;
            } catch (e) {}
          }
          return baseHandle;
        } catch (e) {
          return null;
        }
      },

      async _writeUpdatedPlaylistFilesToDisk() {
        const { txtContent, jsonContent } = this._buildPlaylistFilesContent();
        const musicDirHandle = await this._resolveMusicDirectoryHandle(true);
        if (musicDirHandle && typeof musicDirHandle.getFileHandle === 'function') {
          try {
            let perm = 'granted';
            if (typeof musicDirHandle.queryPermission === 'function') {
              perm = await musicDirHandle.queryPermission({ mode: 'readwrite' });
              if (perm !== 'granted' && typeof musicDirHandle.requestPermission === 'function') {
                try { perm = await musicDirHandle.requestPermission({ mode: 'readwrite' }); } catch (e) {}
              }
            }
            if (perm === 'granted') {
              const writeOne = async (fname, content) => {
                const fh = await musicDirHandle.getFileHandle(fname, { create: true });
                const w = await fh.createWritable();
                await w.write(content);
                await w.close();
              };
              await writeOne('playlist.txt', txtContent);
              await writeOne('playlist.json', jsonContent);
              await writeOne('playlist.js', jsonContent);
              return true;
            }
          } catch (e) {}
        }
        if (typeof location !== 'undefined' && (location.protocol === 'http:' || location.protocol === 'https:') && typeof fetch === 'function') {
          try {
            await fetch('/__sync_music', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tracks: this.tracks.map(t => 'music/' + t.filename) })
            });
            return true;
          } catch (e) {}
        }
        return false;
      },

      // Проверяет один URL аудиофайла. На локальном диске (file://) отсутствующий файл вызывает 'error' за 5-30 мс.
      // Если за 1600 мс 'error' НЕ произошёл, значит файл существует (просто у него крупная обложка в ID3v2 или очередь декодера)!
      _probeSingleAudioUrl(url) {
        return new Promise((resolve) => {
          if (!url) return resolve(false);
          const probe = new Audio();
          probe.preload = 'metadata';
          let settled = false;
          const finish = (ok) => {
            if (settled) return;
            settled = true;
            try {
              probe.pause();
              probe.removeAttribute('src');
              probe.load();
            } catch (e) {}
            resolve(ok);
          };
          const timer = setTimeout(() => {
            // Если ошибки загрузки не возникло — файл физически существует!
            finish(!probe.error);
          }, 1600);
          probe.addEventListener('loadedmetadata', () => { clearTimeout(timer); finish(true); }, { once: true });
          probe.addEventListener('loadeddata', () => { clearTimeout(timer); finish(true); }, { once: true });
          probe.addEventListener('canplay', () => { clearTimeout(timer); finish(true); }, { once: true });
          probe.addEventListener('error', () => { clearTimeout(timer); finish(false); }, { once: true });
          const isHttp = (typeof location !== 'undefined' && (location.protocol === 'http:' || location.protocol === 'https:'));
          probe.src = isHttp ? (url + (url.includes('?') ? '&' : '?') + '_t=' + Date.now()) : url;
        });
      },

      // Проверяет существование трека по имени файла (пробует URL-encoded и прямой UTF-8 путь для файлов с японскими/китайскими символами, ❤, скобками и пробелами)
      async _verifyTrackByFilename(filenameOrUrl) {
        const cleanFn = this._extractCleanFilename(filenameOrUrl);
        const encodedUrl = this._buildSafeMusicUrl(cleanFn);
        if (await this._probeSingleAudioUrl(encodedUrl)) {
          return { ok: true, url: encodedUrl, filename: cleanFn };
        }
        const rawUrl = this._buildRawMusicUrl(cleanFn);
        if (rawUrl !== encodedUrl && await this._probeSingleAudioUrl(rawUrl)) {
          return { ok: true, url: rawUrl, filename: cleanFn };
        }
        return { ok: false, url: encodedUrl, filename: cleanFn };
      },

      async _verifyUrlTrackExists(url) {
        const res = await this._verifyTrackByFilename(url);
        return res.ok;
      },

      // Парсер листинга директории music/ (поддерживает Firefox Gecko application/http-index-format "201: ...", HTML <a href="..."> и JSON)
      _parseDirectoryListingText(rawText) {
        if (!rawText || typeof rawText !== 'string') return null;
        const foundFiles = new Map();
        let isValidListing = false;

        const addCandidateFile = (rawNameOrHref) => {
          const cleanFn = this._extractCleanFilename(rawNameOrHref);
          if (this._isAudioFilename(cleanFn)) {
            const id = cleanFn.toLowerCase();
            foundFiles.set(id, {
              id,
              filename: cleanFn,
              name: this._cleanDisplayName(cleanFn),
              url: this._buildSafeMusicUrl(cleanFn),
              source: 'dir_index'
            });
          }
        };

        // 1. JSON формат
        if (rawText.trim().startsWith('{') || rawText.trim().startsWith('[')) {
          try {
            const parsedJson = JSON.parse(rawText);
            const arr = Array.isArray(parsedJson) ? parsedJson : (parsedJson && Array.isArray(parsedJson.files) ? parsedJson.files : null);
            if (arr) {
              isValidListing = true;
              arr.forEach(item => addCandidateFile(item));
              return foundFiles;
            }
          } catch (e) {}
        }

        // 2. Формат индекса директории Firefox (application/http-index-format: строки "200: ..." и "201: <filename> <size> <date> FILE")
        if (rawText.includes('200:') || rawText.includes('300:') || /^201:/m.test(rawText)) {
          isValidListing = true;
          const lines = rawText.split(/\r?\n/);
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('201:')) continue;
            if (/\bDIRECTORY\b/i.test(trimmed)) continue;
            const rest = trimmed.slice(4).trim();
            let token = '';
            // В Firefox строка 201 имеет вид: 201: <имя_файла> <размер_числом> <дата_без_пробелов> FILE
            // Отсекаем 3 служебных поля справа, чтобы имена с пробелами, скобками, иероглифами и ❤ извлекались целиком!
            const tailMatch = rest.match(/^"?(.*?)"?\s+\d+\s+.+?\s+(?:FILE|DIRECTORY)\s*$/i);
            if (tailMatch && tailMatch[1]) {
              token = tailMatch[1].trim();
            } else if (rest.startsWith('"')) {
              const endQ = rest.indexOf('"', 1);
              token = endQ > 0 ? rest.slice(1, endQ) : rest;
            } else {
              token = rest.split(/\s+/)[0];
            }
            token = token.replace(/^"+|"+$/g, '').trim();
            addCandidateFile(token);
          }
        }

        // 3. HTML листинг (из скрытого <iframe src="music/"> в Firefox или локального веб-сервера)
        if (/<a\s/i.test(rawText) || /Index of/i.test(rawText) || /Directory listing/i.test(rawText)) {
          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(rawText, 'text/html');
            const anchors = doc.querySelectorAll('a');
            if (anchors.length > 0 || /Index of|Directory/i.test(rawText)) {
              isValidListing = true;
            }
            anchors.forEach(a => {
              const href = (a.getAttribute('href') || '').trim();
              const textName = (a.textContent || '').trim();
              // Проверяем и текст ссылки (в Firefox там лежит чистое UTF-8 имя файла с пробелами и иероглифами!), и href
              if (textName && this._isAudioFilename(textName)) {
                addCandidateFile(textName);
              } else if (href && href !== '../' && href !== './' && !href.startsWith('?') && !href.endsWith('/')) {
                addCandidateFile(href);
              }
            });
          } catch (e) {}
        }

        return isValidListing ? foundFiles : null;
      },

      // Авто-сканирование папки music/ через XMLHttpRequest (с декодированием UTF-8 через TextDecoder!) и скрытый <iframe src="music/">
      async _scanMusicFolderViaBrowser() {
        const isFileProto = (typeof location !== 'undefined' && location.protocol === 'file:');
        const targetUrl = isFileProto ? 'music/' : ('music/?_t=' + Date.now());

        // А. Чтение через ArrayBuffer + TextDecoder('utf-8'), чтобы японские/китайские символы (【原神アニメ】), ❤ и кириллица не бились в кракозябры!
        const xhrResult = await new Promise((resolve) => {
          try {
            const xhr = new XMLHttpRequest();
            xhr.open('GET', targetUrl, true);
            xhr.responseType = 'arraybuffer';
            if (typeof xhr.overrideMimeType === 'function') {
              try { xhr.overrideMimeType('text/plain; charset=utf-8'); } catch (e) {}
            }
            const timer = setTimeout(() => {
              try { xhr.abort(); } catch (e) {}
              resolve(null);
            }, 600);
            xhr.onload = () => {
              clearTimeout(timer);
              if (xhr.status === 200 || (isFileProto && xhr.status === 0 && xhr.response)) {
                try {
                  const text = new TextDecoder('utf-8').decode(xhr.response);
                  resolve(this._parseDirectoryListingText(text));
                  return;
                } catch (e) {}
              }
              resolve(null);
            };
            xhr.onerror = () => {
              clearTimeout(timer);
              resolve(null);
            };
            xhr.send();
          } catch (e) {
            resolve(null);
          }
        });
        if (xhrResult && xhrResult.size > 0) return xhrResult;

        // Б. Фоллбэк через скрытый <iframe src="music/">
        const iframeResult = await new Promise((resolve) => {
          let iframe = null;
          let settled = false;
          const finish = (val) => {
            if (settled) return;
            settled = true;
            if (iframe && iframe.parentNode) {
              try { iframe.parentNode.removeChild(iframe); } catch (e) {}
            }
            resolve(val);
          };
          const timer = setTimeout(() => finish(null), 650);
          try {
            iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.setAttribute('aria-hidden', 'true');
            iframe.onload = () => {
              clearTimeout(timer);
              try {
                const doc = iframe.contentDocument || (iframe.contentWindow && iframe.contentWindow.document);
                if (!doc || !doc.body) return finish(null);
                const html = doc.documentElement ? doc.documentElement.innerHTML : doc.body.innerHTML;
                const bodyText = doc.body.innerText || doc.body.textContent || '';
                const parsed = this._parseDirectoryListingText(html) || this._parseDirectoryListingText(bodyText);
                finish(parsed);
              } catch (err) {
                finish(null);
              }
            };
            iframe.onerror = () => {
              clearTimeout(timer);
              finish(null);
            };
            iframe.src = targetUrl;
            document.body.appendChild(iframe);
          } catch (e) {
            clearTimeout(timer);
            finish(null);
          }
        });
        return iframeResult || xhrResult;
      },

      // Перезагружает music/playlist.json, music/playlist.js и music/playlist.txt с диска и объединяет все прописанные в них треки
      async _reloadAllPlaylistFilesFromDisk() {
        const discoveredNames = new Map(); // id_lower -> cleanFilename
        const addFn = (raw) => {
          const clean = this._extractCleanFilename(raw);
          if (this._isAudioFilename(clean)) {
            discoveredNames.set(clean.toLowerCase(), clean);
            this._knownCandidateFilenames.set(clean.toLowerCase(), clean);
          }
        };

        // 1. Читаем через fetch / XHR (если доступно)
        for (const pFile of ['music/playlist.txt', 'music/playlist.json', 'music/playlist.js']) {
          try {
            const res = await fetch(pFile + '?v=' + Date.now(), { cache: 'no-store' });
            if (res.ok) {
              const txt = await res.text();
              this._parsePlaylistTextContent(txt).forEach(fn => addFn(fn));
            }
          } catch (e) {}
        }

        // 2. Перезагружаем через <script src="..."> (работает ВЕЗДЕ на file:// — и в Firefox, и в Chrome, и в Edge!)
        const tryLoadScript = (srcUrl) => new Promise((resolve) => {
          try {
            const s = document.createElement('script');
            s.src = srcUrl;
            const timer = setTimeout(() => {
              if (s.parentNode) s.parentNode.removeChild(s);
              resolve(false);
            }, 450);
            s.onload = () => {
              clearTimeout(timer);
              if (s.parentNode) s.parentNode.removeChild(s);
              resolve(true);
            };
            s.onerror = () => {
              clearTimeout(timer);
              if (s.parentNode) s.parentNode.removeChild(s);
              resolve(false);
            };
            document.head.appendChild(s);
          } catch (e) {
            resolve(false);
          }
        });

        await Promise.all([
          tryLoadScript('music/playlist.json?v=' + Date.now()).then(ok => ok || tryLoadScript('music/playlist.json')),
          tryLoadScript('music/playlist.js?v=' + Date.now()).then(ok => ok || tryLoadScript('music/playlist.js'))
        ]);

        if (Array.isArray(window.MUSIC_PLAYLIST_JSON)) {
          window.MUSIC_PLAYLIST_JSON.forEach(item => addFn(item));
        }
        if (Array.isArray(window.MUSIC_FOLDER_TRACKS)) {
          window.MUSIC_FOLDER_TRACKS.forEach(item => addFn(item));
        }
        return discoveredNames;
      },

      isPlaybackBlocked() {
        return Boolean(SoundFX.muted || this.isGamePaused);
      },

      setVolume(vol0to1) {
        const clamped = Math.max(0, Math.min(1, Number(vol0to1)));
        if (Number.isNaN(clamped)) return;
        this.volume = clamped;
        try {
          localStorage.setItem(this.VOLUME_STORAGE_KEY, String(Math.round(clamped * 100)));
        } catch (e) {}
        if (this.audioEl) {
          this.audioEl.volume = SoundFX.muted ? 0 : this.volume;
        }
      },

      getVolumePercent() {
        return Math.round(this.volume * 100);
      },

      _startBackgroundSyncLoop() {
        if (this._bgSyncTimer) return;
        this._bgSyncTimer = setInterval(() => {
          if (!this.isSyncing && !window.IS_MOBILE_BUILD) {
            this.syncTracks(true);
          }
        }, 2500);
      },

      async tryRestoreSavedHandlePermissionOnGesture() {
        if (!this._savedHandlePendingGesture) return;
        const handle = this._savedHandlePendingGesture;
        this._savedHandlePendingGesture = null;
        try {
          if (typeof handle.requestPermission === 'function') {
            let perm = await handle.requestPermission({ mode: 'readwrite' });
            if (perm !== 'granted') {
              perm = await handle.requestPermission({ mode: 'read' });
            }
            if (perm === 'granted') {
              this.dirHandle = handle;
              await this.syncTracks(true);
            }
          }
        } catch (e) {}
      },

      async init() {
        if (this.initialized) return;
        this.initialized = true;

        if (window.IS_MOBILE_BUILD) {
          this.updateMusicUI();
          return;
        }

        try {
          const savedVol = localStorage.getItem(this.VOLUME_STORAGE_KEY);
          if (savedVol !== null) {
            const pct = Math.max(0, Math.min(100, Number(savedVol)));
            if (!Number.isNaN(pct)) this.volume = pct / 100;
          }
        } catch (e) {}

        this.DEFAULT_STARTER_FILES.forEach(fn => {
          this._knownCandidateFilenames.set(fn.toLowerCase(), fn);
        });

        this.audioEl = new Audio();
        this.audioEl.volume = this.volume;

        this.audioEl.addEventListener('ended', async () => {
          await this.syncTracks(true);
          if (!this.isPlaybackBlocked()) {
            await this.playNextRandom(false);
          }
        });

        this.audioEl.addEventListener('error', async () => {
          if (this.currentTrackId) {
            const missingSet = this._loadNotifiedMissingSet();
            missingSet.add(this.currentTrackId);
            this._saveNotifiedMissingSet(missingSet);
            this._removeTrackFromList(this.currentTrackId, true);
            this._saveExactCachedFiles();
            await this._writeUpdatedPlaylistFilesToDisk();
          }
          if (this.tracks.length > 0 && !this.isPlaybackBlocked()) {
            setTimeout(() => this.playNextRandom(false), 120);
          } else {
            this.isPlaying = false;
            this.currentTrackName = '';
            this.updateMusicUI();
          }
        });

        try {
          const savedHandle = await this._loadPersistedHandle();
          if (savedHandle) {
            let perm = 'prompt';
            if (typeof savedHandle.queryPermission === 'function') {
              perm = await savedHandle.queryPermission({ mode: 'readwrite' });
              if (perm !== 'granted') {
                perm = await savedHandle.queryPermission({ mode: 'read' });
              }
            }
            if (perm === 'granted') {
              this.dirHandle = savedHandle;
            } else {
              this._savedHandlePendingGesture = savedHandle;
            }
          }
        } catch (e) {}

        // ПРОВЕРКА ПРИ ЗАПУСКЕ (в Главном Меню) + авто-запуск музыки при обнаружении!
        await this.syncTracks(true);
        this._startBackgroundSyncLoop();
        this.updateMusicUI();
      },

      _insertTrackObject(trackObj) {
        const key = trackObj.id;
        this._knownCandidateFilenames.set(key, trackObj.filename);
        if (this.trackMap.has(key)) {
          const existing = this.trackMap.get(key);
          Object.assign(existing, trackObj);
          return false;
        }
        this.trackMap.set(key, trackObj);
        this.tracks.push(trackObj);
        const randIdx = Math.floor(Math.random() * (this.shuffledQueue.length + 1));
        this.shuffledQueue.splice(randIdx, 0, trackObj);
        return true;
      },

      _removeTrackFromList(trackId, notify = true) {
        const key = String(trackId || '').toLowerCase();
        const existing = this.trackMap.get(key);
        if (!existing) return false;
        this.trackMap.delete(key);
        this.tracks = this.tracks.filter(t => t.id !== key);
        this.shuffledQueue = this.shuffledQueue.filter(q => q.id !== key);

        if (notify && typeof showToast === 'function') {
          showToast(
            `🗑️ ТРЕК УДАЛЁН ИЗ MUSIC/: ${existing.name}`,
            `Файл исчез из папки music/ и удалён из плейлиста (осталось: ${this.tracks.length})`,
            'border-amber-500 bg-slate-900/95'
          );
        }

        if (this.currentTrackId === key) {
          if (this.audioEl) {
            try { this.audioEl.pause(); } catch (e) {}
          }
          this.isPlaying = false;
          this.currentTrackId = null;
          this.currentTrackName = '';
        }
        this.updateMusicUI();
        return true;
      },

      // Двусторонняя сверка при запуске, при переключении треков и каждые 2.5 сек в фоне!
      async syncTracks(notify = true) {
        if (this.isSyncing || window.IS_MOBILE_BUILD) return;
        this.isSyncing = true;
        try {
          const exactCachedList = this._loadExactCachedFiles();
          const notifiedMissingSet = this._loadNotifiedMissingSet();
          const persistedFilesMap = await this._loadPersistedFilesMap();
          const diskPlaylistFiles = await this._reloadAllPlaylistFilesFromDisk();

          // Определяем базовый список предыдущего состояния (для точного вычисления добавленных и удалённых треков)
          const previouslyActiveMap = new Map();
          if (this._hasCompletedInitialSync) {
            for (const [k, v] of this.trackMap.entries()) {
              previouslyActiveMap.set(k, v.filename);
            }
          } else {
            if (Array.isArray(exactCachedList)) {
              exactCachedList.forEach(fn => {
                const clean = this._extractCleanFilename(fn);
                if (this._isAudioFilename(clean)) {
                  previouslyActiveMap.set(clean.toLowerCase(), clean);
                  this._knownCandidateFilenames.set(clean.toLowerCase(), clean);
                }
              });
            } else {
              // Самый первый запуск: базой считаем 3 стартовых .wav трека, чтобы любые новые .mp3 сразу определялись как НОВЫЕ!
              this.DEFAULT_STARTER_FILES.forEach(fn => {
                if (!notifiedMissingSet.has(fn.toLowerCase())) {
                  previouslyActiveMap.set(fn.toLowerCase(), fn);
                }
              });
            }
            if (Array.isArray(window.MUSIC_PREVIOUS_TRACKS)) {
              window.MUSIC_PREVIOUS_TRACKS.forEach(fn => {
                const clean = this._extractCleanFilename(fn);
                if (this._isAudioFilename(clean)) {
                  previouslyActiveMap.set(clean.toLowerCase(), clean);
                  this._knownCandidateFilenames.set(clean.toLowerCase(), clean);
                }
              });
            }
          }

          let discoveredEntriesMap = null;

          // Способ 1: Прямое чтение подключённой папки music/ через FileSystemDirectoryHandle (Chrome / Edge)
          const musicDirHandle = await this._resolveMusicDirectoryHandle(false);
          if (musicDirHandle && typeof musicDirHandle.values === 'function') {
            try {
              const map = new Map();
              for await (const entry of musicDirHandle.values()) {
                if (entry.kind === 'file' && this._isAudioFilename(entry.name)) {
                  const id = entry.name.toLowerCase();
                  map.set(id, {
                    id,
                    filename: entry.name,
                    name: this._cleanDisplayName(entry.name),
                    url: this._buildSafeMusicUrl(entry.name),
                    source: 'dir',
                    entry
                  });
                }
              }
              discoveredEntriesMap = map;
            } catch (e) {}
          }

          // Способ 2 + Способ 3: Объединяем (UNION) авто-сканирование папки music/ в браузере (Firefox 201: UTF-8 индекс / iframe)
          // И все треки из playlist.json, playlist.txt, playlist.js и кэша!
          if (!discoveredEntriesMap) {
            const candidateMap = new Map();

            // А. Авто-сканирование папки music/ (в Firefox подхватывает любые новые файлы прямо из папки без .bat!)
            const scannedMap = await this._scanMusicFolderViaBrowser();
            const hasAuthoritativeDirListing = Boolean(scannedMap);
            if (scannedMap) {
              for (const [id, item] of scannedMap.entries()) {
                candidateMap.set(id, item.filename);
              }
            }

            // Б. Добавляем кандидатов из файлов плейлиста (playlist.json, playlist.txt, playlist.js) и известных кандидатов
            for (const [id, fn] of diskPlaylistFiles.entries()) {
              if (!hasAuthoritativeDirListing || scannedMap.has(id)) {
                candidateMap.set(id, fn);
              } else {
                // Если файл прописан в playlist.json / playlist.js, всё равно проверим его через <audio> на случай неполного листинга
                candidateMap.set(id, fn);
              }
            }
            for (const [id, fn] of this._knownCandidateFilenames.entries()) {
              if (this._isAudioFilename(fn)) candidateMap.set(id, fn);
            }
            if (Array.isArray(exactCachedList)) {
              exactCachedList.forEach(fn => {
                const clean = this._extractCleanFilename(fn);
                if (this._isAudioFilename(clean)) candidateMap.set(clean.toLowerCase(), clean);
              });
            }
            for (const [id, fileObj] of persistedFilesMap.entries()) {
              if (fileObj && fileObj.name && this._isAudioFilename(fileObj.name)) {
                candidateMap.set(id, fileObj.name);
              }
            }
            for (const [id, trackObj] of this.trackMap.entries()) {
              if (trackObj && trackObj.filename) {
                candidateMap.set(id, trackObj.filename);
              }
            }

            const candidateEntries = Array.from(candidateMap.entries());
            const verifiedMap = new Map();
            const batchSize = 6;
            for (let i = 0; i < candidateEntries.length; i += batchSize) {
              const slice = candidateEntries.slice(i, i + batchSize);
              const results = await Promise.all(slice.map(async ([id, exactFn]) => {
                const check = await this._verifyTrackByFilename(exactFn);
                if (check.ok) {
                  return { ok: true, id, exactFn: check.filename, safeUrl: check.url, fileObj: null };
                }
                const existing = this.trackMap.get(id);
                if (existing && existing.source === 'drop_external' && existing.file instanceof File) {
                  return { ok: true, id, exactFn, safeUrl: '', fileObj: existing.file, source: 'drop_external' };
                }
                return { ok: false, id, exactFn };
              }));

              results.forEach(r => {
                if (r.ok) {
                  notifiedMissingSet.delete(r.id);
                  verifiedMap.set(r.id, {
                    id: r.id,
                    filename: r.exactFn,
                    name: this._cleanDisplayName(r.exactFn),
                    url: r.safeUrl,
                    source: r.source || 'music_folder',
                    file: r.fileObj || persistedFilesMap.get(r.id) || null
                  });
                } else {
                  if (diskPlaylistFiles.has(r.id) && !notifiedMissingSet.has(r.id)) {
                    previouslyActiveMap.set(r.id, r.exactFn);
                  }
                  notifiedMissingSet.add(r.id);
                }
              });
            }
            discoveredEntriesMap = verifiedMap;
          } else {
            for (const [oldId] of previouslyActiveMap.entries()) {
              if (!discoveredEntriesMap.has(oldId)) {
                notifiedMissingSet.add(oldId);
              } else {
                notifiedMissingSet.delete(oldId);
              }
            }
            for (const [newId] of discoveredEntriesMap.entries()) {
              notifiedMissingSet.delete(newId);
            }
          }

          // СВЕРКА 1: Какие треки исчезли из папки music/
          const removedNames = [];
          for (const [oldId, oldFilename] of previouslyActiveMap.entries()) {
            if (!discoveredEntriesMap.has(oldId)) {
              removedNames.push(this._cleanDisplayName(oldFilename));
              if (this.trackMap.has(oldId)) {
                this._removeTrackFromList(oldId, false);
              }
            }
          }

          // СВЕРКА 2: Какие новые музыкальные файлы появились в папке music/
          const addedNames = [];
          for (const [newId, trackObj] of discoveredEntriesMap.entries()) {
            const wasPreviouslyActive = previouslyActiveMap.has(newId);
            this._insertTrackObject(trackObj);
            if (!wasPreviouslyActive) {
              addedNames.push(trackObj.name);
            }
          }

          let playlistDiffers = (diskPlaylistFiles.size !== discoveredEntriesMap.size);
          if (!playlistDiffers) {
            for (const k of discoveredEntriesMap.keys()) {
              if (!diskPlaylistFiles.has(k)) {
                playlistDiffers = true;
                break;
              }
            }
          }

          this._hasCompletedInitialSync = true;
          this._saveNotifiedMissingSet(notifiedMissingSet);
          this._saveExactCachedFiles();
          if (removedNames.length > 0 || addedNames.length > 0 || playlistDiffers) {
            await this._writeUpdatedPlaylistFilesToDisk();
          }

          // Уведомления в Главном Меню и во время игры
          if (notify && typeof showToast === 'function') {
            if (removedNames.length === 1) {
              showToast(
                `🗑️ ТРЕК УДАЛЁН ИЗ MUSIC/: ${removedNames[0]}`,
                `Файл исчез из папки music/ и исключён из плейлиста (осталось: ${this.tracks.length})`,
                'border-amber-500 bg-slate-900/95'
              );
            } else if (removedNames.length > 1) {
              showToast(
                `🗑️ УДАЛЕНО ТРЕКОВ ИЗ MUSIC/: ${removedNames.length}`,
                `Исчезли: ${removedNames.slice(0, 3).join(', ')}${removedNames.length > 3 ? '...' : ''} (осталось: ${this.tracks.length})`,
                'border-amber-500 bg-slate-900/95'
              );
            }

            if (addedNames.length === 1) {
              showToast(
                `🎵 НОВЫЙ ТРЕК В MUSIC/: ${addedNames[0]}`,
                `Обнаружен и добавлен в плейлист (всего: ${this.tracks.length})`,
                'border-emerald-400 bg-slate-900/95'
              );
            } else if (addedNames.length > 1) {
              showToast(
                `🎵 НОВЫХ ТРЕКОВ В MUSIC/: +${addedNames.length}`,
                `Добавлены: ${addedNames.slice(0, 3).join(', ')}${addedNames.length > 3 ? '...' : ''} (всего: ${this.tracks.length})`,
                'border-emerald-400 bg-slate-900/95'
              );
            }
          }

          // АВТО-ЗАПУСК МУЗЫКИ: если музыка обнаружена (tracks.length > 0) и сейчас ничего не играет — автоматически запускаем воспроизведение!
          if (this.tracks.length > 0 && !this.isPlaybackBlocked() && (!this.isPlaying || !this.audioEl || this.audioEl.paused)) {
            this.playNextRandom(false);
          }
        } catch (e) {
        } finally {
          this.isSyncing = false;
          this.updateMusicUI();
        }
      },

      async connectMusicFolderPicker() {
        SoundFX.init();
        let connected = false;
        if (typeof window.showDirectoryPicker === 'function') {
          try {
            let handle = null;
            try {
              handle = await window.showDirectoryPicker({ mode: 'readwrite', id: 'vocaloid_music_dir' });
            } catch (e) {
              handle = await window.showDirectoryPicker({ mode: 'read', id: 'vocaloid_music_dir' });
            }
            if (handle) {
              this.dirHandle = handle;
              await this._savePersistedHandle(handle);
              await this.syncTracks(true);
              await this._writeUpdatedPlaylistFilesToDisk();
              connected = true;
              if (typeof showToast === 'function') {
                showToast(
                  '🎵 ПАПКА MUSIC/ ПОДКЛЮЧЕНА',
                  `Треков в ротации: ${this.tracks.length} • Плейлист синхронизирован`,
                  'border-cyan-400 bg-slate-900/95'
                );
              }
              if (!this.isPlaying && this.tracks.length > 0 && !this.isPlaybackBlocked()) {
                await this.playNextRandom(false);
              }
            }
          } catch (err) {}
        }

        if (!connected) {
          const inp = document.getElementById('musicFolderInput');
          if (inp) {
            inp.value = '';
            inp.click();
          }
        }
      },

      async loadUserSelectedFiles(fileList) {
        const allFiles = Array.from(fileList || []);
        const validFiles = allFiles.filter(f => this._isAudioFilename(f.name));
        const notifiedMissingSet = this._loadNotifiedMissingSet();

        const prevMap = new Map();
        const prevExact = this._loadExactCachedFiles();
        if (Array.isArray(prevExact)) {
          prevExact.forEach(fn => prevMap.set(fn.toLowerCase(), fn));
        }
        for (const [k, v] of this.trackMap.entries()) {
          prevMap.set(k, v.filename);
        }

        const newSet = new Set(validFiles.map(f => f.name.toLowerCase()));

        const removedNames = [];
        for (const [oldId, oldFn] of prevMap.entries()) {
          if (!newSet.has(oldId)) {
            removedNames.push(this._cleanDisplayName(oldFn));
            notifiedMissingSet.add(oldId);
            this._removeTrackFromList(oldId, false);
          }
        }

        const addedNames = [];
        validFiles.forEach(f => {
          const id = f.name.toLowerCase();
          const wasKnown = prevMap.has(id);
          notifiedMissingSet.delete(id);
          this._insertTrackObject({
            id,
            filename: f.name,
            name: this._cleanDisplayName(f.name),
            url: this._buildSafeMusicUrl(f.name),
            source: 'music_folder',
            file: f
          });
          if (!wasKnown) addedNames.push(this._cleanDisplayName(f.name));
        });

        this._saveNotifiedMissingSet(notifiedMissingSet);
        this._saveExactCachedFiles();
        await this._savePersistedFilesMap(validFiles);
        await this._writeUpdatedPlaylistFilesToDisk();
        this._refillQueue();

        if (typeof showToast === 'function') {
          if (removedNames.length > 0) {
            showToast(
              `🗑️ УДАЛЕНО ИЗ MUSIC/: ${removedNames.length} тр.`,
              `Удалены: ${removedNames.slice(0, 3).join(', ')}`,
              'border-amber-500 bg-slate-900/95'
            );
          }
          if (addedNames.length > 0) {
            showToast(
              `🎵 ДОБАВЛЕНО В MUSIC/: +${addedNames.length} тр.`,
              `Новые: ${addedNames.slice(0, 3).join(', ')} (всего: ${this.tracks.length})`,
              'border-emerald-400 bg-slate-900/95'
            );
          } else if (removedNames.length === 0) {
            showToast(
              '🎵 ПАПКА MUSIC/ СИНХРОНИЗИРОВАНА',
              `Активно треков в случайной ротации: ${this.tracks.length}`,
              'border-cyan-400 bg-slate-900/95'
            );
          }
        }

        this.updateMusicUI();
        if (!this.isPlaybackBlocked() && this.tracks.length > 0 && (!this.isPlaying || !this.audioEl || this.audioEl.paused)) {
          await this.playNextRandom(false);
        }
      },

      _refillQueue() {
        if (this.tracks.length === 0) {
          this.shuffledQueue = [];
          return;
        }
        const arr = [...this.tracks];
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        if (arr.length > 1 && arr[arr.length - 1].id === this.currentTrackId) {
          const swapIdx = Math.floor(Math.random() * (arr.length - 1));
          [arr[arr.length - 1], arr[swapIdx]] = [arr[swapIdx], arr[arr.length - 1]];
        }
        this.shuffledQueue = arr;
      },

      async _resolveTrackPlayableUrl(track) {
        if (this.activeBlobUrl) {
          try { URL.revokeObjectURL(this.activeBlobUrl); } catch (e) {}
          this.activeBlobUrl = null;
        }
        if (track.entry && typeof track.entry.getFile === 'function') {
          try {
            const file = await track.entry.getFile();
            this.activeBlobUrl = URL.createObjectURL(file);
            return this.activeBlobUrl;
          } catch (err) {
            return null;
          }
        }
        const check = await this._verifyTrackByFilename(track.filename || track.url);
        if (check.ok) {
          track.url = check.url;
          return check.url;
        }
        if (track.source !== 'drop_external' && track.url) {
          return null;
        }
        if (track.file instanceof File) {
          try {
            this.activeBlobUrl = URL.createObjectURL(track.file);
            return this.activeBlobUrl;
          } catch (err) {
            return null;
          }
        }
        return null;
      },

      async playNextRandom(checkFolderFirst = true) {
        if (window.IS_MOBILE_BUILD) return;
        if (checkFolderFirst) {
          await this.syncTracks(true);
        }

        if (this.tracks.length === 0) {
          this.isPlaying = false;
          this.currentTrackId = null;
          this.currentTrackName = '';
          this.updateMusicUI();
          return;
        }

        if (!this.audioEl) {
          this.audioEl = new Audio();
          this.audioEl.volume = this.volume;
          this.audioEl.addEventListener('ended', async () => {
            await this.syncTracks(true);
            if (!this.isPlaybackBlocked()) {
              await this.playNextRandom(false);
            }
          });
        }

        let attempts = 0;
        const maxAttempts = this.tracks.length + 2;
        while (attempts < maxAttempts && this.tracks.length > 0) {
          attempts++;
          if (this.shuffledQueue.length === 0) {
            this._refillQueue();
          }
          const nextTrack = this.shuffledQueue.pop();
          if (!nextTrack || !this.trackMap.has(nextTrack.id)) continue;

          const playableUrl = await this._resolveTrackPlayableUrl(nextTrack);
          if (!playableUrl) {
            const missingSet = this._loadNotifiedMissingSet();
            missingSet.add(nextTrack.id);
            this._saveNotifiedMissingSet(missingSet);
            this._removeTrackFromList(nextTrack.id, true);
            this._saveExactCachedFiles();
            await this._writeUpdatedPlaylistFilesToDisk();
            continue;
          }

          this.currentTrackId = nextTrack.id;
          this.currentTrackName = nextTrack.name;
          this.audioEl.src = playableUrl;
          this.audioEl.volume = SoundFX.muted ? 0 : this.volume;

          if (this.isPlaybackBlocked()) {
            try { this.audioEl.pause(); } catch (e) {}
            this.isPlaying = false;
            this.updateMusicUI();
            return;
          }

          try {
            await this.audioEl.play();
            this.isPlaying = true;
            this.updateMusicUI();
            return;
          } catch (playErr) {
            this.isPlaying = false;
            this.updateMusicUI();
            return;
          }
        }

        this.isPlaying = false;
        this.currentTrackId = null;
        this.currentTrackName = '';
        this.updateMusicUI();
      },

      syncPlaybackState() {
        if (!this.audioEl || window.IS_MOBILE_BUILD) return;
        if (this.isPlaybackBlocked()) {
          if (!this.audioEl.paused) {
            try { this.audioEl.pause(); } catch (e) {}
          }
          this.isPlaying = false;
          this.updateMusicUI();
        } else {
          this.startIfReady();
        }
      },

      startIfReady() {
        if (window.IS_MOBILE_BUILD) return;
        this.init().then(() => {
          if (this.isPlaybackBlocked() || this.tracks.length === 0) {
            this.updateMusicUI();
            return;
          }
          if (!this.isPlaying || (this.audioEl && this.audioEl.paused)) {
            if (this.audioEl && this.audioEl.src && this.currentTrackId && this.trackMap.has(this.currentTrackId)) {
              this.audioEl.volume = this.volume;
              this.audioEl.play().then(() => {
                this.isPlaying = true;
                this.updateMusicUI();
              }).catch(() => {
                this.playNextRandom(false);
              });
            } else {
              this.playNextRandom(false);
            }
          }
        });
      },

      setMuted(muted) {
        SoundFX.muted = Boolean(muted);
        this.syncPlaybackState();
      },

      setGamePaused(paused) {
        this.isGamePaused = Boolean(paused);
        this.syncPlaybackState();
      },

      updateMusicUI() {
        const labels = [
          document.getElementById('musicTrackStatusLabel'),
          document.getElementById('hudMusicTrackLabel')
        ];
        const pausedSuffix = (this.currentTrackName && this.isPlaybackBlocked()) ? ' [ПАУЗА]' : '';
        const statusText = this.tracks.length === 0
          ? '🎵 Папка music/: пусто (0 тр.)'
          : (this.currentTrackName
              ? `🎵 ${this.currentTrackName}${pausedSuffix} (${this.tracks.length} тр.)`
              : `🎵 В списке music/: ${this.tracks.length} тр.`);
        labels.forEach(el => {
          if (el) el.textContent = statusText;
        });
      }
    };

    // Авто-запуск фоновой музыки (если были обнаружены треки, но ничего не играет) при любом взаимодействии с окном
    ['pointerdown', 'mousedown', 'keydown', 'click', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, () => {
        if (typeof MusicPlayer !== 'undefined' && !window.IS_MOBILE_BUILD) {
          MusicPlayer.tryRestoreSavedHandlePermissionOnGesture();
          if (MusicPlayer.tracks.length > 0 && (!MusicPlayer.isPlaying || !MusicPlayer.audioEl || MusicPlayer.audioEl.paused) && !MusicPlayer.isPlaybackBlocked()) {
            MusicPlayer.startIfReady();
          }
        }
      }, { passive: true, capture: true });
    });
