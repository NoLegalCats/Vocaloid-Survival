// =========================================================================
    // 18. START, PAUSE, & UI INITIALIZATION
    // =========================================================================
    let animFrameId = null;

    function startNewRun() {
      SoundFX.init();
      const skin = SKINS[selectedSkinId];

      state.running = true;
      state.paused = false;
      state.timeElapsed = 0;
      state.maxDistanceMeters = 0;
      state.currentKmTier = 0;
      state.nextBossMeters = 1000;
      state.screenShake = 0;
      state.level = 1;
      state.freeBossLevels = 0;
      state.xp = 0;
      state.xpNeeded = calcXpForLevel(1);
      state.kills = 0;
      state.rerolls = skin.startRerolls || 5;

      state.weapons = {};
      state.abilities = {};
      state.zombies = [];
      state.enemyProjectiles = [];
      state.bullets = [];
      state.xpParticles = [];
      state.shellCasings = [];
      state.scorchMarks = [];
      state.visualEffects = [];
      state.damageNumbers = [];
      state.acidPools = [];
      state.turrets = [];
      state.plushPets = [];
      state.orbitDrones = [];
      state.spinningLeeks = [];
      state.rotatingBeams = [];
      state.streetDecals = [];
      state.streetObstacles = [];
      state.generatedChunks = new Set();
      state.boss = null;

      const gameCanvas = document.getElementById('gameCanvas');
      resizeCanvas();

      state.player.x = gameCanvas.width / 2;
      state.player.y = 0;
      state.player.maxHp = 200;
      state.player.hp = 200;
      state.player.pickupRadius = 90;
      state.player.invulnTimer = 0;
      state.player.shieldTimer = 0;
      state.player.overdriveTimer = 0;
      state.cameraY = state.player.y - gameCanvas.height * 0.65;

      const badge = document.getElementById('hudSkinBadge');
      badge.textContent = skin.shortName;
      badge.className = `px-2 py-0.5 rounded text-[11px] font-extrabold shadow ${skin.badgeClass}`;

      const startRoll = { rarity: RARITIES[0], dmgPoints: 0, areaPoints: 0, cdPoints: 0 };
      applyWeaponUpgrade('pistol', startRoll, true);

      // Miku starts with Legendary Magnet (Level 6 Legendary Magnet ability)
      if (skin.startsWithLegendaryMagnet) {
        const legendaryMagnetRoll = {
          rarity: RARITIES[3],
          dmgPoints: 2,
          areaPoints: 2,
          cdPoints: 2,
          pickedList: ['dmg', 'area', 'cd'],
          fixedCdItem: false
        };
        applyAbilityUpgrade('magnet_pulse', legendaryMagnetRoll, true);
      }
      updateRerollButtonUI();

      document.getElementById('startModal').classList.add('hidden');
      document.getElementById('endModal').classList.add('hidden');
      document.getElementById('bossHudContainer').classList.add('hidden');
      document.getElementById('hudHeader').classList.remove('hidden');
      document.getElementById('controlsHint').classList.remove('hidden');
      document.getElementById('bottomUpgradeFeed').innerHTML = '';

      resizeCanvas();
      updateInventoryStripUI();
      updateHudDOM();
      triggerCutin(skin.cutinImgId, `${skin.name}: «Выходим на бесконечную улицу зомби!»`);

      ensureProceduralStreetChunks(gameCanvas.width, gameCanvas.height);
      spawnZombieWave(gameCanvas.width, gameCanvas.height);
      spawnZombieWave(gameCanvas.width, gameCanvas.height);

      if (animFrameId) cancelAnimationFrame(animFrameId);
      state.lastTimestamp = performance.now();
      animFrameId = requestAnimationFrame(gameLoop);
    }

    function finishGame() {
      state.paused = true;
      const modal = document.getElementById('endModal');
      SoundFX.playBoom(0.4, 0.1);

      const counts = getTotalItemsCount();
      const kmPassed = +(state.maxDistanceMeters / 1000).toFixed(2);
      const metersPassed = Math.round(state.maxDistanceMeters);
      const totalUpgrades = Math.max(1, counts.total);
      const rawScore = (state.kills * metersPassed * state.level) / totalUpgrades;
      const finalScore = Math.round(rawScore);

      const scoreEl = document.getElementById('statFinalScore');
      const formulaEl = document.getElementById('statScoreFormula');
      if (scoreEl) scoreEl.textContent = finalScore.toLocaleString('ru-RU');
      if (formulaEl) {
        formulaEl.textContent = `(${state.kills} зомби × ${metersPassed} м × ${state.level} ур.) / ${totalUpgrades} улучш. = ${rawScore.toFixed(1)}`;
      }

      document.getElementById('statDistance').textContent = `${kmPassed} км (${state.maxDistanceMeters} м)`;
      document.getElementById('statLevel').textContent = `${state.level}`;
      document.getElementById('statKills').textContent = `${state.kills}`;
      document.getElementById('statItems').textContent = `${totalUpgrades}`;

      const buildList = document.getElementById('endBuildList');
      buildList.innerHTML = '';
      const sortedEndItems = [
        ...Object.values(state.weapons).map(w => ({ kind: 'weapon', item: w })),
        ...Object.values(state.abilities).map(a => ({ kind: 'ability', item: a }))
      ].sort((a, b) => b.item.level - a.item.level);

      sortedEndItems.forEach(({ kind, item }) => {
        const theme = getItemLevelColorTheme(item.level);
        const stats = kind === 'weapon' ? getWeaponStats(item) : getAbilityStats(item);
        const el = document.createElement('span');
        el.className = `px-2 py-1 rounded border text-[11px] font-bold ${theme.containerCls} ${theme.textCls}`;
        el.textContent = `${item.def.icon} ${item.def.name} (Ур.${item.level} | Обл.×${stats.areaScale.toFixed(1)})`;
        buildList.appendChild(el);
      });

      modal.classList.remove('hidden');
    }

    function gameLoop(timestamp) {
      const dt = Math.min(0.05, Math.max(0.001, (timestamp - state.lastTimestamp) / 1000));
      state.lastTimestamp = timestamp;

      try {
        const gameCanvas = document.getElementById('gameCanvas');
        const ctx = gameCanvas.getContext('2d');

        updateGame(dt, gameCanvas.width, gameCanvas.height);
        if (state.running && !state.paused && state.player.hp <= 0) {
          finishGame();
        }
        renderGame(ctx, gameCanvas.width, gameCanvas.height);
        renderCutinBanner();
      } catch (err) {
        console.error('Game loop error recovered:', err);
      }

      if (state.running) {
        animFrameId = requestAnimationFrame(gameLoop);
      }
    }

    function resizeCanvas() {
      const gameCanvas = document.getElementById('gameCanvas');
      if (!gameCanvas) return;
      const parent = gameCanvas.parentElement;
      gameCanvas.width = parent.clientWidth || window.innerWidth;
      gameCanvas.height = parent.clientHeight || window.innerHeight;
    }

    function populateArsenalCatalog() {
      const wGrid = document.getElementById('catalogWeaponsGrid');
      const aGrid = document.getElementById('catalogAbilitiesGrid');
      wGrid.innerHTML = '';
      aGrid.innerHTML = '';

      WEAPONS_POOL.forEach((w, idx) => {
        const freqMeta = getItemDropFrequencyMeta(w.id);
        const div = document.createElement('div');
        div.className = 'p-3 rounded-xl bg-slate-950 border border-amber-500/40 flex flex-col justify-between gap-1 overflow-hidden min-w-0';
        div.innerHTML = `
          <div class="relative w-full h-24 rounded-lg overflow-hidden border border-amber-500/40 mb-1 bg-slate-900">
            <img src="${(document.getElementById('imgArt_' + w.id) || {}).src || ''}" alt="${w.name}" class="w-full h-full object-cover" />
          </div>
          <div class="flex items-center justify-between gap-1 flex-wrap">
            <span class="text-xs font-black text-amber-300 break-words">#${idx + 1}. ${w.icon} ${w.name}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded border font-bold ${freqMeta.cls}">🎲 ${freqMeta.label}</span>
          </div>
          <p class="text-[11px] text-slate-300 leading-snug">${w.desc}</p>
          <div class="text-[10px] text-amber-200/90 pt-1 border-t border-slate-800 space-y-0.5">
            <div class="font-bold text-slate-400">Прокачиваемые статы (Редкости):</div>
            <div>• ${(ITEM_CUSTOM_STATS[w.id] || [])[0]}</div>
            <div>• ${(ITEM_CUSTOM_STATS[w.id] || [])[1]}</div>
            <div>• ${(ITEM_CUSTOM_STATS[w.id] || [])[2]}</div>
          </div>
        `;
        wGrid.appendChild(div);
      });

      ABILITIES_POOL.forEach((a, idx) => {
        const freqMeta = getItemDropFrequencyMeta(a.id);
        const div = document.createElement('div');
        div.className = 'p-3 rounded-xl bg-slate-950 border border-cyan-500/40 flex flex-col justify-between gap-1 overflow-hidden min-w-0';
        div.innerHTML = `
          <div class="relative w-full h-24 rounded-lg overflow-hidden border border-cyan-500/40 mb-1 bg-slate-900">
            <img src="${(document.getElementById('imgArt_' + a.id) || {}).src || ''}" alt="${a.name}" class="w-full h-full object-cover" />
          </div>
          <div class="flex items-center justify-between gap-1 flex-wrap">
            <span class="text-xs font-black text-cyan-300 break-words">#${idx + 1}. ${a.icon} ${a.name}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded border font-bold ${freqMeta.cls}">🎲 ${freqMeta.label}</span>
          </div>
          <p class="text-[11px] text-slate-300 leading-snug">${a.desc}</p>
          <div class="text-[10px] text-cyan-200/90 pt-1 border-t border-slate-800 space-y-0.5">
            <div class="font-bold text-slate-400">Прокачиваемые статы (Редкости):</div>
            <div>• ${(ITEM_CUSTOM_STATS[a.id] || [])[0]}</div>
            <div>• ${(ITEM_CUSTOM_STATS[a.id] || [])[1]}</div>
            <div>• ${(ITEM_CUSTOM_STATS[a.id] || [])[2]}</div>
          </div>
        `;
        aGrid.appendChild(div);
      });
    }

    let startPreviewLoopId = null;
    function renderStartScreenPreviews() {
      const skins = [
        { id: 'teto', canvasId: 'previewTeto', phase: 0.0 },
        { id: 'miku', canvasId: 'previewMiku', phase: 1.3 },
        { id: 'neru', canvasId: 'previewNeru', phase: 2.6 }
      ];
      const menuWalk = (performance.now() / 1000) * 1.45;
      skins.forEach(({ id, canvasId, phase }) => {
        const c = document.getElementById(canvasId);
        if (!c) return;
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, c.width, c.height);
        drawPixelHeroine(ctx, c.width / 2, c.height / 2 + 6, id, menuWalk + phase * 0.3, 1.15, phase);
      });
      if (!startPreviewLoopId) {
        startPreviewLoopId = setInterval(() => {
          if (typeof state === 'undefined' || !state.running) {
            renderStartScreenPreviews();
          }
        }, 90);
      }
    }

    window.onload = () => {
      setupHighResImageFallbacks();
      loadExternalBalanceJson();
      resizeCanvas();
      generateAll30UniqueItemArts();
      populateArsenalCatalog();
      renderStartScreenPreviews();

      window.addEventListener('resize', resizeCanvas);

      window.addEventListener('keydown', e => {
        keys[e.code] = true;
      });
      window.addEventListener('keyup', e => {
        keys[e.code] = false;
      });

      const gameCanvas = document.getElementById('gameCanvas');
      const updatePointerPos = (clientX, clientY) => {
        const rect = gameCanvas.getBoundingClientRect();
        pointer.x = clientX - rect.left;
        pointer.y = clientY - rect.top;
      };

      gameCanvas.addEventListener('mousedown', e => {
        SoundFX.init();
        pointer.active = true;
        updatePointerPos(e.clientX, e.clientY);
      });
      window.addEventListener('mousemove', e => {
        updatePointerPos(e.clientX, e.clientY);
      });
      window.addEventListener('mouseup', () => {
        pointer.active = false;
      });

      gameCanvas.addEventListener('touchstart', e => {
        SoundFX.init();
        if (e.touches.length > 0) {
          pointer.active = true;
          updatePointerPos(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });
      gameCanvas.addEventListener('touchmove', e => {
        if (pointer.active && e.touches.length > 0) {
          updatePointerPos(e.touches[0].clientX, e.touches[0].clientY);
        }
      }, { passive: true });
      window.addEventListener('touchend', () => {
        pointer.active = false;
      });

      const skinCards = document.querySelectorAll('.skin-card');
      skinCards.forEach(card => {
        card.addEventListener('click', () => {
          SoundFX.init();
          SoundFX.playXpDing(1.2);
          selectedSkinId = card.dataset.skin;
          skinCards.forEach(c => {
            const isSel = c.dataset.skin === selectedSkinId;
            c.classList.toggle('border-rose-500', isSel && selectedSkinId === 'teto');
            c.classList.toggle('border-cyan-400', isSel && selectedSkinId === 'miku');
            c.classList.toggle('border-amber-400', isSel && selectedSkinId === 'neru');
            c.classList.toggle('border-slate-700', !isSel);
            const badgeEl = c.querySelector('.skin-badge');
            if (badgeEl) badgeEl.classList.toggle('hidden', !isSel);
          });
        });
      });

      const btnMouseAim = document.getElementById('btnMouseAim');
      if (btnMouseAim) {
        btnMouseAim.addEventListener('click', () => {
          mouseAimEnabled = !mouseAimEnabled;
          btnMouseAim.textContent = mouseAimEnabled ? '🎯 Прицел мышкой: ВКЛ' : '🎯 Прицел мышкой: ВЫКЛ';
          btnMouseAim.className = mouseAimEnabled
            ? 'px-2 py-1 rounded text-[10px] font-bold bg-cyan-800/80 hover:bg-cyan-700 text-white border border-cyan-400 transition'
            : 'px-2 py-1 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition';
        });
      }

      const btnAutoMarch = document.getElementById('btnAutoMarch');
      if (btnAutoMarch) {
        btnAutoMarch.addEventListener('click', () => {
          autoMarchEnabled = !autoMarchEnabled;
          btnAutoMarch.textContent = autoMarchEnabled ? '⬆️ Авто-ход: ВКЛ' : '⬆️ Авто-ход: ВЫКЛ';
          btnAutoMarch.className = autoMarchEnabled
            ? 'px-2 py-1 rounded text-[10px] font-bold bg-emerald-700/80 hover:bg-emerald-600 text-white border border-emerald-500 transition'
            : 'px-2 py-1 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition';
        });
      }

      document.getElementById('btnStartGame').addEventListener('click', () => {
        startNewRun();
      });

      const btnRerollChoices = document.getElementById('btnRerollChoices');
      if (btnRerollChoices) {
        btnRerollChoices.addEventListener('click', () => {
          if (state.rerolls <= 0) return;
          state.rerolls--;
          SoundFX.playXpDing(1.35);
          renderLevelUpChoiceCards();
          updateHudDOM();
        });
      }

      const btnDropMode = document.getElementById('btnDropMode');
      btnDropMode.addEventListener('click', () => {
        randomDropMode = !randomDropMode;
        btnDropMode.textContent = randomDropMode ? '🎲 Дроп: Авто' : '🃏 Дроп: Выбор';
        btnDropMode.className = randomDropMode
          ? 'px-2 py-1 rounded text-[10px] font-bold bg-indigo-700/80 hover:bg-indigo-600 text-white border border-indigo-400 transition'
          : 'px-2 py-1 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition';
        updateHudDOM();
      });

      const catalogModal = document.getElementById('catalogModal');
      let wasPausedBeforeCatalog = false;
      document.getElementById('btnShowCatalogStart').addEventListener('click', () => {
        catalogModal.classList.remove('hidden');
      });
      document.getElementById('btnOpenArsenalDuringGame').addEventListener('click', () => {
        wasPausedBeforeCatalog = state.paused;
        state.paused = true;
        catalogModal.classList.remove('hidden');
      });
      document.getElementById('btnCloseCatalog').addEventListener('click', () => {
        catalogModal.classList.add('hidden');
        if (state.running && !wasPausedBeforeCatalog) {
          state.paused = false;
          state.lastTimestamp = performance.now();
        }
      });

      const btnSoundToggle = document.getElementById('btnSoundToggle');
      btnSoundToggle.addEventListener('click', () => {
        SoundFX.muted = !SoundFX.muted;
        btnSoundToggle.textContent = SoundFX.muted ? '🔇 Без звука' : '🔊 Звук';
      });

      const btnPauseGame = document.getElementById('btnPauseGame');
      btnPauseGame.addEventListener('click', () => {
        if (!state.running) return;
        state.paused = !state.paused;
        btnPauseGame.textContent = state.paused ? '▶️' : '⏸️';
        if (!state.paused) state.lastTimestamp = performance.now();
      });

      document.getElementById('btnContinueEndless').addEventListener('click', () => {
        document.getElementById('endModal').classList.add('hidden');
        state.paused = false;
        state.lastTimestamp = performance.now();
      });
      function saveEndStatsAsScreenshot() {
        const counts = getTotalItemsCount();
        const kmPassed = +(state.maxDistanceMeters / 1000).toFixed(2);
        const metersPassed = Math.round(state.maxDistanceMeters);
        const totalUpgrades = Math.max(1, counts.total);
        const rawScore = (state.kills * metersPassed * state.level) / totalUpgrades;
        const finalScore = Math.round(rawScore);
        const skin = SKINS[selectedSkinId] || SKINS.teto;

        const sortedEndItems = [
          ...Object.values(state.weapons).map(w => ({ kind: 'weapon', item: w })),
          ...Object.values(state.abilities).map(a => ({ kind: 'ability', item: a }))
        ].sort((a, b) => b.item.level - a.item.level);

        const cols = 3;
        const itemRows = Math.ceil(sortedEndItems.length / cols);
        const canvasW = 920;
        const canvasH = Math.max(540, 390 + itemRows * 46 + 40);

        const shotCanvas = document.createElement('canvas');
        shotCanvas.width = canvasW;
        shotCanvas.height = canvasH;
        const sctx = shotCanvas.getContext('2d');

        // Background gradient
        const bgGrad = sctx.createLinearGradient(0, 0, canvasW, canvasH);
        bgGrad.addColorStop(0, '#020617');
        bgGrad.addColorStop(0.5, '#0f172a');
        bgGrad.addColorStop(1, '#1e1b4b');
        sctx.fillStyle = bgGrad;
        sctx.fillRect(0, 0, canvasW, canvasH);

        // Outer neon border
        sctx.strokeStyle = '#f43f5e';
        sctx.lineWidth = 4;
        sctx.strokeRect(8, 8, canvasW - 16, canvasH - 16);

        // Header Title & Heroine Sprite
        drawPixelHeroine(sctx, 68, 66, selectedSkinId, 0, 2.0);
        sctx.fillStyle = '#f43f5e';
        sctx.font = '900 13px Inter, sans-serif';
        sctx.fillText('VOCALOID SURVIVORS: УЛИЦА ЗОМБИ — ИТОГОВАЯ СТАТИСТИКА ЗАБЕГА', 120, 44);
        sctx.fillStyle = '#ffffff';
        sctx.font = '900 26px Inter, sans-serif';
        const mins = String(Math.floor(state.timeElapsed / 60)).padStart(2, '0');
        const secs = String(Math.floor(state.timeElapsed % 60)).padStart(2, '0');
        sctx.fillText(`Героиня: ${skin.name} • Время: ${mins}:${secs}`, 120, 78);
        sctx.fillStyle = '#94a3b8';
        sctx.font = '600 13px Inter, sans-serif';
        sctx.fillText(`Боссов побеждено: ${state.currentKmTier} • Макс. HP: ${state.player.maxHp} • Рероллов осталось: ${state.rerolls}`, 120, 102);

        // Score Box
        sctx.fillStyle = 'rgba(69, 26, 3, 0.85)';
        sctx.strokeStyle = '#fbbf24';
        sctx.lineWidth = 2.5;
        sctx.fillRect(32, 124, canvasW - 64, 96);
        sctx.strokeRect(32, 124, canvasW - 64, 96);

        sctx.textAlign = 'center';
        sctx.fillStyle = '#fcd34d';
        sctx.font = '900 13px Inter, sans-serif';
        sctx.fillText('🏆 ИТОГОВЫЕ ОЧКИ ЗАБЕГА', canvasW / 2, 150);
        sctx.fillStyle = '#ffffff';
        sctx.font = '900 36px Inter, sans-serif';
        sctx.fillText(finalScore.toLocaleString('ru-RU'), canvasW / 2, 188);
        sctx.fillStyle = '#cbd5e1';
        sctx.font = '600 12px monospace';
        sctx.fillText(`(${state.kills} зомби × ${metersPassed} м × ${state.level} ур.) / ${totalUpgrades} улучш. = ${rawScore.toFixed(1)}`, canvasW / 2, 209);

        // 4 Stat Cards
        const statBoxes = [
          { label: 'ПРОЙДЕНО КМ', val: `${kmPassed} км (${state.maxDistanceMeters} м)`, col: '#fbbf24' },
          { label: 'УРОВЕНЬ ИГРОКА', val: `${state.level}`, col: '#34d399' },
          { label: 'ЗОМБИ УБИТО', val: `${state.kills}`, col: '#a3e635' },
          { label: 'УЛУЧШЕНИЙ', val: `${totalUpgrades}`, col: '#38bdf8' }
        ];
        const boxW = (canvasW - 64 - 36) / 4;
        statBoxes.forEach((b, idx) => {
          const bx = 32 + idx * (boxW + 12);
          const by = 236;
          sctx.fillStyle = '#090d16';
          sctx.strokeStyle = '#334155';
          sctx.lineWidth = 1.5;
          sctx.fillRect(bx, by, boxW, 68);
          sctx.strokeRect(bx, by, boxW, 68);
          sctx.fillStyle = '#94a3b8';
          sctx.font = '700 11px Inter, sans-serif';
          sctx.fillText(b.label, bx + boxW / 2, by + 24);
          sctx.fillStyle = b.col;
          sctx.font = '900 18px Inter, sans-serif';
          sctx.fillText(b.val, bx + boxW / 2, by + 50);
        });

        // Build Arsenal Header
        sctx.textAlign = 'left';
        sctx.fillStyle = '#e2e8f0';
        sctx.font = '800 14px Inter, sans-serif';
        sctx.fillText(`Собранный арсенал (${sortedEndItems.length} предм.):`, 32, 332);

        const itemW = (canvasW - 64 - 24) / cols;
        sortedEndItems.forEach(({ item }, idx) => {
          const colIdx = idx % cols;
          const rowIdx = Math.floor(idx / cols);
          const ix = 32 + colIdx * (itemW + 12);
          const iy = 346 + rowIdx * 44;
          const theme = getItemLevelColorTheme(item.level);

          sctx.fillStyle = theme.hexBg || '#1e293b';
          sctx.strokeStyle = theme.hexBorder || '#64748b';
          sctx.lineWidth = 2;
          sctx.fillRect(ix, iy, itemW, 36);
          sctx.strokeRect(ix, iy, itemW, 36);

          sctx.fillStyle = theme.hexText || '#ffffff';
          sctx.font = '700 12px Inter, sans-serif';
          const titleStr = `${item.def.icon} ${item.def.name}`;
          sctx.fillText(titleStr.length > 25 ? titleStr.slice(0, 24) + '…' : titleStr, ix + 10, iy + 22);

          sctx.textAlign = 'right';
          sctx.font = '900 12px Inter, sans-serif';
          sctx.fillText(`Ур.${item.level}`, ix + itemW - 10, iy + 22);
          sctx.textAlign = 'left';
        });

        const dataUrl = shotCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `vocaloid_survivors_score_${finalScore}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      const btnSaveStatsScreenshot = document.getElementById('btnSaveStatsScreenshot');
      if (btnSaveStatsScreenshot) {
        btnSaveStatsScreenshot.addEventListener('click', () => {
          saveEndStatsAsScreenshot();
        });
      }

      document.getElementById('btnRestartGame').addEventListener('click', () => {
        state.running = false;
        document.getElementById('endModal').classList.add('hidden');
        document.getElementById('hudHeader').classList.add('hidden');
        document.getElementById('startModal').classList.remove('hidden');
        renderStartScreenPreviews();
      });
    };
