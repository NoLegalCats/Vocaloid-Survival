// =========================================================================
    // 18. START, PAUSE, & UI INITIALIZATION
    // =========================================================================
    let animFrameId = null;


    // Автоматический Drag-and-Drop аудиофайлов или всей папки music/ прямо на экран игры во время боя!
    async function handleDroppedAudioEntries(itemsOrFiles) {
      const audioFiles = [];
      const traverseEntry = async (entry) => {
        if (!entry) return;
        if (entry.isFile) {
          const f = await new Promise(res => entry.file(res, () => res(null)));
          if (f && /\.(mp3|wav|ogg|oga|opus|flac|m4a|aac|mp4|webm|weba|wma|mka|ape|wv)$/i.test(f.name)) {
            audioFiles.push(f);
          }
        } else if (entry.isDirectory) {
          const reader = entry.createReader();
          const readAllBatch = async () => {
            const batch = await new Promise(res => reader.readEntries(res, () => res([])));
            if (batch.length > 0) {
              for (const child of batch) await traverseEntry(child);
              await readAllBatch();
            }
          };
          await readAllBatch();
        }
      };

      for (const item of itemsOrFiles) {
        if (item.webkitGetAsEntry) {
          const entry = item.webkitGetAsEntry();
          if (entry) await traverseEntry(entry);
          else if (item.kind === 'file') {
            const f = item.getAsFile();
            if (f && /\.(mp3|wav|ogg|oga|opus|flac|m4a|aac|mp4|webm|weba|wma|mka|ape|wv)$/i.test(f.name)) audioFiles.push(f);
          }
        } else if (item instanceof File) {
          if (/\.(mp3|wav|ogg|oga|opus|flac|m4a|aac|mp4|webm|weba|wma|mka|ape|wv)$/i.test(item.name)) audioFiles.push(item);
        }
      }

      if (audioFiles.length > 0 && typeof MusicPlayer !== 'undefined') {
        MusicPlayer.loadUserSelectedFiles(audioFiles);
      }
    }

    function startNewRun() {
      SoundFX.init();
      if (typeof MusicPlayer !== 'undefined') {
        MusicPlayer.setGamePaused(false);
        MusicPlayer.startIfReady();
      }
      const btnPauseEl = document.getElementById('btnPauseGame');
      if (btnPauseEl) btnPauseEl.textContent = '⏸️';
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
      state.pendingBossRewardTimer = 0;
      state.player.burnTimer = 0;
      state.banishedItems = new Set();
      state.lastWarnedBossMeters = 0;
      state.player.dashCdTimer = 0;
      state.player.dashMaxCd = 10.0;
      state.player.dashActiveTimer = 0;
      state.player.lastMoveDirX = 0;
      state.player.lastMoveDirY = -1;
      state.cameraY = state.player.y - gameCanvas.height * 0.65;
      // Зона ограничения на старте спавнится ровно внизу стартового экрана!
      state.startBottomLimitY = Math.round(gameCanvas.height * 0.35) - 34;
      if (typeof populateArsenalCatalog === 'function') populateArsenalCatalog();

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

      const customBanner = document.getElementById('endCustomProfileBanner');
      const isCustom = !!(window.IS_CUSTOM_CONFIG_ACTIVE || state.isCustomConfig);
      const profName = window.ACTIVE_CONFIG_PROFILE_NAME || state.activeConfigProfile || 'Кастом';
      if (customBanner) {
        if (isCustom && profName !== 'Стандарт') {
          customBanner.textContent = `КАСТОМ: ${profName}`;
          customBanner.classList.remove('hidden');
        } else {
          customBanner.classList.add('hidden');
        }
      }

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
      if (!wGrid || !aGrid) return;
      wGrid.innerHTML = '';
      aGrid.innerHTML = '';
      const banished = (typeof state !== 'undefined' && state.banishedItems) ? state.banishedItems : new Set();

      WEAPONS_POOL.forEach((w, idx) => {
        const isBanished = banished.has(w.id);
        const freqMeta = getItemDropFrequencyMeta(w.id);
        const div = document.createElement('div');
        div.className = isBanished
          ? 'p-3 rounded-xl bg-slate-950 border-2 border-red-600/80 opacity-65 flex flex-col justify-between gap-1 overflow-hidden min-w-0'
          : 'p-3 rounded-xl bg-slate-950 border border-amber-500/40 flex flex-col justify-between gap-1 overflow-hidden min-w-0';
        div.innerHTML = `
          <div class="relative w-full h-24 rounded-lg overflow-hidden border ${isBanished ? 'border-red-600 grayscale' : 'border-amber-500/40'} mb-1 bg-slate-900">
            <img src="${(document.getElementById('imgArt_' + w.id) || {}).src || ''}" alt="${w.name}" class="w-full h-full object-cover" />
            ${isBanished ? `<div class="absolute inset-0 bg-red-950/80 flex items-center justify-center"><span class="px-2 py-0.5 rounded bg-red-600 text-white font-black text-[10px] uppercase">🚫 ЗАБЛОКИРОВАНО</span></div>` : ''}
          </div>
          <div class="flex items-center justify-between gap-1 flex-wrap">
            <span class="text-xs font-black ${isBanished ? 'text-red-300 line-through' : 'text-amber-300'} break-words">#${idx + 1}. ${w.icon} ${w.name}</span>
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
        const isBanished = banished.has(a.id);
        const freqMeta = getItemDropFrequencyMeta(a.id);
        const div = document.createElement('div');
        div.className = isBanished
          ? 'p-3 rounded-xl bg-slate-950 border-2 border-red-600/80 opacity-65 flex flex-col justify-between gap-1 overflow-hidden min-w-0'
          : 'p-3 rounded-xl bg-slate-950 border border-cyan-500/40 flex flex-col justify-between gap-1 overflow-hidden min-w-0';
        div.innerHTML = `
          <div class="relative w-full h-24 rounded-lg overflow-hidden border ${isBanished ? 'border-red-600 grayscale' : 'border-cyan-500/40'} mb-1 bg-slate-900">
            <img src="${(document.getElementById('imgArt_' + a.id) || {}).src || ''}" alt="${a.name}" class="w-full h-full object-cover" />
            ${isBanished ? `<div class="absolute inset-0 bg-red-950/80 flex items-center justify-center"><span class="px-2 py-0.5 rounded bg-red-600 text-white font-black text-[10px] uppercase">🚫 ЗАБЛОКИРОВАНО</span></div>` : ''}
          </div>
          <div class="flex items-center justify-between gap-1 flex-wrap">
            <span class="text-xs font-black ${isBanished ? 'text-red-300 line-through' : 'text-cyan-300'} break-words">#${idx + 1}. ${a.icon} ${a.name}</span>
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


    // =========================================================================
    // 19. DYNAMIC CUSTOM CONFIG EDITOR, VALIDATOR & VFX OPACITY SLIDER
    // =========================================================================
    function syncVfxOpacitySliders(pctValue) {
      const clamped = Math.max(5, Math.min(100, Math.round(Number(pctValue) || 75)));
      state.playerVfxOpacity = clamped / 100;
      const s1 = document.getElementById('vfxOpacitySlider');
      const l1 = document.getElementById('vfxOpacityLabel');
      const s2 = document.getElementById('vfxOpacitySliderStart');
      const l2 = document.getElementById('vfxOpacityLabelStart');
      if (s1 && Number(s1.value) !== clamped) s1.value = String(clamped);
      if (l1) l1.textContent = `${clamped}%`;
      if (s2 && Number(s2.value) !== clamped) s2.value = String(clamped);
      if (l2) l2.textContent = `${clamped}%`;
    }

    function syncMusicVolumeSliders(pctValue) {
      const num = Number(pctValue);
      const clamped = Math.max(0, Math.min(100, Number.isNaN(num) ? 35 : Math.round(num)));
      if (typeof MusicPlayer !== 'undefined') {
        MusicPlayer.setVolume(clamped / 100);
      }
      const m1 = document.getElementById('musicVolumeSlider');
      const ml1 = document.getElementById('musicVolumeLabel');
      const m2 = document.getElementById('musicVolumeSliderStart');
      const ml2 = document.getElementById('musicVolumeLabelStart');
      if (m1 && Number(m1.value) !== clamped) m1.value = String(clamped);
      if (ml1) ml1.textContent = `${clamped}%`;
      if (m2 && Number(m2.value) !== clamped) m2.value = String(clamped);
      if (ml2) ml2.textContent = `${clamped}%`;
    }

    function openCustomConfigModal(initialProfileName = '') {
      const modal = document.getElementById('customConfigModal');
      if (!modal) return;
      const nameInput = document.getElementById('customConfigNameInput');
      const previewCode = document.getElementById('customConfigFilePreview');
      const baseName = (initialProfileName && initialProfileName !== 'Стандарт' && initialProfileName !== '__create_new__')
        ? initialProfileName
        : `Мой_Профиль_${Object.keys(window.CUSTOM_CONFIG_PROFILES || {}).length + 1}`;
      if (nameInput) nameInput.value = baseName;
      if (previewCode) previewCode.textContent = `config/${baseName}.json`;

      const sourceCfg = (initialProfileName && window.CUSTOM_CONFIG_PROFILES && window.CUSTOM_CONFIG_PROFILES[initialProfileName])
        ? window.CUSTOM_CONFIG_PROFILES[initialProfileName]
        : window.DEFAULT_BALANCE_CONFIG;

      buildDynamicConfigEditorFields(sourceCfg, window.DEFAULT_BALANCE_CONFIG);
      modal.classList.remove('hidden');
    }

    function getNumericBoundsFromStd(key, stdVal) {
      const k = String(key).toLowerCase();
      if (k.includes('chance') || k === 'maxarmor' || k === 'armorbonus' || k === 'armorperkm') {
        return { min: 0, max: 1, step: 0.01 };
      }
      if (k.includes('cooldown') || k.includes('duration') || k.includes('sec')) {
        return { min: 0.05, max: 600, step: 0.05 };
      }
      if (stdVal > 0 && Number.isInteger(stdVal)) {
        return { min: 0, max: Math.max(999999, stdVal * 100), step: 1 };
      }
      return { min: 0, max: Math.max(100000, Math.abs(stdVal) * 100 + 100), step: 0.01 };
    }

    function buildDynamicConfigEditorFields(currentCfg, stdCfg) {
      const container = document.getElementById('customConfigDynamicBody');
      if (!container) return;
      container.innerHTML = '';

      const sectionTitles = {
        general: '⚙️ 1. Общие настройки мира, Рывка (Shift) и Разрушений',
        characters: '🎤 2. Характеристики героинь (Тето, Мику, Неру)',
        rarities: '🎲 3. Веса и бонусы редкостей прокачки',
        weapons: '🔫 4. Баланс всех 10 видов Оружия',
        abilities: '⚡ 5. Баланс всех 20 Способностей',
        bosses: '👑 6. Масштабирование и архетипы Боссов'
      };

      const createFieldInput = (pathArr, labelText, curVal, stdVal) => {
        const wrap = document.createElement('div');
        wrap.className = 'flex flex-col gap-1 bg-slate-950/90 p-2.5 rounded-xl border border-slate-800';
        const valType = typeof stdVal;
        const pathStr = pathArr.join('.');

        if (valType === 'number') {
          const bounds = getNumericBoundsFromStd(pathArr[pathArr.length - 1], stdVal);
          wrap.innerHTML = `
            <div class="flex items-center justify-between gap-1 text-[11px]">
              <span class="font-bold text-slate-200 truncate" title="${labelText}">${labelText}</span>
              <span class="text-[10px] text-slate-400 font-mono">Станд: ${stdVal}</span>
            </div>
            <input type="number" data-cfg-path="${pathStr}" data-cfg-type="number" data-std-val="${stdVal}"
              min="${bounds.min}" max="${bounds.max}" step="${bounds.step}" value="${curVal !== undefined ? curVal : stdVal}"
              class="cfg-dyn-input w-full bg-slate-900 text-amber-300 font-mono text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-700 focus:border-cyan-400 outline-none" />
          `;
        } else if (valType === 'boolean') {
          const checked = (curVal !== undefined ? curVal : stdVal) ? 'checked' : '';
          wrap.innerHTML = `
            <div class="flex items-center justify-between gap-2 text-[11px] h-full">
              <span class="font-bold text-slate-200">${labelText} <span class="text-[10px] text-slate-400">(Станд: ${stdVal ? 'ВКЛ' : 'ВЫКЛ'})</span></span>
              <input type="checkbox" data-cfg-path="${pathStr}" data-cfg-type="boolean" ${checked} class="cfg-dyn-input w-4 h-4 accent-cyan-400 cursor-pointer" />
            </div>
          `;
        } else if (valType === 'string' && !pathStr.includes('imageFile') && !pathStr.includes('id') && !pathStr.includes('archetype')) {
          wrap.innerHTML = `
            <div class="flex items-center justify-between gap-1 text-[11px]">
              <span class="font-bold text-slate-200 truncate">${labelText}</span>
            </div>
            <input type="text" data-cfg-path="${pathStr}" data-cfg-type="string" data-std-val="${stdVal}" value="${curVal !== undefined ? curVal : stdVal}"
              class="cfg-dyn-input w-full bg-slate-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-700 focus:border-cyan-400 outline-none" />
          `;
        } else {
          return null;
        }
        return wrap;
      };

      Object.keys(stdCfg).forEach(secKey => {
        if (secKey === '_comment') return;
        const stdSec = stdCfg[secKey];
        const curSec = (currentCfg && currentCfg[secKey]) || stdSec;

        const secBlock = document.createElement('div');
        secBlock.className = 'bg-slate-900/80 border border-slate-700/90 rounded-2xl p-4 space-y-3';
        const title = sectionTitles[secKey] || `📦 ${secKey}`;
        secBlock.innerHTML = `<h4 class="text-sm sm:text-base font-black text-cyan-300 border-b border-slate-800 pb-2">${title}</h4>`;

        if (secKey === 'general') {
          const grid = document.createElement('div');
          grid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5';
          Object.keys(stdSec).forEach(k => {
            const el = createFieldInput(['general', k], k, curSec[k], stdSec[k]);
            if (el) grid.appendChild(el);
          });
          secBlock.appendChild(grid);
        } else if (secKey === 'characters' || secKey === 'weapons' || secKey === 'abilities') {
          const subGrid = document.createElement('div');
          subGrid.className = 'grid grid-cols-1 md:grid-cols-2 gap-3';
          Object.keys(stdSec).forEach(itemId => {
            const stdItem = stdSec[itemId];
            const curItem = (curSec && curSec[itemId]) || stdItem;
            const card = document.createElement('div');
            card.className = 'p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2';
            card.innerHTML = `<div class="text-xs font-black text-amber-300">${stdItem.icon || '🔹'} ${stdItem.name || itemId} <span class="text-slate-500 font-mono">(${itemId})</span></div>`;
            const fieldsWrap = document.createElement('div');
            fieldsWrap.className = 'grid grid-cols-1 sm:grid-cols-2 gap-2';
            Object.keys(stdItem).forEach(prop => {
              const val = stdItem[prop];
              if (typeof val === 'number' || typeof val === 'boolean' || prop === 'name') {
                const el = createFieldInput([secKey, itemId, prop], prop, curItem[prop], val);
                if (el) fieldsWrap.appendChild(el);
              } else if (prop === 'upgradeScaling' && val && typeof val === 'object') {
                Object.keys(val).forEach(uProp => {
                  if (typeof val[uProp] === 'number') {
                    const el = createFieldInput([secKey, itemId, 'upgradeScaling', uProp], `scale.${uProp}`, curItem.upgradeScaling?.[uProp], val[uProp]);
                    if (el) fieldsWrap.appendChild(el);
                  }
                });
              }
            });
            card.appendChild(fieldsWrap);
            subGrid.appendChild(card);
          });
          secBlock.appendChild(subGrid);
        } else if (secKey === 'rarities' && Array.isArray(stdSec)) {
          const grid = document.createElement('div');
          grid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5';
          stdSec.forEach((rStd, idx) => {
            const rCur = (Array.isArray(curSec) && curSec[idx]) || rStd;
            const card = document.createElement('div');
            card.className = 'p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2';
            card.innerHTML = `<div class="text-xs font-black text-white">${rStd.emoji || ''} ${rStd.name}</div>`;
            ['weight', 'levelGain', 'statsCount', 'totalPoints'].forEach(pKey => {
              if (typeof rStd[pKey] === 'number') {
                const el = createFieldInput(['rarities', String(idx), pKey], pKey, rCur[pKey], rStd[pKey]);
                if (el) card.appendChild(el);
              }
            });
            grid.appendChild(card);
          });
          secBlock.appendChild(grid);
        } else if (secKey === 'bosses' && stdSec && typeof stdSec === 'object') {
          if (stdSec.scaling) {
            const grid = document.createElement('div');
            grid.className = 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5';
            Object.keys(stdSec.scaling).forEach(k => {
              if (typeof stdSec.scaling[k] === 'number') {
                const el = createFieldInput(['bosses', 'scaling', k], k, curSec.scaling?.[k], stdSec.scaling[k]);
                if (el) grid.appendChild(el);
              }
            });
            secBlock.appendChild(grid);
          }
        }

        container.appendChild(secBlock);
      });

      // Подключаем живую валидацию ко всем полям
      container.querySelectorAll('.cfg-dyn-input').forEach(inp => {
        inp.addEventListener('input', () => {
          validateCustomConfigInputs();
        });
      });
      validateCustomConfigInputs();
    }

    function validateCustomConfigInputs() {
      const container = document.getElementById('customConfigDynamicBody');
      const msgEl = document.getElementById('customConfigValidationMsg');
      if (!container) return true;
      let allValid = true;
      let firstError = '';

      container.querySelectorAll('.cfg-dyn-input').forEach(inp => {
        const cfgType = inp.getAttribute('data-cfg-type');
        const pathStr = inp.getAttribute('data-cfg-path') || '';
        if (cfgType === 'number') {
          const val = Number(inp.value);
          const minV = inp.min !== '' ? Number(inp.min) : -Infinity;
          const maxV = inp.max !== '' ? Number(inp.max) : Infinity;
          if (inp.value === '' || Number.isNaN(val) || !Number.isFinite(val) || val < minV || val > maxV) {
            allValid = false;
            inp.classList.add('border-red-500', 'bg-red-950/60');
            if (!firstError) firstError = `Ошибка в поле "${pathStr}": введите число от ${minV} до ${maxV}`;
          } else {
            inp.classList.remove('border-red-500', 'bg-red-950/60');
          }
        } else if (cfgType === 'string') {
          if (!inp.value.trim()) {
            allValid = false;
            inp.classList.add('border-red-500', 'bg-red-950/60');
            if (!firstError) firstError = `Поле "${pathStr}" не может быть пустым`;
          } else {
            inp.classList.remove('border-red-500', 'bg-red-950/60');
          }
        }
      });

      if (msgEl) {
        if (allValid) {
          msgEl.textContent = '✅ Все значения корректны и соответствуют формату стандартного конфига';
          msgEl.className = 'text-xs font-bold text-emerald-400';
        } else {
          msgEl.textContent = `❌ ${firstError}`;
          msgEl.className = 'text-xs font-bold text-red-400';
        }
      }
      return allValid;
    }

    async function saveAndActivateCustomConfigFromModal() {
      if (!validateCustomConfigInputs()) return;
      const nameInput = document.getElementById('customConfigNameInput');
      let rawName = (nameInput ? nameInput.value.trim() : '') || 'Мой_Баланс';
      rawName = rawName.replace(/[\\/:*?"<>|]/g, '_');
      if (rawName === 'Стандарт' || rawName.toLowerCase() === 'balance') {
        rawName = 'Мой_Стандарт';
      }

      const newCfg = JSON.parse(JSON.stringify(window.DEFAULT_BALANCE_CONFIG));
      const container = document.getElementById('customConfigDynamicBody');
      if (container) {
        container.querySelectorAll('.cfg-dyn-input').forEach(inp => {
          const pathArr = (inp.getAttribute('data-cfg-path') || '').split('.');
          const cfgType = inp.getAttribute('data-cfg-type');
          let target = newCfg;
          for (let i = 0; i < pathArr.length - 1; i++) {
            const stepKey = pathArr[i];
            if (target[stepKey] === undefined) return;
            target = target[stepKey];
          }
          const lastKey = pathArr[pathArr.length - 1];
          if (cfgType === 'number') target[lastKey] = Number(inp.value);
          else if (cfgType === 'boolean') target[lastKey] = !!inp.checked;
          else if (cfgType === 'string') target[lastKey] = inp.value.trim();
        });
      }

      newCfg._customProfileName = rawName;
      window.CUSTOM_CONFIG_PROFILES = window.CUSTOM_CONFIG_PROFILES || {};
      window.CUSTOM_CONFIG_PROFILES[rawName] = newCfg;

      try {
        localStorage.setItem('vocaloid_custom_configs_v1', JSON.stringify(window.CUSTOM_CONFIG_PROFILES));
      } catch (e) {}

      // Сохраняем файл <rawName>.json для папки config/
      const jsonBlob = new Blob([JSON.stringify(newCfg, null, 2)], { type: 'application/json' });
      let savedViaPicker = false;
      if (typeof window.showSaveFilePicker === 'function') {
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: `${rawName}.json`,
            types: [{ description: 'JSON Config File', accept: { 'application/json': ['.json'] } }]
          });
          const writable = await handle.createWritable();
          await writable.write(jsonBlob);
          await writable.close();
          savedViaPicker = true;
        } catch (err) {
          // Если пользователь закрыл системный диалог или браузер заблокировал — скачиваем автоматически
        }
      }
      if (!savedViaPicker) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(jsonBlob);
        a.download = `${rawName}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      activateConfigProfile(rawName);
      const modal = document.getElementById('customConfigModal');
      if (modal) modal.classList.add('hidden');
      showToast(
        `🛠️ КАСТОМНЫЙ ПРОФИЛЬ АКТИВИРОВАН: ${rawName}`,
        `Файл ${rawName}.json сохранён! В статистике забега будет отмечено «Кастом: ${rawName}».`,
        'border-cyan-400 bg-slate-900/95'
      );
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
      // Гарантируем наличие нижней панели HP + кругового КД деша и текста +200% у Тето даже со старым index.html
      const tetoCard = document.querySelector('[data-skin="teto"]');
      if (tetoCard) {
        tetoCard.innerHTML = tetoCard.innerHTML.replace("+45%", "+200%");
      }
      if (!document.getElementById("bottomPlayerHud")) {
        const mainEl = document.querySelector("main") || document.body;
        const feedEl = document.getElementById("bottomUpgradeFeed");
        if (feedEl) {
          feedEl.classList.remove("bottom-3");
          feedEl.classList.add("bottom-20");
        }
        const hudDiv = document.createElement("div");
        hudDiv.id = "bottomPlayerHud";
        hudDiv.className = "absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-slate-950/90 border border-slate-700/90 shadow-[0_0_26px_rgba(0,0,0,0.85)] backdrop-blur-md";
        hudDiv.innerHTML = `
          <div class="flex flex-col items-center gap-1">
            <div class="relative w-56 sm:w-72 md:w-80 h-5 bg-slate-900 rounded-full overflow-hidden border-2 border-rose-500/85 shadow-inner">
              <div id="bottomHpBar" class="h-full bg-gradient-to-r from-rose-600 via-red-500 to-emerald-400 transition-all duration-150" style="width: 100%;"></div>
              <div id="bottomHpText" class="absolute inset-0 flex items-center justify-center text-[11px] sm:text-xs font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] tracking-wide">
                ❤️ HP: 200 / 200
              </div>
            </div>
            <div id="bottomStatsSubtext" class="text-[9px] sm:text-[10px] font-bold text-cyan-200/90 tracking-tight truncate max-w-[320px]">
              УР.1: Скор. +0% • Рывок/Неуязв. 0.10с • КД деша 10.0с
            </div>
          </div>
          <button id="dashCircleWidget" type="button" title="Рывок (Shift): 0.5с неуязвимости (+10%/ур.), КД 1с (-10%/ур.), длина +10%/ур." class="relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-900/95 border-2 border-cyan-400 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.35)] hover:scale-105 active:scale-95 transition cursor-pointer flex-shrink-0">
            <svg class="w-full h-full -rotate-90 p-0.5" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="#1e293b" stroke-width="4.5"></circle>
              <circle id="dashCircleArc" cx="24" cy="24" r="20" fill="none" stroke="#22d3ee" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="125.66" stroke-dashoffset="0"></circle>
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center leading-none pointer-events-none">
              <span class="text-[11px] sm:text-xs">⚡</span>
              <span id="dashCircleText" class="text-[8px] sm:text-[9px] font-black text-cyan-200 mt-0.5">SHIFT</span>
            </div>
          </button>
        `;
        mainEl.appendChild(hudDiv);
      }
      setupHighResImageFallbacks();
      loadExternalBalanceJson();
      syncVfxOpacitySliders(75);
      if (typeof MusicPlayer !== 'undefined' && !window.IS_MOBILE_BUILD) {
        MusicPlayer.init().then(() => {
          syncMusicVolumeSliders(MusicPlayer.getVolumePercent());
        });
      } else {
        syncMusicVolumeSliders(35);
      }

      const vfxS1 = document.getElementById('vfxOpacitySlider');
      const vfxS2 = document.getElementById('vfxOpacitySliderStart');
      if (vfxS1) vfxS1.addEventListener('input', e => syncVfxOpacitySliders(e.target.value));
      if (vfxS2) vfxS2.addEventListener('input', e => syncVfxOpacitySliders(e.target.value));

      const musS1 = document.getElementById('musicVolumeSlider');
      const musS2 = document.getElementById('musicVolumeSliderStart');
      if (musS1) musS1.addEventListener('input', e => syncMusicVolumeSliders(e.target.value));
      if (musS2) musS2.addEventListener('input', e => syncMusicVolumeSliders(e.target.value));

      const cfgSelect = document.getElementById('configProfileSelect');
      if (cfgSelect) {
        cfgSelect.addEventListener('change', e => {
          const val = e.target.value;
          if (val === '__create_new__') {
            openCustomConfigModal('');
          } else {
            activateConfigProfile(val);
          }
        });
      }
      const btnEditCfg = document.getElementById('btnEditCurrentConfig');
      if (btnEditCfg) {
        btnEditCfg.addEventListener('click', () => {
          openCustomConfigModal(window.ACTIVE_CONFIG_PROFILE_NAME || '');
        });
      }
      const btnCloseCfg = document.getElementById('btnCloseCustomConfigModal');
      if (btnCloseCfg) {
        btnCloseCfg.addEventListener('click', () => {
          const m = document.getElementById('customConfigModal');
          if (m) m.classList.add('hidden');
          refreshConfigProfileSelectUI();
        });
      }
      const btnResetCfg = document.getElementById('btnResetCustomConfigToStd');
      if (btnResetCfg) {
        btnResetCfg.addEventListener('click', () => {
          buildDynamicConfigEditorFields(window.DEFAULT_BALANCE_CONFIG, window.DEFAULT_BALANCE_CONFIG);
        });
      }
      const btnSaveCfg = document.getElementById('btnSaveAndActivateCustomConfig');
      if (btnSaveCfg) {
        btnSaveCfg.addEventListener('click', () => {
          saveAndActivateCustomConfigFromModal();
        });
      }
      const nameInp = document.getElementById('customConfigNameInput');
      if (nameInp) {
        nameInp.addEventListener('input', e => {
          const prev = document.getElementById('customConfigFilePreview');
          const clean = (e.target.value.trim() || 'Мой_Баланс').replace(/[\\/:*?"<>|]/g, '_');
          if (prev) prev.textContent = `config/${clean}.json`;
        });
      }
      const fileInp = document.getElementById('configJsonFileInput');
      if (fileInp) {
        fileInp.addEventListener('change', async e => {
          const files = Array.from(e.target.files || []);
          let lastLoaded = null;
          for (const f of files) {
            try {
              const txt = await f.text();
              const parsed = JSON.parse(txt);
              const pName = parsed._customProfileName || f.name.replace(/\.json$/i, '');
              if (pName && pName !== 'balance' && pName !== 'profiles') {
                window.CUSTOM_CONFIG_PROFILES = window.CUSTOM_CONFIG_PROFILES || {};
                window.CUSTOM_CONFIG_PROFILES[pName] = parsed;
                lastLoaded = pName;
              }
            } catch (err) {}
          }
          if (lastLoaded) {
            try { localStorage.setItem('vocaloid_custom_configs_v1', JSON.stringify(window.CUSTOM_CONFIG_PROFILES)); } catch (err) {}
            activateConfigProfile(lastLoaded);
          }
        });
      }
      resizeCanvas();
      generateAll30UniqueItemArts();
      populateArsenalCatalog();
      renderStartScreenPreviews();

      window.addEventListener('resize', resizeCanvas);

      // Drag and drop аудиофайлов прямо в окно браузера во время игры
      window.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      });
      window.addEventListener('drop', async e => {
        e.preventDefault();
        const items = e.dataTransfer.items || e.dataTransfer.files || [];
        await handleDroppedAudioEntries(items);
      });

      // Кнопки подключения папки music/ и переключения треков
      const btnConnectMusic = document.getElementById('btnConnectMusicFolder');
      if (btnConnectMusic) {
        btnConnectMusic.addEventListener('click', () => {
          if (typeof MusicPlayer !== 'undefined') MusicPlayer.connectMusicFolderPicker();
        });
      }
      const btnHudConnectMusic = document.getElementById('btnHudConnectMusic');
      if (btnHudConnectMusic) {
        btnHudConnectMusic.addEventListener('click', () => {
          if (typeof MusicPlayer !== 'undefined') MusicPlayer.connectMusicFolderPicker();
        });
      }
      const btnHudNext = document.getElementById('btnHudNextMusicTrack');
      if (btnHudNext) {
        btnHudNext.addEventListener('click', () => {
          SoundFX.init();
          if (typeof MusicPlayer !== 'undefined') MusicPlayer.playNextRandom();
        });
      }
      const btnNextMusicTrack = document.getElementById('btnNextMusicTrack');
      if (btnNextMusicTrack) {
        btnNextMusicTrack.addEventListener('click', () => {
          SoundFX.init();
          if (typeof MusicPlayer !== 'undefined') MusicPlayer.playNextRandom();
        });
      }
      const musicFolderInput = document.getElementById('musicFolderInput');
      if (musicFolderInput) {
        musicFolderInput.addEventListener('change', e => {
          if (typeof MusicPlayer !== 'undefined' && e.target.files && e.target.files.length > 0) {
            MusicPlayer.loadUserSelectedFiles(e.target.files);
          }
        });
      }

      window.addEventListener('keydown', e => {
        keys[e.code] = true;
        // Shift нельзя зажимать — работает только на одиночное нажатие (!e.repeat)!
        if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key === 'Shift') && !e.repeat) {
          if (!keys['_shiftHeldLock']) {
            keys['_shiftHeldLock'] = true;
            if (state.running && !state.paused) {
              state.triggerDashRequested = true;
            }
          }
        }
      });
      window.addEventListener('keyup', e => {
        keys[e.code] = false;
        if (e.code === 'ShiftLeft' || e.code === 'ShiftRight' || e.key === 'Shift') {
          keys['_shiftHeldLock'] = false;
        }
      });

      const dashWidget = document.getElementById('dashCircleWidget');
      if (dashWidget) {
        dashWidget.addEventListener('click', () => {
          if (state.running && !state.paused) {
            state.triggerDashRequested = true;
          }
        });
      }

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
            ? 'px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-800/80 hover:bg-cyan-700 text-white border border-cyan-400 transition whitespace-nowrap'
            : 'px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition whitespace-nowrap';
        });
      }

      const btnAutoMarch = document.getElementById('btnAutoMarch');
      if (btnAutoMarch) {
        btnAutoMarch.addEventListener('click', () => {
          autoMarchEnabled = !autoMarchEnabled;
          btnAutoMarch.textContent = autoMarchEnabled ? '⬆️ Авто-ход: ВКЛ' : '⬆️ Авто-ход: ВЫКЛ';
          btnAutoMarch.className = autoMarchEnabled
            ? 'px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-700/80 hover:bg-emerald-600 text-white border border-emerald-500 transition whitespace-nowrap'
            : 'px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition whitespace-nowrap';
        });
      }

      document.getElementById('btnStartGame').addEventListener('click', () => {
        startNewRun();
      });

      const btnRerollChoices = document.getElementById('btnRerollChoices');
      if (btnRerollChoices && !document.getElementById('btnOpenBanishModal')) {
        const parentWrap = document.createElement('div');
        parentWrap.className = 'flex items-center gap-2.5 flex-wrap justify-center sm:justify-end';
        btnRerollChoices.parentNode.insertBefore(parentWrap, btnRerollChoices);
        const banishBtn = document.createElement('button');
        banishBtn.id = 'btnOpenBanishModal';
        banishBtn.type = 'button';
        banishBtn.className = 'px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-700 to-red-600 hover:from-rose-600 hover:to-red-500 text-white font-black text-xs sm:text-sm shadow-lg border border-rose-400/70 flex items-center gap-2 flex-shrink-0 transition transform active:scale-95';
        banishBtn.innerHTML = '<span>🚫 Блокировка</span><span id="banishPoolCountBadge" class="px-2 py-0.5 rounded-full bg-slate-950/90 text-rose-200 font-mono text-xs">Пул: 30</span>';
        parentWrap.appendChild(banishBtn);
        parentWrap.appendChild(btnRerollChoices);
      }

      if (!document.getElementById('banishItemModal')) {
        const bModal = document.createElement('div');
        bModal.id = 'banishItemModal';
        bModal.className = 'hidden fixed inset-0 z-[60] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6';
        bModal.innerHTML = `
          <div class="w-full max-w-6xl max-h-[90vh] bg-slate-900 border-2 border-rose-500 rounded-3xl shadow-[0_0_50px_rgba(244,63,94,0.35)] flex flex-col overflow-hidden">
            <div class="px-5 py-4 bg-slate-950 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <div class="text-xs font-black uppercase tracking-widest text-rose-400">🚫 ИСКЛЮЧЕНИЕ ИЗ ПУЛА НА ТЕКУЩИЙ ЗАБЕГ</div>
                <h3 class="text-lg sm:text-2xl font-black text-white">Заблокировать 1 предмет вместо прокачки уровня</h3>
                <p id="banishModalPoolCounter" class="text-xs text-slate-300 mt-0.5">Осталось в пуле: 30 / 30 (блокировка доступна до 5 предм.)</p>
              </div>
              <button id="btnCloseBanishModal" type="button" class="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm border border-slate-600 transition flex-shrink-0">
                ⬅️ Назад к выбору прокачки
              </button>
            </div>
            <div class="p-4 sm:p-5 overflow-y-auto flex-1">
              <div id="banishItemsGrid" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3"></div>
            </div>
          </div>
        `;
        document.body.appendChild(bModal);
      }

      const btnOpenBanishModal = document.getElementById('btnOpenBanishModal');
      if (btnOpenBanishModal) {
        btnOpenBanishModal.addEventListener('click', () => {
          openBanishItemModal();
        });
      }
      const btnCloseBanishModal = document.getElementById('btnCloseBanishModal');
      if (btnCloseBanishModal) {
        btnCloseBanishModal.addEventListener('click', () => {
          const bModal = document.getElementById('banishItemModal');
          if (bModal) bModal.classList.add('hidden');
        });
      }

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
          ? 'px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-700/80 hover:bg-indigo-600 text-white border border-indigo-400 transition whitespace-nowrap'
          : 'px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-600 transition whitespace-nowrap';
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
        if (typeof MusicPlayer !== 'undefined') MusicPlayer.setGamePaused(true);
        catalogModal.classList.remove('hidden');
      });
      document.getElementById('btnCloseCatalog').addEventListener('click', () => {
        catalogModal.classList.add('hidden');
        if (state.running && !wasPausedBeforeCatalog) {
          state.paused = false;
          state.lastTimestamp = performance.now();
          if (typeof MusicPlayer !== 'undefined') MusicPlayer.setGamePaused(false);
        }
      });

      const btnSoundToggle = document.getElementById('btnSoundToggle');
      btnSoundToggle.addEventListener('click', () => {
        SoundFX.muted = !SoundFX.muted;
        btnSoundToggle.textContent = SoundFX.muted ? '🔇 Без звука' : '🔊 Звук';
        if (typeof MusicPlayer !== 'undefined') {
          MusicPlayer.setMuted(SoundFX.muted);
        }
      });

      const btnPauseGame = document.getElementById('btnPauseGame');
      btnPauseGame.addEventListener('click', () => {
        if (!state.running) return;
        state.paused = !state.paused;
        btnPauseGame.textContent = state.paused ? '▶️' : '⏸️';
        if (!state.paused) state.lastTimestamp = performance.now();
        if (typeof MusicPlayer !== 'undefined') {
          MusicPlayer.setGamePaused(state.paused);
        }
      });

      document.getElementById('btnContinueEndless').addEventListener('click', () => {
        document.getElementById('endModal').classList.add('hidden');
        state.paused = false;
        state.lastTimestamp = performance.now();
        if (typeof MusicPlayer !== 'undefined') {
          MusicPlayer.setGamePaused(false);
        }
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
        sctx.fillText('VOCALOID SURVIVAL 3D: МОСТ НАД ВОДОЙ — ИТОГОВАЯ СТАТИСТИКА ЗАБЕГА', 120, 44);
        if (window.IS_CUSTOM_CONFIG_ACTIVE && window.ACTIVE_CONFIG_PROFILE_NAME && window.ACTIVE_CONFIG_PROFILE_NAME !== 'Стандарт') {
          sctx.save();
          sctx.fillStyle = '#ef4444';
          sctx.font = '900 28px Inter, sans-serif';
          sctx.textAlign = 'right';
          sctx.fillText(`КАСТОМ: ${window.ACTIVE_CONFIG_PROFILE_NAME}`, canvasW - 28, 52);
          sctx.restore();
        }
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
