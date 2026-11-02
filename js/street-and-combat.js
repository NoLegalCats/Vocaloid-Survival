// =========================================================================
    // 10. AUTONOMOUS PLUSHIE TETO (+1 PER LEVEL) & PERMANENT ORBITING DRONES
    // =========================================================================
    function syncPlushPets() {
      const plushAbility = state.abilities['plush_teto'];
      if (!plushAbility) return;
      // Ровно 1 Плюшка Тето на 1-м уровне (+1 за каждый уровень способности)
      const desiredCount = Math.min(20, plushAbility.level);
      while (state.plushPets.length < desiredCount) {
        const idx = state.plushPets.length;
        const ang = (idx * 1.7) % (Math.PI * 2);
        state.plushPets.push({
          x: state.player.x + Math.cos(ang) * 70,
          y: state.player.y + Math.sin(ang) * 70,
          vx: 0,
          vy: 0,
          z: 0,
          state: 'roam', // 'roam' | 'jumping' | 'slam'
          roamTargetX: state.player.x + Math.cos(ang) * 140,
          roamTargetY: state.player.y - 80 + Math.sin(ang) * 120,
          roamTimer: 0.5,
          targetX: 0,
          targetY: 0,
          jumpTimer: 0,
          jumpDuration: 0.46,
          startX: 0,
          startY: 0,
          cooldownTimer: 0.3 + (idx % 4) * 0.35,
          squashScale: 1,
          rot: 0
        });
      }
    }

    function syncOrbitDrones() {
      const droneAbility = state.abilities['drone_swarm'];
      if (!droneAbility) return;
      // Орбитальный рой дронов за каждый уровень получает +2 дрона!
      const desiredCount = Math.min(48, 2 * droneAbility.level + Math.max(0, droneAbility.areaPts - 1) * 2);
      while (state.orbitDrones.length < desiredCount) {
        state.orbitDrones.push({
          angleOffset: (state.orbitDrones.length * Math.PI * 2) / Math.max(1, desiredCount),
          fireTimer: 0.1 + (state.orbitDrones.length % 3) * 0.12,
          x: state.player.x,
          y: state.player.y
        });
      }
      // Re-space drone angles evenly
      state.orbitDrones.forEach((d, i) => {
        d.angleOffset = (i / state.orbitDrones.length) * Math.PI * 2;
      });
    }

    // =========================================================================
    // 11. LEVEL-UP REWARD HANDLER WITH RARITIES
    // =========================================================================
    function grantLevelUpReward(isFreeBossLevel = false) {
      state.level++;
      if (isFreeBossLevel) {
        state.freeBossLevels = (state.freeBossLevels || 0) + 1;
      } else {
        const xpLevelIndex = Math.max(1, state.level - (state.freeBossLevels || 0));
        state.xpNeeded = calcXpForLevel(xpLevelIndex);
      }
      state.player.maxHp += 10;
      state.player.hp = Math.min(state.player.maxHp, state.player.hp + 10);
      addDamageNumber(state.player.x, state.player.y - 28, '+10 Макс. HP', '#4ade80');

      const candidates = typeof getUnbanishedCandidates === 'function'
        ? getUnbanishedCandidates()
        : [
            ...WEAPONS_POOL.map(w => ({ kind: 'weapon', id: w.id, def: w })),
            ...ABILITIES_POOL.map(a => ({ kind: 'ability', id: a.id, def: a }))
          ];

      if (randomDropMode) {
        const rolledThree = rollRouletteItems(candidates, 3).map(item => {
          const isWeapon = item.kind === 'weapon';
          const currentLvl = isWeapon
            ? (state.weapons[item.id]?.level || 0)
            : (state.abilities[item.id]?.level || 0);
          const rarity = rollUpgradeRarity();
          const roll = rollStatsForRarity(rarity, !!item.def.fixedCooldown);
          const rarityRank = rarity.id === 'legendary' ? 4 : (rarity.id === 'epic' ? 3 : (rarity.id === 'rare' ? 2 : 1));
          return { item, currentLvl, rarity, roll, rarityRank };
        });

        rolledThree.sort((a, b) => {
          if (b.rarityRank !== a.rarityRank) return b.rarityRank - a.rarityRank;
          if (b.currentLvl !== a.currentLvl) return b.currentLvl - a.currentLvl;
          return getItemDropChance(a.item.id) - getItemDropChance(b.item.id);
        });

        const chosen = rolledThree[0];
        SoundFX.playLevelUp(chosen.rarity.id === 'legendary');
        if (chosen.item.kind === 'weapon') applyWeaponUpgrade(chosen.item.id, chosen.roll, false);
        else applyAbilityUpgrade(chosen.item.id, chosen.roll, false);
      } else {
        state.paused = true;
        SoundFX.playLevelUp(false);
        renderLevelUpChoiceCards(candidates);
        document.getElementById('levelUpChoiceModal').classList.remove('hidden');
      }
    }

    function updateRerollButtonUI() {
      const btn = document.getElementById('btnRerollChoices');
      const badge = document.getElementById('rerollCountModalBadge');
      const hudBadge = document.getElementById('hudRerollsBadge');
      if (badge) badge.textContent = `${state.rerolls}`;
      if (hudBadge) hudBadge.textContent = `🎲 ${state.rerolls}`;
      if (btn) {
        btn.disabled = state.rerolls <= 0;
        btn.className = state.rerolls > 0
          ? 'px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs sm:text-sm shadow-lg border border-indigo-400/60 flex items-center gap-2 flex-shrink-0 transition transform active:scale-95'
          : 'px-4 py-2.5 rounded-xl bg-slate-800 text-slate-500 font-black text-xs sm:text-sm border border-slate-700 flex items-center gap-2 flex-shrink-0 opacity-60 cursor-not-allowed';
      }

      // Обновляем кнопку «🚫 Блокировка» левее кнопки Реролла (доступна пока в пуле > 5 предметов!)
      const banishBtn = document.getElementById('btnOpenBanishModal');
      const banishBadge = document.getElementById('banishPoolCountBadge');
      const unbanishedCount = typeof getUnbanishedCandidates === 'function' ? getUnbanishedCandidates().length : 30;
      const canBanish = unbanishedCount > 5;
      if (banishBadge) {
        banishBadge.textContent = canBanish ? `Пул: ${unbanishedCount}` : `Мин: 5`;
      }
      if (banishBtn) {
        banishBtn.disabled = !canBanish;
        banishBtn.className = canBanish
          ? 'px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-700 to-red-600 hover:from-rose-600 hover:to-red-500 text-white font-black text-xs sm:text-sm shadow-lg border border-rose-400/70 flex items-center gap-2 flex-shrink-0 transition transform active:scale-95'
          : 'px-4 py-2.5 rounded-xl bg-slate-800 text-slate-500 font-black text-xs sm:text-sm border border-slate-700 flex items-center gap-2 flex-shrink-0 opacity-50 cursor-not-allowed';
      }
    }

    function openBanishItemModal() {
      const unbanishedCount = typeof getUnbanishedCandidates === 'function' ? getUnbanishedCandidates().length : 30;
      if (unbanishedCount <= 5) return;
      const modal = document.getElementById('banishItemModal');
      if (!modal) return;
      renderBanishItemsGrid();
      modal.classList.remove('hidden');
    }

    function renderBanishItemsGrid() {
      const grid = document.getElementById('banishItemsGrid');
      const countLabel = document.getElementById('banishModalPoolCounter');
      if (!grid) return;
      grid.innerHTML = '';

      const banished = state.banishedItems || new Set();
      const unbanishedCount = 30 - banished.size;
      if (countLabel) {
        countLabel.textContent = `Осталось в пуле: ${unbanishedCount} / 30 (блокировка доступна до 5 предм.)`;
      }

      const allItems = [
        ...WEAPONS_POOL.map(w => ({ kind: 'weapon', id: w.id, def: w })),
        ...ABILITIES_POOL.map(a => ({ kind: 'ability', id: a.id, def: a }))
      ];

      allItems.forEach(item => {
        const isBanished = banished.has(item.id);
        const currentLvl = item.kind === 'weapon'
          ? (state.weapons[item.id]?.level || 0)
          : (state.abilities[item.id]?.level || 0);
        const freqMeta = getItemDropFrequencyMeta(item.id);
        const card = document.createElement('button');
        card.type = 'button';
        card.disabled = isBanished || unbanishedCount <= 5;
        card.className = isBanished
          ? 'relative p-3 rounded-xl bg-slate-950/90 border-2 border-red-600/80 opacity-60 flex flex-col justify-between gap-1.5 text-left cursor-not-allowed overflow-hidden'
          : 'group relative p-3 rounded-xl bg-slate-900/95 hover:bg-rose-950/50 border-2 border-slate-700 hover:border-rose-400 flex flex-col justify-between gap-1.5 text-left transition transform hover:scale-[1.01] cursor-pointer overflow-hidden';

        card.innerHTML = `
          <div>
            <div class="relative w-full h-24 rounded-lg overflow-hidden border ${isBanished ? 'border-red-600 grayscale' : 'border-slate-700'} bg-slate-950 mb-2">
              <img src="${(document.getElementById('imgArt_' + item.id) || {}).src || ''}" alt="${item.def.name}" class="w-full h-full object-cover" />
              ${isBanished ? `
                <div class="absolute inset-0 bg-red-950/80 flex items-center justify-center">
                  <span class="px-2 py-1 rounded bg-red-600 text-white font-black text-[11px] uppercase tracking-wider shadow-lg border border-white/30">🚫 ЗАБЛОКИРОВАНО</span>
                </div>
              ` : `
                <div class="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded bg-slate-950/85 text-[10px] font-bold text-slate-200 border border-slate-600">
                  ${currentLvl > 0 ? `Ур. ${currentLvl}` : 'В пуле'}
                </div>
              `}
            </div>
            <div class="flex items-center justify-between gap-1 flex-wrap">
              <span class="text-xs font-black ${isBanished ? 'text-red-300 line-through' : 'text-white'}">${item.def.icon} ${item.def.name}</span>
              <span class="text-[10px] px-1.5 py-0.5 rounded border font-bold ${freqMeta.cls}">🎲 ${freqMeta.label}</span>
            </div>
            <p class="text-[11px] text-slate-300 mt-1 line-clamp-2 leading-snug">${item.def.desc}</p>
          </div>
          <div class="mt-1.5 pt-1.5 border-t border-slate-800 flex items-center justify-between text-[10px] font-black">
            <span class="${item.kind === 'weapon' ? 'text-amber-300' : 'text-cyan-300'}">${item.kind === 'weapon' ? '🔫 Оружие' : '⚡ Способность'}</span>
            <span class="${isBanished ? 'text-red-400' : 'text-rose-400 group-hover:text-rose-300'}">${isBanished ? '🚫 Исключено' : '🚫 Заблокировать (вместо ур.)'}</span>
          </div>
        `;

        if (!isBanished && unbanishedCount > 5) {
          card.addEventListener('click', () => {
            if (!state.banishedItems) state.banishedItems = new Set();
            if (30 - state.banishedItems.size <= 5) return;
            state.banishedItems.add(item.id);
            SoundFX.playBoom(0.24, 0.07);
            if (typeof populateArsenalCatalog === 'function') populateArsenalCatalog();
            updateRerollButtonUI();
            const banishModal = document.getElementById('banishItemModal');
            if (banishModal) banishModal.classList.add('hidden');
            const lvlModal = document.getElementById('levelUpChoiceModal');
            if (lvlModal) lvlModal.classList.add('hidden');
            state.paused = false;
            state.lastTimestamp = performance.now();
            const leftInPool = 30 - state.banishedItems.size;
            showToast(
              `🚫 ЗАБЛОКИРОВАНО НА ЭТОТ ЗАБЕГ: ${item.def.name}`,
              `Предмет исключён из пула вместо прокачки! Осталось в пуле: ${leftInPool} предм.`,
              'border-rose-500 bg-slate-950/95'
            );
            updateHudDOM();
          });
        }

        grid.appendChild(card);
      });
    }

    function renderLevelUpChoiceCards(candidatesList = null) {
      const candidates = candidatesList || (typeof getUnbanishedCandidates === 'function'
        ? getUnbanishedCandidates()
        : [
            ...WEAPONS_POOL.map(w => ({ kind: 'weapon', id: w.id, def: w })),
            ...ABILITIES_POOL.map(a => ({ kind: 'ability', id: a.id, def: a }))
          ]);
      const chosenThree = rollRouletteItems(candidates, 3);
      const listEl = document.getElementById('choiceCardsList');
      listEl.innerHTML = '';
      updateRerollButtonUI();

      chosenThree.forEach(item => {
        const isWeapon = item.kind === 'weapon';
        const currentLvl = isWeapon
          ? (state.weapons[item.id]?.level || 0)
          : (state.abilities[item.id]?.level || 0);
        const rarity = rollUpgradeRarity();
        const rollResult = rollStatsForRarity(rarity, !!item.def.fixedCooldown);
        const freqMeta = getItemDropFrequencyMeta(item.id);

        const statLabels = getCustomStatLabels(item.id, rollResult).map(b => b.text);

        const card = document.createElement('button');
        card.type = 'button';
        card.className = `group w-full min-w-0 overflow-hidden text-left p-4 sm:p-5 lg:p-6 rounded-2xl border-2 transition-all duration-200 hover:scale-[1.01] hover:shadow-2xl flex flex-col justify-between gap-3 ${rarity.borderClass}`;
        const lvlGain = rarity.levelGain || 1;
        card.innerHTML = `
          <div class="w-full min-w-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="px-2.5 py-1 rounded-md text-xs sm:text-sm font-black shadow ${rarity.badgeClass}">
                ${rarity.emoji} ${rarity.name} (+${lvlGain} УР.)
              </span>
              <span class="px-2 py-1 rounded-md text-xs sm:text-sm font-black bg-slate-800 text-emerald-300 border border-emerald-500/30">
                ${currentLvl > 0 ? `УР. ${currentLvl} ➔ ${currentLvl + lvlGain} (+${lvlGain})` : `НОВОЕ! (СРАЗУ УР. ${lvlGain})`}
              </span>
              <span class="px-2 py-1 rounded-md border text-xs font-bold ${freqMeta.cls}">
                🎲 ${freqMeta.label}
              </span>
            </div>
            <div class="relative w-full rounded-xl overflow-hidden border-2 border-slate-700/90 mt-3 bg-slate-950 shadow-inner" style="height: clamp(180px, 19vw, 330px);">
              <img src="${(document.getElementById('imgArt_' + item.id) || {}).src || ''}" alt="${item.def.name}" class="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300" />
              <div class="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-950/85 to-transparent pointer-events-none"></div>
              <div class="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-950/85 border border-slate-600/80 text-[11px] font-bold text-slate-200">
                ${isWeapon ? '🔫 Оружие' : '⚡ Способность'}
              </div>
            </div>
            <div class="font-black text-base sm:text-lg lg:text-xl text-white mt-3 break-words leading-snug">${item.def.icon} ${item.def.name}</div>
            <p class="text-xs sm:text-sm text-slate-200 mt-1.5 leading-relaxed break-words">${item.def.desc}</p>
          </div>
          <div class="text-xs sm:text-sm font-extrabold text-amber-300 p-2.5 rounded-xl bg-slate-950/75 border border-slate-700/80 break-words">
            Выпало: ${statLabels.join(' • ')}
          </div>
        `;
        card.addEventListener('click', () => {
          document.getElementById('levelUpChoiceModal').classList.add('hidden');
          state.paused = false;
          state.lastTimestamp = performance.now();
          if (isWeapon) applyWeaponUpgrade(item.id, rollResult, false);
          else applyAbilityUpgrade(item.id, rollResult, false);
          // Check if player still has enough XP for another level-up
          while (state.xp >= state.xpNeeded && !state.paused) {
            state.xp -= state.xpNeeded;
            grantLevelUpReward();
          }
          updateHudDOM();
        });
        listEl.appendChild(card);
      });
    }

    function showToast(title, subtitle, colorClass = 'border-emerald-400 bg-slate-900/95') {
      const container = document.getElementById('toastContainer');
      if (!container) return;
      container.className = 'pointer-events-none fixed top-16 left-1/2 -translate-x-1/2 z-[90] flex flex-col items-center gap-1.5 w-full max-w-md px-3';
      const el = document.createElement('div');
      el.className = `toast-anim w-full px-3.5 py-2 rounded-xl border-2 shadow-xl backdrop-blur-md ${colorClass}`;
      el.innerHTML = `
        <div class="text-xs font-black text-white">${title}</div>
        <div class="text-[11px] text-slate-200 truncate">${subtitle}</div>
      `;
      container.appendChild(el);
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 2400);
    }

    function triggerCutin(artId, captionText) {
      state.cutinArtId = artId || SKINS[selectedSkinId].cutinImgId;
      state.cutinTimer = 2.8;
      if (captionText) {
        state.cutinText = captionText;
        const cap = document.getElementById('cutinCaption');
        if (cap) cap.textContent = captionText;
      }
    }

    // Окрашивание предметов в верхней панели за каждые 5 уровней (7 рангов):
    // 1. Ур. 1–5: Серый
    // 2. Ур. 6–10: Зелёный
    // 3. Ур. 11–15: Голубой
    // 4. Ур. 16–20: Фиолетовый
    // 5. Ур. 21–25: Золотой
    // 6. Ур. 26–30: Красный
    // 7. Ур. 31+: Чёрный (остаётся чёрным)
    function getItemLevelColorTheme(level) {
      if (level < 5) {
        return {
          tierName: 'Серый ранг (Ур. 1–4)',
          containerCls: 'bg-slate-800/95 border-slate-400/80',
          textCls: 'text-slate-200',
          pillCls: 'bg-slate-600 text-white',
          barCls: 'bg-slate-300',
          hexBg: '#1e293b',
          hexBorder: '#94a3b8',
          hexText: '#e2e8f0'
        };
      } else if (level < 10) {
        return {
          tierName: 'Зелёный ранг (Ур. 5–9)',
          containerCls: 'bg-emerald-950/95 border-emerald-400/85',
          textCls: 'text-emerald-200',
          pillCls: 'bg-emerald-500 text-slate-950',
          barCls: 'bg-emerald-400',
          hexBg: '#064e3b',
          hexBorder: '#34d399',
          hexText: '#a7f3d0'
        };
      } else if (level < 15) {
        return {
          tierName: 'Голубой ранг (Ур. 10–14)',
          containerCls: 'bg-sky-950/95 border-sky-400/85',
          textCls: 'text-sky-200',
          pillCls: 'bg-sky-400 text-slate-950',
          barCls: 'bg-sky-400',
          hexBg: '#0c4a6e',
          hexBorder: '#38bdf8',
          hexText: '#bae6fd'
        };
      } else if (level < 20) {
        return {
          tierName: 'Фиолетовый ранг (Ур. 15–19)',
          containerCls: 'bg-purple-950/95 border-purple-400/85',
          textCls: 'text-purple-200',
          pillCls: 'bg-purple-400 text-slate-950',
          barCls: 'bg-purple-400',
          hexBg: '#3b0764',
          hexBorder: '#c084fc',
          hexText: '#e9d5ff'
        };
      } else if (level < 25) {
        return {
          tierName: 'Золотой ранг (Ур. 20–24)',
          containerCls: 'bg-amber-950/95 border-amber-400/90 shadow-[0_0_10px_rgba(251,191,36,0.35)]',
          textCls: 'text-amber-200',
          pillCls: 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950',
          barCls: 'bg-amber-400',
          hexBg: '#451a03',
          hexBorder: '#fbbf24',
          hexText: '#fde68a'
        };
      } else if (level < 30) {
        return {
          tierName: 'Красный ранг (Ур. 25–29)',
          containerCls: 'bg-red-950/95 border-red-500/95 shadow-[0_0_12px_rgba(239,68,68,0.45)]',
          textCls: 'text-red-200',
          pillCls: 'bg-gradient-to-r from-red-500 to-rose-400 text-white',
          barCls: 'bg-red-500',
          hexBg: '#450a0a',
          hexBorder: '#ef4444',
          hexText: '#fecaca'
        };
      } else if (level < 40) {
        return {
          tierName: 'Чёрный Оникс (Ур. 30–39)',
          containerCls: 'bg-black border-2 border-white/90 shadow-[0_0_14px_rgba(255,255,255,0.45)]',
          textCls: 'text-white',
          pillCls: 'bg-zinc-900 border border-white/80 text-white',
          barCls: 'bg-white',
          hexBg: '#030305',
          hexBorder: '#ffffff',
          hexText: '#ffffff'
        };
      } else if (level < 50) {
        return {
          tierName: '⚡ Электрический Разряд (Ур. 40–49)',
          containerCls: 'tier-anim-40',
          textCls: 'text-cyan-200',
          pillCls: 'bg-cyan-400 text-slate-950 font-black',
          barCls: 'bg-cyan-300',
          hexBg: '#082f49',
          hexBorder: '#38bdf8',
          hexText: '#e0f2fe'
        };
      } else if (level < 60) {
        return {
          tierName: '☣️ Изумрудная Плазма (Ур. 50–59)',
          containerCls: 'tier-anim-50',
          textCls: 'text-emerald-200',
          pillCls: 'bg-gradient-to-r from-emerald-400 to-fuchsia-400 text-slate-950 font-black',
          barCls: 'bg-emerald-300',
          hexBg: '#064e3b',
          hexBorder: '#34d399',
          hexText: '#d1fae5'
        };
      } else if (level < 70) {
        return {
          tierName: '❄️ Крио-Кристалл Нуля (Ур. 60–69)',
          containerCls: 'tier-anim-60',
          textCls: 'text-cyan-100',
          pillCls: 'bg-gradient-to-r from-cyan-200 to-white text-slate-950 font-black',
          barCls: 'bg-cyan-200',
          hexBg: '#083344',
          hexBorder: '#a5f3fc',
          hexText: '#ecfeff'
        };
      } else if (level < 80) {
        return {
          tierName: '🔥 Пылающее Адское Пламя (Ур. 70–79)',
          containerCls: 'tier-anim-70',
          textCls: 'text-amber-100',
          pillCls: 'bg-gradient-to-r from-red-500 via-orange-400 to-yellow-300 text-slate-950 font-black',
          barCls: 'bg-yellow-300',
          hexBg: '#7c2d12',
          hexBorder: '#f97316',
          hexText: '#fef08a'
        };
      } else if (level < 90) {
        return {
          tierName: '🌌 Сингулярность Бездны (Ур. 80–89)',
          containerCls: 'tier-anim-80',
          textCls: 'text-fuchsia-200',
          pillCls: 'bg-gradient-to-r from-purple-500 via-fuchsia-400 to-amber-300 text-slate-950 font-black',
          barCls: 'bg-fuchsia-400',
          hexBg: '#3b0764',
          hexBorder: '#e879f9',
          hexText: '#fae8ff'
        };
      } else if (level < 100) {
        return {
          tierName: '🌈 Радужный Хромо-Спектр (Ур. 90–99)',
          containerCls: 'tier-anim-90',
          textCls: 'text-white',
          pillCls: 'bg-gradient-to-r from-rose-500 via-emerald-400 to-cyan-400 text-slate-950 font-black',
          barCls: 'bg-gradient-to-r from-rose-400 via-yellow-300 to-cyan-400',
          hexBg: '#1e1b4b',
          hexBorder: '#00ff88',
          hexText: '#ffffff'
        };
      } else {
        return {
          tierName: '👑 Божественный Абсолют (Ур. 100+)',
          containerCls: 'tier-anim-100',
          textCls: 'text-amber-200',
          pillCls: 'bg-gradient-to-r from-yellow-300 via-white to-rose-400 text-slate-950 font-black',
          barCls: 'bg-gradient-to-r from-yellow-300 via-white to-cyan-300',
          hexBg: '#450a0a',
          hexBorder: '#fde047',
          hexText: '#fef08a'
        };
      }
    }

    function updateInventoryStripUI() {
      const strip = document.getElementById('inventoryStrip');
      if (!strip) return;
      strip.innerHTML = '';

      // Combine weapons and abilities and sort by level descending so strongest items appear on the left
      const combinedItems = [
        ...Object.values(state.weapons).map(w => ({ kind: 'weapon', item: w })),
        ...Object.values(state.abilities).map(a => ({ kind: 'ability', item: a }))
      ].sort((a, b) => {
        if (b.item.level !== a.item.level) return b.item.level - a.item.level;
        const aPts = (a.item.dmgPts || 0) + (a.item.areaPts || 0) + (a.item.cdPts || 0);
        const bPts = (b.item.dmgPts || 0) + (b.item.areaPts || 0) + (b.item.cdPts || 0);
        return bPts - aPts;
      });

      combinedItems.forEach(({ kind, item }) => {
        const theme = getItemLevelColorTheme(item.level);
        if (kind === 'weapon') {
          const w = item;
          const stats = getWeaponStats(w);
          const badge = document.createElement('div');
          badge.className = `flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] flex-shrink-0 ${theme.containerCls}`;
          badge.title = `${w.def.name} (Ур.${w.level} • ${theme.tierName}) | Урон: ${stats.damage} | Область: ×${stats.areaScale.toFixed(2)}`;
          badge.innerHTML = `
            <span>${w.def.icon}</span>
            <span class="font-bold ${theme.textCls} truncate max-w-[95px]">${w.def.name}</span>
            <span class="px-1 rounded ${theme.pillCls} font-black text-[10px]">Ур.${w.level}</span>
          `;
          strip.appendChild(badge);
        } else {
          const a = item;
          const stats = getAbilityStats(a);
          const isPerm = (a.def.isPermanentOrbit || a.id === 'plush_teto');
          const isActive = !isPerm && a.activeTimer > 0;
          const pct = isPerm
            ? 100
            : (isActive
                ? Math.max(0, Math.min(100, (a.activeTimer / Math.max(0.01, a.maxActiveTimer || 1)) * 100))
                : (stats.cooldown <= 0 ? 100 : Math.max(0, Math.min(100, ((stats.cooldown - Math.max(0, a.timer)) / stats.cooldown) * 100))));
          const barColor = isActive ? 'bg-emerald-400' : theme.barCls;
          const badge = document.createElement('div');
          badge.dataset.abilityHud = a.id;
          badge.className = `relative overflow-hidden flex items-center gap-1 px-2 py-0.5 rounded border text-[11px] flex-shrink-0 ${theme.containerCls}`;
          badge.title = `${a.def.name} (Ур.${a.level} • ${theme.tierName}) | Урон: ${stats.damage} | Область: ×${stats.areaScale.toFixed(2)} | КД после действия: ${stats.cooldown.toFixed(1)}с`;
          badge.innerHTML = `
            <div data-cd-fill="${a.id}" data-bar-cls="${theme.barCls}" class="absolute bottom-0 left-0 h-0.5 ${barColor} transition-all duration-75" style="width: ${pct}%;"></div>
            <span>${a.def.icon}</span>
            <span class="font-bold ${theme.textCls} truncate max-w-[95px]">${a.def.name}</span>
            <span class="px-1 rounded ${theme.pillCls} font-black text-[10px]">Ур.${a.level}</span>
          `;
          strip.appendChild(badge);
        }
      });
    }

    // =========================================================================
    // 12. ENDLESS KILOMETER SCALING (x1.5 HP & x1.5 XP per km) + 10-MINUTE HORDE RAMP
    // =========================================================================
    // За каждого убитого босса зомби получают +3 к множителю ХП (до 1-го ×1, после 1-го ×3, после 2-го ×6, после 3-го ×9...)
    function getKmMultiplier() {
      return state.currentKmTier === 0 ? 1.0 : state.currentKmTier * 3.0;
    }

    // За каждого убитого босса зомби получают +15% к скорости перемещения
    function getKmEnemySpeedMultiplier() {
      return 1.0 + state.currentKmTier * 0.15;
    }

    // За каждого убитого босса зомби получают +15% к урону
    function getKmEnemyDamageMultiplier() {
      return 1.0 + state.currentKmTier * 0.15;
    }

    // За каждого убитого босса игрок получает +5 к множителю опыта (а Мику умножает этот множитель за босса на 1.5: 7.5, 15, 22.5...)
    function getKmXpMultiplier() {
      if (state.currentKmTier === 0) return 1.0;
      const baseBossXp = state.currentKmTier * 5.0;
      const skin = SKINS[selectedSkinId] || SKINS.teto;
      return baseBossXp * (skin.bossXpFactor || 1.0);
    }

    function spawnZombieWave(canvasWidth, canvasHeight) {
      // Рост плотности толпы замедлен на ~25%
      const tenMinFactor = (state.timeElapsed / 600) * 0.75;
      const hpMult = getKmMultiplier();
      const spdMult = getKmEnemySpeedMultiplier();
      const dmgMult = getKmEnemyDamageMultiplier();

      // Количество зомби в волне растёт на 25% плавнее
      const count = Math.min(22, 3 + Math.floor(tenMinFactor * 12) + Math.floor(state.currentKmTier * 1.5));
      const roadLeft = canvasWidth * 0.14;
      const roadRight = canvasWidth * 0.86;

      for (let i = 0; i < count; i++) {
        const spawnAhead = Math.random() < 0.82;
        const x = roadLeft + 24 + Math.random() * Math.max(80, roadRight - roadLeft - 48);
        const y = spawnAhead
          ? state.cameraY - 40 - Math.random() * 210
          : state.cameraY + canvasHeight + 40;

        const roll = Math.random();
        // Чем сильнее зомби, тем больше опыта он даёт!
        // Обычный ходок (walker): 2 ед. опыта (2 кристалла по 1)
        let type = 'walker';
        let hp = (42 + tenMinFactor * 130) * hpMult;
        let speed = (58 + Math.random() * 22 + Math.min(45, tenMinFactor * 30)) * spdMult;
        let size = 15;
        let xpDrops = 2;
        let xpPerDrop = 1;
        let shirtColor = '#2563eb';
        let contactDmg = 12 * dmgMult;

        if (roll < 0.18) {
          // Спринтер (быстрый, повышенный контактный урон): 3 ед. опыта (3 × 1)
          type = 'sprinter';
          hp *= 0.85;
          speed *= 1.50;
          size = 13;
          shirtColor = '#9333ea';
          xpDrops = 3;
          xpPerDrop = 1;
          contactDmg = Math.round(14 * dmgMult);
        } else if (roll < 0.34 && state.timeElapsed > 20) {
          // Бронированный ОМОН со щитом (ХП ×2.2 + 40% снижение урона = эффективное ХП ×3.7): 12 ед. опыта (4 × 3)
          type = 'riot';
          hp *= 2.2;
          speed *= 0.82;
          size = 18;
          shirtColor = '#334155';
          xpDrops = 4;
          xpPerDrop = 3;
          contactDmg = Math.round(16 * dmgMult);
        } else if (roll < 0.48 && state.timeElapsed > 35) {
          // Кислотный плеватель (стреляет ядом + оставляет ядовитое поле): 5 ед. опыта (5 × 1)
          type = 'spitter';
          hp *= 1.15;
          speed *= 0.90;
          size = 15;
          shirtColor = '#65a30d';
          xpDrops = 5;
          xpPerDrop = 1;
          contactDmg = Math.round(12 * dmgMult);
        } else if (roll < 0.60 && state.timeElapsed > 50) {
          // Подрывник-камикадзе (быстрый, взрывается при смерти): 6 ед. опыта (3 × 2)
          type = 'bomber';
          hp *= 1.1;
          speed *= 1.25;
          size = 16;
          shirtColor = '#dc2626';
          xpDrops = 3;
          xpPerDrop = 2;
          contactDmg = Math.round(24 * dmgMult);
        } else if (roll < 0.72 && state.timeElapsed > 70) {
          // Некромант (ХП ×1.75, ускоряет орду вокруг): 9 ед. опыта (3 × 3)
          type = 'necromancer';
          hp *= 1.75;
          speed *= 0.78;
          size = 17;
          shirtColor = '#581c87';
          xpDrops = 3;
          xpPerDrop = 3;
          contactDmg = Math.round(15 * dmgMult);
        } else if (roll < 0.84 && state.timeElapsed > 60) {
          // Тяжёлый Зомби-Танк (ХП ×4.0, огромный урон и стойкость): 20 ед. опыта (5 × 4)
          type = 'tank';
          hp *= 4.0;
          speed *= 0.72;
          size = 25;
          shirtColor = '#7f1d1d';
          xpDrops = 5;
          xpPerDrop = 4;
          contactDmg = Math.round(22 * dmgMult);
        }

        state.zombies.push({
          x,
          y,
          hp,
          maxHp: hp,
          speed,
          size,
          type,
          shirtColor,
          xpDrops,
          xpPerDrop,
          contactDmg,
          actionTimer: 1.5 + Math.random() * 2.0,
          stunTimer: 0,
          chillTimer: 0,
          hitFlash: 0,
          buffTimer: 0,
          wobblePhase: Math.random() * Math.PI * 2
        });
      }
    }

    const BOSS_SCALING_CONFIG = {
      baseHp: 9000,
      linearKmFactor: 2.2,
      exponentialKmBase: 1.48,
      speedBonusPerKm: 0.14,
      contactDamageBase: 80,
      contactDamagePerKm: 40,
      projectileDamageBonusPerKm: 0.38,
      baseAttackInterval: 2.15,
      attackIntervalDecayPerKm: 0.80,
      minAttackInterval: 0.58,
      extraProjectilesPerKm: 3,
      armorPerKmAfterFirst: 0.09,
      maxArmor: 0.52,
      enrageHpThreshold: 0.45,
      enrageSpeedMult: 1.32,
      enrageCooldownMult: 0.65,
      alwaysLockBottomFromKm: 2,
      arenaMinHeightPx: 500
    };

    const BOSS_VARIETIES = [
      {
        archetype: 'titan',
        title: 'КОРОЛЬ ПЕРЕКРЁСТКА: ЗОМБИ-ТИТАН',
        bodyColor: '#1e1b4b',
        headColor: '#22c55e',
        accentColor: '#facc15',
        eyeColor: '#ef4444',
        speed: 76,
        size: 58,
        hpMultiplier: 1.0,
        armorBonus: 0.0,
        locksBottomImmediately: false,
        canLockBottomOnSpecial: false,
        attackPool: [
          'titan_leap_slam',
          'titan_boulder_hurl',
          'titan_seismic_fissure',
          'titan_shockwave_roar',
          'titan_bull_rush'
        ]
      },
      {
        archetype: 'cyber_riot',
        title: 'КИБЕР-ГОЛИАФ ОМОН-X (БРОНЕ-БОСС)',
        bodyColor: '#0f172a',
        headColor: '#475569',
        accentColor: '#38bdf8',
        eyeColor: '#00f0ff',
        speed: 72,
        size: 62,
        hpMultiplier: 1.25,
        armorBonus: 0.15,
        locksBottomImmediately: false,
        canLockBottomOnSpecial: false,
        attackPool: [
          'cyber_laser_sweep',
          'cyber_shotgun_barrage',
          'cyber_emp_grid',
          'cyber_shield_ram',
          'cyber_squad_deploy'
        ]
      },
      {
        archetype: 'plague_spitter',
        title: 'ТОКСИЧНЫЙ АРХИВАРИУС ЧУМЫ',
        bodyColor: '#365314',
        headColor: '#a3e635',
        accentColor: '#84cc16',
        eyeColor: '#fde047',
        speed: 75,
        size: 56,
        hpMultiplier: 1.15,
        armorBonus: 0.05,
        locksBottomImmediately: false,
        canLockBottomOnSpecial: false,
        attackPool: [
          'plague_mutant_leap',
          'plague_acid_mortar',
          'plague_spore_nova',
          'plague_geyser_trail',
          'plague_outbreak_wave'
        ]
      },
      {
        archetype: 'pyro_bomber',
        title: 'БЕЗУМНЫЙ ПОДРЫВНИК-ДЖАГГЕРНАУТ',
        bodyColor: '#7f1d1d',
        headColor: '#f97316',
        accentColor: '#ef4444',
        eyeColor: '#fef08a',
        speed: 86,
        size: 60,
        hpMultiplier: 1.20,
        armorBonus: 0.08,
        locksBottomImmediately: false,
        canLockBottomOnSpecial: false,
        attackPool: [
          'pyro_rocket_jump',
          'pyro_carpet_bombs',
          'pyro_hellfire_cross',
          'pyro_cluster_salvo',
          'pyro_kamikaze_call'
        ]
      },
      {
        archetype: 'necro_lord',
        title: 'ВЕРХОВНЫЙ НЕКРО-ДИРИЖЁР НОЧИ',
        bodyColor: '#3b0764',
        headColor: '#c084fc',
        accentColor: '#e879f9',
        eyeColor: '#f43f5e',
        speed: 80,
        size: 58,
        hpMultiplier: 1.30,
        armorBonus: 0.12,
        locksBottomImmediately: false,
        canLockBottomOnSpecial: false,
        attackPool: [
          'necro_abyss_pentagrams',
          'necro_skull_symphony',
          'necro_void_lasers',
          'necro_phantom_pounce',
          'necro_legion_ritual'
        ]
      }
    ];

    function getBossMissingHpRageMult(b) {
      // По мере процентной потери ХП босс получает бонус к передвижению и частоте атак вплоть до +300% (множитель от 1.0x до 4.0x)!
      const missingRatio = Math.max(0, Math.min(1, 1 - (b.hp / Math.max(1, b.maxHp))));
      return 1 + missingRatio * 3.0;
    }

    function getBossAttackCooldown(b) {
      const cfg = BOSS_SCALING_CONFIG;
      const rawCd = cfg.baseAttackCooldown - Math.max(0, b.kmNumber - 1) * cfg.cooldownReductionPerKm;
      const baseCd = Math.max(cfg.minAttackCooldown, rawCd);
      const freqMult = getBossMissingHpRageMult(b);
      return Math.max(0.28, baseCd / freqMult);
    }

    function lockBossBottomArena(b, canvasHeight) {
      // Ограничение сзади убрано по запросу игрока (чтобы на любых экранах хватало места для манёвра!)
      b.bottomBarrierLocked = false;
    }

    // Запускает напрыгивание босса в сторону игрока на фиксированное расстояние (замена лазеров для подходящих боссов!)
    function startBossFixedDistanceLeap(b, p, roadLeft, roadRight, fixedDist = 240, landingType = 'quake') {
      const ang = Math.atan2(p.y - b.y, p.x - b.x);
      let tx = b.x + Math.cos(ang) * fixedDist;
      let ty = b.y + Math.sin(ang) * fixedDist;
      tx = Math.max(roadLeft + b.size + 10, Math.min(roadRight - b.size - 10, tx));
      if (b.barrierY !== undefined && ty < b.barrierY + 95) {
        ty = b.barrierY + 95;
      }
      if (ty > 0) ty = 0;

      const leapDuration = 0.52;
      b.leapState = {
        startX: b.x,
        startY: b.y,
        targetX: tx,
        targetY: ty,
        elapsed: 0,
        duration: leapDuration,
        landingType
      };
      // Показываем зону приземления прыжка босса
      state.visualEffects.push({
        type: 'boss_hazard_zone',
        x: tx,
        y: ty,
        radius: 88 + Math.min(28, b.kmNumber * 4),
        damage: Math.round((38 + b.kmNumber * 14) * (b.projDmgMult || 1)),
        color: b.accentColor || '#facc15',
        spawnAcid: landingType === 'acid',
        timer: leapDuration,
        maxTimer: leapDuration
      });
      SoundFX.playBoom(0.26, 0.08);
    }

    function spawnKilometerBoss(canvasWidth, kmNumber, canvasHeight = 600) {
      const cfg = BOSS_SCALING_CONFIG;
      const variety = BOSS_VARIETIES[(kmNumber - 1) % BOSS_VARIETIES.length];
      const kmHpScale = (kmNumber * cfg.linearKmFactor) * Math.pow(cfg.exponentialKmBase, Math.max(0, kmNumber - 1));
      const bossHp = Math.round(cfg.baseHp * kmHpScale * (variety.hpMultiplier || 1.0));
      const bossSpeed = Math.round(variety.speed * (1 + Math.max(0, kmNumber - 1) * cfg.speedBonusPerKm));
      const bossArmor = Math.min(
        cfg.maxArmor,
        (variety.armorBonus || 0) + Math.max(0, kmNumber - 1) * cfg.armorPerKmAfterFirst
      );
      const projDmgMult = (1 + Math.max(0, kmNumber - 1) * cfg.projectileDamageBonusPerKm) * getKmEnemyDamageMultiplier();

      // Верхняя полоса-барьер на уровне прибытия игрока (сзади ограничения нет!)
      const topScreenOffset = Math.max(240, Math.round(canvasHeight * 0.58));
      const barrierY = -kmNumber * 1000 * PIXELS_PER_METER - topScreenOffset;

      // На 1 км у босса 1 способность из его пула (5 уникальных атак), на 2 км — 2, ..., с 5 км — все 5!
      const fullPool = Array.isArray(variety.attackPool) && variety.attackPool.length === 5
        ? [...variety.attackPool]
        : ['titan_leap_slam', 'titan_boulder_hurl', 'titan_seismic_fissure', 'titan_shockwave_roar', 'titan_bull_rush'];
      for (let i = fullPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [fullPool[i], fullPool[j]] = [fullPool[j], fullPool[i]];
      }
      const unlockedCount = Math.min(5, Math.max(1, kmNumber));
      const unlockedAttacks = fullPool.slice(0, unlockedCount);

      state.boss = {
        kmNumber,
        barrierY,
        bottomBarrierLocked: false,
        canLockBottomOnSpecial: false,
        archetype: variety.archetype,
        title: variety.title,
        bodyColor: variety.bodyColor,
        headColor: variety.headColor,
        accentColor: variety.accentColor,
        eyeColor: variety.eyeColor,
        x: canvasWidth / 2,
        y: barrierY + 135,
        zOffset: 0,
        leapState: null,
        unlockedAttacks,
        hp: bossHp,
        maxHp: bossHp,
        size: variety.size + Math.min(18, (kmNumber - 1) * 3),
        speed: bossSpeed,
        armorReduction: bossArmor,
        projDmgMult,
        enraged: false,
        attackTimer: 1.5,
        attackPhase: 0,
        hitFlash: 0,
        chillTimer: 0
      };

      const stContainer = document.getElementById('streetProgressContainer');
      if (stContainer) stContainer.classList.add('hidden');
      document.getElementById('bossHudContainer').classList.remove('hidden');
      document.getElementById('bossStatusLabel').textContent = `🚨 БОСС ${kmNumber} КМ: ${variety.title}!`;
      showToast(
        `🚨 РУБЕЖ ${kmNumber} КМ: ${variety.title}!`,
        `Спец-атак из пула босса: ${unlockedCount}/5 • Броня: ${Math.round(bossArmor * 100)}% • Урон ×${projDmgMult.toFixed(1)}`,
        'border-red-500 bg-red-950/95'
      );
      triggerCutin('imgCutinShock', `БОСС ${kmNumber} КМ: ${variety.title}!`);
      state.screenShake = 0.55;
      SoundFX.playBoom(0.55, 0.14);
    }

    // =========================================================================
    // 13. COMBAT, EXPLOSIONS, & PERFORMANCE-OPTIMIZED PARTICLES
    // =========================================================================
    function addDamageNumber(x, y, dmg, color = '#ffffff') {
      if (state.damageNumbers.length > 42) return;
      state.damageNumbers.push({
        x: x + (Math.random() - 0.5) * 14,
        y: y - 10,
        vy: -45,
        text: typeof dmg === 'number' ? Math.round(dmg).toString() : String(dmg),
        color,
        timer: 0.45
      });
    }

    function damageZombie(z, dmg, knockbackAngle = null, knockbackForce = 0, ignoreShield = false) {
      let actualDmg = dmg;
      if (z.type === 'riot' && !ignoreShield) {
        actualDmg *= 0.60;
        knockbackForce *= 0.30;
      }
      z.hp -= actualDmg;
      z.hitFlash = 0.09;
      if (Math.random() < 0.45) {
        addDamageNumber(z.x, z.y - z.size, actualDmg, z.type === 'riot' && !ignoreShield ? '#94a3b8' : '#fef08a');
      }

      if (knockbackAngle !== null && knockbackForce > 0) {
        const resist = z.type === 'tank' ? 0.35 : 1.0;
        z.x += Math.cos(knockbackAngle) * knockbackForce * resist;
        z.y += Math.sin(knockbackAngle) * knockbackForce * resist;
      }
    }

    function spawnZombieDeathParticles(z) {
      const { x, y, xpDrops = 2, xpPerDrop = 1, type, isBoss = false } = z;
      const totalBaseXp = xpDrops * xpPerDrop;

      // Consolidate XP on the ground without auto-magnetizing when particle count is high
      if (state.xpParticles.length > 260 && !isBoss) {
        state.xpParticles.push({
          x,
          y,
          vx: 0,
          vy: 0,
          size: 9.5,
          value: totalBaseXp,
          color: '#34d399',
          magnetized: false
        });
      } else {
        for (let i = 0; i < xpDrops; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = isBoss ? (55 + Math.random() * 145) : (35 + Math.random() * 85);
          state.xpParticles.push({
            x: x + (Math.random() - 0.5) * (isBoss ? 24 : 12),
            y: y + (Math.random() - 0.5) * (isBoss ? 24 : 12),
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            size: isBoss ? 10 : (6 + Math.min(4, xpPerDrop)),
            value: xpPerDrop,
            color: isBoss ? '#fde047' : (xpPerDrop >= 3 ? '#34d399' : (Math.random() < 0.5 ? '#4ade80' : '#a3e635')),
            magnetized: false
          });
        }
      }

      if (state.visualEffects.length < 130) {
        for (let i = 0; i < 4; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 65 + Math.random() * 135;
          state.visualEffects.push({
            type: 'voxel_splat',
            x,
            y,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            size: 5 + Math.random() * 3,
            color: i % 2 === 0 ? '#22c55e' : '#86efac',
            timer: 0.32,
            maxTimer: 0.32
          });
        }
      }

      if (type === 'spitter' && state.acidPools.length < 15) {
        state.acidPools.push({
          x,
          y,
          radius: 44,
          damagePerSec: Math.round(18 * getKmEnemyDamageMultiplier()),
          isHealingZone: false,
          timer: 2.4
        });
      } else if (type === 'bomber') {
        // Взрыв зомби-подрывника (урон растёт на +15% за каждого босса)
        SoundFX.playBoom(0.24, 0.06);
        state.visualEffects.push({
          type: 'square_explosion',
          x,
          y,
          halfSide: 75,
          color: '#ef4444',
          timer: 0.38,
          maxTimer: 0.38
        });
        damageObstaclesInSquare(x, y, 75, false);
        const p = state.player;
        if (Math.abs(p.x - x) <= 75 + p.radius && Math.abs(p.y - y) <= 75 + p.radius) {
          if (p.shieldTimer <= 0 && p.invulnTimer <= 0) {
            const bDmg = Math.round(24 * getKmEnemyDamageMultiplier());
            p.hp = Math.max(0, p.hp - bDmg);
            p.invulnTimer = 0.45;
            addDamageNumber(p.x, p.y - 20, bDmg, '#ef4444');
          }
        }
      }
    }

    // =========================================================================
    // 13.5. PROCEDURAL STREET DETAILS, COLLISIONS & EXPLOSIVE DESTRUCTION
    //       (Burning barrels, oil/mud stains, tires, wrecked cars, trash, barricades, road cracks)
    // =========================================================================
    const STREET_CHUNK_HEIGHT = 280;

    function seededHash(n) {
      const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
      return s - Math.floor(s);
    }

    function generateStreetChunk(chunkIdx, canvasWidth) {
      const chunkTopY = chunkIdx * STREET_CHUNK_HEIGHT;
      const roadLeft = canvasWidth * 0.14;
      const roadRight = canvasWidth * 0.86;
      const roadWidth = roadRight - roadLeft;
      let seed = chunkIdx * 97 + 13;
      const rand = () => {
        seed += 1.61803398875;
        return seededHash(seed);
      };

      // 1. Трещины на асфальте и тротуаре (Road Cracks)
      const crackCount = 3 + Math.floor(rand() * 4);
      for (let i = 0; i < crackCount; i++) {
        const cx = roadLeft - 20 + rand() * (roadWidth + 40);
        const cy = chunkTopY + rand() * STREET_CHUNK_HEIGHT;
        const mainSegs = [];
        const branches = [];
        let currX = 0;
        let currY = 0;
        let baseAng = rand() * Math.PI * 2;
        const steps = 4 + Math.floor(rand() * 4);
        for (let s = 0; s < steps; s++) {
          const stepLen = 10 + rand() * 16;
          baseAng += (rand() - 0.5) * 1.1;
          const nx = currX + Math.cos(baseAng) * stepLen;
          const ny = currY + Math.sin(baseAng) * stepLen;
          mainSegs.push({ x1: currX, y1: currY, x2: nx, y2: ny });
          if (rand() < 0.55) {
            const bAng = baseAng + (rand() < 0.5 ? 0.75 : -0.75);
            const bLen = 7 + rand() * 12;
            branches.push({
              x1: nx,
              y1: ny,
              x2: nx + Math.cos(bAng) * bLen,
              y2: ny + Math.sin(bAng) * bLen
            });
          }
          currX = nx;
          currY = ny;
        }
        state.streetDecals.push({
          chunkIdx,
          type: 'crack',
          x: cx,
          y: cy,
          mainSegs,
          branches
        });
      }

      // 2. Пятна масла, копоти, грязи и тёмные лужи (Oil / Mud / Grime Stains)
      const stainCount = 2 + Math.floor(rand() * 3);
      const stainColors = [
        'rgba(14, 17, 23, 0.68)',
        'rgba(58, 39, 24, 0.46)',
        'rgba(38, 28, 20, 0.52)',
        'rgba(18, 24, 34, 0.60)'
      ];
      for (let i = 0; i < stainCount; i++) {
        const sx = roadLeft + 18 + rand() * Math.max(60, roadWidth - 36);
        const sy = chunkTopY + rand() * STREET_CHUNK_HEIGHT;
        state.streetDecals.push({
          chunkIdx,
          type: 'stain',
          x: sx,
          y: sy,
          w: 28 + rand() * 44,
          h: 20 + rand() * 34,
          angle: (rand() - 0.5) * 1.2,
          isRect: rand() < 0.62,
          color: stainColors[Math.floor(rand() * stainColors.length)]
        });
      }

      // 3. Следы покрышек (Tire Skid Marks) и разбросанные старые покрышки (Loose Tires)
      if (rand() < 0.75) {
        const tx = roadLeft + 45 + rand() * Math.max(60, roadWidth - 90);
        const ty = chunkTopY + rand() * STREET_CHUNK_HEIGHT;
        state.streetDecals.push({
          chunkIdx,
          type: 'tire_skid',
          x: tx,
          y: ty,
          length: 55 + rand() * 65,
          angle: -Math.PI / 2 + (rand() - 0.5) * 0.65
        });
      }
      const looseTireCount = 1 + Math.floor(rand() * 2);
      for (let i = 0; i < looseTireCount; i++) {
        state.streetDecals.push({
          chunkIdx,
          type: 'loose_tire',
          x: roadLeft + 10 + rand() * Math.max(60, roadWidth - 20),
          y: chunkTopY + rand() * STREET_CHUNK_HEIGHT,
          radius: 9 + rand() * 3,
          angle: rand() * Math.PI * 2
        });
      }

      // 4. Мусор на улице: листы бумаги, коробки, обломки кирпичей, банки и дорожные конусы (Photos 2 & 3)
      const trashCount = 5 + Math.floor(rand() * 5);
      for (let i = 0; i < trashCount; i++) {
        const rKind = rand();
        let subType = 'paper';
        if (rKind < 0.42) subType = 'paper';
        else if (rKind < 0.64) subType = 'rubble';
        else if (rKind < 0.82) subType = 'cardboard';
        else subType = 'cone';

        state.streetDecals.push({
          chunkIdx,
          type: 'trash',
          subType,
          x: roadLeft - 12 + rand() * (roadWidth + 24),
          y: chunkTopY + rand() * STREET_CHUNK_HEIGHT,
          w: subType === 'cardboard' ? (12 + rand() * 8) : (7 + rand() * 5),
          h: subType === 'cardboard' ? (10 + rand() * 6) : (5 + rand() * 4),
          angle: rand() * Math.PI * 2,
          tint: rand() < 0.5 ? '#e2e8f0' : '#cbd5e1'
        });
      }

      // 5. Крупные объекты с коллизией и разрушением от взрывов:
      //    Горящие бочки (burning_barrel), Уничтоженные машины (destroyed_car),
      //    Баррикады (barricade), Связки покрышек (tire_stack)
      const obstacleCount = 2 + Math.floor(rand() * 3); // 2 to 4 per chunk
      const carPalettes = [
        { body: '#18181b', roof: '#27272a', accent: '#3f3f46', stripe: null },       // Charred black wreck (Photo 3)
        { body: '#450a0a', roof: '#7f1d1d', accent: '#991b1b', stripe: null },       // Rusted dark crimson sedan
        { body: '#1e293b', roof: '#f8fafc', accent: '#38bdf8', stripe: 'police' },   // Abandoned police cruiser
        { body: '#713f12', roof: '#a16207', accent: '#eab308', stripe: 'taxi' },     // Burnt yellow taxi
        { body: '#172554', roof: '#1e3a8a', accent: '#60a5fa', stripe: null }        // Wrecked dark blue car
      ];

      for (let i = 0; i < obstacleCount; i++) {
        const obsY = chunkTopY + 32 + rand() * (STREET_CHUNK_HEIGHT - 64);

        // Не спавним крупные препятствия прямо в стартовой точке игрока (y ~ 0)
        if (Math.abs(obsY) < 185) continue;

        // Не спавним препятствия прямо на линии блокпоста Босса каждого километра
        const nearestKm = Math.max(1, Math.round(Math.abs(obsY) / (1000 * PIXELS_PER_METER)));
        const approxBossBarrierY = -nearestKm * 1000 * PIXELS_PER_METER - 350;
        if (Math.abs(obsY - approxBossBarrierY) < 220) continue;

        const kindRoll = rand();
        let kind = 'burning_barrel';
        if (kindRoll < 0.34) kind = 'burning_barrel';
        else if (kindRoll < 0.62) kind = 'barricade';
        else if (kindRoll < 0.84) kind = 'destroyed_car';
        else kind = 'tire_stack';

        // Выбираем X так, чтобы бочки и машины чаще стояли ближе к обочинам или со смещением по полосам,
        // оставляя разнообразные проходы
        let obsX;
        if (kind === 'burning_barrel') {
          if (rand() < 0.55) {
            // Ближе к тротуару или обочине, как на фото 2 и 3
            const leftSide = rand() < 0.5;
            obsX = leftSide
              ? (roadLeft - 6 + rand() * (roadWidth * 0.24))
              : (roadRight - roadWidth * 0.24 + rand() * (roadWidth * 0.24 + 6));
          } else {
            obsX = roadLeft + 34 + rand() * Math.max(60, roadWidth - 68);
          }
        } else if (kind === 'destroyed_car') {
          obsX = roadLeft + 54 + rand() * Math.max(80, roadWidth - 108);
        } else {
          obsX = roadLeft + 38 + rand() * Math.max(60, roadWidth - 76);
        }

        // Проверка дистанции до других крупных объектов, чтобы не перекрывать всю ширину улицы наглухо
        let tooClose = false;
        let sameRowCount = 0;
        for (let k = state.streetObstacles.length - 1; k >= Math.max(0, state.streetObstacles.length - 25); k--) {
          const other = state.streetObstacles[k];
          const d = Math.hypot(other.x - obsX, other.y - obsY);
          if (d < 118) {
            tooClose = true;
            break;
          }
          if (Math.abs(other.y - obsY) < 85) {
            sameRowCount++;
          }
        }
        if (tooClose || sameRowCount >= 2) continue;

        if (kind === 'burning_barrel') {
          state.streetObstacles.push({
            chunkIdx,
            kind: 'burning_barrel',
            x: obsX,
            y: obsY,
            isCircle: true,
            radius: 19,
            hp: 75,
            maxHp: 75,
            angle: 0,
            flamePhase: rand() * Math.PI * 2,
            destroyed: false
          });
        } else if (kind === 'barricade') {
          const variant = rand() < 0.68 ? 'sawhorse' : 'concrete';
          state.streetObstacles.push({
            chunkIdx,
            kind: 'barricade',
            variant,
            x: obsX,
            y: obsY,
            isCircle: false,
            hp: 110,
            maxHp: 110,
            halfW: 36,
            halfH: 13,
            radius: 38,
            angle: (rand() - 0.5) * 0.48,
            destroyed: false
          });
        } else if (kind === 'destroyed_car') {
          const pal = carPalettes[Math.floor(rand() * carPalettes.length)];
          // Машина стоит вдоль улицы или под углом аварии
          const baseVertical = rand() < 0.5 ? -Math.PI / 2 : Math.PI / 2;
          const carAngle = baseVertical + (rand() - 0.5) * 0.85;
          state.streetObstacles.push({
            chunkIdx,
            kind: 'destroyed_car',
            palette: pal,
            x: obsX,
            y: obsY,
            isCircle: false,
            hp: 180,
            maxHp: 180,
            halfW: 44,
            halfH: 23,
            radius: 48,
            angle: carAngle,
            hasHoodFire: rand() < 0.65,
            flamePhase: rand() * Math.PI * 2,
            destroyed: false
          });
        } else if (kind === 'tire_stack') {
          state.streetObstacles.push({
            chunkIdx,
            kind: 'tire_stack',
            x: obsX,
            y: obsY,
            isCircle: true,
            radius: 21,
            hp: 85,
            maxHp: 85,
            angle: rand() * Math.PI * 2,
            smoldering: rand() < 0.5,
            flamePhase: rand() * Math.PI * 2,
            destroyed: false
          });
        }
      }
    }

    function ensureProceduralStreetChunks(canvasWidth, canvasHeight) {
      const topY = state.cameraY - 600;
      const bottomY = state.cameraY + canvasHeight + 420;
      const minChunk = Math.floor(topY / STREET_CHUNK_HEIGHT);
      const maxChunk = Math.floor(bottomY / STREET_CHUNK_HEIGHT);

      for (let c = minChunk; c <= maxChunk; c++) {
        if (!state.generatedChunks.has(c)) {
          state.generatedChunks.add(c);
          generateStreetChunk(c, canvasWidth);
        }
      }

      // Очистка старых чанков далеко позади/впереди камеры для стабильных 60 FPS
      if (state.streetDecals.length > 480) {
        state.streetDecals = state.streetDecals.filter(d => {
          const keep = d.y >= topY - 900 && d.y <= bottomY + 900;
          if (!keep && (d.chunkIdx < minChunk - 3 || d.chunkIdx > maxChunk + 3)) {
            state.generatedChunks.delete(d.chunkIdx);
          }
          return keep;
        });
      }
      if (state.streetObstacles.length > 140) {
        state.streetObstacles = state.streetObstacles.filter(o => !o.destroyed && o.y >= topY - 900 && o.y <= bottomY + 900);
      }
    }

    // Коллизия круглой сущности (игрок, зомби, плюшка) с крупными объектами улицы (круглыми и повёрнутыми прямоугольниками)
    function resolveEntityObstacleCollisions(entity, entityRadius, dt = 0.016, isZombie = false) {
      for (let i = state.streetObstacles.length - 1; i >= 0; i--) {
        const obs = state.streetObstacles[i];
        if (!obs || obs.destroyed) continue;
        if (obs.hitFlash && obs.hitFlash > 0 && !isZombie) {
          obs.hitFlash = Math.max(0, obs.hitFlash - dt);
        }

        const maxR = (obs.radius || 46) + entityRadius + 4;
        const dx = entity.x - obs.x;
        const dy = entity.y - obs.y;
        if (Math.abs(dx) > maxR || Math.abs(dy) > maxR) continue;

        let collided = false;
        if (obs.isCircle) {
          const dist = Math.hypot(dx, dy);
          const minDist = obs.radius + entityRadius;
          if (dist < minDist) {
            collided = true;
            const nx = dist > 0.001 ? dx / dist : 0;
            const ny = dist > 0.001 ? dy / dist : 1;
            const push = minDist - dist;
            entity.x += nx * push;
            entity.y += ny * push;
          }
        } else {
          const cosA = Math.cos(-obs.angle);
          const sinA = Math.sin(-obs.angle);
          const localX = dx * cosA - dy * sinA;
          const localY = dx * sinA + dy * cosA;

          const clampedX = Math.max(-obs.halfW, Math.min(obs.halfW, localX));
          const clampedY = Math.max(-obs.halfH, Math.min(obs.halfH, localY));
          const diffX = localX - clampedX;
          const diffY = localY - clampedY;
          const distSq = diffX * diffX + diffY * diffY;

          if (distSq < entityRadius * entityRadius) {
            collided = true;
            const dist = Math.sqrt(distSq);
            let pushLocalX = 0;
            let pushLocalY = 0;
            if (dist > 0.001) {
              const overlap = entityRadius - dist;
              pushLocalX = (diffX / dist) * overlap;
              pushLocalY = (diffY / dist) * overlap;
            } else {
              const penX = obs.halfW - Math.abs(localX) + entityRadius;
              const penY = obs.halfH - Math.abs(localY) + entityRadius;
              if (penX < penY) {
                pushLocalX = localX >= 0 ? penX : -penX;
              } else {
                pushLocalY = localY >= 0 ? penY : -penY;
              }
            }
            const cosBack = Math.cos(obs.angle);
            const sinBack = Math.sin(obs.angle);
            entity.x += pushLocalX * cosBack - pushLocalY * sinBack;
            entity.y += pushLocalX * sinBack + pushLocalY * cosBack;
          }
        }

        // Зомби, упираясь в препятствие, постепенно ломают его!
        if (collided && isZombie) {
          if (obs.maxHp === undefined) {
            obs.maxHp = obs.kind === 'destroyed_car' ? 180 : (obs.kind === 'barricade' ? 110 : 80);
            obs.hp = obs.maxHp;
          }
          const breakDmg = Math.max(22, (entity.contactDmg || 18) * 1.8) * dt;
          obs.hp -= breakDmg;
          obs.hitFlash = 0.12;
          if (Math.random() < 0.14 && state.visualEffects.length < 140) {
            state.visualEffects.push({
              type: 'voxel_splat',
              x: obs.x + (Math.random() - 0.5) * 20,
              y: obs.y + (Math.random() - 0.5) * 16,
              vx: (Math.random() - 0.5) * 90,
              vy: -40 - Math.random() * 60,
              size: 4.5,
              color: '#94a3b8',
              timer: 0.22,
              maxTimer: 0.22
            });
          }
          if (obs.hp <= 0) {
            state.streetObstacles.splice(i, 1);
            destroyStreetObstacle(obs, false);
          }
        }
      }
    }

    function destroyStreetObstacle(obs, allowSecondaryBlast = true) {
      if (!obs || obs._destroyedDone) return;
      obs.destroyed = true;
      obs._destroyedDone = true;

      // Оставляем на асфальте плоский след разрушенного объекта (без коллизии)
      state.streetDecals.push({
        chunkIdx: obs.chunkIdx,
        type: 'destroyed_remnant',
        remnantKind: obs.kind,
        x: obs.x,
        y: obs.y,
        halfW: obs.halfW || obs.radius || 22,
        halfH: obs.halfH || obs.radius || 22,
        angle: obs.angle || 0
      });

      const debrisColor = obs.kind === 'barricade'
        ? '#f87171'
        : (obs.kind === 'burning_barrel' ? '#fb923c' : (obs.kind === 'tire_stack' ? '#334175' : '#94a3b8'));
      if (state.visualEffects.length < 155) {
        for (let i = 0; i < 8; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 85 + Math.random() * 190;
          state.visualEffects.push({
            type: 'voxel_splat',
            x: obs.x + (Math.random() - 0.5) * 20,
            y: obs.y + (Math.random() - 0.5) * 20,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            size: 6 + Math.random() * 4,
            color: i % 2 === 0 ? debrisColor : '#fde047',
            timer: 0.42,
            maxTimer: 0.42
          });
        }
      }

      const p = state.player;
      if (obs.kind === 'destroyed_car') {
        // Машины при уничтожении взрываются (с уникальным авто-взрывом, чёрным дымом и разлетающимися деталями кузова!), нанося 2500 урона зомби/боссу и 100 игроку!
        const carRad = 225;
        SoundFX.playBoom(0.42, 0.14);
        state.screenShake = Math.max(state.screenShake, 0.38);
        if (state.scorchMarks.length > 28) state.scorchMarks.shift();
        state.scorchMarks.push({ x: obs.x, y: obs.y, halfSide: carRad * 0.76, alpha: 0.68 });
        state.visualEffects.push({
          type: 'car_wreck_explosion',
          x: obs.x,
          y: obs.y,
          radius: carRad,
          carColor: obs.color || '#dc2626',
          timer: 0.72,
          maxTimer: 0.72
        });
        const partKinds = ['wheel', 'door', 'wheel', 'bumper', 'hood', 'wheel'];
        for (let pi = 0; pi < partKinds.length; pi++) {
          const pAng = (pi / partKinds.length) * Math.PI * 2 + (Math.random() - 0.5) * 0.45;
          const pDist = 85 + Math.random() * 125;
          state.visualEffects.push({
            type: 'car_debris_part',
            partKind: partKinds[pi],
            startX: obs.x,
            startY: obs.y,
            targetX: obs.x + Math.cos(pAng) * pDist,
            targetY: obs.y + Math.sin(pAng) * pDist,
            arcHeight: 55 + Math.random() * 65,
            rotSpeed: (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 7),
            color: obs.color || '#dc2626',
            timer: 0.68,
            maxTimer: 0.68
          });
        }
        addDamageNumber(obs.x, obs.y - 28, '💥 ВЗРЫВ МАШИНЫ! (2500)', '#ef4444');

        // Урон 2500 по зомби
        for (const z of state.zombies) {
          const distZ = Math.hypot(z.x - obs.x, z.y - obs.y);
          if (distZ <= carRad + z.size) {
            const angZ = Math.atan2(z.y - obs.y, z.x - obs.x);
            damageZombie(z, 2500, angZ, 38, true);
          }
        }
        // Урон 2500 по боссу
        if (state.boss) {
          const distB = Math.hypot(state.boss.x - obs.x, state.boss.y - obs.y);
          if (distB <= carRad + state.boss.size) {
            state.boss.hp -= 2500;
            state.boss.hitFlash = 0.18;
            addDamageNumber(state.boss.x, state.boss.y - 36, '-2500 (ВЗРЫВ МАШИНЫ!)', '#ef4444');
          }
        }
        // Урон 100 по игроку (в 2 раза меньше: 100 ед.; защищает только активный Деш или Дива-Щит!)
        if (Math.hypot(p.x - obs.x, p.y - obs.y) <= carRad + p.radius) {
          if ((p.shieldTimer || 0) <= 0 && (p.dashActiveTimer || 0) <= 0) {
            p.hp = Math.max(0, p.hp - 100);
            p.hitFlash = 0.25;
            addDamageNumber(p.x, p.y - 26, '-100 💥 ВЗРЫВ МАШИНЫ!', '#ef4444');
            updateHudDOM();
            if (p.hp <= 0) {
              finishGame();
            }
          }
        }
        if (allowSecondaryBlast) {
          damageObstaclesInCircle(obs.x, obs.y, carRad * 0.75, true);
        }
      } else if (obs.kind === 'burning_barrel') {
        // Горящие бочки при уничтожении взрываются разливом напалма и кольцом пламени (отличается от взрывов игрока!), поджигая на 10с зомби/босса и на 1.5с игрока!
        const barrelRad = 195;
        SoundFX.playBoom(0.30, 0.18);
        state.screenShake = Math.max(state.screenShake, 0.24);
        state.visualEffects.push({
          type: 'barrel_napalm_explosion',
          x: obs.x,
          y: obs.y,
          radius: barrelRad,
          seed: Math.random() * 100,
          timer: 0.85,
          maxTimer: 0.85
        });
        addDamageNumber(obs.x, obs.y - 24, '🔥 ПОДЖОГ БОЧКИ!', '#fb923c');

        // Поджог зомби на 10 секунд
        for (const z of state.zombies) {
          const distZ = Math.hypot(z.x - obs.x, z.y - obs.y);
          if (distZ <= barrelRad + z.size) {
            z.burnTimer = Math.max(z.burnTimer || 0, 10.0);
            z.burnDps = Math.max(z.burnDps || 0, 160);
            addDamageNumber(z.x, z.y - z.size, '🔥 ГОРИТ 10С!', '#fb923c');
          }
        }
        // Поджог босса на 10 секунд
        if (state.boss) {
          const distB = Math.hypot(state.boss.x - obs.x, state.boss.y - obs.y);
          if (distB <= barrelRad + state.boss.size) {
            state.boss.burnTimer = Math.max(state.boss.burnTimer || 0, 10.0);
            state.boss.burnDps = Math.max(state.boss.burnDps || 0, 280);
            addDamageNumber(state.boss.x, state.boss.y - 36, '🔥 БОСС ГОРИТ 10С!', '#fb923c');
          }
        }
        // Поджог игрока на 1.5 секунды (в 2 раза меньше: 1.5с; не блокируется микро-неуязвимостью от касания зомби!)
        if (Math.hypot(p.x - obs.x, p.y - obs.y) <= barrelRad + p.radius) {
          if ((p.shieldTimer || 0) <= 0 && (p.dashActiveTimer || 0) <= 0) {
            p.burnTimer = Math.max(p.burnTimer || 0, 1.5);
            p.burnDps = 25;
            p.burnTickAccum = 0;
            p.hp = Math.max(0, p.hp - 15);
            addDamageNumber(p.x, p.y - 26, '-15 🔥 ПОДЖОГ 1.5С!', '#fb923c');
            updateHudDOM();
            if (p.hp <= 0) {
              finishGame();
            }
          }
        }
      } else if (obs.kind === 'barricade') {
        addDamageNumber(obs.x, obs.y - 20, '💥 РАЗРУШЕНО!', '#fde047');
      } else if (obs.kind === 'tire_stack') {
        addDamageNumber(obs.x, obs.y - 20, '💥 ПОКРЫШКИ!', '#94a3b8');
      }
    }

    function damageObstaclesInSquare(cx, cy, halfSide, isSecondary = false) {
      const destroyedList = [];
      for (let i = state.streetObstacles.length - 1; i >= 0; i--) {
        const obs = state.streetObstacles[i];
        if (!obs || obs.destroyed) continue;
        const r = obs.isCircle ? obs.radius : Math.max(obs.halfW, obs.halfH);
        if (Math.abs(obs.x - cx) <= halfSide + r && Math.abs(obs.y - cy) <= halfSide + r) {
          obs.destroyed = true;
          state.streetObstacles.splice(i, 1);
          destroyedList.push(obs);
        }
      }
      for (const obs of destroyedList) {
        destroyStreetObstacle(obs, !isSecondary);
      }
    }

    function damageObstaclesInCircle(cx, cy, radius, isSecondary = false) {
      const destroyedList = [];
      for (let i = state.streetObstacles.length - 1; i >= 0; i--) {
        const obs = state.streetObstacles[i];
        if (!obs || obs.destroyed) continue;
        const r = obs.isCircle ? obs.radius : Math.max(obs.halfW, obs.halfH);
        if (Math.hypot(obs.x - cx, obs.y - cy) <= radius + r) {
          obs.destroyed = true;
          state.streetObstacles.splice(i, 1);
          destroyedList.push(obs);
        }
      }
      for (const obs of destroyedList) {
        destroyStreetObstacle(obs, !isSecondary);
      }
    }

    function createSquareExplosion(cx, cy, halfSide, damage, color = '#f97316') {
      SoundFX.playBoom(0.26, 0.07);
      state.screenShake = Math.max(state.screenShake, 0.20);

      if (state.scorchMarks.length > 28) state.scorchMarks.shift();
      state.scorchMarks.push({
        x: cx,
        y: cy,
        halfSide: halfSide * 0.85,
        alpha: 0.5
      });

      state.visualEffects.push({
        type: 'square_explosion',
        x: cx,
        y: cy,
        halfSide,
        color,
        timer: 0.42,
        maxTimer: 0.42
      });

      if (state.visualEffects.length < 140) {
        for (let i = 0; i < 6; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 95 + Math.random() * 170;
          state.visualEffects.push({
            type: 'voxel_splat',
            x: cx + (Math.random() - 0.5) * halfSide,
            y: cy + (Math.random() - 0.5) * halfSide,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            size: 6,
            color: i % 2 === 0 ? '#fde047' : '#fb923c',
            timer: 0.35,
            maxTimer: 0.35
          });
        }
      }

      damageObstaclesInSquare(cx, cy, halfSide, false);
      for (const z of state.zombies) {
        if (Math.abs(z.x - cx) <= halfSide + z.size && Math.abs(z.y - cy) <= halfSide + z.size) {
          const ang = Math.atan2(z.y - cy, z.x - cx);
          damageZombie(z, damage, ang, 28, true);
        }
      }
      if (state.boss) {
        if (Math.abs(state.boss.x - cx) <= halfSide + state.boss.size && Math.abs(state.boss.y - cy) <= halfSide + state.boss.size) {
          state.boss.hp -= damage;
          state.boss.hitFlash = 0.15;
          addDamageNumber(state.boss.x, state.boss.y - 40, damage, '#f97316');
        }
      }
    }

    function createExplosion(x, y, radius, damage, color = '#f97316', isSecondary = false) {
      SoundFX.playBoom(0.20, 0.06);
      state.screenShake = Math.max(state.screenShake, 0.14);
      if (state.scorchMarks.length > 28) state.scorchMarks.shift();
      state.scorchMarks.push({
        x,
        y,
        halfSide: radius * 0.65,
        alpha: 0.45
      });
      state.visualEffects.push({
        type: 'explosion',
        x,
        y,
        radius,
        color,
        timer: 0.36,
        maxTimer: 0.36
      });
      damageObstaclesInCircle(x, y, radius, isSecondary);
      for (const z of state.zombies) {
        const dist = Math.hypot(z.x - x, z.y - y);
        if (dist <= radius + z.size) {
          const ang = Math.atan2(z.y - y, z.x - x);
          damageZombie(z, damage, ang, 24, true);
        }
      }
      if (state.boss) {
        const distB = Math.hypot(state.boss.x - x, state.boss.y - y);
        if (distB <= radius + state.boss.size) {
          state.boss.hp -= damage;
          state.boss.hitFlash = 0.14;
          addDamageNumber(state.boss.x, state.boss.y - 30, damage, color);
        }
      }
    }

    function findNearestEnemy(fromX, fromY, maxDist = 900) {
      let best = null;
      let bestDist = maxDist;
      if (state.boss) {
        const dBoss = Math.hypot(state.boss.x - fromX, state.boss.y - fromY);
        if (dBoss < bestDist) {
          bestDist = dBoss;
          best = state.boss;
        }
      }
      for (const z of state.zombies) {
        const d = Math.hypot(z.x - fromX, z.y - fromY);
        if (d < bestDist) {
          bestDist = d;
          best = z;
        }
      }
      return best;
    }

    // =========================================================================
    // 14. EXECUTING ABILITIES (Full-Map Square Bombardment, 90°×Lv Laser, Wide Road Roller!)
    // =========================================================================
    // Находит самое плотное скопление врагов на экране (для наведения ракет Катюши)
    function findDenseEnemyClusterTarget(canvasWidth, canvasHeight) {
      if (state.zombies.length === 0) {
        if (state.boss) return { x: state.boss.x, y: state.boss.y };
        return {
          x: canvasWidth * 0.2 + Math.random() * (canvasWidth * 0.6),
          y: state.cameraY + 80 + Math.random() * (canvasHeight - 160)
        };
      }
      const sampleCount = Math.min(25, state.zombies.length);
      let bestZ = state.zombies[0];
      let bestNeighbors = -1;
      for (let s = 0; s < sampleCount; s++) {
        const cand = state.zombies[Math.floor(Math.random() * state.zombies.length)];
        let neighbors = 0;
        for (let j = 0; j < state.zombies.length; j += 2) {
          const other = state.zombies[j];
          if (Math.abs(other.x - cand.x) < 135 && Math.abs(other.y - cand.y) < 135) {
            neighbors++;
          }
        }
        if (neighbors > bestNeighbors) {
          bestNeighbors = neighbors;
          bestZ = cand;
        }
      }
      return {
        x: bestZ.x + (Math.random() - 0.5) * 70,
        y: bestZ.y + (Math.random() - 0.5) * 70
      };
    }

    function executeTimerAbility(aObj, canvasWidth, canvasHeight) {
      const stats = getAbilityStats(aObj);
      const p = state.player;
      const id = aObj.id;
      const roadLeft = canvasWidth * 0.15;
      const roadRight = canvasWidth * 0.85;

      switch (id) {
        case 'plush_teto':
        case 'drone_swarm':
          return 0;

        case 'c130_airstrike': {
          // C-130 пролетает снизу вверх вдоль моста (как на видео 00:08) и сбрасывает видимые авиабомбы!
          const maxMapHalf = Math.max(canvasWidth * 0.48, canvasHeight * 0.48);
          const zoneHalfSize = Math.min(maxMapHalf, 130 * stats.areaScale);
          const centerX = canvasWidth / 2;
          const centerY = p.y - 90;

          state.visualEffects.push({
            type: 'c130_plane',
            x: centerX,
            startY: state.cameraY + canvasHeight + 220,
            endY: state.cameraY - 260,
            y: state.cameraY + canvasHeight + 220,
            width: canvasWidth,
            timer: 1.25,
            maxTimer: 1.25
          });
          state.visualEffects.push({
            type: 'square_target_zone',
            x: centerX,
            y: centerY,
            halfSide: zoneHalfSize,
            color: '#f97316',
            timer: 0.85,
            maxTimer: 0.85
          });

          const gridN = 3;
          const cellHalf = zoneHalfSize / gridN;
          let stepIdx = 0;
          for (let gy = gridN - 1; gy >= 0; gy--) {
            for (let gx = 0; gx < gridN; gx++) {
              const bx = (centerX - zoneHalfSize + cellHalf) + gx * (cellHalf * 2);
              const by = (centerY - zoneHalfSize + cellHalf) + gy * (cellHalf * 2);
              const delay = stepIdx * 45;
              stepIdx++;
              setTimeout(() => {
                if (!state.running || state.paused) return;
                // Видимая падающая авиабомба C-130 перед взрывом
                state.visualEffects.push({
                  type: 'incoming_projectile',
                  projType: 'c130_bomb',
                  startX: bx,
                  startY: by - 190,
                  targetX: bx,
                  targetY: by,
                  blastHalf: cellHalf * 1.18,
                  damage: stats.damage,
                  color: '#f97316',
                  timer: 0.26,
                  maxTimer: 0.26
                });
              }, delay);
            }
          }
          return Math.max(1.30, stepIdx * 0.045 + 0.65);
        }

        case 'twin_mega_beam': {
          // Вращение 90° × (уровень + стат вращения), КД -15% от 2-го стата, полупрозрачный луч
          const sweepSteps = stats.level + Math.max(0, aObj.cdPts - 1);
          const totalSweepRadians = (Math.PI / 2) * sweepSteps;
          const duration = Math.min(2.6, 0.75 + sweepSteps * 0.20);
          SoundFX.playLaser(640, 0.35);
          state.screenShake = 0.35;

          state.rotatingBeams.push({
            startAngle: -Math.PI / 4,
            currentAngle: -Math.PI / 4,
            totalSweep: totalSweepRadians,
            elapsed: 0,
            duration,
            damagePerSec: stats.damage * 2.2,
            beamWidth: 28,
            beamLength: Math.max(canvasWidth, canvasHeight) * 0.9
          });
          return duration;
        }

        case 'road_roller': {
          // Появляется на уровне игрока (y = p.y) и доезжает до верхнего конца экрана!
          const roadFullWidth = canvasWidth * 0.74;
          const rollerHalfWidth = Math.min(roadFullWidth * 0.5, 62 * stats.areaScale);
          const startX = rollerHalfWidth >= roadFullWidth * 0.42 ? canvasWidth / 2 : p.x;
          const startY = p.y;
          const topScreenY = state.cameraY - 80;
          const travelDist = Math.max(220, startY - topScreenY);
          const rollerSpeed = 640;
          const rollerDur = travelDist / rollerSpeed;

          SoundFX.playBoom(0.38, 0.09);
          state.screenShake = 0.28;
          state.visualEffects.push({
            type: 'road_roller',
            x: startX,
            y: startY,
            vy: -rollerSpeed,
            halfWidth: rollerHalfWidth,
            damage: stats.damage,
            timer: rollerDur,
            maxTimer: rollerDur
          });
          return rollerDur;
        }

        case 'meteor_rain': {
          // Настоящие огненные метеориты с длинным кометным хвостом прилетают с неба в точку удара (как на видео 00:11)!
          const count = 5 + (stats.level - 1) + Math.max(0, aObj.cdPts - 1);
          const craterHalf = Math.min(280, 68 * stats.areaScale);
          for (let i = 0; i < count; i++) {
            setTimeout(() => {
              if (!state.running || state.paused) return;
              const mx = roadLeft + 24 + Math.random() * Math.max(80, roadRight - roadLeft - 48);
              const my = state.cameraY + 50 + Math.random() * (canvasHeight - 100);
              state.visualEffects.push({
                type: 'incoming_projectile',
                projType: 'meteor',
                startX: mx - 160,
                startY: my - 420,
                targetX: mx,
                targetY: my,
                blastHalf: craterHalf,
                damage: stats.damage,
                color: '#ef4444',
                timer: 0.38,
                maxTimer: 0.38
              });
            }, i * 75);
          }
          return count * 0.075 + 0.65;
        }

        case 'triple_baka_overdrive': {
          const activeDur = 5.5 + (aObj.areaPts - 1) * 1.4 + stats.level * 0.5;
          p.overdriveTimer = Math.max(p.overdriveTimer, activeDur);
          state.screenShake = 0.3;
          const burstCount = 16 + stats.level * 4;
          for (let i = 0; i < burstCount; i++) {
            const ang = (i / burstCount) * Math.PI * 2;
            state.bullets.push({
              x: p.x,
              y: p.y,
              vx: Math.cos(ang) * 760,
              vy: Math.sin(ang) * 760,
              damage: stats.damage,
              color: i % 3 === 0 ? '#f43f5e' : (i % 3 === 1 ? '#22d3ee' : '#facc15'),
              radius: 7 * Math.min(2, stats.areaScale),
              pierce: 10,
              life: 1.4,
              hitList: new Set()
            });
          }
          return activeDur;
        }

        case 'flash_panic': {
          // Радиус +40%, оглушение +0.6с и снижение КД -15%
          const rad = Math.min(canvasWidth * 0.85, 240 * stats.areaScale);
          const stunDur = 3.2 + Math.max(0, aObj.cdPts - 1) * 0.6;
          SoundFX.playLaser(1200, 0.2);
          state.visualEffects.push({
            type: 'shockwave_ring',
            x: p.x,
            y: p.y,
            maxRadius: rad,
            color: '#fef08a',
            timer: 0.45,
            maxTimer: 0.45
          });
          for (const z of state.zombies) {
            if (Math.hypot(z.x - p.x, z.y - p.y) <= rad) {
              z.stunTimer = Math.max(z.stunTimer, stunDur);
              damageZombie(z, stats.damage, null, 0, true);
            }
          }
          return stunDur;
        }

        case 'neru_phone': {
          // В базе 3 рикошета и 400 урона, перескоки без ограничений, дальность дуги +30% и КД -25%
          SoundFX.playLaser(820, 0.16);
          let currX = p.x;
          let currY = p.y;
          const hitSet = new Set();
          const jumps = 3 + Math.max(0, aObj.areaPts - 1) * 3;
          const maxJumpDist = 340 * (1 + Math.max(0, aObj.cdPts - 1) * 0.30);
          for (let j = 0; j < jumps; j++) {
            let nextTarget = null;
            let bestD = maxJumpDist;
            for (const z of state.zombies) {
              if (!hitSet.has(z)) {
                const d = Math.hypot(z.x - currX, z.y - currY);
                if (d < bestD) {
                  bestD = d;
                  nextTarget = z;
                }
              }
            }
            if (!nextTarget && state.boss && !hitSet.has(state.boss)) {
              nextTarget = state.boss;
            }
            if (!nextTarget) break;
            hitSet.add(nextTarget);
            damageZombie(nextTarget, stats.damage, null, 0, true);
            state.visualEffects.push({
              type: 'laser_line',
              x1: currX,
              y1: currY,
              x2: nextTarget.x,
              y2: nextTarget.y,
              color: '#facc15',
              width: 4.5,
              timer: 0.30,
              maxTimer: 0.30
            });
            currX = nextTarget.x;
            currY = nextTarget.y;
          }
          return 0.30;
        }

        case 'drill_tornado': {
          // База 1200 урона, размер буров +50%, центробежный отброс +25% и КД -15%
          const rad = Math.min(480, 135 * stats.areaScale);
          const knockForce = 55 * (1 + Math.max(0, aObj.cdPts - 1) * 0.25);
          SoundFX.playShoot(240, 0.22, 'sawtooth', 0.06);
          state.screenShake = Math.max(state.screenShake, 0.18);
          state.visualEffects.push({
            type: 'drill_vortex',
            x: p.x,
            y: p.y,
            radius: rad,
            drillCount: 2 + Math.min(4, Math.floor(stats.level / 2)),
            timer: 0.95,
            maxTimer: 0.95
          });
          for (const z of state.zombies) {
            const d = Math.hypot(z.x - p.x, z.y - p.y);
            if (d <= rad + z.size) {
              const ang = Math.atan2(z.y - p.y, z.x - p.x);
              damageZombie(z, stats.damage, ang, knockForce, true);
            }
          }
          if (state.boss && Math.hypot(state.boss.x - p.x, state.boss.y - p.y) <= rad + state.boss.size) {
            state.boss.hp -= stats.damage * 1.25;
            state.boss.hitFlash = 0.15;
            addDamageNumber(state.boss.x, state.boss.y - 40, stats.damage * 1.25, '#f43f5e');
          }
          return 0.95;
        }

        case 'bass_shockwave': {
          // Базовый радиус в 2 раза больше (420), оглушение 0.5с, КД -20%, радиус +50%, отброс +50%
          const rad = Math.min(620, 210 * stats.areaScale);
          const knockForce = 85 * (1 + Math.max(0, aObj.cdPts - 1) * 0.50);
          SoundFX.playBoom(0.28, 0.08);
          state.visualEffects.push({
            type: 'shockwave_ring',
            x: p.x,
            y: p.y,
            maxRadius: rad,
            color: '#22d3ee',
            timer: 0.45,
            maxTimer: 0.45
          });
          for (const z of state.zombies) {
            const d = Math.hypot(z.x - p.x, z.y - p.y);
            if (d <= rad) {
              const ang = Math.atan2(z.y - p.y, z.x - p.x);
              z.stunTimer = Math.max(z.stunTimer, 0.5);
              damageZombie(z, stats.damage, ang, knockForce, true);
            }
          }
          return 0.50;
        }

        case 'cryo_blizzard': {
          // Крио-урон +50%, размер квадрата +50%, длительность обморожения 5с + 1.0с без ограничений
          const halfSide = Math.min(520, 155 * stats.areaScale);
          const chillDur = 5.0 + Math.max(0, aObj.cdPts - 1) * 1.0;
          createSquareExplosion(p.x, p.y - 70, halfSide, stats.damage, '#38bdf8');
          for (const z of state.zombies) {
            if (Math.abs(z.x - p.x) <= halfSide && Math.abs(z.y - (p.y - 70)) <= halfSide) {
              z.chillTimer = Math.max(z.chillTimer, chillDur);
            }
          }
          if (state.boss) state.boss.chillTimer = Math.max(state.boss.chillTimer || 0, chillDur * 0.8);
          return chillDur;
        }

        case 'orbital_laser': {
          // Спавнится случайно, движется как заставка DVD и наносит урон НА ВСЮ ВЕРТИКАЛЬНУЮ ДЛИНУ луча!
          const pillars = 1 + Math.max(0, aObj.cdPts - 1);
          const beamLife = 4.0 + Math.max(0, aObj.areaPts - 1) * 3.0;
          const beamLength = Math.min(canvasHeight * 2.8, 280 * stats.areaScale);
          const rad = 54;
          SoundFX.playLaser(440, 0.30);
          for (let i = 0; i < pillars; i++) {
            const startX = roadLeft + 35 + Math.random() * Math.max(80, roadRight - roadLeft - 70);
            const startY = state.cameraY + 80 + Math.random() * Math.max(80, canvasHeight - 160);
            const dirX = Math.random() < 0.5 ? 1 : -1;
            const dirY = Math.random() < 0.5 ? 1 : -1;
            state.visualEffects.push({
              type: 'orbital_beam',
              x: startX,
              y: startY,
              vx: dirX * (225 + (i % 3) * 25),
              vy: dirY * (185 + (i % 2) * 25),
              radius: rad,
              beamLength,
              damagePerSec: stats.damage,
              timer: beamLife,
              maxTimer: beamLife
            });
          }
          return beamLife;
        }

        case 'napalm_ring': {
          // Урон горения (DoT) +100%, радиус кольца +50%, длительность горения +2.0с
          const halfSide = Math.min(480, 140 * stats.areaScale);
          const burnDur = 2.5 + Math.max(0, aObj.cdPts - 1) * 2.0;
          createSquareExplosion(p.x, p.y, halfSide, Math.round(stats.damage * 0.5), '#f97316');
          state.visualEffects.push({
            type: 'napalm_burn_zone',
            x: p.x,
            y: p.y,
            halfSide,
            damagePerSec: stats.damage,
            color: '#f97316',
            timer: burnDur,
            maxTimer: burnDur
          });
          return burnDur;
        }

        case 'mortar_barrage': {
          // Для Багетной Катюши в место удара по высокой баллистической дуге прилетает гигантский реактивный БАГЕТ!
          const shells = 5 + Math.max(0, aObj.cdPts - 1) * 2;
          const blastHalf = Math.min(240, 64 * stats.areaScale);
          for (let i = 0; i < shells; i++) {
            setTimeout(() => {
              if (!state.running || state.paused) return;
              const cluster = findDenseEnemyClusterTarget(canvasWidth, canvasHeight);
              SoundFX.playShoot(260, 0.05, 'sawtooth', 0.035);
              state.visualEffects.push({
                type: 'incoming_projectile',
                projType: 'baguette_shell',
                startX: state.player.x + (Math.random() - 0.5) * 30,
                startY: state.player.y - 16,
                targetX: cluster.x,
                targetY: cluster.y,
                blastHalf,
                damage: stats.damage,
                color: '#fbbf24',
                timer: 0.44,
                maxTimer: 0.44
              });
            }, i * 65);
          }
          return shells * 0.065 + 0.65;
        }

        case 'black_hole': {
          // Чёрная дыра НЕ спавнится центром перед игроком (спавнится на флангах или позади)
          // и стягивает врагов НА ПРОТЯЖЕНИИ ВСЕГО ДЕЙСТВИЯ в 3 раза сильнее!
          const pullRad = Math.min(1850, 660 * stats.areaScale);
          const bhDuration = 2.6;
          const sideSign = p.x < canvasWidth / 2 ? 1 : -1;
          let bhX = Math.max(roadLeft + 65, Math.min(roadRight - 65, p.x + sideSign * 190));
          let bhY = p.y - 90;
          for (let attempt = 0; attempt < 25; attempt++) {
            const candX = roadLeft + 55 + Math.random() * Math.max(80, roadRight - roadLeft - 110);
            const candY = state.cameraY + 75 + Math.random() * Math.max(80, canvasHeight - 150);
            const distToPlayer = Math.hypot(candX - p.x, candY - p.y);
            const isInFrontCenter = (candY <= p.y + 45) && (Math.abs(candX - p.x) < 155);
            if (distToPlayer >= 210 && !isInFrontCenter) {
              bhX = candX;
              bhY = candY;
              break;
            }
          }
          SoundFX.playBoom(0.45, 0.09);
          state.visualEffects.push({
            type: 'black_hole',
            x: bhX,
            y: bhY,
            radius: pullRad,
            damagePerSec: stats.damage,
            timer: bhDuration,
            maxTimer: bhDuration
          });
          if (state.boss && Math.hypot(state.boss.x - bhX, state.boss.y - bhY) < pullRad + state.boss.size) {
            state.boss.hp -= stats.damage * 0.5;
            state.boss.hitFlash = 0.2;
            addDamageNumber(state.boss.x, state.boss.y - 40, stats.damage * 0.5, '#a855f7');
          }
          return bhDuration;
        }

        case 'acid_juice': {
          // Зона лечения для игрока в случайной точке экрана (база 10 HP/с, +5 HP/с за уровень)!
          const count = 1 + Math.max(0, aObj.cdPts - 1);
          const poolDur = 5.0 + Math.max(0, aObj.areaPts - 1) * 2.0;
          const healPerSec = 10 + Math.max(0, aObj.dmgPts - 1) * 5;
          const poolRadius = 62 * (1 + Math.max(0, aObj.cdPts - 1) * 0.35);
          for (let i = 0; i < count; i++) {
            const px = roadLeft + 45 + Math.random() * Math.max(60, roadRight - roadLeft - 90);
            const py = state.cameraY + 70 + Math.random() * Math.max(80, canvasHeight - 140);
            state.acidPools.push({
              x: px,
              y: py,
              radius: poolRadius,
              healPerSec,
              isHealingZone: true,
              timer: poolDur
            });
          }
          return poolDur;
        }

        case 'holo_shield': {
          // Не наносит урона, не лечит, базовое отталкивание в 2 раза больше!
          const shieldDur = 4.0 + Math.max(0, aObj.cdPts - 1) * 1.0;
          const waveRad = Math.min(540, 260 * stats.areaScale);
          p.shieldTimer = shieldDur;
          SoundFX.playBoom(0.22, 0.06);
          state.visualEffects.push({
            type: 'shockwave_ring',
            x: p.x,
            y: p.y,
            maxRadius: waveRad,
            color: '#67e8f9',
            timer: 0.42,
            maxTimer: 0.42
          });
          for (const z of state.zombies) {
            const dist = Math.hypot(z.x - p.x, z.y - p.y);
            if (dist <= waveRad + z.size) {
              const ang = Math.atan2(z.y - p.y, z.x - p.x);
              z.x += Math.cos(ang) * 170;
              z.y += Math.sin(ang) * 170;
            }
          }
          return shieldDur;
        }

        case 'magnet_pulse': {
          // Прямоугольное притяжение опыта на всю ширину экрана!
          const rectHalfH = p.pickupRadius * 1.5 * stats.areaScale;
          for (const xp of state.xpParticles) {
            if (Math.abs(xp.y - p.y) <= rectHalfH) {
              xp.magnetized = true;
            }
          }
          state.visualEffects.push({
            type: 'magnet_rect_pulse',
            x: canvasWidth / 2,
            y: p.y,
            halfWidth: canvasWidth * 0.48,
            halfHeight: rectHalfH,
            color: '#34d399',
            timer: 0.55,
            maxTimer: 0.55
          });
          return 0.55;
        }

        case 'chibi_turret': {
          // База 300 урона, спавнятся в любой точке экрана, вращаются куда стреляют!
          const count = 1 + Math.max(0, aObj.areaPts - 1) * 2;
          const turretDur = 7.5 + Math.max(0, aObj.cdPts - 1) * 3.0;
          const fireInterval = Math.max(0.04, 0.22 / (1 + Math.max(0, aObj.dmgPts - 1) * 1.0));
          for (let i = 0; i < count; i++) {
            const tx = roadLeft + 30 + Math.random() * Math.max(60, roadRight - roadLeft - 60);
            const ty = state.cameraY + 60 + Math.random() * Math.max(80, canvasHeight - 120);
            state.turrets.push({
              x: tx,
              y: ty,
              aimAngle: -Math.PI / 2,
              fireTimer: 0.05,
              fireInterval,
              damage: stats.damage,
              timer: turretDur
            });
          }
          return turretDur;
        }
      }
      return 0.4;
    }

    // =========================================================================
    // 15. AUTONOMOUS PLUSHIE TETO AI, ORBITING DRONES & SPINNING LEEKS
    // =========================================================================
    function updateAutonomousPlushPets(dt, canvasWidth) {
      const plushAbility = state.abilities['plush_teto'];
      if (!plushAbility) return;
      syncPlushPets();

      const stats = getAbilityStats(plushAbility);
      const crushHalfSide = Math.min(320, 76 * stats.areaScale);
      const jumpRange = 250 * stats.areaScale;
      const speedMult = 1 + Math.max(0, plushAbility.cdPts - 1) * 0.35;
      const roadLeft = canvasWidth * 0.16;
      const roadRight = canvasWidth * 0.84;

      state.plushPets.forEach((pet, idx) => {
        if (Math.abs(pet.y - state.player.y) > 460) {
          pet.x = state.player.x + (Math.random() - 0.5) * 120;
          pet.y = state.player.y - 60;
          pet.state = 'roam';
        }

        if (pet.state === 'roam') {
          pet.roamTimer -= dt;
          const nearestEnemy = findNearestEnemy(pet.x, pet.y, 380);

          if (nearestEnemy) {
            pet.roamTargetX = nearestEnemy.x;
            pet.roamTargetY = nearestEnemy.y;
          } else if (pet.roamTimer <= 0) {
            pet.roamTimer = 1.4 + Math.random() * 1.2;
            pet.roamTargetX = Math.max(roadLeft, Math.min(roadRight, state.player.x + (Math.random() - 0.5) * 280));
            pet.roamTargetY = state.player.y - 160 + (Math.random() - 0.5) * 240;
          }

          const dx = pet.roamTargetX - pet.x;
          const dy = pet.roamTargetY - pet.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 8) {
            const walkSpd = 155 * speedMult;
            pet.x += (dx / dist) * walkSpd * dt;
            pet.y += (dy / dist) * walkSpd * dt;
            resolveEntityObstacleCollisions(pet, 14);
          }

          pet.z = Math.abs(Math.sin(state.timeElapsed * 9 + idx * 1.3)) * 11;
          pet.squashScale = 1;
          pet.rot = Math.sin(state.timeElapsed * 8 + idx) * 0.12;

          pet.cooldownTimer -= dt;
          if (pet.cooldownTimer <= 0 && nearestEnemy && Math.hypot(nearestEnemy.x - pet.x, nearestEnemy.y - pet.y) < jumpRange) {
            pet.state = 'jumping';
            pet.startX = pet.x;
            pet.startY = pet.y;
            pet.targetX = nearestEnemy.x;
            pet.targetY = nearestEnemy.y;
            pet.jumpTimer = 0;
            pet.jumpDuration = Math.max(0.16, 0.42 / speedMult);
          }
        } else if (pet.state === 'jumping') {
          pet.jumpTimer += dt;
          const t = Math.min(1, pet.jumpTimer / pet.jumpDuration);
          pet.x = pet.startX + (pet.targetX - pet.startX) * t;
          pet.y = pet.startY + (pet.targetY - pet.startY) * t;
          pet.z = Math.sin(t * Math.PI) * 145;
          pet.rot = t * Math.PI * 2;
          pet.squashScale = t > 0.85 ? 1.3 : 0.92;

          if (t >= 1) {
            pet.z = 0;
            pet.rot = 0;
            pet.state = 'slam';
            pet.jumpTimer = 0;
            pet.squashScale = 1.5;
            SoundFX.playPlushSquash();
            createSquareExplosion(pet.x, pet.y, crushHalfSide, stats.damage, '#fb7185');
          }
        } else if (pet.state === 'slam') {
          pet.jumpTimer += dt;
          pet.squashScale = 1.5 - (pet.jumpTimer / 0.22) * 0.5;
          if (pet.jumpTimer >= 0.22) {
            pet.state = 'roam';
            pet.cooldownTimer = Math.max(0.35, (stats.cooldown * 0.55) / speedMult);
          }
        }
      });
    }

    function updatePermanentOrbitDrones(dt) {
      const droneAbility = state.abilities['drone_swarm'];
      if (!droneAbility) return;
      syncOrbitDrones();

      const stats = getAbilityStats(droneAbility);
      const orbitRadius = 68 * Math.min(1.6, stats.areaScale);
      const fireInterval = Math.max(0.10, 0.48 / (1 + Math.max(0, droneAbility.cdPts - 1) * 0.20));

      state.orbitDrones.forEach((drone, idx) => {
        const ang = state.timeElapsed * 2.4 + drone.angleOffset;
        drone.x = state.player.x + Math.cos(ang) * orbitRadius;
        drone.y = state.player.y + Math.sin(ang) * (orbitRadius * 0.85);

        drone.fireTimer -= dt;
        if (drone.fireTimer <= 0) {
          drone.fireTimer = fireInterval;
          const target = findNearestEnemy(drone.x, drone.y, 420);
          if (target) {
            SoundFX.playLaser(980, 0.06);
            const shotAng = Math.atan2(target.y - drone.y, target.x - drone.x);
            state.bullets.push({
              x: drone.x,
              y: drone.y,
              vx: Math.cos(shotAng) * 840,
              vy: Math.sin(shotAng) * 840,
              damage: stats.damage,
              color: '#4ade80',
              radius: 4.5,
              pierce: 3,
              explosiveRadius: 0,
              isBeamShot: true,
              life: 0.75,
              hitList: new Set()
            });
          }
        }
      });
    }

    function updateSpinningLeeks(dt) {
      const leekWeapon = state.weapons['leek_blaster'];
      if (!leekWeapon) {
        state.spinningLeeks = [];
        return;
      }
      const stats = getWeaponStats(leekWeapon);
      const leekCount = 2 + Math.max(0, leekWeapon.areaPts - 1);
      const leekSpeedAndSizeScale = 1 + Math.max(0, leekWeapon.cdPts - 1) * 0.30;
      const orbitRadius = 56 * Math.min(2.6, leekSpeedAndSizeScale);
      const bladeRadius = 22 * Math.min(2.8, leekSpeedAndSizeScale);
      const spinSpeed = 4.6 * leekSpeedAndSizeScale;

      leekWeapon.orbitAngle = (leekWeapon.orbitAngle || 0) + spinSpeed * dt;
      state.spinningLeeks = [];

      for (let i = 0; i < leekCount; i++) {
        const ang = leekWeapon.orbitAngle + (i / leekCount) * Math.PI * 2;
        const lx = state.player.x + Math.cos(ang) * orbitRadius;
        const ly = state.player.y + Math.sin(ang) * orbitRadius;
        state.spinningLeeks.push({ x: lx, y: ly, angle: ang + Math.PI / 2, size: bladeRadius });

        // High continuous damage to nearby enemies!
        for (const z of state.zombies) {
          const d = Math.hypot(z.x - lx, z.y - ly);
          if (d <= bladeRadius + z.size) {
            if (!z.lastLeekHit || state.timeElapsed - z.lastLeekHit > 0.16) {
              z.lastLeekHit = state.timeElapsed;
              const kbAng = Math.atan2(z.y - state.player.y, z.x - state.player.x);
              damageZombie(z, stats.damage, kbAng, 18, true);
            }
          }
        }
        if (state.boss) {
          const dB = Math.hypot(state.boss.x - lx, state.boss.y - ly);
          if (dB <= bladeRadius + state.boss.size) {
            if (!state.boss.lastLeekHit || state.timeElapsed - state.boss.lastLeekHit > 0.18) {
              state.boss.lastLeekHit = state.timeElapsed;
              state.boss.hp -= stats.damage;
              state.boss.hitFlash = 0.08;
              addDamageNumber(state.boss.x, state.boss.y - 30, stats.damage, '#4ade80');
            }
          }
        }
      }
    }

    function updateRotatingMegaBeams(dt) {
      const p = state.player;
      for (let i = state.rotatingBeams.length - 1; i >= 0; i--) {
        const rb = state.rotatingBeams[i];
        rb.elapsed += dt;
        const progress = Math.min(1, rb.elapsed / rb.duration);
        rb.currentAngle = rb.startAngle + rb.totalSweep * progress;

        // 2 intersecting beams (Angle & Angle + PI/2) rotating around player!
        const angles = [rb.currentAngle, rb.currentAngle + Math.PI / 2];
        for (const a of angles) {
          const cosA = Math.cos(a);
          const sinA = Math.sin(a);
          for (const z of state.zombies) {
            const dx = z.x - p.x;
            const dy = z.y - p.y;
            // Perpendicular distance to line passing through player at angle `a`
            const perpDist = Math.abs(-sinA * dx + cosA * dy);
            if (perpDist <= rb.beamWidth + z.size) {
              damageZombie(z, rb.damagePerSec * dt, a, 8, true);
            }
          }
          if (state.boss) {
            const dx = state.boss.x - p.x;
            const dy = state.boss.y - p.y;
            const perpDist = Math.abs(-sinA * dx + cosA * dy);
            if (perpDist <= rb.beamWidth + state.boss.size) {
              state.boss.hp -= rb.damagePerSec * dt;
              state.boss.hitFlash = 0.06;
            }
          }
        }

        if (rb.elapsed >= rb.duration) {
          state.rotatingBeams.splice(i, 1);
        }
      }
    }

    // =========================================================================
    // 16. MAIN UPDATE LOOP
    // =========================================================================
    function updateGame(dt, canvasWidth, canvasHeight) {
      if (!state.running || state.paused) return;

      state.timeElapsed += dt;
      const p = state.player;
      const skin = SKINS[selectedSkinId];

      if (state.screenShake > 0) state.screenShake = Math.max(0, state.screenShake - dt * 1.5);
      if (p.invulnTimer > 0) p.invulnTimer -= dt;
      if (p.shieldTimer > 0) p.shieldTimer -= dt;
      if (p.overdriveTimer > 0) p.overdriveTimer -= dt;

      // Passive HP regeneration (Miku: +1 HP/sec)
      if (skin.regenPerSec && skin.regenPerSec > 0 && p.hp > 0 && p.hp < p.maxHp) {
        p.hp = Math.min(p.maxHp, p.hp + skin.regenPerSec * dt);
      }

      // Горение игрока от взрыва бочки (3с)
      if (p.burnTimer && p.burnTimer > 0) {
        p.burnTimer = Math.max(0, p.burnTimer - dt);
        if ((p.shieldTimer || 0) <= 0 && (p.dashActiveTimer || 0) <= 0) {
          const bDmg = (p.burnDps || 25) * dt;
          p.hp = Math.max(0, p.hp - bDmg);
          p.burnTickAccum = (p.burnTickAccum || 0) + dt;
          if (p.burnTickAccum >= 0.4) {
            p.burnTickAccum = 0;
            addDamageNumber(p.x, p.y - 22, `-${Math.round((p.burnDps || 25) * 0.4)} 🔥 (ГОРЕНИЕ)`, '#fb923c');
          }
          if (p.hp <= 0) {
            finishGame();
            return;
          }
        }
      }

      // Открытие окна награды за босса ровно через 1 секунду после его финального взрыва!
      if (state.pendingBossRewardTimer && state.pendingBossRewardTimer > 0) {
        state.pendingBossRewardTimer -= dt;
        if (state.pendingBossRewardTimer <= 0) {
          state.pendingBossRewardTimer = 0;
          SoundFX.playLevelUp(true);
          grantLevelUpReward(true);
          return;
        }
      }

      if (state.cutinTimer > 0) {
        state.cutinTimer -= dt;
        if (state.cutinTimer <= 0) {
          state.cutinArtId = skin.cutinImgId;
          const quotes = skin.quotes;
          state.cutinText = quotes[Math.floor(Math.random() * quotes.length)];
          const cap = document.getElementById('cutinCaption');
          if (cap) cap.textContent = state.cutinText;
        }
      }

      // 1. Player Movement
      let moveX = 0;
      let moveY = 0;
      if (keys['KeyW'] || keys['ArrowUp']) moveY -= 1;
      if (keys['KeyS'] || keys['ArrowDown']) moveY += 1;
      if (keys['KeyA'] || keys['ArrowLeft']) moveX -= 1;
      if (keys['KeyD'] || keys['ArrowRight']) moveX += 1;

      if (pointer.active) {
        const worldPtrX = pointer.x;
        const worldPtrY = pointer.y + state.cameraY;
        const dx = worldPtrX - p.x;
        const dy = worldPtrY - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 12) {
          moveX = dx / dist;
          moveY = dy / dist;
        }
      } else if (moveX === 0 && moveY === 0 && autoMarchEnabled) {
        if (!state.boss) {
          // Normal stage: Always move forward (upward along the road, negative Y) and steer around street obstacles
          moveY = -0.86;
          const roadCenter = canvasWidth / 2;
          const centerDiff = roadCenter - p.x;
          moveX = Math.sign(centerDiff) * Math.min(0.35, Math.abs(centerDiff) / 160) + Math.sin(state.timeElapsed * 1.8) * 0.16;
          for (const obs of state.streetObstacles) {
            if (obs.destroyed) continue;
            const dyObs = p.y - obs.y;
            const dxObs = p.x - obs.x;
            const clearR = (obs.radius || 38) + p.radius + 26;
            if (dyObs > -15 && dyObs < 135 && Math.abs(dxObs) < clearR) {
              const steerDir = dxObs >= 0 ? 1 : -1;
              moveX += steerDir * 1.05;
            }
          }
        } else {
          // Boss stage: Keep close to boss for combat, but safely maintain perimeter and NEVER touch or collide with boss!
          const b = state.boss;
          const dx = b.x - p.x;
          const dy = b.y - p.y;
          const dist = Math.hypot(dx, dy);
          const desiredDist = 185;
          const safeMinDist = 135;

          let radialMove = 0;
          if (dist > desiredDist + 35) {
            radialMove = 0.80; // approach nearby
          } else if (dist < safeMinDist) {
            radialMove = -1.15; // urgently back away from boss hitbox!
          } else {
            radialMove = (dist - desiredDist) * 0.025;
          }

          // Tangential strafe around boss
          const tangentDir = Math.sin(state.timeElapsed * 1.6) > 0 ? 1 : -1;
          const tangentMove = 0.65 * tangentDir;

          const cosA = dx / (dist || 1);
          const sinA = dy / (dist || 1);

          moveX = cosA * radialMove - sinA * tangentMove;
          moveY = sinA * radialMove + cosA * tangentMove;
        }
      }

      const lvlBonuses = typeof getPlayerLevelBonuses === 'function'
        ? getPlayerLevelBonuses()
        : { speedMult: 1, dashDuration: 0.2, dashInvuln: 0.2, dashCooldown: 10.0, dashSpeedPxPerSec: 760, dashDistance: 152 };

      if (p.dashCdTimer > 0) p.dashCdTimer = Math.max(0, p.dashCdTimer - dt);

      const mag = Math.hypot(moveX, moveY);
      if (mag > 0.01) {
        moveX /= mag;
        moveY /= mag;
        p.lastMoveDirX = moveX;
        p.lastMoveDirY = moveY;
      }

      // Деш работает ТОЛЬКО по нажатию Shift (зажимать нельзя!) и одинаков для всех персонажей:
      // КД 10с (-0.1с/ур., мин 0.3с), длительность и неуязвимость 0.2с (+0.05с/ур., макс 2.0с)
      if (state.triggerDashRequested) {
        state.triggerDashRequested = false;
        if ((p.dashCdTimer || 0) <= 0 && (p.dashActiveTimer || 0) <= 0) {
          const dDirX = mag > 0.01 ? moveX : (p.lastMoveDirX || 0);
          const dDirY = mag > 0.01 ? moveY : (p.lastMoveDirY !== undefined ? p.lastMoveDirY : -1);
          const dMag = Math.hypot(dDirX, dDirY) || 1;
          p.dashDirX = dDirX / dMag;
          p.dashDirY = dDirY / dMag;
          p.dashActiveTimer = lvlBonuses.dashDuration;
          p.dashCdTimer = lvlBonuses.dashCooldown;
          p.dashMaxCd = lvlBonuses.dashCooldown;
          // Неуязвимость связана со временем всего рывка!
          p.invulnTimer = Math.max(p.invulnTimer || 0, lvlBonuses.dashInvuln);
          SoundFX.playShoot(540, 0.08, 'triangle', 0.045);
          state.visualEffects.push({
            type: 'shockwave_ring',
            x: p.x,
            y: p.y,
            maxRadius: 38,
            color: '#38bdf8',
            timer: 0.22,
            maxTimer: 0.22
          });
        }
      }

      if (p.dashActiveTimer && p.dashActiveTimer > 0) {
        p.dashActiveTimer = Math.max(0, p.dashActiveTimer - dt);
        // Во время всего рывка поддерживается неуязвимость и можно подруливать направлением
        p.invulnTimer = Math.max(p.invulnTimer || 0, p.dashActiveTimer + 0.02);
        const curDirX = mag > 0.01 ? moveX : (p.dashDirX || 0);
        const curDirY = mag > 0.01 ? moveY : (p.dashDirY !== undefined ? p.dashDirY : -1);
        const dashSpd = lvlBonuses.dashSpeedPxPerSec || 760;
        p.x += curDirX * dashSpd * dt;
        p.y += curDirY * dashSpd * dt;
        p.walkFrame += dt * 18;
        if (state.visualEffects.length < 150) {
          state.visualEffects.push({
            type: 'voxel_splat',
            x: p.x + (Math.random() - 0.5) * 14,
            y: p.y + 8,
            vx: -curDirX * 85,
            vy: -curDirY * 85,
            size: 6,
            color: '#38bdf8',
            timer: 0.18,
            maxTimer: 0.18
          });
        }
      } else if (mag > 0.01) {
        // Скорость перемещения увеличивается на +2.5% за каждый уровень
        const effectiveSpeed = p.speed * skin.speedMult * lvlBonuses.speedMult;
        p.x += moveX * effectiveSpeed * dt;
        p.y += moveY * effectiveSpeed * dt;
        p.walkFrame += dt * 9 * Math.min(1.8, lvlBonuses.speedMult);
      } else {
        p.walkFrame = 0;
      }

      const roadLeft = canvasWidth * 0.14;
      const roadRight = canvasWidth * 0.86;
      const roadWidth = roadRight - roadLeft;
      ensureProceduralStreetChunks(canvasWidth, canvasHeight);
      resolveEntityObstacleCollisions(p, p.radius, dt, false);
      p.x = Math.max(roadLeft + 22, Math.min(roadRight - 22, p.x));

      // Зона ограничения на старте спавнится ВНИЗУ ЭКРАНА (в мировой точке низа стартового экрана)!
      const startBottomLimitY = state.startBottomLimitY !== undefined
        ? state.startBottomLimitY
        : (Math.round(canvasHeight * 0.35) - 26);
      if (p.y > startBottomLimitY) {
        p.y = startBottomLimitY;
        if (moveY > 0) moveY = 0;
      }

      // IMPASSABLE ROADBLOCK: Верхний барьер перед боссом (сзади ограничение убрано!)
      let targetCamY = Math.min(0 - canvasHeight * 0.65, p.y - canvasHeight * 0.65);
      if (state.boss) {
        const barrierY = state.boss.barrierY !== undefined
          ? state.boss.barrierY
          : (-state.boss.kmNumber * 1000 * PIXELS_PER_METER - Math.max(240, Math.round(canvasHeight * 0.58)));
        const playerTopLimitY = barrierY + 92;
        if (p.y < playerTopLimitY) {
          p.y = playerTopLimitY;
          if (moveY < 0) moveY = 0;
        }
        targetCamY = Math.max(targetCamY, barrierY + 14);
      }

      state.cameraY += (targetCamY - state.cameraY) * Math.min(1, dt * 10);

      // Update Street Distance & Endless Kilometer Progression!
      const currentMeters = Math.max(0, Math.floor(-p.y / PIXELS_PER_METER));
      if (currentMeters > state.maxDistanceMeters) {
        if (state.boss) {
          state.maxDistanceMeters = Math.min(state.boss.kmNumber * 1000, currentMeters);
        } else {
          state.maxDistanceMeters = currentMeters;
        }
      }

      // Check if player reached the next Kilometer Milestone (1000m, 2000m, 3000m...)
      // Когда до босса остаётся 100 м — выводим на экран тревожное уведомление о приближении к огромной сущности!
      const metersToNextBoss = state.nextBossMeters - state.maxDistanceMeters;
      if (!state.boss && metersToNextBoss <= 100 && metersToNextBoss > 0 && state.lastWarnedBossMeters !== state.nextBossMeters) {
        state.lastWarnedBossMeters = state.nextBossMeters;
        SoundFX.playLaser(230, 0.35);
        state.screenShake = Math.max(state.screenShake, 0.28);
        showToast(
          `⚠️ ДО РУБЕЖА ${Math.round(state.nextBossMeters / 1000)} КМ ОСТАЛОСЬ ${metersToNextBoss} М!`,
          `Внимание! Вы приближаетесь к огромной сущности впереди на мосту!`,
          'border-red-500 bg-red-950/95 shadow-[0_0_25px_rgba(239,68,68,0.8)]'
        );
      }

      if (!state.boss && state.maxDistanceMeters >= state.nextBossMeters) {
        spawnKilometerBoss(canvasWidth, Math.round(state.nextBossMeters / 1000), canvasHeight);
      }

      // 2. Fire All Independent Base Weapons + Update Spinning Leeks
      updateSpinningLeeks(dt);

      const nearestGlobal = findNearestEnemy(p.x, p.y, 780);
      if (nearestGlobal) {
        p.facingAngle = Math.atan2(nearestGlobal.y - p.y, nearestGlobal.x - p.x);
      }

      const gunWeapons = Object.values(state.weapons).filter(w => !w.def.isOrbitWeapon);
      const MOUSE_AIM_WEAPONS = new Set(['mp5', 'dual_sniper', 'shotgun', 'baguette_rpg', 'plasma_rail']);
      gunWeapons.forEach((wObj, idx) => {
        if (wObj.recoilTimer > 0) wObj.recoilTimer = Math.max(0, wObj.recoilTimer - dt);
        const def = wObj.def;
        const slotAngle = gunWeapons.length === 1
          ? 0
          : -Math.PI + (idx / Math.max(1, gunWeapons.length)) * Math.PI * 2;
        const slotRadius = gunWeapons.length === 1 ? 14 : 28;
        const wx = p.x + Math.cos(slotAngle) * slotRadius;
        const wy = p.y + Math.sin(slotAngle) * (slotRadius * 0.82);

        if (mouseAimEnabled && MOUSE_AIM_WEAPONS.has(def.id)) {
          const worldMouseX = pointer.x || (canvasWidth / 2);
          const worldMouseY = (pointer.y || (canvasHeight * 0.3)) + state.cameraY;
          wObj.aimAngle = Math.atan2(worldMouseY - wy, worldMouseX - wx);
        }

        wObj.timer -= dt;
        if (wObj.timer <= 0) {
          const stats = getWeaponStats(wObj);
          wObj.timer = stats.cooldown;
          wObj.recoilTimer = 0.08;

          const weaponTarget = findNearestEnemy(wx, wy, 780);
          let baseAngle = weaponTarget
            ? Math.atan2(weaponTarget.y - wy, weaponTarget.x - wx)
            : -Math.PI / 2;
          if (mouseAimEnabled && MOUSE_AIM_WEAPONS.has(def.id)) {
            const worldMouseX = pointer.x || (canvasWidth / 2);
            const worldMouseY = (pointer.y || (canvasHeight * 0.3)) + state.cameraY;
            baseAngle = Math.atan2(worldMouseY - wy, worldMouseX - wx);
          }
          wObj.aimAngle = baseAngle;

          if (def.id === 'minigun' || def.id === 'mp5') {
            SoundFX.playShoot(390, 0.03, 'sawtooth', 0.022);
          } else if (def.isBeamShot) {
            SoundFX.playLaser(740, 0.08);
          } else {
            SoundFX.playShoot(280, 0.04, 'square', 0.025);
          }

          const shooters = [{ x: wx, y: wy }];
          if (p.overdriveTimer > 0) {
            shooters.push({ x: p.x - 44, y: p.y + 10 }, { x: p.x + 44, y: p.y + 10 });
          }

          shooters.forEach((origin, sIdx) => {
            const count = sIdx === 0 ? stats.count : Math.max(1, Math.ceil(stats.count * 0.5));
            for (let i = 0; i < count; i++) {
              let angleOffset = 0;
              if (def.id === 'dual_ar') {
                const directions = [-Math.PI / 2, -Math.PI * 0.82, -Math.PI * 0.18, Math.PI * 0.15, Math.PI * 0.85];
                const chosenDir = directions[i % directions.length];
                angleOffset = (chosenDir - baseAngle) + (Math.random() - 0.5) * 0.12;
              } else if (count > 1) {
                const frac = (i / (count - 1)) - 0.5;
                angleOffset = frac * def.spread + (Math.random() - 0.5) * (def.spread * 0.35);
              } else {
                angleOffset = (Math.random() - 0.5) * def.spread;
              }

              const shotAngle = baseAngle + angleOffset;
              state.bullets.push({
                weaponId: def.id,
                x: origin.x + Math.cos(shotAngle) * 14,
                y: origin.y + Math.sin(shotAngle) * 14,
                vx: Math.cos(shotAngle) * def.speed,
                vy: Math.sin(shotAngle) * def.speed,
                damage: sIdx === 0 ? stats.damage : Math.round(stats.damage * 0.6),
                color: def.color,
                radius: (def.explosiveRadius ? 6.5 : 4.2) * Math.min(1.8, stats.areaScale),
                pierce: stats.pierce,
                explosiveRadius: def.explosiveRadius ? def.explosiveRadius * (stats.explosionAreaScale || stats.areaScale) : 0,
                isBeamShot: !!def.isBeamShot,
                isBaguetteRocket: def.id === 'baguette_rpg',
                isPlasmaOrb: def.id === 'plasma_rail',
                beamWidthScale: def.id === 'dual_sniper' ? stats.areaScale : 1.0,
                knockbackBonus: (def.id === 'ak47' || def.id === 'shotgun') ? (1 + Math.max(0, wObj.cdPts - 1) * 0.25) : 1.0,
                life: 1.25,
                hitList: new Set()
              });
            }
          });

          if (state.visualEffects.length < 130) {
            state.visualEffects.push({
              type: 'muzzle_flash',
              x: wx + Math.cos(baseAngle) * 16,
              y: wy + Math.sin(baseAngle) * 16,
              color: def.color,
              timer: 0.05,
              maxTimer: 0.05
            });
          }

          if (state.shellCasings.length < 75) {
            const sideAng = baseAngle + Math.PI / 2 + (Math.random() - 0.5) * 0.5;
            state.shellCasings.push({
              x: wx,
              y: wy,
              vx: Math.cos(sideAng) * (45 + Math.random() * 55),
              vy: Math.sin(sideAng) * (45 + Math.random() * 55),
              life: 1.8
            });
          }
        }
      });

      // 3. Update Timer Abilities (Cooldown starts ONLY AFTER the ability's active duration ends!)
      Object.values(state.abilities).forEach(aObj => {
        if (aObj.def.isPermanentOrbit || aObj.id === 'plush_teto') return;
        const stats = getAbilityStats(aObj);
        const fillEl = document.querySelector(`[data-cd-fill="${aObj.id}"]`);

        if (aObj.activeTimer && aObj.activeTimer > 0) {
          // Способность сейчас активна — ждём окончания её действия, КД ещё не идёт!
          aObj.activeTimer = Math.max(0, aObj.activeTimer - dt);
          if (fillEl) {
            const activePct = Math.max(0, Math.min(100, (aObj.activeTimer / Math.max(0.01, aObj.maxActiveTimer || 1)) * 100));
            fillEl.style.width = `${activePct}%`;
          }
          if (aObj.activeTimer <= 0) {
            // Действие способности завершилось — запускаем отсчёт перезарядки!
            aObj.timer = stats.cooldown;
          }
          return;
        }

        aObj.timer -= dt;
        if (fillEl) {
          const pct = stats.cooldown <= 0 ? 100 : Math.max(0, Math.min(100, ((stats.cooldown - Math.max(0, aObj.timer)) / stats.cooldown) * 100));
          fillEl.style.width = `${pct}%`;
        }
        if (aObj.timer <= 0) {
          const activeDur = executeTimerAbility(aObj, canvasWidth, canvasHeight) || 0.4;
          aObj.activeTimer = activeDur;
          aObj.maxActiveTimer = activeDur;
          aObj.timer = stats.cooldown;
        }
      });

      updateAutonomousPlushPets(dt, canvasWidth);
      updatePermanentOrbitDrones(dt);
      updateRotatingMegaBeams(dt);

      // 4. Update Turrets (rotate toward target!) & PoPiPo Healing Zones
      for (let i = state.turrets.length - 1; i >= 0; i--) {
        const t = state.turrets[i];
        t.timer -= dt;
        t.fireTimer -= dt;
        const target = findNearestEnemy(t.x, t.y, 520);
        if (target) {
          t.aimAngle = Math.atan2(target.y - t.y, target.x - t.x);
        }
        if (t.fireTimer <= 0) {
          t.fireTimer = t.fireInterval || 0.22;
          if (target) {
            const ang = t.aimAngle;
            state.bullets.push({
              x: t.x + Math.cos(ang) * 14,
              y: t.y + Math.sin(ang) * 14,
              vx: Math.cos(ang) * 760,
              vy: Math.sin(ang) * 760,
              damage: t.damage,
              color: '#60a5fa',
              radius: 4.8,
              pierce: 3,
              explosiveRadius: 0,
              life: 0.95,
              hitList: new Set()
            });
          }
        }
        if (t.timer <= 0) state.turrets.splice(i, 1);
      }

      for (let i = state.acidPools.length - 1; i >= 0; i--) {
        const pool = state.acidPools[i];
        pool.timer -= dt;
        if (pool.isHealingZone) {
          if (Math.hypot(p.x - pool.x, p.y - pool.y) <= pool.radius + p.radius) {
            if (p.hp < p.maxHp) {
              p.hp = Math.min(p.maxHp, p.hp + (pool.healPerSec || 10) * dt);
            }
          }
        } else {
          if (Math.hypot(p.x - pool.x, p.y - pool.y) <= pool.radius + p.radius) {
            if (p.shieldTimer <= 0 && p.invulnTimer <= 0) {
              const tickDmg = 10;
              p.hp = Math.max(0, p.hp - tickDmg);
              p.invulnTimer = 0.50;
              addDamageNumber(p.x, p.y - 20, tickDmg, '#ef4444');
              if (p.hp <= 0) {
                finishGame();
                return;
              }
            }
          }
        }
        if (pool.timer <= 0) state.acidPools.splice(i, 1);
      }

      // 5. Update Bullets
      for (let i = state.bullets.length - 1; i >= 0; i--) {
        const b = state.bullets[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.life -= dt;

        let removeBullet = b.life <= 0;

        for (const z of state.zombies) {
          if (b.hitList && b.hitList.has(z)) continue;
          if (Math.abs(z.x - b.x) > z.size + b.radius || Math.abs(z.y - b.y) > z.size + b.radius) continue;
          const dist = Math.hypot(z.x - b.x, z.y - b.y);
          if (dist <= z.size + b.radius) {
            if (b.hitList) b.hitList.add(z);
            if (b.explosiveRadius > 0) {
              createExplosion(b.x, b.y, b.explosiveRadius, b.damage, b.color);
              if (b.pierce <= 1) {
                removeBullet = true;
                break;
              }
              b.pierce--;
            } else {
              const ang = Math.atan2(b.vy, b.vx);
              damageZombie(z, b.damage, ang, 7 * (b.knockbackBonus || 1), false);
              if (state.visualEffects.length < 160 && Math.random() < 0.45) {
                state.visualEffects.push({
                  type: 'hit_star_spark',
                  x: b.x,
                  y: b.y,
                  color: b.weaponId === 'dual_ar' ? '#f43f5e' : (b.weaponId === 'shotgun' ? '#fb923c' : '#67e8f9'),
                  size: 9 + Math.random() * 6,
                  timer: 0.16,
                  maxTimer: 0.16
                });
              }
              b.pierce--;
              if (b.pierce <= 0) {
                removeBullet = true;
                break;
              }
            }
          }
        }

        if (!removeBullet && state.boss) {
          if (!b.hitList || !b.hitList.has(state.boss)) {
            const distB = Math.hypot(state.boss.x - b.x, state.boss.y - b.y);
            if (distB <= state.boss.size + b.radius) {
              if (b.hitList) b.hitList.add(state.boss);
              if (b.explosiveRadius > 0) {
                createExplosion(b.x, b.y, b.explosiveRadius, b.damage, b.color);
                removeBullet = true;
              } else {
                const bActualDmg = Math.max(1, Math.round(b.damage * (1 - (state.boss.armorReduction || 0))));
                state.boss.hp -= bActualDmg;
                state.boss.hitFlash = 0.08;
                addDamageNumber(state.boss.x, state.boss.y - 35, bActualDmg, state.boss.armorReduction > 0 ? '#93c5fd' : '#fef08a');
                b.pierce--;
                if (b.pierce <= 0) removeBullet = true;
              }
            }
          }
        }

        if (!removeBullet) {
          for (let k = state.streetObstacles.length - 1; k >= 0; k--) {
            const obs = state.streetObstacles[k];
            if (!obs || obs.destroyed) continue;
            const hitR = obs.isCircle ? obs.radius : Math.max(obs.halfW * 0.85, obs.halfH * 0.85);
            if (Math.hypot(obs.x - b.x, obs.y - b.y) <= hitR + b.radius) {
              if (b.explosiveRadius > 0) {
                createExplosion(b.x, b.y, b.explosiveRadius, b.damage, b.color);
                removeBullet = true;
                break;
              } else {
                if (obs.maxHp === undefined) {
                  obs.maxHp = obs.kind === 'destroyed_car' ? 180 : (obs.kind === 'barricade' ? 110 : 80);
                  obs.hp = obs.maxHp;
                }
                obs.hp -= Math.max(12, b.damage * 0.35);
                obs.hitFlash = 0.08;
                if (obs.hp <= 0) {
                  state.streetObstacles.splice(k, 1);
                  destroyStreetObstacle(obs, true);
                }
                b.pierce--;
                if (b.pierce <= 0) {
                  removeBullet = true;
                }
                break;
              }
            }
          }
        }

        if (removeBullet) state.bullets.splice(i, 1);
      }

      // 6. Update Enemy Projectiles
      for (let i = state.enemyProjectiles.length - 1; i >= 0; i--) {
        const ep = state.enemyProjectiles[i];
        ep.x += ep.vx * dt;
        ep.y += ep.vy * dt;
        ep.life -= dt;

        if (Math.hypot(ep.x - p.x, ep.y - p.y) <= ep.radius + p.radius) {
          if (p.shieldTimer <= 0 && p.invulnTimer <= 0) {
            p.hp = Math.max(0, p.hp - ep.damage);
            p.invulnTimer = 0.45;
            addDamageNumber(p.x, p.y - 20, ep.damage, '#ef4444');
            if (p.hp <= 0) {
              finishGame();
              return;
            }
          }
          state.enemyProjectiles.splice(i, 1);
          continue;
        }
        if (ep.life <= 0) state.enemyProjectiles.splice(i, 1);
      }

      // 7. Spawn & Update Zombies (рост плотности толпы замедлен на 25%)
      const tenMinRatio = (state.timeElapsed / 600) * 0.75;
      const dynamicMaxZombies = Math.min(420, Math.round(80 + tenMinRatio * 285));
      state.zombieSpawnTimer -= dt;
      if (state.zombieSpawnTimer <= 0 && state.zombies.length < dynamicMaxZombies) {
        state.zombieSpawnTimer = Math.max(0.18, 0.76 - tenMinRatio * 0.42);
        spawnZombieWave(canvasWidth, canvasHeight);
      }

      for (let i = state.zombies.length - 1; i >= 0; i--) {
        const z = state.zombies[i];

        if (z.hp <= 0) {
          state.kills++;
          spawnZombieDeathParticles(z);
          state.zombies.splice(i, 1);
          continue;
        }

        if (z.y > state.cameraY + canvasHeight + 280) {
          z.y = state.cameraY - 50 - Math.random() * 120;
        }

        if (z.hitFlash > 0) z.hitFlash -= dt;
        if (z.buffTimer > 0) z.buffTimer -= dt;
        if (z.burnTimer && z.burnTimer > 0) {
          z.burnTimer = Math.max(0, z.burnTimer - dt);
          z.hp -= (z.burnDps || 140) * dt;
          if (z.hp <= 0) {
            state.kills++;
            spawnZombieDeathParticles(z);
            state.zombies.splice(i, 1);
            continue;
          }
        }
        if (z.stunTimer > 0) {
          z.stunTimer -= dt;
          continue;
        }

        let spd = z.speed * (z.buffTimer > 0 ? 1.35 : 1.0);
        if (z.chillTimer > 0) {
          z.chillTimer -= dt;
          spd *= 0.38;
        }

        const distPlayer = Math.hypot(z.x - p.x, z.y - p.y);
        let ang = Math.atan2(p.y - z.y, p.x - z.x);

        if (z.type === 'sprinter') {
          ang += Math.sin(state.timeElapsed * 7 + z.wobblePhase) * 0.42;
        } else if (z.type === 'spitter') {
          z.actionTimer -= dt;
          if (z.actionTimer <= 0 && distPlayer < 360 && state.enemyProjectiles.length < 35) {
            z.actionTimer = 2.8;
            state.enemyProjectiles.push({
              x: z.x,
              y: z.y,
              vx: Math.cos(ang) * 245,
              vy: Math.sin(ang) * 245,
              radius: 5.5,
              damage: Math.round(12 * getKmEnemyDamageMultiplier()),
              color: '#a3e635',
              life: 1.8
            });
          }
        } else if (z.type === 'necromancer') {
          z.actionTimer -= dt;
          if (z.actionTimer <= 0) {
            z.actionTimer = 3.8;
            for (const other of state.zombies) {
              if (Math.abs(other.x - z.x) < 100 && Math.abs(other.y - z.y) < 100) {
                other.buffTimer = 3.0;
              }
            }
          }
        }

        z.x += Math.cos(ang) * spd * dt;
        z.y += Math.sin(ang) * spd * dt;
        z.wobblePhase += dt * 8;
        resolveEntityObstacleCollisions(z, z.size * 0.85, dt, true);

        // Fast neighbor push
        if (i > 0) {
          const other = state.zombies[i - 1];
          const dx = z.x - other.x;
          const dy = z.y - other.y;
          if (Math.abs(dx) < 28 && Math.abs(dy) < 28) {
            const d = Math.hypot(dx, dy);
            const minDist = z.size + other.size;
            if (d > 0 && d < minDist) {
              const push = (minDist - d) * 0.35;
              z.x += (dx / d) * push;
              z.y += (dy / d) * push;
            }
          }
        }

        // Зомби падают с моста прямо в воду с 3D-всплеском!
        if (z.x < roadLeft - 4 || z.x > roadRight + 4) {
          const splashX = z.x < roadLeft ? roadLeft - 34 : roadRight + 34;
          state.visualEffects.push({
            type: 'water_splash',
            x: splashX,
            y: z.y + 12,
            radius: 34,
            timer: 0.65,
            maxTimer: 0.65
          });
          addDamageNumber(splashX, z.y - z.size, '💦 В ВОДУ!', '#38bdf8');
          z.x = Math.max(roadLeft + 16, Math.min(roadRight - 16, z.x));
          state.kills++;
          spawnZombieDeathParticles(z);
          state.zombies.splice(i, 1);
          continue;
        }

        if (distPlayer <= z.size + p.radius) {
          if (z.type === 'bomber') {
            z.hp = 0;
            continue;
          }
          if (p.shieldTimer > 0) {
            damageZombie(z, 0, ang + Math.PI, 90, true);
          } else if (p.invulnTimer <= 0) {
            p.hp = Math.max(0, p.hp - z.contactDmg);
            p.invulnTimer = 0.42;
            addDamageNumber(p.x, p.y - 20, z.contactDmg, '#ef4444');
            if (p.hp <= 0) {
              finishGame();
              return;
            }
          }
        }
      }

      // 8. Update Kilometer Boss
      if (state.boss) {
        const b = state.boss;
        if (b.hitFlash > 0) b.hitFlash -= dt;
        if (b.burnTimer && b.burnTimer > 0) {
          b.burnTimer = Math.max(0, b.burnTimer - dt);
          b.hp -= (b.burnDps || 260) * dt;
        }

        const bossPct = Math.max(0, Math.min(100, (b.hp / b.maxHp) * 100));
        const rageBonusPct = Math.round((getBossMissingHpRageMult(b) - 1) * 100);
        document.getElementById('bossHpBar').style.width = `${bossPct}%`;
        document.getElementById('bossHpText').textContent =
          `👑 БОСС ${b.kmNumber} КМ: ${b.title || 'ЗОМБИ-ТИТАН'} — ${Math.max(0, Math.ceil(b.hp))} / ${b.maxHp} HP (Ярость: +${rageBonusPct}% скор./атак)`;

        if (b.hp <= 0) {
          const defeatedKm = b.kmNumber;
          const bossX = b.x;
          const bossY = b.y;
          const barrierY = b.barrierY !== undefined
            ? b.barrierY
            : (-defeatedKm * 1000 * PIXELS_PER_METER - Math.max(240, Math.round(canvasHeight * 0.58)));
          state.boss = null;
          state.kills++;
          state.enemyProjectiles = [];
          state.visualEffects = state.visualEffects.filter(
            fx => fx.type !== 'boss_hazard_zone' && fx.type !== 'boss_laser_sweep'
          );

          const prevHpMult = getKmMultiplier();
          const prevSpdMult = getKmEnemySpeedMultiplier();
          const prevDmgMult = getKmEnemyDamageMultiplier();
          state.currentKmTier = defeatedKm;
          state.nextBossMeters = (defeatedKm + 1) * 1000;
          const newHpMult = getKmMultiplier();
          const newSpdMult = getKmEnemySpeedMultiplier();
          const newDmgMult = getKmEnemyDamageMultiplier();
          const newXpMult = getKmXpMultiplier();
          const hpScaleRatio = newHpMult / Math.max(1, prevHpMult);
          const spdScaleRatio = newSpdMult / Math.max(1, prevSpdMult);
          const dmgScaleRatio = newDmgMult / Math.max(1, prevDmgMult);
          for (const z of state.zombies) {
            z.hp *= hpScaleRatio;
            z.maxHp *= hpScaleRatio;
            z.speed *= spdScaleRatio;
            z.contactDmg = Math.round(z.contactDmg * dmgScaleRatio);
          }

          createSquareExplosion(bossX, bossY, 190, 9999, '#facc15');
          spawnZombieDeathParticles({ x: bossX, y: bossY, xpDrops: 0, xpPerDrop: 0, type: 'boss', isBoss: true });

          // ЭПИЧНЫЙ ФИНАЛЬНЫЙ ВЗРЫВ БОССА:
          // Для роботов/мехов (cyber_riot, pyro_bomber) — каскадный термоядерный взрыв реактора,
          // Для зомби-боссов (titan, plague_spitter, necro_lord) — разлёт 3D-кусочков тела зомби во все стороны!
          const isRobotBoss = (b.archetype === 'cyber_riot' || b.archetype === 'pyro_bomber');
          if (isRobotBoss) {
            state.screenShake = 0.85;
            SoundFX.playBoom(0.55, 0.22);
            state.visualEffects.push({
              type: 'boss_death_robot_core',
              x: bossX,
              y: bossY,
              radius: 260,
              timer: 0.95,
              maxTimer: 0.95
            });
            for (let burstIdx = 0; burstIdx < 6; burstIdx++) {
              setTimeout(() => {
                if (!state.running) return;
                const ox = bossX + (Math.random() - 0.5) * 140;
                const oy = bossY + (Math.random() - 0.5) * 140;
                SoundFX.playBoom(0.32, 0.16);
                state.visualEffects.push({
                  type: 'explosion',
                  x: ox,
                  y: oy,
                  radius: 95 + Math.random() * 45,
                  color: burstIdx % 2 === 0 ? '#00f0ff' : '#f97316',
                  timer: 0.45,
                  maxTimer: 0.45
                });
              }, burstIdx * 120);
            }
            for (let sh = 0; sh < 28; sh++) {
              const sa = (sh / 28) * Math.PI * 2 + Math.random() * 0.2;
              const sp = 140 + Math.random() * 260;
              state.visualEffects.push({
                type: 'voxel_splat',
                x: bossX,
                y: bossY,
                vx: Math.cos(sa) * sp,
                vy: Math.sin(sa) * sp,
                size: 10 + Math.random() * 6,
                color: sh % 3 === 0 ? '#00f0ff' : (sh % 3 === 1 ? '#fde047' : '#94a3b8'),
                timer: 0.95,
                maxTimer: 0.95
              });
            }
          } else {
            // Зомби-босс разлетается на 3D-кусочки тела (голова, торс, конечности, кости, ядро) с отскоками от моста!
            state.screenShake = 0.75;
            SoundFX.playBoom(0.50, 0.20);
            const chunkColors = [
              b.headColor || '#22c55e',
              b.bodyColor || '#1e1b4b',
              b.accentColor || '#84cc16',
              '#4ade80',
              '#15803d'
            ];
            for (let ch = 0; ch < 26; ch++) {
              const ca = (ch / 26) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
              const cSpd = 110 + Math.random() * 240;
              state.visualEffects.push({
                type: 'boss_death_zombie_chunk',
                x: bossX + (Math.random() - 0.5) * 24,
                y: bossY + (Math.random() - 0.5) * 24,
                vx: Math.cos(ca) * cSpd,
                vy: Math.sin(ca) * cSpd,
                z: 18 + Math.random() * 28,
                vz: 150 + Math.random() * 190,
                rot: Math.random() * Math.PI * 2,
                vRot: (Math.random() - 0.5) * 14,
                size: ch < 4 ? 22 : (12 + Math.random() * 8),
                color: chunkColors[ch % chunkColors.length],
                subColor: ch % 2 === 0 ? '#dc2626' : '#fef08a',
                timer: 0.98,
                maxTimer: 0.98
              });
            }
          }

          const barriersToShatter = [barrierY + 68];
          for (const bLineY of barriersToShatter) {
            for (let sp = 0; sp < 22; sp++) {
              state.visualEffects.push({
                type: 'voxel_splat',
                x: roadLeft + (sp / 22) * roadWidth,
                y: bLineY,
                vx: (Math.random() - 0.5) * 180,
                vy: -80 - Math.random() * 120,
                size: 8,
                color: sp % 2 === 0 ? '#ef4444' : '#facc15',
                timer: 0.65,
                maxTimer: 0.65
              });
            }
          }
          const rerollBonus = skin.rerollsPerBoss || (selectedSkinId === 'miku' ? 10 : 5);
          state.rerolls += rerollBonus;
          updateRerollButtonUI();
          document.getElementById('bossHudContainer').classList.add('hidden');
          const stContainer = document.getElementById('streetProgressContainer');
          if (stContainer) stContainer.classList.remove('hidden');
          document.getElementById('bossStatusLabel').textContent = `💀 СЛЕД. БОСС НА ${state.nextBossMeters} М`;
          const xpMultDisplay = Number.isInteger(newXpMult) ? newXpMult.toFixed(0) : newXpMult.toFixed(1);
          showToast(
            `🏆 БОСС ${defeatedKm} КМ ПОВЕРЖЕН! (+1 УРОВЕНЬ И +${rerollBonus} РЕРОЛЛОВ 🎲)`,
            `Зомби: ХП ×${newHpMult.toFixed(0)}, Скор./Урон +${Math.round((newSpdMult - 1) * 100)}% • Опыт за босса ×${xpMultDisplay}!`,
            'border-amber-400 bg-slate-900/95'
          );
          // Окно прокачки за победу над боссом открывается ровно через 1.0 секунду после взрыва босса!
          state.pendingBossRewardTimer = 1.0;
        } else {
          // Плавный рост скорости и частоты атак босса до +300% по мере потери его ХП
          const rageMult = getBossMissingHpRageMult(b);
          if (!b.enraged && b.hp <= b.maxHp * 0.50) {
            b.enraged = true;
            showToast(
              `🔥 БОСС ${b.kmNumber} КМ РАССВИРЕПЕЛ!`,
              `Потеря ХП усиливает скорость и частоту атак босса вплоть до +300%!`,
              'border-red-500 bg-red-950/95'
            );
            state.screenShake = Math.max(state.screenShake, 0.38);
            SoundFX.playBoom(0.35, 0.10);
          }

          const ang = Math.atan2(p.y - b.y, p.x - b.x);
          const baseSpd = b.chillTimer > 0 ? b.speed * 0.5 : b.speed;
          const spd = baseSpd * rageMult;
          if (b.chillTimer > 0) b.chillTimer -= dt;

          // Обработка прыжка босса в воздухе (напрыгивание на фиксированное расстояние!)
          if (b.leapState) {
            b.leapState.elapsed += dt;
            const lProg = Math.min(1, b.leapState.elapsed / Math.max(0.01, b.leapState.duration));
            b.x = b.leapState.startX + (b.leapState.targetX - b.leapState.startX) * lProg;
            b.y = b.leapState.startY + (b.leapState.targetY - b.leapState.startY) * lProg;
            b.zOffset = Math.sin(lProg * Math.PI) * 115;
            if (lProg >= 1) {
              const lType = b.leapState.landingType;
              b.leapState = null;
              b.zOffset = 0;
              state.screenShake = Math.max(state.screenShake, 0.42);
              SoundFX.playBoom(0.38, 0.11);
              state.visualEffects.push({
                type: 'shockwave_ring',
                x: b.x,
                y: b.y,
                maxRadius: 195 + b.kmNumber * 15,
                color: b.accentColor || '#facc15',
                timer: 0.45,
                maxTimer: 0.45
              });
              const landShards = 10 + Math.min(10, b.kmNumber * 2);
              for (let k = 0; k < landShards; k++) {
                const sa = (k / landShards) * Math.PI * 2;
                state.enemyProjectiles.push({
                  x: b.x,
                  y: b.y,
                  vx: Math.cos(sa) * 265,
                  vy: Math.sin(sa) * 265,
                  radius: 7.5,
                  damage: Math.round(19 * (b.projDmgMult || 1)),
                  color: lType === 'acid' ? '#a3e635' : (lType === 'fire' ? '#f97316' : (b.accentColor || '#facc15')),
                  life: 2.1
                });
              }
            }
          } else {
            b.zOffset = 0;
            b.x += Math.cos(ang) * spd * dt;
            b.y += Math.sin(ang) * spd * dt;
          }

          // Удерживаем босса в пределах моста и верхнего барьера
          b.x = Math.max(roadLeft + b.size, Math.min(roadRight - b.size, b.x));
          if (b.barrierY !== undefined && b.y < b.barrierY + 95) b.y = b.barrierY + 95;
          if (b.y > startBottomLimitY) b.y = startBottomLimitY;
          damageObstaclesInCircle(b.x, b.y, b.size + 12, true);

          b.attackTimer -= dt;
          if (b.attackTimer <= 0 && !b.leapState) {
            b.attackTimer = getBossAttackCooldown(b);
            const km = b.kmNumber;
            const extraProj = (km - 1) * (BOSS_SCALING_CONFIG.extraProjectilesPerKm || 3);
            const pMult = b.projDmgMult || (1 + (km - 1) * 0.38);
            const spdScale = 1 + Math.min(0.85, (km - 1) * 0.12);

            const pool = (Array.isArray(b.unlockedAttacks) && b.unlockedAttacks.length > 0)
              ? b.unlockedAttacks
              : ['titan_leap_slam'];
            const chosenAttack = pool[Math.floor(Math.random() * pool.length)];

            // У каждого из 5 боссов — 5 собственных уникальных атак (пересечение <= 2 с любым другим боссом!)
            switch (chosenAttack) {
              // ==================== БОСС 1: TITAN (Зомби-Титан) ====================
              case 'titan_leap_slam':
                startBossFixedDistanceLeap(b, p, roadLeft, roadRight, 245, 'quake');
                break;

              case 'titan_boulder_hurl': {
                // Прицельный бросок 3 огромных валунов вокруг игрока с осколками
                for (let i = 0; i < 3 + Math.min(3, Math.floor(km / 2)); i++) {
                  const tx = Math.max(roadLeft + 75, Math.min(roadRight - 75, p.x + (i === 0 ? 0 : (Math.random() - 0.5) * 260)));
                  const ty = p.y + (i === 0 ? 0 : (Math.random() - 0.5) * 210);
                  state.visualEffects.push({
                    type: 'boss_hazard_zone',
                    x: tx, y: ty, radius: 78,
                    damage: Math.round(36 * pMult), color: '#facc15', spawnAcid: false,
                    timer: 0.78, maxTimer: 0.78
                  });
                }
                SoundFX.playBoom(0.28, 0.08);
                break;
              }

              case 'titan_seismic_fissure': {
                // Тройная сейсмическая трещина веером (-24°, 0°, +24°)
                for (const branchOffset of [-0.42, 0, 0.42]) {
                  const bAng = ang + branchOffset;
                  for (let sIdx = 1; sIdx <= 4; sIdx++) {
                    const gx = Math.max(roadLeft + 50, Math.min(roadRight - 50, b.x + Math.cos(bAng) * (sIdx * 76)));
                    const gy = b.y + Math.sin(bAng) * (sIdx * 76);
                    state.visualEffects.push({
                      type: 'boss_hazard_zone',
                      x: gx, y: gy, radius: 56,
                      damage: Math.round(30 * pMult), color: '#eab308', spawnAcid: false,
                      timer: 0.35 + sIdx * 0.14, maxTimer: 0.35 + sIdx * 0.14
                    });
                  }
                }
                SoundFX.playBoom(0.32, 0.09);
                break;
              }

              case 'titan_shockwave_roar': {
                // Оглушающий рёв Титана: отталкивающая звуковая волна + кольцо каменных глыб
                state.visualEffects.push({
                  type: 'shockwave_ring', x: b.x, y: b.y, maxRadius: 230, color: '#facc15', timer: 0.48, maxTimer: 0.48
                });
                if (Math.hypot(p.x - b.x, p.y - b.y) < 250) {
                  p.x = Math.max(roadLeft + 24, Math.min(roadRight - 24, p.x + Math.cos(ang) * 95));
                  p.y = Math.min(startBottomLimitY, p.y + Math.sin(ang) * 95);
                }
                const rocks = 10 + extraProj;
                for (let k = 0; k < rocks; k++) {
                  const a = (k / rocks) * Math.PI * 2;
                  state.enemyProjectiles.push({
                    x: b.x, y: b.y,
                    vx: Math.cos(a) * 230 * spdScale, vy: Math.sin(a) * 230 * spdScale,
                    radius: 9, damage: Math.round(20 * pMult), color: '#eab308', life: 2.3
                  });
                }
                SoundFX.playBoom(0.35, 0.10);
                break;
              }

              case 'titan_bull_rush': {
                // Таранный рывок Короля Перекрёстка + вызов телохранителей-громил
                const rushDist = 175;
                b.x = Math.max(roadLeft + b.size, Math.min(roadRight - b.size, b.x + Math.cos(ang) * rushDist));
                b.y = Math.min(startBottomLimitY, Math.max((b.barrierY || -999999) + 95, b.y + Math.sin(ang) * rushDist));
                spawnZombieWave(canvasWidth, canvasHeight);
                SoundFX.playBoom(0.30, 0.09);
                break;
              }

              // ==================== БОСС 2: CYBER_RIOT (Кибер-Голиаф ОМОН-X) ====================
              case 'cyber_laser_sweep': {
                // Вращающийся тактический лазерный резак ОМОН-X
                const sweepDur = Math.max(1.15, 1.85 - km * 0.08);
                state.visualEffects.push({
                  type: 'boss_laser_sweep',
                  bossRef: b, x: b.x, y: b.y,
                  startAngle: ang - 0.55,
                  totalSweep: Math.PI * 1.05,
                  beamCount: km >= 4 ? 4 : 2,
                  beamLength: Math.max(canvasWidth, canvasHeight) * 0.75,
                  beamWidth: 18,
                  damagePerSec: Math.round((48 + km * 16) * pMult),
                  color: '#00f0ff',
                  timer: sweepDur, maxTimer: sweepDur
                });
                SoundFX.playLaser(340, 0.28);
                break;
              }

              case 'cyber_shotgun_barrage': {
                // Плотный веерный залп плазменной картечи из дробовика ОМОН
                const pellets = 5 + Math.min(6, km);
                for (let k = -pellets; k <= pellets; k++) {
                  const a = ang + k * 0.11;
                  state.enemyProjectiles.push({
                    x: b.x, y: b.y,
                    vx: Math.cos(a) * 355 * spdScale, vy: Math.sin(a) * 355 * spdScale,
                    radius: 6.5, damage: Math.round(19 * pMult), color: '#38bdf8', life: 2.0
                  });
                }
                SoundFX.playShoot(210, 0.09, 'sawtooth', 0.05);
                break;
              }

              case 'cyber_emp_grid': {
                // Квадратная электромагнитная сеть из 5 ЭМП-узлов вокруг игрока
                const offsets = [[0, 0], [-115, -115], [115, -115], [-115, 115], [115, 115]];
                for (const [ox, oy] of offsets) {
                  const gx = Math.max(roadLeft + 65, Math.min(roadRight - 65, p.x + ox));
                  const gy = p.y + oy;
                  state.visualEffects.push({
                    type: 'boss_hazard_zone',
                    x: gx, y: gy, radius: 66,
                    damage: Math.round(34 * pMult), color: '#38bdf8', spawnAcid: false,
                    timer: 0.82, maxTimer: 0.82
                  });
                }
                SoundFX.playLaser(520, 0.18);
                break;
              }

              case 'cyber_shield_ram': {
                // Реактивный таран щитом с электрическим следом
                for (let s = 1; s <= 3; s++) {
                  state.visualEffects.push({
                    type: 'boss_hazard_zone',
                    x: b.x + Math.cos(ang) * (s * 48),
                    y: b.y + Math.sin(ang) * (s * 48),
                    radius: 54, damage: Math.round(28 * pMult), color: '#00f0ff', spawnAcid: false,
                    timer: 0.45, maxTimer: 0.45
                  });
                }
                b.x = Math.max(roadLeft + b.size, Math.min(roadRight - b.size, b.x + Math.cos(ang) * 165));
                b.y = Math.min(startBottomLimitY, Math.max((b.barrierY || -999999) + 95, b.y + Math.sin(ang) * 165));
                SoundFX.playBoom(0.28, 0.08);
                break;
              }

              case 'cyber_squad_deploy': {
                // Вызов спецназа щитоносцев + круговой электро-импульс
                spawnZombieWave(canvasWidth, canvasHeight);
                for (let k = 0; k < 8; k++) {
                  const a = (k / 8) * Math.PI * 2;
                  state.enemyProjectiles.push({
                    x: b.x, y: b.y,
                    vx: Math.cos(a) * 280, vy: Math.sin(a) * 280,
                    radius: 7, damage: Math.round(20 * pMult), color: '#00f0ff', life: 2.2
                  });
                }
                SoundFX.playLaser(410, 0.20);
                break;
              }

              // ==================== БОСС 3: PLAGUE_SPITTER (Токсичный Архивариус Чумы) ====================
              case 'plague_mutant_leap':
                startBossFixedDistanceLeap(b, p, roadLeft, roadRight, 235, 'acid');
                break;

              case 'plague_acid_mortar': {
                // Навесной обстрел бурлящими кислотными бомбами, оставляющими лужи кислоты
                const mortarCount = 4 + Math.min(4, km);
                for (let i = 0; i < mortarCount; i++) {
                  const zx = Math.max(roadLeft + 70, Math.min(roadRight - 70, p.x + (i === 0 ? 0 : (Math.random() - 0.5) * 300)));
                  const zy = p.y + (i === 0 ? 0 : (Math.random() - 0.5) * 240);
                  state.visualEffects.push({
                    type: 'boss_hazard_zone',
                    x: zx, y: zy, radius: 72,
                    damage: Math.round(32 * pMult), color: '#84cc16', spawnAcid: true,
                    timer: 0.85, maxTimer: 0.85
                  });
                }
                SoundFX.playShoot(260, 0.12, 'sine', 0.06);
                break;
              }

              case 'plague_spore_nova': {
                // Двойная спираль крупных ядовитых спор
                const spores = 14 + extraProj;
                for (let k = 0; k < spores; k++) {
                  const a = (k / spores) * Math.PI * 2 + state.timeElapsed * 1.5;
                  const spdVar = (k % 2 === 0 ? 215 : 275) * spdScale;
                  state.enemyProjectiles.push({
                    x: b.x, y: b.y,
                    vx: Math.cos(a) * spdVar, vy: Math.sin(a) * spdVar,
                    radius: 8.5, damage: Math.round(18 * pMult), color: '#a3e635', life: 2.7
                  });
                }
                SoundFX.playShoot(180, 0.10, 'triangle', 0.05);
                break;
              }

              case 'plague_geyser_trail': {
                // Линия прорывающихся из-под асфальта кислотных гейзеров к игроку
                for (let sIdx = 1; sIdx <= 5; sIdx++) {
                  const gx = Math.max(roadLeft + 55, Math.min(roadRight - 55, b.x + Math.cos(ang) * (sIdx * 72)));
                  const gy = b.y + Math.sin(ang) * (sIdx * 72);
                  state.visualEffects.push({
                    type: 'boss_hazard_zone',
                    x: gx, y: gy, radius: 60,
                    damage: Math.round(30 * pMult), color: '#a3e635', spawnAcid: true,
                    timer: 0.40 + sIdx * 0.13, maxTimer: 0.40 + sIdx * 0.13
                  });
                }
                SoundFX.playBoom(0.26, 0.08);
                break;
              }

              case 'plague_outbreak_wave': {
                // Направленная туча био-паразитов + токсичные лужи вокруг босса
                for (let i = 0; i < 12; i++) {
                  const a = ang + (Math.random() - 0.5) * 0.95;
                  const sp = (220 + Math.random() * 140) * spdScale;
                  state.enemyProjectiles.push({
                    x: b.x, y: b.y,
                    vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                    radius: 6, damage: Math.round(17 * pMult), color: '#bef264', life: 2.0
                  });
                }
                if (state.acidPools.length < 18) {
                  state.acidPools.push({
                    x: b.x, y: b.y, radius: 68, damagePerSec: Math.round(26 * pMult), isHealingZone: false, timer: 4.0
                  });
                }
                SoundFX.playShoot(240, 0.10, 'sawtooth', 0.05);
                break;
              }

              // ==================== БОСС 4: PYRO_BOMBER (Безумный Подрывник-Джаггернаут) ====================
              case 'pyro_rocket_jump':
                createExplosion(b.x, b.y, 95, 0, '#f97316', true);
                startBossFixedDistanceLeap(b, p, roadLeft, roadRight, 255, 'fire');
                break;

              case 'pyro_carpet_bombs': {
                // Поперечная ковровая шеренга из 5 динамитных связок через ширину моста
                const rowY = p.y + (Math.random() - 0.5) * 90;
                for (let col = 0; col < 5; col++) {
                  const bx = roadLeft + 48 + (col / 4) * Math.max(80, roadWidth - 96);
                  state.visualEffects.push({
                    type: 'boss_hazard_zone',
                    x: bx, y: rowY, radius: 64,
                    damage: Math.round(38 * pMult), color: '#f97316', spawnAcid: false,
                    timer: 0.80, maxTimer: 0.80
                  });
                }
                SoundFX.playBoom(0.30, 0.09);
                break;
              }

              case 'pyro_hellfire_cross': {
                // Огнемётный Х-образный крест из 4 вращающихся струй пламени
                state.visualEffects.push({
                  type: 'boss_laser_sweep',
                  bossRef: b, x: b.x, y: b.y,
                  startAngle: ang - 0.4,
                  totalSweep: Math.PI * 0.9,
                  beamCount: 4,
                  beamLength: Math.max(canvasWidth, canvasHeight) * 0.68,
                  beamWidth: 20,
                  damagePerSec: Math.round((50 + km * 16) * pMult),
                  color: '#f97316',
                  timer: 1.45, maxTimer: 1.45
                });
                SoundFX.playBoom(0.32, 0.10);
                break;
              }

              case 'pyro_cluster_salvo': {
                // Кассетный залп разрывных гранат по сектору игрока
                for (let k = -4; k <= 4; k++) {
                  const a = ang + k * 0.18;
                  state.enemyProjectiles.push({
                    x: b.x, y: b.y,
                    vx: Math.cos(a) * 310 * spdScale, vy: Math.sin(a) * 310 * spdScale,
                    radius: 8.5, damage: Math.round(22 * pMult), color: '#fb923c', life: 2.1
                  });
                }
                SoundFX.playShoot(170, 0.10, 'square', 0.06);
                break;
              }

              case 'pyro_kamikaze_call': {
                // Детонационная волна + призыв ускоренной волны подрывников
                createExplosion(b.x, b.y, 130, 0, '#ef4444', true);
                spawnZombieWave(canvasWidth, canvasHeight);
                for (const z of state.zombies) {
                  z.buffTimer = Math.max(z.buffTimer || 0, 4.5);
                }
                break;
              }

              // ==================== БОСС 5: NECRO_LORD (Верховный Некро-Дирижёр Ночи) ====================
              case 'necro_phantom_pounce':
                startBossFixedDistanceLeap(b, p, roadLeft, roadRight, 240, 'shadow');
                break;

              case 'necro_abyss_pentagrams': {
                // Кольцо из 5 магических пентаграмм Бездны вокруг игрока
                for (let k = 0; k < 5; k++) {
                  const a = (k / 5) * Math.PI * 2 + state.timeElapsed;
                  const dist = k === 0 ? 0 : 125;
                  const px = Math.max(roadLeft + 65, Math.min(roadRight - 65, p.x + Math.cos(a) * dist));
                  const py = p.y + Math.sin(a) * dist;
                  state.visualEffects.push({
                    type: 'boss_hazard_zone',
                    x: px, y: py, radius: 70,
                    damage: Math.round(36 * pMult), color: '#e879f9', spawnAcid: false,
                    timer: 0.85, maxTimer: 0.85
                  });
                }
                SoundFX.playLaser(290, 0.22);
                break;
              }

              case 'necro_skull_symphony': {
                // Симфония черепов: спиральное кольцо + прицельный тройной залп тьмы
                const skulls = 12 + extraProj;
                for (let k = 0; k < skulls; k++) {
                  const a = (k / skulls) * Math.PI * 2 - state.timeElapsed;
                  state.enemyProjectiles.push({
                    x: b.x, y: b.y,
                    vx: Math.cos(a) * 250 * spdScale, vy: Math.sin(a) * 250 * spdScale,
                    radius: 8, damage: Math.round(20 * pMult), color: '#c084fc', life: 2.5
                  });
                }
                for (const da of [-0.15, 0, 0.15]) {
                  state.enemyProjectiles.push({
                    x: b.x, y: b.y,
                    vx: Math.cos(ang + da) * 360 * spdScale, vy: Math.sin(ang + da) * 360 * spdScale,
                    radius: 9, damage: Math.round(24 * pMult), color: '#f43f5e', life: 2.2
                  });
                }
                SoundFX.playLaser(360, 0.18);
                break;
              }

              case 'necro_void_lasers': {
                // Луч Тёмного Обелиска
                state.visualEffects.push({
                  type: 'boss_laser_sweep',
                  bossRef: b, x: b.x, y: b.y,
                  startAngle: ang - 0.5,
                  totalSweep: Math.PI * 1.1,
                  beamCount: 2,
                  beamLength: Math.max(canvasWidth, canvasHeight) * 0.78,
                  beamWidth: 20,
                  damagePerSec: Math.round((52 + km * 18) * pMult),
                  color: '#e879f9',
                  timer: 1.55, maxTimer: 1.55
                });
                SoundFX.playLaser(260, 0.28);
                break;
              }

              case 'necro_legion_ritual':
              default: {
                // Ритуал Бессмертного Легиона: призыв свиты нежити и тёмное ускорение всей орды
                spawnZombieWave(canvasWidth, canvasHeight);
                for (const z of state.zombies) {
                  z.buffTimer = Math.max(z.buffTimer || 0, 5.0);
                }
                state.visualEffects.push({
                  type: 'shockwave_ring', x: b.x, y: b.y, maxRadius: 210, color: '#c084fc', timer: 0.45, maxTimer: 0.45
                });
                SoundFX.playBoom(0.30, 0.09);
                break;
              }
            }
          }

          if (!b.leapState && Math.hypot(b.x - p.x, b.y - p.y) <= b.size + p.radius) {
            if (p.invulnTimer <= 0 && p.shieldTimer <= 0) {
              // Контактный урон босса значительно растёт с каждым километром!
              const bossContactDmg = Math.round(
                ((BOSS_SCALING_CONFIG.contactDamageBase || 80) + b.kmNumber * (BOSS_SCALING_CONFIG.contactDamagePerKm || 40)) * getKmEnemyDamageMultiplier()
              );
              p.hp = Math.max(0, p.hp - bossContactDmg);
              p.invulnTimer = 0.55;
              state.screenShake = Math.max(state.screenShake, 0.35);
              addDamageNumber(p.x, p.y - 24, `-${bossContactDmg} (БОСС!)`, '#ef4444');
              if (p.hp <= 0) {
                finishGame();
                return;
              }
            }
          }
        }
      }

      // 9. Update Green Square XP Particles (Магнит даёт +100% опыта за каждый уровень и собирает по импульсу!)
      const magnetAbil = state.abilities['magnet_pulse'];
      const magnetXpBonus = magnetAbil ? (1 + magnetAbil.level * 1.00) : 1.0;
      const skinXpMult = skin.xpMult || 1.0;
      const bossXpMult = getKmXpMultiplier();
      const basePickupRad = p.pickupRadius * skin.magnetMult;

      for (let i = state.xpParticles.length - 1; i >= 0; i--) {
        const xp = state.xpParticles[i];
        xp.x += xp.vx * dt;
        xp.y += xp.vy * dt;
        xp.vx *= 0.90;
        xp.vy *= 0.90;

        const dist = Math.hypot(p.x - xp.x, p.y - xp.y);
        // Притягиваем только в базовом радиусе подбора ИЛИ если частица была захвачена импульсом Магнита!
        if (dist <= basePickupRad || xp.magnetized) {
          xp.magnetized = true;
          const pullAng = Math.atan2(p.y - xp.y, p.x - xp.x);
          xp.x += Math.cos(pullAng) * 650 * dt;
          xp.y += Math.sin(pullAng) * 650 * dt;
        }

        if (dist <= p.radius + 16) {
          const gainedXp = (xp.value || 1) * bossXpMult * skinXpMult * magnetXpBonus;
          state.xp = +(state.xp + gainedXp).toFixed(2);
          SoundFX.playXpDing(1 + Math.min(1, state.xp / state.xpNeeded) * 0.35);
          state.xpParticles.splice(i, 1);

          while (state.xp >= state.xpNeeded && !state.paused) {
            state.xp = +(state.xp - state.xpNeeded).toFixed(2);
            grantLevelUpReward();
          }
        }
      }

      // 10. Update Shell Casings, Road Roller, DVD Orbital Lasers, Black Hole & Napalm Burn Zones
      for (let i = state.shellCasings.length - 1; i >= 0; i--) {
        const c = state.shellCasings[i];
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.vx *= 0.88;
        c.vy *= 0.88;
        c.life -= dt;
        if (c.life <= 0) state.shellCasings.splice(i, 1);
      }

      for (let i = state.visualEffects.length - 1; i >= 0; i--) {
        const fx = state.visualEffects[i];
        fx.timer -= dt;
        if (fx.type === 'voxel_splat') {
          fx.x += fx.vx * dt;
          fx.y += fx.vy * dt;
          fx.vx *= 0.9;
          fx.vy *= 0.9;
        } else if (fx.type === 'boss_death_zombie_chunk') {
          fx.x += (fx.vx || 0) * dt;
          fx.y += (fx.vy || 0) * dt;
          fx.vx *= 0.94;
          fx.vy *= 0.94;
          fx.rot = (fx.rot || 0) + (fx.vRot || 6) * dt;
          fx.z = (fx.z || 0) + (fx.vz || 0) * dt;
          fx.vz = (fx.vz || 0) - 520 * dt;
          if (fx.z < 0) {
            fx.z = 0;
            fx.vz = Math.abs(fx.vz) * 0.45;
          }
        } else if (fx.type === 'c130_plane') {
          const prog = 1 - Math.max(0, fx.timer) / Math.max(0.01, fx.maxTimer);
          fx.y = fx.startY + (fx.endY - fx.startY) * prog;
        } else if (fx.type === 'incoming_projectile') {
          if (fx.timer <= 0) {
            createSquareExplosion(fx.targetX, fx.targetY, fx.blastHalf || 70, fx.damage || 500, fx.color || '#f97316');
          }
        } else if (fx.type === 'road_roller') {
          fx.y += fx.vy * dt;
          damageObstaclesInSquare(fx.x, fx.y, fx.halfWidth, false);
          for (const z of state.zombies) {
            if (Math.abs(z.x - fx.x) <= fx.halfWidth + z.size && Math.abs(z.y - fx.y) <= 55 + z.size) {
              z.y -= 540 * dt;
              damageZombie(z, fx.damage * dt * 2.2, -Math.PI / 2, 16, true);
            }
          }
        } else if (fx.type === 'orbital_beam') {
          // Спутниковый Залп «УТАУ» движется рикошетом как DVD и наносит урон НА ВСЮ ВЕРТИКАЛЬНУЮ ДЛИНУ!
          fx.x += (fx.vx || 225) * dt;
          fx.y += (fx.vy || 185) * dt;
          const minX = roadLeft + 24;
          const maxX = roadRight - 24;
          const minY = state.cameraY + 35;
          const maxY = state.cameraY + canvasHeight - 35;
          if (fx.x <= minX) { fx.x = minX; fx.vx = Math.abs(fx.vx || 225); }
          else if (fx.x >= maxX) { fx.x = maxX; fx.vx = -Math.abs(fx.vx || 225); }
          if (fx.y <= minY) { fx.y = minY; fx.vy = Math.abs(fx.vy || 185); }
          else if (fx.y >= maxY) { fx.y = maxY; fx.vy = -Math.abs(fx.vy || 185); }

          const beamHalfW = (fx.radius || 54) * 0.65;
          const beamHalfLen = (fx.beamLength || 320) * 0.5;
          damageObstaclesInCircle(fx.x, fx.y, beamHalfW + 16, false);
          for (const z of state.zombies) {
            if (Math.abs(z.x - fx.x) <= beamHalfW + z.size && Math.abs(z.y - fx.y) <= beamHalfLen + z.size) {
              damageZombie(z, (fx.damagePerSec || 490) * dt * 2.4, null, 0, true);
            }
          }
          if (state.boss && Math.abs(state.boss.x - fx.x) <= beamHalfW + state.boss.size && Math.abs(state.boss.y - fx.y) <= beamHalfLen + state.boss.size) {
            const bDmg = (fx.damagePerSec || 490) * dt * 2.4;
            state.boss.hp -= bDmg;
            state.boss.hitFlash = 0.06;
          }
        } else if (fx.type === 'black_hole') {
          // Чёрная дыра стягивает врагов НА ПРОТЯЖЕНИИ ВСЕГО ДЕЙСТВИЯ и в 3 раза сильнее!
          const pullRad = fx.radius || 660;
          const dps = (fx.damagePerSec || 2500) * 0.85;
          for (const z of state.zombies) {
            const dx = fx.x - z.x;
            const dy = fx.y - z.y;
            const d = Math.hypot(dx, dy);
            if (d < pullRad && d > 1) {
              // Сила притяжения увеличена в 3 раза (мощная гравитационная воронка к центру дыры)
              const pullStep = Math.min(d, (580 + (1 - d / pullRad) * 650) * dt);
              z.x += (dx / d) * pullStep;
              z.y += (dy / d) * pullStep;
              damageZombie(z, dps * dt, null, 0, true);
            }
          }
          if (state.boss) {
            const dB = Math.hypot(state.boss.x - fx.x, state.boss.y - fx.y);
            if (dB < pullRad + state.boss.size) {
              state.boss.hp -= dps * dt;
              state.boss.hitFlash = 0.06;
            }
          }
        } else if (fx.type === 'boss_hazard_zone') {
          // Когда таймер предупреждения истекает — зона взрывается и наносит урон игроку!
          if (fx.timer <= 0) {
            SoundFX.playBoom(0.22, 0.08);
            state.visualEffects.push({
              type: 'explosion',
              x: fx.x,
              y: fx.y,
              radius: fx.radius,
              color: fx.color || '#ef4444',
              timer: 0.35,
              maxTimer: 0.35
            });
            if (Math.hypot(p.x - fx.x, p.y - fx.y) <= fx.radius + p.radius) {
              if (p.shieldTimer <= 0 && p.invulnTimer <= 0) {
                const zDmg = fx.damage || 35;
                p.hp = Math.max(0, p.hp - zDmg);
                p.invulnTimer = 0.45;
                addDamageNumber(p.x, p.y - 22, `-${zDmg} (ВЗРЫВ БОССА!)`, '#ef4444');
              }
            }
            if (fx.spawnAcid && state.acidPools.length < 18) {
              state.acidPools.push({
                x: fx.x,
                y: fx.y,
                radius: fx.radius * 0.75,
                damagePerSec: 25,
                isHealingZone: false,
                timer: 3.0
              });
            }
          }
        } else if (fx.type === 'boss_laser_sweep') {
          if (fx.bossRef && state.boss === fx.bossRef) {
            fx.x = state.boss.x;
            fx.y = state.boss.y;
          }
          const prog = 1 - Math.max(0, fx.timer) / Math.max(0.01, fx.maxTimer);
          const curAng = fx.startAngle + fx.totalSweep * prog;
          // Первые 25% времени — лазерный прицел-предупреждение, затем активный луч!
          if (prog >= 0.25) {
            const count = fx.beamCount || 2;
            for (let bIdx = 0; bIdx < count; bIdx++) {
              const a = curAng + (bIdx / count) * Math.PI;
              const cosA = Math.cos(a);
              const sinA = Math.sin(a);
              const dx = p.x - fx.x;
              const dy = p.y - fx.y;
              const perpDist = Math.abs(-sinA * dx + cosA * dy);
              const alongDist = Math.abs(cosA * dx + sinA * dy);
              if (perpDist <= (fx.beamWidth || 18) + p.radius && alongDist <= (fx.beamLength || 650)) {
                if (p.shieldTimer <= 0 && p.invulnTimer <= 0) {
                  const lDmg = Math.max(12, Math.round((fx.damagePerSec || 50) * 0.35));
                  p.hp = Math.max(0, p.hp - lDmg);
                  p.invulnTimer = 0.38;
                  addDamageNumber(p.x, p.y - 22, `-${lDmg} (ЛУЧ БОССА!)`, '#ef4444');
                }
              }
            }
          }
        } else if (fx.type === 'napalm_burn_zone') {
          for (const z of state.zombies) {
            if (Math.abs(z.x - fx.x) <= fx.halfSide + z.size && Math.abs(z.y - fx.y) <= fx.halfSide + z.size) {
              damageZombie(z, (fx.damagePerSec || 350) * dt, null, 0, true);
            }
          }
          if (state.boss && Math.abs(state.boss.x - fx.x) <= fx.halfSide + state.boss.size && Math.abs(state.boss.y - fx.y) <= fx.halfSide + state.boss.size) {
            state.boss.hp -= (fx.damagePerSec || 350) * dt;
            state.boss.hitFlash = 0.05;
          }
        }
        if (fx.timer <= 0) state.visualEffects.splice(i, 1);
      }

      for (let i = state.damageNumbers.length - 1; i >= 0; i--) {
        const dn = state.damageNumbers[i];
        dn.y += dn.vy * dt;
        dn.timer -= dt;
        if (dn.timer <= 0) state.damageNumbers.splice(i, 1);
      }

      updateHudDOM();
    }

    function updateHudDOM() {
      const p = state.player;
      const counts = getTotalItemsCount();
      const skin = SKINS[selectedSkinId] || SKINS.teto;
      const hpMult = getKmMultiplier();
      const bossXpMult = getKmXpMultiplier();
      const bossXpStr = Number.isInteger(bossXpMult) ? bossXpMult.toFixed(0) : bossXpMult.toFixed(1);
      const tenMinFactor = (state.timeElapsed / 600) * 0.75;
      const popPct = Math.round(100 + tenMinFactor * 300);

      document.getElementById('hudLevelText').textContent = `УР. ${state.level}`;
      document.getElementById('hudItemsCount').textContent = `Улучшений: ${counts.total}`;
      const kmMultEl = document.getElementById('hudKmMultiplier');
      if (kmMultEl) {
        kmMultEl.textContent = `ХП врагов ×${hpMult.toFixed(0)} • Опыт ×${bossXpStr}`;
      }
      const waveThreatEl = document.getElementById('hudWaveThreat');
      if (waveThreatEl) {
        waveThreatEl.textContent = `Популяция: ${popPct}%`;
      }
      document.getElementById('hudKillCount').textContent = `🧟 ${state.kills}`;

      const mins = String(Math.floor(state.timeElapsed / 60)).padStart(2, '0');
      const secs = String(Math.floor(state.timeElapsed % 60)).padStart(2, '0');
      document.getElementById('hudTimer').textContent = `${mins}:${secs}`;

      const stContainer = document.getElementById('streetProgressContainer');
      const bossContainer = document.getElementById('bossHudContainer');
      if (state.boss) {
        if (stContainer) stContainer.classList.add('hidden');
        if (bossContainer) bossContainer.classList.remove('hidden');
      } else {
        if (stContainer) stContainer.classList.remove('hidden');
        if (bossContainer) bossContainer.classList.add('hidden');
        const prevMilestone = state.nextBossMeters - 1000;
        const streetPct = Math.max(0, Math.min(100, ((state.maxDistanceMeters - prevMilestone) / 1000) * 100));
        const metersLeft = Math.max(0, state.nextBossMeters - state.maxDistanceMeters);
        document.getElementById('streetProgressBar').style.width = `${streetPct}%`;
        document.getElementById('streetDistanceText').textContent =
          `🛣️ До босса: ${metersLeft} м (${state.maxDistanceMeters} / ${state.nextBossMeters} м)`;
      }

      const hudRerolls = document.getElementById('hudRerollsBadge');
      if (hudRerolls) hudRerolls.textContent = `🎲 ${state.rerolls}`;

      const hpPct = Math.max(0, Math.min(100, (p.hp / p.maxHp) * 100));
      document.getElementById('hpBar').style.width = `${hpPct}%`;
      document.getElementById('hpText').textContent = `HP: ${Math.floor(p.hp)} / ${p.maxHp}`;

      const bottomHpBar = document.getElementById('bottomHpBar');
      const bottomHpText = document.getElementById('bottomHpText');
      const bottomStatsSubtext = document.getElementById('bottomStatsSubtext');
      if (bottomHpBar) {
        bottomHpBar.style.width = `${hpPct}%`;
        // Динамический цвет полоски ХП снизу (Фото 2): красный при <30% ХП, жёлтый при <70% ХП и зелёный при >=70% ХП!
        const trackEl = bottomHpBar.parentElement;
        if (hpPct < 30) {
          bottomHpBar.style.background = 'linear-gradient(90deg, #b91c1c, #ef4444, #f87171)';
          bottomHpBar.style.boxShadow = '0 0 12px rgba(239, 68, 68, 0.8)';
          if (trackEl) {
            trackEl.style.borderColor = 'rgba(239, 68, 68, 0.9)';
            trackEl.style.backgroundColor = 'rgba(69, 10, 10, 0.85)';
          }
        } else if (hpPct < 70) {
          bottomHpBar.style.background = 'linear-gradient(90deg, #ca8a04, #eab308, #facc15)';
          bottomHpBar.style.boxShadow = '0 0 12px rgba(234, 179, 8, 0.7)';
          if (trackEl) {
            trackEl.style.borderColor = 'rgba(234, 179, 8, 0.9)';
            trackEl.style.backgroundColor = 'rgba(69, 26, 3, 0.85)';
          }
        } else {
          bottomHpBar.style.background = 'linear-gradient(90deg, #059669, #10b981, #34d399)';
          bottomHpBar.style.boxShadow = '0 0 12px rgba(16, 185, 129, 0.7)';
          if (trackEl) {
            trackEl.style.borderColor = 'rgba(16, 185, 129, 0.9)';
            trackEl.style.backgroundColor = 'rgba(6, 46, 34, 0.85)';
          }
        }
      }
      if (bottomHpText) bottomHpText.textContent = `❤️ HP: ${Math.floor(p.hp)} / ${p.maxHp}`;

      const lvlBonuses = typeof getPlayerLevelBonuses === 'function'
        ? getPlayerLevelBonuses()
        : { lvlCount: 0, speedMult: 1, dashDuration: 0.10, dashInvuln: 0.10, dashCooldown: 10.0 };
      if (bottomStatsSubtext) {
        const spdPct = +((lvlBonuses.speedMult - 1) * 100).toFixed(1);
        const durSec = (lvlBonuses.dashDuration || 0.10).toFixed(2);
        const cdSec = (lvlBonuses.dashCooldown || 10.0).toFixed(1);
        bottomStatsSubtext.textContent = `УР.${state.level}: Скор. +${spdPct}% • Рывок/Неуязв. ${durSec}с • КД деша ${cdSec}с`;
      }

      const dashCircleArc = document.getElementById('dashCircleArc');
      const dashCircleText = document.getElementById('dashCircleText');
      const dashCircleWidget = document.getElementById('dashCircleWidget');
      if (dashCircleArc && dashCircleText) {
        const circumference = 125.66; // 2 * PI * 20
        const cdLeft = Math.max(0, p.dashCdTimer || 0);
        const maxCd = Math.max(0.05, p.dashMaxCd || lvlBonuses.dashCooldown || 1.0);
        const readyRatio = cdLeft <= 0 ? 1 : Math.max(0, Math.min(1, 1 - cdLeft / maxCd));
        dashCircleArc.style.strokeDashoffset = `${(circumference * (1 - readyRatio)).toFixed(2)}`;
        if (cdLeft <= 0) {
          dashCircleText.textContent = 'SHIFT';
          dashCircleArc.setAttribute('stroke', '#22d3ee');
          if (dashCircleWidget) dashCircleWidget.classList.add('border-cyan-400');
        } else {
          dashCircleText.textContent = `${cdLeft.toFixed(1)}с`;
          dashCircleArc.setAttribute('stroke', '#94a3b8');
          if (dashCircleWidget) dashCircleWidget.classList.remove('border-cyan-400');
        }
      }

      const xpPct = Math.max(0, Math.min(100, (state.xp / state.xpNeeded) * 100));
      document.getElementById('xpBar').style.width = `${xpPct}%`;
      document.getElementById('xpText').textContent =
        `🟩 Опыт: ${Math.floor(state.xp)} / ${state.xpNeeded}`;
    }

    // =========================================================================
    // 17. RENDERING: INDEPENDENT WEAPONS, ORBITING DRONES, LEEKS, ROTATING LASERS
    // =========================================================================
    function drawPlushieTetoPhotoSprite(ctx, pet) {
      const plushImg = document.getElementById('imgPlushTeto');
      ctx.save();
      ctx.globalAlpha = 1.0;

      const shadowScale = Math.max(0.35, 1 - pet.z / 200);
      ctx.fillStyle = 'rgba(0,0,0,0.52)';
      ctx.beginPath();
      ctx.ellipse(pet.x, pet.y + 16, 20 * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.translate(pet.x, pet.y - pet.z);
      ctx.rotate(pet.rot || 0);
      ctx.scale(pet.squashScale, 2 - pet.squashScale);

      if (plushImg && plushImg.complete && plushImg.naturalWidth > 0) {
        ctx.drawImage(plushImg, -28, -32, 56, 56);
      } else {
        ctx.fillStyle = '#fb7185';
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawOrbitingDrones(ctx) {
      for (const d of state.orbitDrones) {
        ctx.save();
        ctx.globalAlpha = 0.52;
        ctx.translate(d.x, d.y);
        // Drone shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(-8, 14, 16, 4);
        // Quadcopter arms & rotors
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, -6);
        ctx.lineTo(10, 6);
        ctx.moveTo(10, -6);
        ctx.lineTo(-10, 6);
        ctx.stroke();
        // Glowing core
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-5, -5, 10, 10);
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(-2.5, -2.5, 5, 5);
        ctx.restore();
      }
    }

    function drawSpinningLeeksAura(ctx) {
      if (state.spinningLeeks.length === 0) return;
      for (const l of state.spinningLeeks) {
        ctx.save();
        ctx.globalAlpha = 0.45;
        ctx.translate(l.x, l.y);
        ctx.rotate(l.angle + state.timeElapsed * 10);
        const s = l.size / 18;
        ctx.scale(s, s);
        // Glowing cyan/green slash trail
        ctx.strokeStyle = 'rgba(74, 222, 128, 0.32)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 1.4);
        ctx.stroke();
        // Pixel Leek stalk & leaves
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-10, -3.5, 10, 7);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(0, -5, 12, 4.5);
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(0, 0.5, 12, 4.5);
        ctx.restore();
      }
    }

    function drawPixelZombieVariety(ctx, z) {
      ctx.save();
      const wobbleX = Math.sin(z.wobblePhase) * 1.8;
      ctx.translate(Math.round(z.x + wobbleX), Math.round(z.y));

      const s = z.size;
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(-s * 0.75, s * 0.65, s * 1.5, s * 0.35);

      if (z.type === 'necromancer' || z.buffTimer > 0) {
        ctx.strokeStyle = z.type === 'necromancer' ? '#c084fc' : 'rgba(192, 132, 252, 0.45)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-s * 0.9, -s * 1.2, s * 1.8, s * 2.0);
      }

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-s * 0.45, s * 0.25, s * 0.35, s * 0.55);
      ctx.fillRect(s * 0.1, s * 0.25, s * 0.35, s * 0.55);

      ctx.fillStyle = z.hitFlash > 0 ? '#ffffff' : z.shirtColor;
      ctx.fillRect(-s * 0.6, -s * 0.25, s * 1.2, s * 0.65);

      let skinCol = '#4ade80';
      if (z.type === 'spitter') skinCol = '#a3e635';
      else if (z.type === 'tank') skinCol = '#16a34a';
      else if (z.chillTimer > 0) skinCol = '#67e8f9';

      ctx.fillStyle = z.hitFlash > 0 ? '#ffffff' : skinCol;
      ctx.fillRect(-s * 0.65, -s * 1.05, s * 1.3, s * 0.9);

      if (z.type === 'riot') {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-s * 0.72, -s * 1.15, s * 1.44, s * 0.48);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(-s * 0.5, -s * 0.85, s * 1.0, s * 0.2);
        ctx.fillStyle = '#64748b';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.fillRect(-s * 0.85, -s * 0.4, s * 0.45, s * 1.05);
        ctx.strokeRect(-s * 0.85, -s * 0.4, s * 0.45, s * 1.05);
      } else if (z.type === 'bomber') {
        const blink = Math.sin(state.timeElapsed * 18) > 0;
        ctx.fillStyle = blink ? '#ef4444' : '#fde047';
        ctx.fillRect(-s * 0.5, -s * 1.45, s * 1.0, s * 0.45);
      } else if (z.type === 'necromancer') {
        ctx.fillStyle = '#3b0764';
        ctx.fillRect(-s * 0.7, -s * 1.15, s * 1.4, s * 0.4);
        ctx.fillStyle = '#e879f9';
        ctx.fillRect(-s * 0.15, -s * 1.05, s * 0.3, s * 0.25);
      } else {
        ctx.fillStyle = '#14532d';
        ctx.fillRect(-s * 0.65, -s * 1.05, s * 1.3, s * 0.25);
      }

      ctx.fillStyle = z.type === 'sprinter' || z.type === 'tank' ? '#ef4444' : '#090d16';
      ctx.fillRect(-s * 0.42, -s * 0.58, s * 0.24, s * 0.24);
      ctx.fillRect(s * 0.18, -s * 0.58, s * 0.24, s * 0.24);

      if (z.hp < z.maxHp && (z.type === 'tank' || z.type === 'riot' || z.type === 'necromancer')) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(-s * 0.7, -s * 1.35, s * 1.4, 3.5);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-s * 0.7, -s * 1.35, s * 1.4 * Math.max(0, z.hp / z.maxHp), 3.5);
      }

      ctx.restore();
    }

    function drawGiantBossZombie(ctx, b) {
      ctx.save();
      ctx.translate(Math.round(b.x), Math.round(b.y));
      const s = b.size;

      // Boss Aura Frame (пульсирующая багровая аура в фазе ЯРОСТИ!)
      if (b.enraged) {
        const pulse = 1.18 + Math.sin(state.timeElapsed * 14) * 0.10;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
        ctx.fillRect(-s * pulse, -s * 1.45, s * pulse * 2, s * 2.55);
      }
      ctx.strokeStyle = b.enraged ? '#ef4444' : (b.accentColor || '#ef4444');
      ctx.lineWidth = b.enraged ? 5.5 : 4;
      ctx.strokeRect(-s * 1.1, -s * 1.35, s * 2.2, s * 2.35);

      // Boss Torso
      ctx.fillStyle = b.hitFlash > 0 ? '#ffffff' : (b.bodyColor || '#1e1b4b');
      ctx.fillRect(-s * 0.85, -s * 0.2, s * 1.7, s * 1.05);

      // Boss Head
      ctx.fillStyle = b.hitFlash > 0 ? '#ffffff' : (b.headColor || '#22c55e');
      ctx.fillRect(-s * 0.85, -s * 1.15, s * 1.7, s * 1.05);

      // Archetype-specific Boss Gear & Details
      if (b.archetype === 'cyber_riot') {
        // Heavy Steel Riot Shields on both sides + Glowing Cyan Visor
        ctx.fillStyle = '#334155';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.fillRect(-s * 1.25, -s * 0.6, s * 0.45, s * 1.45);
        ctx.strokeRect(-s * 1.25, -s * 0.6, s * 0.45, s * 1.45);
        ctx.fillRect(s * 0.8, -s * 0.6, s * 0.45, s * 1.45);
        ctx.strokeRect(s * 0.8, -s * 0.6, s * 0.45, s * 1.45);
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(-s * 0.65, -s * 0.72, s * 1.3, s * 0.32);
      } else if (b.archetype === 'plague_spitter') {
        // Glowing Biohazard Tanks on shoulders
        ctx.fillStyle = '#84cc16';
        ctx.fillRect(-s * 1.15, -s * 0.5, s * 0.35, s * 0.9);
        ctx.fillRect(s * 0.8, -s * 0.5, s * 0.35, s * 0.9);
        ctx.fillStyle = '#14532d';
        ctx.fillRect(-s * 0.85, -s * 1.15, s * 1.7, s * 0.28);
      } else if (b.archetype === 'pyro_bomber') {
        // Twin Nuclear TNT Barrels strapped on top
        const blink = Math.sin(state.timeElapsed * 16) > 0;
        ctx.fillStyle = blink ? '#ef4444' : '#facc15';
        ctx.fillRect(-s * 0.9, -s * 1.6, s * 0.75, s * 0.5);
        ctx.fillRect(s * 0.15, -s * 1.6, s * 0.75, s * 0.5);
      } else if (b.archetype === 'necro_lord') {
        // Dark Cultist Crown & Floating Necro Gems
        ctx.fillStyle = '#e879f9';
        ctx.beginPath();
        ctx.moveTo(-s * 0.65, -s * 1.15);
        ctx.lineTo(-s * 0.35, -s * 1.7);
        ctx.lineTo(0, -s * 1.3);
        ctx.lineTo(s * 0.35, -s * 1.7);
        ctx.lineTo(s * 0.65, -s * 1.15);
        ctx.closePath();
        ctx.fill();
      } else {
        // Default Titan Golden Crown
        ctx.fillStyle = '#14532d';
        ctx.fillRect(-s * 0.85, -s * 1.15, s * 1.7, s * 0.28);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-s * 0.55, -s * 1.45, s * 1.1, s * 0.3);
      }

      // Glowing Boss Eyes (if not covered by Cyber Visor)
      if (b.archetype !== 'cyber_riot') {
        ctx.fillStyle = b.eyeColor || '#ef4444';
        ctx.fillRect(-s * 0.52, -s * 0.65, s * 0.34, s * 0.3);
        ctx.fillRect(s * 0.18, -s * 0.65, s * 0.34, s * 0.3);
      }

      ctx.restore();
    }
