// =========================================================================
    // 2. SKINS DATA (Teto, Miku, Neru)
    // =========================================================================
    // Explosive abilities boosted by Teto (+35% damage, +30% explosion area at the end)
    const TETO_EXPLOSIVE_ABILITIES = new Set([
      'plush_teto',
      'c130_airstrike',
      'meteor_rain',
      'orbital_laser',
      'mortar_barrage'
    ]);

    // Abilities excluded from Neru's +50% ability damage bonus
    const NERU_EXCLUDED_DAMAGE_ABILITIES = new Set([
      'plush_teto',
      'c130_airstrike',
      'meteor_rain',
      'triple_baka_overdrive',
      'drill_tornado',
      'cryo_blizzard',
      'acid_juice',
      'magnet_pulse'
    ]);

    const SKINS = {
      teto: {
        id: 'teto',
        name: 'Касане Тето',
        shortName: 'ТЕТО',
        code: '0401',
        hairColor: '#e11d48',
        hairDark: '#9f1239',
        outfitColor: '#1e293b',
        trimColor: '#f43f5e',
        eyeColor: '#e11d48',
        badgeClass: 'bg-rose-600 text-white',
        dmgMult: 1.0,
        areaMult: 1.0,
        cdMult: 1.0,
        speedMult: 1.0,
        magnetMult: 1.0,
        regenPerSec: 0,
        startRerolls: 5,
        rerollsPerBoss: 5,
        handheldWeaponDmgMult: 1.45, // +45% to handheld weapons (except leek & railgun)
        explosionDmgMult: 1.45,      // +45% to explosions (Plush Teto, Bombardment, Meteors, UTAU, Katyusha)
        explosionAreaMult: 2.00,     // +100% to explosion area
        cutinImgId: 'imgCutinTeto',
        quotes: [
          'Тето: «Ахаха! Ручное оружие и взрывы +45% урона и +100% площади взрывов!»',
          'Тето: «Мои Плюшки и Катюша накрывают всю улицу!»',
          'Тето: «С каждым километром веселье только начинается!»'
        ]
      },
      miku: {
        id: 'miku',
        name: 'Хацуне Мику',
        shortName: 'МИКУ',
        code: '01',
        hairColor: '#06b6d4',
        hairDark: '#0e7490',
        outfitColor: '#e2e8f0',
        trimColor: '#22d3ee',
        eyeColor: '#06b6d4',
        badgeClass: 'bg-cyan-600 text-white',
        dmgMult: 1.0,
        areaMult: 1.0,
        cdMult: 1.0,
        speedMult: 1.0,
        magnetMult: 1.0,
        regenPerSec: 1.0,            // Passive regeneration 1 HP/sec
        xpMult: 1.00,                // Base XP multiplier 1.0; multiplies boss XP bonus by 1.5!
        bossXpFactor: 1.50,          // Multiplies boss XP multiplier by 1.5 (1st boss: 7.5, 2nd: 15, 3rd: 22.5...)
        startRerolls: 10,            // 10 rerolls at start
        rerollsPerBoss: 10,          // +10 rerolls per boss for Miku
        startsWithLegendaryMagnet: true,
        leekAndDrillDmgMult: 2.0,    // +100% final damage to Leek & Giant Drills
        cutinImgId: 'imgCutinMiku',
        quotes: [
          'Мику: «Умножаю множитель опыта за босса на 1.5 (×7.5, ×15...) и получаю +10 рероллов!»',
          'Мику: «Лук-порей и Гигантские буры бьют с двойным уроном (+100%)!»',
          'Мику: «Пассивная регенерация 1 HP/сек и Легендарный Магнит со старта!»'
        ]
      },
      neru: {
        id: 'neru',
        name: 'Акита Неро',
        shortName: 'НЕРО',
        code: 'DEN2',
        hairColor: '#facc15',
        hairDark: '#ca8a04',
        outfitColor: '#1f2937',
        trimColor: '#eab308',
        eyeColor: '#f59e0b',
        badgeClass: 'bg-amber-400 text-slate-950',
        dmgMult: 1.0,
        areaMult: 1.0,
        cdMult: 0.50,                // -50% ability cooldown reduction (2x faster cooldowns!)
        speedMult: 1.0,
        magnetMult: 1.0,
        regenPerSec: 0,
        startRerolls: 5,
        rerollsPerBoss: 5,
        abilityDmgMult: 1.50,        // +50% final damage to eligible abilities
        highRarityBonusChance: 0.50, // +50% high rarity chance
        cutinImgId: 'imgCutinNeru',
        quotes: [
          'Неро: «Перезарядка абилок в 2 раза быстрее (-50% КД) и +50% к редкости!»',
          'Неро: «Мои техно-абилки и Рельсотрон бьют на +50% сильнее!»',
          'Неро: «Давай выбьем Эпическую или Легендарную редкость!»'
        ]
      }
    };

    // =========================================================================
    // 3. RARITY SYSTEM (Common: 1 stat, Rare: 2 stats, Epic: 3 stats, Legendary: 3 stats x2)
    // =========================================================================
    const RARITIES = [
      {
        id: 'common',
        name: 'ОБЫЧНАЯ',
        emoji: '⚪',
        weight: 48,
        levelGain: 1,
        statsCount: 1,
        multiplier: 1,
        borderClass: 'border-slate-400 bg-slate-900/95',
        badgeClass: 'bg-slate-600 text-white',
        textClass: 'text-slate-200'
      },
      {
        id: 'rare',
        name: 'РЕДКАЯ',
        emoji: '🔵',
        weight: 30,
        levelGain: 2,
        statsCount: 2,
        multiplier: 1,
        borderClass: 'border-sky-400 bg-sky-950/95',
        badgeClass: 'bg-sky-500 text-slate-950',
        textClass: 'text-sky-300'
      },
      {
        id: 'epic',
        name: 'ЭПИЧЕСКАЯ',
        emoji: '🟣',
        weight: 15,
        levelGain: 3,
        statsCount: 3,
        multiplier: 1,
        borderClass: 'border-purple-400 bg-purple-950/95',
        badgeClass: 'bg-purple-500 text-white',
        textClass: 'text-purple-300'
      },
      {
        id: 'legendary',
        name: 'ЛЕГЕНДАРНАЯ',
        emoji: '🟡',
        weight: 7,
        levelGain: 6,
        statsCount: 3,
        multiplier: 2,
        borderClass: 'border-amber-400 bg-amber-950/95 shadow-[0_0_25px_rgba(251,191,36,0.65)]',
        badgeClass: 'bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950',
        textClass: 'text-amber-300'
      }
    ];

    function rollUpgradeRarity() {
      // Neru has +50% chance of high rarity
      const isNeru = selectedSkinId === 'neru';
      const weights = RARITIES.map(r => {
        if (!isNeru) return r.weight;
        if (r.id === 'common') return 14;                  // 14% Common
        if (r.id === 'rare') return 40;                    // 40% Rare
        if (r.id === 'epic') return 28;                    // 28% Epic
        if (r.id === 'legendary') return 18;               // 18% Legendary
        return r.weight;
      });
      const totalW = weights.reduce((s, w) => s + w, 0);
      let roll = Math.random() * totalW;
      for (let i = 0; i < RARITIES.length; i++) {
        if (roll < weights[i]) return RARITIES[i];
        roll -= weights[i];
      }
      return RARITIES[0];
    }

    // Custom 3-Stat Definitions for all 10 Weapons and 20 Abilities
    const ITEM_CUSTOM_STATS = {
      // 10 Weapons
      pistol:       ['💥 Урон пули +30%', '🔫 Мультишот (+1 пуля за ур.)', '⚡ Скорострельность +20%'],
      leek_blaster: ['💥 Урон шинковки +32%', '🥬 Кол-во луков (+1 на орбиту)', '🌀 Размер спрайта и скорость +30%'],
      mp5:          ['💥 Бронепробитие и урон +28%', '📠 Длина очереди (+2 пули)', '⚡ Темп стрельбы +25%'],
      ak47:         ['💥 Тяжёлый урон 7.62 +32%', '📐 Пробитие навылет (+цели)', '🛑 Сила отбрасывания +25%'],
      dual_ar:      ['💥 Урон с двух рук +28%', '⚔️ Ширина веера и стволы', '⚡ Частота очередей +12%'],
      minigun:      ['💥 Урон пули +28%', '🔥 Плотность потока (+стволы)', '⚡ Разгон стволов (RPM) +12%'],
      dual_sniper:  ['💥 Урон синего луча +50%', '💠 Ширина трассера и пробитие +50%', '⚡ Частота выстрелов +12%'],
      shotgun:      ['💥 Урон картечи +30%', '🧨 Кол-во дробин в веере (+2)', '📐 Конус и отбрасывание +25%'],
      baguette_rpg: ['💥 Урон в эпицентре +75%', '🥖 Радиус фугасного взрыва +28%', '🚀 Скорость и перезарядка +12%'],
      plasma_rail:  ['💥 Урон плазмы +32%', '⚡ Радиус электро-дуги +28%', '🔋 Цепные микро-взрывы +1'],

      // 20 Abilities
      plush_teto:            ['💥 Урон раздавливания +32%', '🧸 Радиус прыжка и взрыва +50%', '⚡ Скорость бега и прыжков +35%'],
      c130_airstrike:        ['💥 Урон фугасных авиабомб +35%', '📐 Площадь квадрата +50%', '⚡ Снижение КД бомбардировки -15%'],
      drone_swarm:           ['💥 Урон лазерного луча +30%', '🛸 Кол-во дронов (+1 на орбиту)', '⚡ Скорострельность лазеров +20%'],
      twin_mega_beam:        ['💥 Урон в секунду (DPS) +35%', '⚡ Снижение КД мега-луча -15%', '🔄 Сектор вращения (+90° к обороту)'],
      road_roller:           ['🛑 Сила расталкивания и урон +30%', '🚜 Ширина катка (до всей карты) +25%', '⚡ Снижение КД катка -20%'],
      meteor_rain:           ['💥 Урон падения и ожога +35%', '☄️ Радиус кратера +50%', '🔥 Кол-во метеоров в шторме (+1)'],
      triple_baka_overdrive: ['💥 Огневая мощь союзниц +32%', '⏱️ Длительность боя втроём +1.4с', '⚡ Снижение КД призыва -14%'],
      flash_panic:           ['💥 Урон шоковой волны +30%', '📐 Радиус ослепления экрана +40%', '💫 Оглушение +0.6с и КД -15%'],
      neru_phone:            ['💥 Урон электро-разряда +32%', '📱 Кол-во перескоков цепи (+3)', '⚡ Дальность дуги +30% и КД -25%'],
      drill_tornado:         ['💥 Урон перемалывания +32%', '🌀 Размер волос-буров Тето +50%', '🌪️ Отброс +25% и КД -15%'],
      bass_shockwave:        ['⚡ Снижение КД бас-дропа -20%', '🔊 Радиус звукового фронта +50%', '🌊 Сила отбрасывания назад +50%'],
      cryo_blizzard:         ['💥 Крио-урон раскалывания +50%', '❄️ Размер квадрата заморозки +50%', '🧊 Длительность обморожения +1.0с'],
      orbital_laser:         ['💥 Фокусированный урон +50%', '📐 Вертикальная длина +45% и жизнь +3.0с', '☄️ +1 колонна плазмы и КД -10%'],
      napalm_ring:           ['💥 Урон горения (DoT) +100%', '🔥 Радиус кольца пламени +50%', '⏳ Длительность горения +2.0с'],
      mortar_barrage:        ['💥 Урон прямого попадания +32%', '🚀 Радиус подрыва багета +50%', '💣 Кол-во ракет в залпе (+2)'],
      black_hole:            ['💥 Урон сверхновой при взрыве +35%', '🕳️ Радиус захвата улицы +28%', '⚡ Снижение КД сингулярности -10%'],
      acid_juice:            ['💚 Лечение в зоне +5 HP/с', '⏱️ Длительность +2с и КД -15%', '🟢 +1 лужа и радиус зоны +35%'],
      holo_shield:           ['⚡ Снижение КД купола -30%', '🛡️ Радиус отталкивающей волны +50%', '⏱️ Длительность купола +1.0с'],
      magnet_pulse:          ['📈 Множитель опыта +100% за ур.', '🧲 Высота зоны притяжения +50%', '⚡ Снижение КД импульса -30%'],
      chibi_turret:          ['💥 Калибр и скорострельность +100%', '🤖 Кол-во турелей за спавн (+2)', '⚡ КД -30% и +3с жизни турели']
    };

    // Вычисляет чёткое числовое изменение каждого стата (Было ➔ Стало (+Δ)) во время игры!
    function formatComputedStatChange(itemId, statSlot, beforeState, afterState) {
      const wDef = WEAPONS_POOL.find(w => w.id === itemId);
      if (wDef) {
        const bStats = getWeaponStats({ def: wDef, ...beforeState });
        const aStats = getWeaponStats({ def: wDef, ...afterState });
        if (statSlot === 'dmg') {
          const diff = aStats.damage - bStats.damage;
          return `💥 Урон: ${bStats.damage} ➔ ${aStats.damage} (${diff >= 0 ? '+' : ''}${diff})`;
        } else if (statSlot === 'area') {
          if (itemId === 'pistol' || itemId === 'mp5' || itemId === 'shotgun' || itemId === 'dual_ar' || itemId === 'minigun') {
            const diff = aStats.count - bStats.count;
            return `🔫 Пуль за выстрел: ${bStats.count} ➔ ${aStats.count} (+${Math.max(1, diff)})`;
          } else if (itemId === 'leek_blaster') {
            const bC = 2 + (beforeState.areaPts - 1);
            const aC = 2 + (afterState.areaPts - 1);
            return `🥬 Луков на орбите: ${bC} ➔ ${aC} (+${aC - bC})`;
          } else if (itemId === 'ak47' || itemId === 'dual_sniper') {
            return `💠 Пробитие: ${bStats.pierce} ➔ ${aStats.pierce} (+${aStats.pierce - bStats.pierce}) • Ширина ×${aStats.areaScale.toFixed(2)}`;
          } else if (itemId === 'baguette_rpg' || itemId === 'plasma_rail') {
            const bR = Math.round(wDef.explosiveRadius * (bStats.explosionAreaScale || bStats.areaScale));
            const aR = Math.round(wDef.explosiveRadius * (aStats.explosionAreaScale || aStats.areaScale));
            return `🥖 Радиус взрыва: ${bR}px ➔ ${aR}px (+${aR - bR}px)`;
          }
        } else if (statSlot === 'cd') {
          if (itemId === 'leek_blaster') {
            const bS = Math.round(22 * (1 + (beforeState.cdPts - 1) * 0.30));
            const aS = Math.round(22 * (1 + (afterState.cdPts - 1) * 0.30));
            return `🌀 Размер и скорость лука: ${bS}px ➔ ${aS}px (+${aS - bS}px)`;
          } else if (itemId === 'ak47' || itemId === 'shotgun') {
            const bK = Math.round(18 * (1 + (beforeState.cdPts - 1) * 0.25));
            const aK = Math.round(18 * (1 + (afterState.cdPts - 1) * 0.25));
            return `🛑 Отбрасывание: ${bK} ➔ ${aK} (+${aK - bK})`;
          } else {
            const bRpm = (1 / bStats.cooldown).toFixed(1);
            const aRpm = (1 / aStats.cooldown).toFixed(1);
            return `⚡ Стрельба: ${bRpm}/с ➔ ${aRpm}/с (КД ${bStats.cooldown.toFixed(2)}с ➔ ${aStats.cooldown.toFixed(2)}с)`;
          }
        }
      }

      const aDef = ABILITIES_POOL.find(a => a.id === itemId);
      if (aDef) {
        const bStats = getAbilityStats({ def: aDef, ...beforeState });
        const aStats = getAbilityStats({ def: aDef, ...afterState });
        if (statSlot === 'dmg') {
          if (itemId === 'bass_shockwave' || itemId === 'holo_shield') {
            return `⚡ КД: ${bStats.cooldown.toFixed(2)}с ➔ ${aStats.cooldown.toFixed(2)}с (-${(bStats.cooldown - aStats.cooldown).toFixed(2)}с)`;
          } else if (itemId === 'acid_juice') {
            const bH = 10 + (beforeState.dmgPts - 1) * 5;
            const aH = 10 + (afterState.dmgPts - 1) * 5;
            return `💚 Лечение: ${bH} ➔ ${aH} HP/с (+${aH - bH} HP/с)`;
          } else if (itemId === 'magnet_pulse') {
            const bM = Math.round(beforeState.level * 100);
            const aM = Math.round(afterState.level * 100);
            return `📈 Бонус опыта: +${bM}% ➔ +${aM}% (+${aM - bM}%)`;
          } else if (itemId === 'chibi_turret') {
            const bF = (1 / (0.22 / (1 + (beforeState.dmgPts - 1) * 1.0))).toFixed(1);
            const aF = (1 / (0.22 / (1 + (afterState.dmgPts - 1) * 1.0))).toFixed(1);
            return `💥 Урон: ${bStats.damage} ➔ ${aStats.damage} (+${aStats.damage - bStats.damage}) • Выстр/с: ${bF} ➔ ${aF}`;
          } else {
            const diff = aStats.damage - bStats.damage;
            return `💥 Урон: ${bStats.damage} ➔ ${aStats.damage} (+${diff})`;
          }
        } else if (statSlot === 'area') {
          if (itemId === 'twin_mega_beam') {
            return `⚡ КД луча: ${bStats.cooldown.toFixed(2)}с ➔ ${aStats.cooldown.toFixed(2)}с (-${(bStats.cooldown - aStats.cooldown).toFixed(2)}с)`;
          } else if (itemId === 'drone_swarm') {
            const bD = 1 + beforeState.level + Math.max(0, beforeState.areaPts - 1);
            const aD = 1 + afterState.level + Math.max(0, afterState.areaPts - 1);
            return `🛸 Дронов на орбите: ${bD} ➔ ${aD} (+${aD - bD})`;
          } else if (itemId === 'triple_baka_overdrive') {
            const bT = (5.5 + (beforeState.areaPts - 1) * 1.4 + beforeState.level * 0.5).toFixed(1);
            const aT = (5.5 + (afterState.areaPts - 1) * 1.4 + afterState.level * 0.5).toFixed(1);
            return `⏱️ Длительность боя: ${bT}с ➔ ${aT}с (+${(aT - bT).toFixed(1)}с)`;
          } else if (itemId === 'neru_phone') {
            const bJ = 3 + (beforeState.areaPts - 1) * 3;
            const aJ = 3 + (afterState.areaPts - 1) * 3;
            return `📱 Рикошетов молнии: ${bJ} ➔ ${aJ} (+${aJ - bJ})`;
          } else if (itemId === 'orbital_laser') {
            const bLen = Math.round(280 * bStats.areaScale);
            const aLen = Math.round(280 * aStats.areaScale);
            const bL = (4.0 + (beforeState.areaPts - 1) * 3.0).toFixed(1);
            const aL = (4.0 + (afterState.areaPts - 1) * 3.0).toFixed(1);
            return `📐 Длина: ${bLen}px ➔ ${aLen}px • Жизнь: ${bL}с ➔ ${aL}с`;
          } else if (itemId === 'acid_juice') {
            const bDur = (5.0 + (beforeState.areaPts - 1) * 2.0).toFixed(1);
            const aDur = (5.0 + (afterState.areaPts - 1) * 2.0).toFixed(1);
            return `⏱️ Действие: ${bDur}с ➔ ${aDur}с (+${(aDur - bDur).toFixed(1)}с) • КД ${bStats.cooldown.toFixed(1)}с ➔ ${aStats.cooldown.toFixed(1)}с`;
          } else if (itemId === 'magnet_pulse') {
            const bH = Math.round(90 * 1.5 * bStats.areaScale * 2);
            const aH = Math.round(90 * 1.5 * aStats.areaScale * 2);
            return `🧲 Высота прямоугольника: ${bH}px ➔ ${aH}px (+${aH - bH}px)`;
          } else if (itemId === 'chibi_turret') {
            const bCnt = 1 + (beforeState.areaPts - 1) * 2;
            const aCnt = 1 + (afterState.areaPts - 1) * 2;
            return `🤖 Турелей за спавн: ${bCnt} ➔ ${aCnt} (+${aCnt - bCnt})`;
          } else {
            const baseR = itemId === 'bass_shockwave' ? 420 : (itemId === 'black_hole' ? 660 : (itemId === 'holo_shield' ? 260 : 130));
            const bR = Math.round(baseR * bStats.areaScale);
            const aR = Math.round(baseR * aStats.areaScale);
            return `📐 Размер/Радиус: ${bR}px ➔ ${aR}px (+${aR - bR}px)`;
          }
        } else if (statSlot === 'cd') {
          if (itemId === 'plush_teto') {
            const bSpd = Math.round(155 * (1 + (beforeState.cdPts - 1) * 0.35));
            const aSpd = Math.round(155 * (1 + (afterState.cdPts - 1) * 0.35));
            return `⚡ Скорость Плюшек: ${bSpd} ➔ ${aSpd} (+${aSpd - bSpd})`;
          } else if (itemId === 'drone_swarm') {
            const bInt = (0.48 / (1 + (beforeState.cdPts - 1) * 0.20)).toFixed(2);
            const aInt = (0.48 / (1 + (afterState.cdPts - 1) * 0.20)).toFixed(2);
            return `⚡ Интервал лазеров: ${bInt}с ➔ ${aInt}с`;
          } else if (itemId === 'twin_mega_beam') {
            const bDeg = (beforeState.level + Math.max(0, beforeState.cdPts - 1)) * 90;
            const aDeg = (afterState.level + Math.max(0, afterState.cdPts - 1)) * 90;
            return `🔄 Сектор вращения: ${bDeg}° ➔ ${aDeg}° (+${aDeg - bDeg}°)`;
          } else if (itemId === 'meteor_rain') {
            const bM = 5 + (beforeState.level - 1) + Math.max(0, beforeState.cdPts - 1);
            const aM = 5 + (afterState.level - 1) + Math.max(0, afterState.cdPts - 1);
            return `🔥 Метеоров в шторме: ${bM} ➔ ${aM} (+${aM - bM})`;
          } else if (itemId === 'flash_panic') {
            const bSt = (3.2 + (beforeState.cdPts - 1) * 0.6).toFixed(1);
            const aSt = (3.2 + (afterState.cdPts - 1) * 0.6).toFixed(1);
            return `💫 Оглушение: ${bSt}с ➔ ${aSt}с • КД ${bStats.cooldown.toFixed(1)}с ➔ ${aStats.cooldown.toFixed(1)}с`;
          } else if (itemId === 'neru_phone') {
            const bD = Math.round(340 * (1 + (beforeState.cdPts - 1) * 0.30));
            const aD = Math.round(340 * (1 + (afterState.cdPts - 1) * 0.30));
            return `⚡ Дальность: ${bD}px ➔ ${aD}px • КД ${bStats.cooldown.toFixed(1)}с ➔ ${aStats.cooldown.toFixed(1)}с`;
          } else if (itemId === 'drill_tornado') {
            const bK = Math.round(55 * (1 + (beforeState.cdPts - 1) * 0.25));
            const aK = Math.round(55 * (1 + (afterState.cdPts - 1) * 0.25));
            return `🌪️ Отброс: ${bK} ➔ ${aK} • КД ${bStats.cooldown.toFixed(1)}с ➔ ${aStats.cooldown.toFixed(1)}с`;
          } else if (itemId === 'bass_shockwave') {
            const bK = Math.round(85 * (1 + (beforeState.cdPts - 1) * 0.50));
            const aK = Math.round(85 * (1 + (afterState.cdPts - 1) * 0.50));
            return `🌊 Сила отброса: ${bK} ➔ ${aK} (+${aK - bK})`;
          } else if (itemId === 'cryo_blizzard') {
            const bC = (5.0 + (beforeState.cdPts - 1) * 1.0).toFixed(1);
            const aC = (5.0 + (afterState.cdPts - 1) * 1.0).toFixed(1);
            return `🧊 Заморозка: ${bC}с ➔ ${aC}с (+${(aC - bC).toFixed(1)}с)`;
          } else if (itemId === 'orbital_laser') {
            const bP = 1 + (beforeState.cdPts - 1);
            const aP = 1 + (afterState.cdPts - 1);
            return `☄️ Колонн: ${bP} ➔ ${aP} (+${aP - bP}) • КД ${bStats.cooldown.toFixed(1)}с ➔ ${aStats.cooldown.toFixed(1)}с`;
          } else if (itemId === 'napalm_ring') {
            const bB = (2.5 + (beforeState.cdPts - 1) * 2.0).toFixed(1);
            const aB = (2.5 + (afterState.cdPts - 1) * 2.0).toFixed(1);
            return `⏳ Горение: ${bB}с ➔ ${aB}с (+${(aB - bB).toFixed(1)}с)`;
          } else if (itemId === 'mortar_barrage') {
            const bR = 5 + (beforeState.cdPts - 1) * 2;
            const aR = 5 + (afterState.cdPts - 1) * 2;
            return `💣 Ракет в залпе: ${bR} ➔ ${aR} (+${aR - bR})`;
          } else if (itemId === 'acid_juice') {
            const bP = 1 + (beforeState.cdPts - 1);
            const aP = 1 + (afterState.cdPts - 1);
            const bRad = Math.round(124 * (1 + (beforeState.cdPts - 1) * 0.35));
            const aRad = Math.round(124 * (1 + (afterState.cdPts - 1) * 0.35));
            return `🟢 Луж: ${bP} ➔ ${aP} • Радиус: ${bRad}px ➔ ${aRad}px`;
          } else if (itemId === 'holo_shield') {
            const bS = (4.0 + (beforeState.cdPts - 1) * 1.0).toFixed(1);
            const aS = (4.0 + (afterState.cdPts - 1) * 1.0).toFixed(1);
            return `⏱️ Длительность щита: ${bS}с ➔ ${aS}с (+${(aS - bS).toFixed(1)}с)`;
          } else if (itemId === 'chibi_turret') {
            const bLife = (7.5 + (beforeState.cdPts - 1) * 3.0).toFixed(1);
            const aLife = (7.5 + (afterState.cdPts - 1) * 3.0).toFixed(1);
            return `⚡ КД: ${bStats.cooldown.toFixed(1)}с ➔ ${aStats.cooldown.toFixed(1)}с • Жизнь: ${bLife}с ➔ ${aLife}с`;
          } else {
            return `⚡ КД: ${bStats.cooldown.toFixed(2)}с ➔ ${aStats.cooldown.toFixed(2)}с (-${(bStats.cooldown - aStats.cooldown).toFixed(2)}с)`;
          }
        }
      }
      const defs = ITEM_CUSTOM_STATS[itemId] || ['💥 Урон', '📐 Область', '⚡ КД'];
      return statSlot === 'dmg' ? defs[0] : (statSlot === 'area' ? defs[1] : defs[2]);
    }

    function getCustomStatLabels(itemId, rollResult, isAlreadyApplied = false) {
      const lvlGain = (rollResult && rollResult.rarity && rollResult.rarity.levelGain) ? rollResult.rarity.levelGain : 1;
      const existing = state.weapons[itemId] || state.abilities[itemId];
      let beforeState, afterState;

      if (existing) {
        if (isAlreadyApplied) {
          afterState = {
            level: existing.level,
            dmgPts: existing.dmgPts,
            areaPts: existing.areaPts,
            cdPts: existing.cdPts
          };
          beforeState = {
            level: Math.max(1, existing.level - lvlGain),
            dmgPts: Math.max(1, existing.dmgPts - rollResult.dmgPoints),
            areaPts: Math.max(1, existing.areaPts - rollResult.areaPoints),
            cdPts: Math.max(1, existing.cdPts - rollResult.cdPoints)
          };
        } else {
          beforeState = {
            level: existing.level,
            dmgPts: existing.dmgPts,
            areaPts: existing.areaPts,
            cdPts: existing.cdPts
          };
          afterState = {
            level: existing.level + lvlGain,
            dmgPts: existing.dmgPts + rollResult.dmgPoints,
            areaPts: existing.areaPts + rollResult.areaPoints,
            cdPts: existing.cdPts + rollResult.cdPoints
          };
        }
      } else {
        beforeState = { level: 1, dmgPts: 1, areaPts: 1, cdPts: 1 };
        afterState = {
          level: lvlGain,
          dmgPts: 1 + rollResult.dmgPoints,
          areaPts: 1 + rollResult.areaPoints,
          cdPts: 1 + rollResult.cdPoints
        };
      }

      const out = [];
      if (rollResult.dmgPoints > 0) {
        out.push({ text: formatComputedStatChange(itemId, 'dmg', beforeState, afterState), cls: 'bg-rose-600/90 text-white' });
      }
      if (rollResult.areaPoints > 0) {
        out.push({ text: formatComputedStatChange(itemId, 'area', beforeState, afterState), cls: 'bg-amber-500/90 text-slate-950' });
      }
      if (rollResult.cdPoints > 0) {
        out.push({ text: formatComputedStatChange(itemId, 'cd', beforeState, afterState), cls: 'bg-cyan-400/90 text-slate-950' });
      }
      return out;
    }

    // Шанс удержания места в рулетке по силе предмета (от 20% у ультимативных до 100% у базовых).
    const ITEM_DROP_CHANCES = {
      // 10 Оружий (по возрастанию силы: от 100% до 25%)
      pistol:       1.00, // 100% — базовый пистолет
      mp5:          0.85, // 85%  — лёгкий ПП
      shotgun:      0.75, // 75%  — дробовик ближнего боя
      ak47:         0.65, // 65%  — штурмовой автомат
      dual_ar:      0.55, // 55%  — парные автоматы по флангам
      leek_blaster: 0.45, // 45%  — вращающийся лук-порей (урон ×3 вблизи)
      dual_sniper:  0.40, // 40%  — сквозные лазерные снайперки
      baguette_rpg: 0.35, // 35%  — фугасная базука РПГ-7
      minigun:      0.30, // 30%  — шестиствольный миниган
      plasma_rail:  0.25, // 25%  — плазменный рельсотрон с цепными взрывами

      // 20 Способностей (по возрастанию силы: от 90% до 20%)
      flash_panic:           0.90, // 90% — светошумовая вспышка
      bass_shockwave:        0.85, // 85% — отбрасывающий бас-дроп
      holo_shield:           0.50, // 50% (Необычный) — купол без урона и отхила, мощное отталкивание
      acid_juice:            0.50, // 50% (Необычный) — исцеляющая зона «ПоПиПо»
      magnet_pulse:          0.70, // 70% — магнит опыта (+25% опыта за стат)
      road_roller:           0.70, // 70% — расталкивающий дорожный каток
      cryo_blizzard:         0.65, // 65% — квадрат заморозки Снежной Мику
      neru_phone:            0.60, // 60% — цепная молния телефона Неру
      napalm_ring:           0.60, // 60% — термитное кольцо напалма
      chibi_turret:          0.55, // 55% — десант авто-турелей
      mortar_barrage:        0.50, // 50% — ракетный залп «Катюша»
      drone_swarm:           0.45, // 45% — постоянный орбитальный рой дронов
      plush_teto:            0.40, // 40% — автономные прыгающие Плюшки Тето
      drill_tornado:         0.35, // 35% — гигантские буры (урон ×3 вблизи)
      meteor_rain:           0.35, // 35% — метеоритный апокалипсис
      black_hole:            0.30, // 30% — стягивающая чёрная дыра
      orbital_laser:         0.30, // 30% — орбитальные колонны плазмы «УТАУ»
      twin_mega_beam:        0.25, // 25% — вращающийся мега-луч «Дива» (90°×Ур.)
      triple_baka_overdrive: 0.25, // 25% — призыв двух остальных героинь «Трипл Бака»
      c130_airstrike:        0.20  // 20% — ковровая бомбардировка C-130 до всей карты
    };

    function getItemDropChance(itemId) {
      return ITEM_DROP_CHANCES[itemId] !== undefined ? ITEM_DROP_CHANCES[itemId] : 0.50;
    }

    // Человекочитаемые теги частоты выпадения предмета вместо процентов
    function getItemDropFrequencyMeta(itemId) {
      const chance = getItemDropChance(itemId);
      if (chance >= 0.80) {
        return { label: 'Очень частый', cls: 'bg-slate-800 text-slate-200 border-slate-600' };
      } else if (chance >= 0.60) {
        return { label: 'Частый', cls: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50' };
      } else if (chance >= 0.45) {
        return { label: 'Необычный', cls: 'bg-sky-950/90 text-sky-300 border-sky-500/50' };
      } else if (chance >= 0.30) {
        return { label: 'Редкий', cls: 'bg-purple-950/90 text-purple-300 border-purple-500/50' };
      } else {
        return { label: 'Очень редкий', cls: 'bg-amber-950/90 text-amber-300 border-amber-500/60' };
      }
    }

    // Честная рулетка предметов без бага Array.sort():
    // Все 30 предметов (включая Магнит) имеют равный доступ к слоту, но чтобы остаться в слоте,
    // предмет должен выиграть свой шанс выпадения (от 20% до 100%), иначе место переразыгрывается!
    function rollRouletteItems(candidates, count = 3) {
      const available = [...candidates];
      const chosen = [];
      let safety = 0;
      while (chosen.length < count && available.length > 0 && safety < 2000) {
        safety++;
        const idx = Math.floor(Math.random() * available.length);
        const candidate = available[idx];
        const keepChance = getItemDropChance(candidate.id);
        if (Math.random() < keepChance) {
          chosen.push(candidate);
          available.splice(idx, 1);
        }
      }
      // На случай экстремальной серии неудач добираем оставшиеся слоты честным выбором
      while (chosen.length < count && available.length > 0) {
        const idx = Math.floor(Math.random() * available.length);
        chosen.push(available[idx]);
        available.splice(idx, 1);
      }
      return chosen;
    }

    function rollStatsForRarity(rarity, fixedCdItem = false) {
      // The 3 stats are: 'dmg' (Урон), 'area' (Область), 'cd' (КД / Скорость)
      const shuffled = ['dmg', 'area', 'cd'];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const picked = shuffled.slice(0, rarity.statsCount);
      return {
        rarity,
        dmgPoints: picked.includes('dmg') ? rarity.multiplier : 0,
        areaPoints: picked.includes('area') ? rarity.multiplier : 0,
        cdPoints: picked.includes('cd') ? rarity.multiplier : 0,
        pickedList: picked,
        fixedCdItem
      };
    }

    // =========================================================================
    // 4. POOL OF 10 BASE WEAPONS (Independent holsters + Spinning Leek Aura!)
    // =========================================================================
    const WEAPONS_POOL = [
      {
        id: 'pistol',
        name: 'Пистолет M1911',
        icon: '🔫',
        artId: 'imgCutinMiku',
        gunStyle: 'pistol',
        videoRef: 'Видео 1 (Старт)',
        desc: 'Табельный пистолет. С ростом Области стреляет веером крупнокалиберных экспансивных пуль.',
        baseCooldown: 0.38,
        baseDamage: 34,
        color: '#fde047',
        speed: 680,
        pierce: 1,
        spread: 0.07,
        bulletsPerShot: 1
      },
      {
        id: 'leek_blaster',
        name: 'Вращающийся Лук-Порей Мику',
        icon: '🥬',
        artId: 'imgCutinMiku',
        gunStyle: 'leek',
        isOrbitWeapon: true,
        videoRef: 'Урон ×3 в ближнем бою!',
        desc: 'Луки-пореи ПОСТОЯННО крутятся вокруг персонажа! Из-за ближнего действия базовый урон в ~3 раза выше стандартного оружия.',
        baseCooldown: 0.15,
        baseDamage: 120,
        color: '#4ade80',
        speed: 0,
        pierce: 999,
        spread: 0,
        bulletsPerShot: 2
      },
      {
        id: 'mp5',
        name: 'ПП MP5 «Шквал»',
        icon: '📠',
        artId: 'imgCutinSmg',
        gunStyle: 'mp5',
        videoRef: 'Видео 2 (0:00)',
        desc: 'Скорострельный ПП Тето. Выпускает плотные очереди пуль с дождём латунных гильз.',
        baseCooldown: 0.11,
        baseDamage: 19,
        color: '#fef08a',
        speed: 730,
        pierce: 2,
        spread: 0.14,
        bulletsPerShot: 1
      },
      {
        id: 'ak47',
        name: 'Автомат АК-47',
        icon: '💥',
        artId: 'imgCutinMiku',
        gunStyle: 'ak47',
        videoRef: 'Видео 2 (0:04)',
        desc: 'Тяжёлый калибр 7.62. Пробивает толпу навылет; Область увеличивает калибр и число пробитий.',
        baseCooldown: 0.18,
        baseDamage: 44,
        color: '#fb923c',
        speed: 780,
        pierce: 4,
        spread: 0.09,
        bulletsPerShot: 1
      },
      {
        id: 'dual_ar',
        name: 'Парные Автоматы Акимбо',
        icon: '⚔️',
        artId: 'imgCutinTeto',
        gunStyle: 'dual_ar',
        videoRef: 'Видео 1 (0:06 Тето)',
        desc: 'Две розово-чёрные винтовки! Поливают огнём одновременно вперёд и по флангам улицы.',
        baseCooldown: 0.16,
        baseDamage: 28,
        color: '#f43f5e',
        speed: 710,
        pierce: 2,
        spread: 0.28,
        bulletsPerShot: 3
      },
      {
        id: 'minigun',
        name: 'Шестиствольный Миниган',
        icon: '🔥',
        artId: 'imgCutinTeto',
        gunStyle: 'minigun',
        videoRef: 'Видео 2 (0:07)',
        desc: 'Роторный пулемёт Гатлинга! Непрерывный поток свинца, косящий целые кварталы.',
        baseCooldown: 0.055,
        baseDamage: 18,
        color: '#facc15',
        speed: 820,
        pierce: 2,
        spread: 0.22,
        bulletsPerShot: 1
      },
      {
        id: 'dual_sniper',
        name: 'Парные Снайперки «Синий Луч»',
        icon: '💠',
        artId: 'imgCutinMiku',
        gunStyle: 'sniper',
        videoRef: 'Видео 2 (0:11)',
        desc: 'Сверхмощные винтовки с оптикой. Выпускают широкие синие лазерные трассеры через всю карту!',
        baseCooldown: 0.58,
        baseDamage: 98,
        color: '#38bdf8',
        speed: 1200,
        pierce: 18,
        spread: 0.04,
        bulletsPerShot: 2,
        isBeamShot: true
      },
      {
        id: 'shotgun',
        name: 'Дробовик SPAS-12 «Дракон»',
        icon: '🧨',
        artId: 'imgCutinTriple',
        gunStyle: 'shotgun',
        videoRef: 'Наводится на мышку!',
        desc: 'Целится на мышку! Выстреливает широкий конус зажигательной картечи, отбрасывающий толпу зомби назад.',
        baseCooldown: 0.62,
        baseDamage: 28,
        color: '#fdba74',
        speed: 620,
        pierce: 3,
        spread: 0.45,
        bulletsPerShot: 7
      },
      {
        id: 'baguette_rpg',
        name: 'Багетная Базука РПГ-7',
        icon: '🥖',
        artId: 'imgCutinTriple',
        gunStyle: 'rpg',
        videoRef: 'Наводится на мышку!',
        desc: 'Целится на мышку! Выпускает реактивные багеты, взрывающиеся огромным огненным шаром (+75% урона в эпицентре).',
        baseCooldown: 0.85,
        baseDamage: 95,
        color: '#f59e0b',
        speed: 540,
        pierce: 1,
        spread: 0.08,
        bulletsPerShot: 1,
        explosiveRadius: 95
      },
      {
        id: 'plasma_rail',
        name: 'Плазменный Рельсотрон «Дива»',
        icon: '⚡',
        artId: 'imgCutinNeru',
        gunStyle: 'railgun',
        videoRef: 'Наводится на мышку!',
        desc: 'Целится на мышку! Стреляет гигантскими плазменными сферами, которые взрываются при каждом касании врага!',
        baseCooldown: 0.52,
        baseDamage: 74,
        color: '#c084fc',
        speed: 860,
        pierce: 6,
        spread: 0.05,
        bulletsPerShot: 1,
        explosiveRadius: 64
      }
    ];

    // =========================================================================
    // 5. POOL OF 20 ABILITIES (Autonomous Plushie, Orbiting Drones, 90°×Lv Laser, Full-Map Square Bomb & Road Roller!)
    // =========================================================================
    const ABILITIES_POOL = [
      {
        id: 'plush_teto',
        name: 'Питомец «Плюшевая Тето»',
        icon: '🧸',
        artId: 'imgPlushTeto',
        videoRef: '+1 новая Плюшка каждый Ур.!',
        desc: 'Плюшка Тето самостоятельно ходит по полю и напрыгивает на врагов поблизости, расплющивая их! С КАЖДЫМ уровнем добавляется +1 новая Плюшка!',
        baseCooldown: 2.2,
        baseDamage: 290,
        color: '#fb7185'
      },
      {
        id: 'c130_airstrike',
        name: 'Ковровая Бомбардировка C-130',
        icon: '✈️',
        artId: 'imgCutinShock',
        fixedCooldown: false,
        videoRef: 'Квадрат +50% и Снижение КД -15%!',
        desc: 'Самолёт C-130 выжигает квадратную зону взрывами (базовый урон 750)! Прокачивает площадь квадрата (+50%), урон и снижает КД на 15%!',
        baseCooldown: 10.5,
        baseDamage: 750,
        color: '#f97316'
      },
      {
        id: 'drone_swarm',
        name: 'Орбитальный Рой Дронов',
        icon: '🛸',
        artId: 'imgCutinNeru',
        isPermanentOrbit: true,
        videoRef: 'Крутятся вокруг и стреляют!',
        desc: 'Боевые дроны ПОСТОЯННО крутятся вокруг игрока и непрерывно расстреливают зомби зелёными лазерами! Скорострельность +20% за стат.',
        baseCooldown: 0.25,
        baseDamage: 68,
        color: '#4ade80'
      },
      {
        id: 'twin_mega_beam',
        name: 'Вращающийся Мега-Луч «Дива»',
        icon: '🌈',
        artId: 'imgCutinShock',
        videoRef: 'Оборот 90° × Уровень + КД -15%!',
        desc: 'Полупрозрачные розово-бирюзовые лучи делают оборот на 90° × уровень! Прокачивает урон, сектор вращения (+90°) и снижает КД на 15%!',
        baseCooldown: 9.5,
        baseDamage: 540,
        color: '#ec4899'
      },
      {
        id: 'road_roller',
        name: 'Дорожный Каток «Неро»',
        icon: '🚜',
        artId: 'imgCutinNeru',
        fixedCooldown: false,
        videoRef: 'От уровня игрока до верха экрана!',
        desc: 'Появляется на уровне игрока и несётся до самого верха экрана, мощно расталкивая зомби! Ширина +25%, снижение КД -20%.',
        baseCooldown: 9.0,
        baseDamage: 185,
        color: '#eab308'
      },
      {
        id: 'meteor_rain',
        name: 'Метеоритный Апокалипсис',
        icon: '☄️',
        artId: 'imgCutinShock',
        videoRef: 'Падают случайно по всему экрану!',
        desc: 'Огненные метеоры (база 640 урона) обрушиваются в случайные точки всего экрана! Радиус кратера +50%, кол-во метеоров +1 без ограничений.',
        baseCooldown: 9.5,
        baseDamage: 640,
        color: '#ef4444'
      },
      {
        id: 'triple_baka_overdrive',
        name: 'Призыв «Трипл Бака»',
        icon: '👑',
        artId: 'imgCutinTriple',
        videoRef: 'Две остальные героини!',
        desc: 'На поле боя выходят ДВЕ ОСТАЛЬНЫЕ ГЕРОИНИ и ведут шквальный огонь из всех орудий! Прокачка увеличивает длительность и мощь залпа.',
        baseCooldown: 12.0,
        baseDamage: 350,
        color: '#f472b6'
      },
      {
        id: 'flash_panic',
        name: 'Светошумовая Сверхновая «Паника»',
        icon: '💥',
        artId: 'imgCutinMiku',
        videoRef: 'Оглушение +0.6с и КД -15%!',
        desc: 'Слепящая вспышка оглушает и подрывает зомби. Радиус +40%, а прокачка оглушения (+0.6с) также снижает КД на 15%!',
        baseCooldown: 8.5,
        baseDamage: 260,
        color: '#fef08a'
      },
      {
        id: 'neru_phone',
        name: 'Грозовой Спам Телефона Неро',
        icon: '📱',
        artId: 'imgCutinNeru',
        videoRef: 'База: 3 рикошета и 400 урона!',
        desc: 'Цепная молния (400 урона, 3 рикошета в базе, рост перескоков без ограничений)! Дальность дуги +30% и снижение КД -25%.',
        baseCooldown: 6.2,
        baseDamage: 400,
        color: '#facc15'
      },
      {
        id: 'drill_tornado',
        name: 'Гигантские Буры «Касане Торнадо»',
        icon: '🌀',
        artId: 'imgCutinTeto',
        videoRef: 'База Урона 1200 + Размер +50%!',
        desc: 'Вокруг героини проносятся гигантские красные свёрла-буры (базовый урон 1200)! Размер +50%, центробежный отброс +25% и КД -15%.',
        baseCooldown: 7.2,
        baseDamage: 1200,
        color: '#f43f5e'
      },
      {
        id: 'bass_shockwave',
        name: 'Сверхзвуковой Бас-Дроп 01',
        icon: '🔊',
        artId: 'imgCutinMiku',
        videoRef: 'Радиус ×2 + Оглушение 0.5с!',
        desc: 'Удвоенное кольцо эквалайзера оглушает врагов на 0.5с и отбрасывает назад! Прокачивает снижение КД (-20%), радиус (+50%) и отброс (+50%).',
        baseCooldown: 7.8,
        baseDamage: 280,
        color: '#22d3ee'
      },
      {
        id: 'cryo_blizzard',
        name: 'Ледниковый Шторм «Снежная Мику»',
        icon: '❄️',
        artId: 'imgCutinMiku',
        videoRef: 'Заморозка 5с +1с без лимита!',
        desc: 'Накрывает квадрат улицы льдом (заморозка 5с в базе +1с за стат без ограничений)! Крио-урон +50%, размер квадрата +50%.',
        baseCooldown: 9.0,
        baseDamage: 270,
        color: '#38bdf8'
      },
      {
        id: 'orbital_laser',
        name: 'Спутниковый Залп «УТАУ»',
        icon: '🛰️',
        artId: 'imgCutinTeto',
        videoRef: 'Урон на всю длину + прокачка длины!',
        desc: 'Вертикальные колонны плазмы летают как заставка DVD и выжигают врагов по всей своей длине! Урон +50%, вертикальная длина +45% и жизнь +3с, +1 колонна и КД -10%.',
        baseCooldown: 8.8,
        baseDamage: 490,
        color: '#fb7185'
      },
      {
        id: 'napalm_ring',
        name: 'Термитное Кольцо Ада',
        icon: '🔥',
        artId: 'imgCutinShock',
        videoRef: 'Урон горения +100% и +2с!',
        desc: 'Выжигает квадратный фронт напалма вокруг игрока, оставляя пылающую зону горения! Урон горения +100%, радиус +50%, длительность +2.0с.',
        baseCooldown: 7.5,
        baseDamage: 350,
        color: '#f97316'
      },
      {
        id: 'mortar_barrage',
        name: 'Багетная РСЗО «Катюша»',
        icon: '🚀',
        artId: 'imgCutinTriple',
        videoRef: 'Наведение в скопления врагов (Урон 500)!',
        desc: 'Реактивные багеты (база 500 урона) прицельно летят в самые большие скопления зомби! Радиус взрыва +50%, +2 ракеты за стат.',
        baseCooldown: 8.2,
        baseDamage: 500,
        color: '#fbbf24'
      },
      {
        id: 'black_hole',
        name: 'Гравитационная Сингулярность',
        icon: '🕳️',
        artId: 'imgCutinNeru',
        videoRef: 'Урон 2500 • Радиус ×3 • КД 30с!',
        desc: 'Гигантская чёрная дыра (радиус ×3, урон 2500, КД 30с) спавнится в случайной точке экрана вдали от игрока и стягивает всю орду!',
        baseCooldown: 30.0,
        baseDamage: 2500,
        color: '#a855f7'
      },
      {
        id: 'acid_juice',
        name: 'Море Овощного Сока «ПоПиПо»',
        icon: '🧪',
        artId: 'imgCutinMiku',
        videoRef: 'Зона исцеления (10 HP/с в базе, +5 HP/с за ур.)!',
        desc: 'Спавнит большую целебную зону зелёного сока в случайной точке экрана (базовый отхил 10 HP/с в течение 5с, КД 7с, +5 HP/с за прокачку)!',
        baseCooldown: 7.0,
        baseDamage: 0,
        color: '#84cc16'
      },
      {
        id: 'holo_shield',
        name: 'Импульсный Купол «Дива-Щит»',
        icon: '🛡️',
        artId: 'imgCutinMiku',
        videoRef: 'Без урона и хила • Отталкивание ×2!',
        desc: 'Окружает героиню неуязвимым куполом и отбрасывает врагов с удвоенной силой (без урона и лечения). КД -30%, радиус +50%, длит. +1с!',
        baseCooldown: 9.8,
        baseDamage: 0,
        color: '#67e8f9'
      },
      {
        id: 'magnet_pulse',
        name: 'Квантовый Пылесос (Магнит)',
        icon: '🧲',
        artId: 'imgCutinNeru',
        videoRef: '+100% опыта за каждый уровень!',
        desc: 'По импульсу стягивает опыт прямоугольной зоной во всю ширину экрана! Даёт +100% опыта за каждый уровень, увеличивает высоту захвата (+50%) и снижает КД (-30%).',
        baseCooldown: 8.0,
        baseDamage: 0,
        color: '#34d399'
      },
      {
        id: 'chibi_turret',
        name: 'Бункер «Авто-Синт» (Турели)',
        icon: '🤖',
        artId: 'imgCutinTriple',
        videoRef: 'Вращаются к цели • База 300 урона!',
        desc: 'Десантирует вращающиеся огневые турели (300 урона) в случайные точки экрана! Калибр/скорострельность +100%, +2 турели, КД -30% и +3с жизни.',
        baseCooldown: 7.2,
        baseDamage: 300,
        color: '#60a5fa'
      }
    ];

    // =========================================================================
    // 5.5. NANO BANANA GENERATED ANIME & MINECRAFT-ZOMBIE ARTWORK REGISTRY
    //      (All 30 Weapon/Ability Arts + 3 Heroine Buff Banners preloaded!)
    // =========================================================================
    const ITEM_HERO_ASSIGNMENT = {
      // 10 KASANE TETO ITEMS (Handheld Guns, Explosives & Giant Drills Tornado)
      minigun:        { heroId: 'teto', quote: 'Тето: «Шестиствольный Миниган! Свинцовый шторм на всю улицу!»' },
      mp5:            { heroId: 'teto', quote: 'Тето: «ПП MP5 Шквал! Прицел на мышку и очередь без остановки!»' },
      dual_ar:        { heroId: 'teto', quote: 'Тето: «Парные Автоматы Акимбо! Огонь с двух рук по всем флангам!»' },
      shotgun:        { heroId: 'teto', quote: 'Тето: «Дробовик SPAS-12 Дракон! Картечь по мышке с мощным отбросом!»' },
      baguette_rpg:   { heroId: 'teto', quote: 'Тето: «Багетная Базука РПГ-7! Точно по мышке — хрустящий фугас!»' },
      plush_teto:     { heroId: 'teto', quote: 'Тето: «Вперёд, мои Плюшки Тето! Расплющим зомби в лепёшку!»' },
      c130_airstrike: { heroId: 'teto', quote: 'Тето: «Вызываю C-130! Ковровая бомбардировка по квадрату!»' },
      meteor_rain:    { heroId: 'teto', quote: 'Тето: «Метеоритный Апокалипсис! Огненные кратеры по всей карте!»' },
      mortar_barrage: { heroId: 'teto', quote: 'Тето: «Багетная Катюша! Залп реактивными багетами по толпе!»' },
      drill_tornado:  { heroId: 'teto', quote: 'Тето: «Гигантские Буры Торнадо! Мои красные буры сносят всё вокруг!»' },

      // 10 HATSUNE MIKU ITEMS (AK-47, M1911, Snipers, Leek, Lasers, Bass, Cryo, PoPiPo, Shield & Magnet)
      pistol:         { heroId: 'miku', quote: 'Мику: «Табельный M1911! Мультишот +1 пуля за каждый уровень!»' },
      leek_blaster:   { heroId: 'miku', quote: 'Мику: «Вращающийся Лук-Порей! Изумрудный вихрь ближнего боя!»' },
      ak47:           { heroId: 'miku', quote: 'Мику: «Тяжёлый АК-47! Калибр 7.62 прошивает шеренгу зомби навылет!»' },
      dual_sniper:    { heroId: 'miku', quote: 'Мику: «Парные Снайперки Синий Луч! Прострел по мышке через всю карту!»' },
      twin_mega_beam: { heroId: 'miku', quote: 'Мику: «Вращающийся Мега-Луч Дива! Оборот лазеров 90° × уровень!»' },
      bass_shockwave: { heroId: 'miku', quote: 'Мику: «Сверхзвуковой Бас-Дроп 01! Звуковая волна отбрасывает орду!»' },
      cryo_blizzard:  { heroId: 'miku', quote: 'Мику: «Ледниковый Шторм Снежной Мику! Заморозим всю улицу в лёд!»' },
      acid_juice:     { heroId: 'miku', quote: 'Мику: «Овощной Сок ПоПиПо! Лечит меня и плавит броню зомби!»' },
      holo_shield:    { heroId: 'miku', quote: 'Мику: «Импульсный Купол Дива-Щит! Неуязвимость, лечение и отпор!»' },
      magnet_pulse:   { heroId: 'miku', quote: 'Мику: «Квантовый Магнит! Импульс сбора и +100% опыта за уровень!»' },

      // 10 AKITA NERU ITEMS (Railgun, Drones, Road Roller, Phone, Turrets, Singularity, Napalm, Flash, UTAU & Triple Baka)
      plasma_rail:           { heroId: 'neru', quote: 'Неро: «Плазменный Рельсотрон! Наводка по мышке и взрыв при каждом касании!»' },
      drone_swarm:           { heroId: 'neru', quote: 'Неро: «Орбитальный Рой Дронов! Постоянный лазерный периметр!»' },
      road_roller:           { heroId: 'neru', quote: 'Неро: «Дорожный Каток Неро! Сметаем зомби от игрока до верха карты!»' },
      neru_phone:            { heroId: 'neru', quote: 'Неро: «Грозовой Спам Телефона! Цепная молния бьёт по всей толпе!»' },
      chibi_turret:          { heroId: 'neru', quote: 'Неро: «Бункер Авто-Синт! Десантирую скорострельные турели!»' },
      black_hole:            { heroId: 'neru', quote: 'Неро: «Гравитационная Сингулярность! Тройное стягивание в чёрную дыру!»' },
      napalm_ring:           { heroId: 'neru', quote: 'Неро: «Термитное Кольцо Ада! Квадратный периметр напалма +100% DoT!»' },
      flash_panic:           { heroId: 'neru', quote: 'Неро: «Светошумовая Сверхновая! Ослепление и оглушение всей орды!»' },
      orbital_laser:         { heroId: 'neru', quote: 'Неро: «Спутниковый Залп УТАУ! Колонны плазмы во весь экран рикошетят как DVD!»' },
      triple_baka_overdrive: { heroId: 'neru', quote: 'Неро, Тето и Мику: «Призыв Трипл Бака! Огонь втроём из всех стволов!»' }
    };

    function generateAll30UniqueItemArts() {
      const allItems = [
        ...WEAPONS_POOL.map(w => ({ def: w, isWeapon: true })),
        ...ABILITIES_POOL.map(a => ({ def: a, isWeapon: false }))
      ];

      allItems.forEach(({ def }) => {
        const artId = `imgArt_${def.id}`;
        const meta = ITEM_HERO_ASSIGNMENT[def.id] || { heroId: 'teto', quote: '' };
        def.artId = artId;
        def.heroId = meta.heroId;
        def.heroQuote = meta.quote;
      });
    }

    
// =========================================================================
    // 7. GAME STATE & CONFIGURATION (Endless Kilometers + 10-Min Scaling)
    // =========================================================================
    const PIXELS_PER_METER = 18;

    let selectedSkinId = 'teto';
    let randomDropMode = false;
    let autoMarchEnabled = false;
    let mouseAimEnabled = true;

    const state = {
      running: false,
      paused: false,
      timeElapsed: 0,
      lastTimestamp: 0,
      cameraY: 0,
      maxDistanceMeters: 0,
      currentKmTier: 0,
      nextBossMeters: 1000,
      screenShake: 0,

      player: {
        x: 0,
        y: 0,
        radius: 17,
        hp: 200,
        maxHp: 200,
        speed: 210,
        pickupRadius: 90,
        invulnTimer: 0,
        shieldTimer: 0,
        overdriveTimer: 0,
        facingAngle: -Math.PI / 2,
        walkFrame: 0
      },

      level: 1,
      freeBossLevels: 0,
      xp: 0,
      xpNeeded: 20,
      kills: 0,
      rerolls: 5,

      weapons: {},
      abilities: {},

      // Entities on street
      zombies: [],
      enemyProjectiles: [],
      bullets: [],
      xpParticles: [],
      shellCasings: [],
      scorchMarks: [],
      visualEffects: [],
      damageNumbers: [],
      acidPools: [],
      turrets: [],
      plushPets: [],     // Autonomous Plushie Teto instances (+1 per level!)
      orbitDrones: [],   // Permanent Orbiting Drones that shoot lasers!
      spinningLeeks: [], // Permanent Orbiting Leeks around player!
      rotatingBeams: [], // Active sweeping Twin Mega-Beams (90° * level)!
      streetDecals: [],    // Procedural ground details (cracks, stains, tire tracks, loose tires, trash, cones)
      streetObstacles: [], // Large collidable & explosively destructible objects (burning barrels, destroyed cars, barricades, tire stacks)
      generatedChunks: new Set(),

      boss: null,

      cutinTimer: 0,
      cutinArtId: 'imgCutinTeto',
      cutinText: 'Тето: «Время зачистить улицу!»',
      zombieSpawnTimer: 0
    };

    const keys = {};
    const pointer = { active: false, x: 0, y: 0 };

    // =========================================================================
    // 8. FIRST-TIME CUT-IN & BOTTOM RARITY UPGRADE BANNER
    // =========================================================================
    let cutinTimeoutId = null;

    function buildCurrentItemStatsForCutin(itemDef, isWeapon, rollResult) {
      const id = itemDef.id;
      const badges = [];
      if (isWeapon) {
        const wObj = state.weapons[id] || {
          id,
          level: (rollResult && rollResult.rarity && rollResult.rarity.levelGain) ? rollResult.rarity.levelGain : 1,
          dmgPts: 1 + (rollResult ? rollResult.dmgPoints : 0),
          areaPts: 1 + (rollResult ? rollResult.areaPoints : 0),
          cdPts: 1 + (rollResult ? rollResult.cdPoints : 0),
          def: itemDef
        };
        const st = getWeaponStats(wObj);
        badges.push({ text: `💥 Урон: ${st.damage}`, cls: 'bg-rose-600/90 text-white border border-rose-400/50' });
        if (id === 'leek_blaster') {
          const leekCnt = 2 + Math.max(0, wObj.areaPts - 1);
          const leekSz = Math.round(22 * (1 + Math.max(0, wObj.cdPts - 1) * 0.30));
          badges.push({ text: `🥬 Луков на орбите: ${leekCnt}`, cls: 'bg-amber-500/95 text-slate-950' });
          badges.push({ text: `🌀 Размер и скорость: ${leekSz}px`, cls: 'bg-cyan-400/95 text-slate-950' });
        } else if (id === 'baguette_rpg' || id === 'plasma_rail') {
          const rad = Math.round((itemDef.explosiveRadius || 70) * (st.explosionAreaScale || st.areaScale));
          badges.push({ text: `🥖 Радиус взрыва: ${rad}px`, cls: 'bg-amber-500/95 text-slate-950' });
          badges.push({ text: `⚡ Стрельба: ${(1 / st.cooldown).toFixed(1)}/с (КД ${st.cooldown.toFixed(2)}с)`, cls: 'bg-cyan-400/95 text-slate-950' });
        } else if (id === 'ak47' || id === 'dual_sniper') {
          badges.push({ text: `💠 Пробитие: ${st.pierce} цел. (×${st.areaScale.toFixed(2)})`, cls: 'bg-amber-500/95 text-slate-950' });
          badges.push({ text: `⚡ Стрельба: ${(1 / st.cooldown).toFixed(1)}/с (КД ${st.cooldown.toFixed(2)}с)`, cls: 'bg-cyan-400/95 text-slate-950' });
        } else {
          badges.push({ text: `🔫 Выстрел: ${st.count} пул. • Пробитие: ${st.pierce}`, cls: 'bg-amber-500/95 text-slate-950' });
          badges.push({ text: `⚡ Стрельба: ${(1 / st.cooldown).toFixed(1)}/с (КД ${st.cooldown.toFixed(2)}с)`, cls: 'bg-cyan-400/95 text-slate-950' });
        }
      } else {
        const aObj = state.abilities[id] || {
          id,
          level: (rollResult && rollResult.rarity && rollResult.rarity.levelGain) ? rollResult.rarity.levelGain : 1,
          dmgPts: 1 + (rollResult ? rollResult.dmgPoints : 0),
          areaPts: 1 + (rollResult ? rollResult.areaPoints : 0),
          cdPts: 1 + (rollResult ? rollResult.cdPoints : 0),
          def: itemDef
        };
        const st = getAbilityStats(aObj);
        if (id === 'acid_juice') {
          const heal = 10 + Math.max(0, aObj.dmgPts - 1) * 5;
          const dur = (5.0 + Math.max(0, aObj.areaPts - 1) * 2.0).toFixed(1);
          const rad = Math.round(124 * st.areaScale);
          badges.push({ text: `💚 Лечение: ${heal} HP/с`, cls: 'bg-emerald-500/95 text-slate-950' });
          badges.push({ text: `🟢 Луж: ${1 + Math.max(0, aObj.cdPts - 1)} • Радиус: ${rad}px`, cls: 'bg-amber-500/95 text-slate-950' });
          badges.push({ text: `⏱️ Длит.: ${dur}с • КД: ${st.cooldown.toFixed(1)}с`, cls: 'bg-cyan-400/95 text-slate-950' });
        } else if (id === 'magnet_pulse') {
          const bonusPct = Math.round(aObj.level * 100);
          const rectH = Math.round(90 * 1.5 * st.areaScale * 2);
          badges.push({ text: `📈 Бонус опыта: +${bonusPct}%`, cls: 'bg-emerald-500/95 text-slate-950' });
          badges.push({ text: `🧲 Зона сбора: ${rectH}px`, cls: 'bg-amber-500/95 text-slate-950' });
          badges.push({ text: `⚡ КД импульса: ${st.cooldown.toFixed(2)}с`, cls: 'bg-cyan-400/95 text-slate-950' });
        } else if (id === 'holo_shield') {
          const dur = (4.0 + Math.max(0, aObj.cdPts - 1) * 1.0).toFixed(1);
          const rad = Math.round(260 * st.areaScale);
          badges.push({ text: `🛡️ Купол: ${dur}с неуязвимости`, cls: 'bg-sky-400/95 text-slate-950' });
          badges.push({ text: `📐 Волна отброса: ${rad}px`, cls: 'bg-amber-500/95 text-slate-950' });
          badges.push({ text: `⚡ КД: ${st.cooldown.toFixed(2)}с`, cls: 'bg-cyan-400/95 text-slate-950' });
        } else if (id === 'plush_teto') {
          const rad = Math.round(76 * st.areaScale);
          const spd = Math.round(155 * (1 + Math.max(0, aObj.cdPts - 1) * 0.35));
          badges.push({ text: `💥 Урон прыжка: ${st.damage}`, cls: 'bg-rose-600/90 text-white' });
          badges.push({ text: `🧸 Плюшек: ${aObj.level} • Взрыв: ${rad}px`, cls: 'bg-amber-500/95 text-slate-950' });
          badges.push({ text: `⚡ Скорость бега: ${spd}`, cls: 'bg-cyan-400/95 text-slate-950' });
        } else if (id === 'drone_swarm') {
          const cnt = 1 + aObj.level + Math.max(0, aObj.areaPts - 1);
          const intv = (0.48 / (1 + Math.max(0, aObj.cdPts - 1) * 0.20)).toFixed(2);
          badges.push({ text: `💥 Урон лазера: ${st.damage}`, cls: 'bg-rose-600/90 text-white' });
          badges.push({ text: `🛸 Дронов на орбите: ${cnt}`, cls: 'bg-amber-500/95 text-slate-950' });
          badges.push({ text: `⚡ Залп каждые ${intv}с`, cls: 'bg-cyan-400/95 text-slate-950' });
        } else if (id === 'twin_mega_beam') {
          const deg = (aObj.level + Math.max(0, aObj.cdPts - 1)) * 90;
          badges.push({ text: `💥 Урон луча: ${st.damage}`, cls: 'bg-rose-600/90 text-white' });
          badges.push({ text: `🔄 Сектор вращения: ${deg}°`, cls: 'bg-amber-500/95 text-slate-950' });
          badges.push({ text: `⚡ КД: ${st.cooldown.toFixed(2)}с`, cls: 'bg-cyan-400/95 text-slate-950' });
        } else if (id === 'meteor_rain') {
          const cnt = 5 + (aObj.level - 1) + Math.max(0, aObj.cdPts - 1);
          const rad = Math.round(68 * st.areaScale);
          badges.push({ text: `💥 Урон метеора: ${st.damage}`, cls: 'bg-rose-600/90 text-white' });
          badges.push({ text: `🔥 Метеоров: ${cnt} • Кратер: ${rad}px`, cls: 'bg-amber-500/95 text-slate-950' });
          badges.push({ text: `⚡ КД: ${st.cooldown.toFixed(2)}с`, cls: 'bg-cyan-400/95 text-slate-950' });
        } else if (id === 'mortar_barrage') {
          const cnt = 5 + Math.max(0, aObj.cdPts - 1) * 2;
          const rad = Math.round(64 * st.areaScale);
          badges.push({ text: `💥 Урон багета: ${st.damage}`, cls: 'bg-rose-600/90 text-white' });
          badges.push({ text: `💣 Ракет: ${cnt} • Взрыв: ${rad}px`, cls: 'bg-amber-500/95 text-slate-950' });
          badges.push({ text: `⚡ КД: ${st.cooldown.toFixed(2)}с`, cls: 'bg-cyan-400/95 text-slate-950' });
        } else if (id === 'chibi_turret') {
          const cnt = 1 + Math.max(0, aObj.areaPts - 1) * 2;
          const life = (7.5 + Math.max(0, aObj.cdPts - 1) * 3.0).toFixed(1);
          badges.push({ text: `💥 Урон пули: ${st.damage}`, cls: 'bg-rose-600/90 text-white' });
          badges.push({ text: `🤖 Турелей: ${cnt} • Жизнь: ${life}с`, cls: 'bg-amber-500/95 text-slate-950' });
          badges.push({ text: `⚡ КД: ${st.cooldown.toFixed(2)}с`, cls: 'bg-cyan-400/95 text-slate-950' });
        } else {
          const baseR = id === 'bass_shockwave' ? 420 : (id === 'black_hole' ? 660 : 135);
          const rad = Math.round(baseR * st.areaScale);
          badges.push({ text: `💥 Урон: ${st.damage}`, cls: 'bg-rose-600/90 text-white' });
          badges.push({ text: `📐 Область/Радиус: ${rad}px (×${st.areaScale.toFixed(2)})`, cls: 'bg-amber-500/95 text-slate-950' });
          badges.push({ text: `⚡ КД: ${st.cooldown.toFixed(2)}с`, cls: 'bg-cyan-400/95 text-slate-950' });
        }
      }
      return badges;
    }

    function showFirstTimeWeaponCutin(itemDef, isWeapon, newLevel = 1, rollResult = null, isNew = true) {
      // Показываем верхний выезжающий баннер (слева -> центр -> вправо) только при ПЕРВОМ взятии оружия или абилки!
      if (!isNew) return;

      const overlay = document.getElementById('firstTimeCutinOverlay');
      const cardEl = document.getElementById('firstTimeCutinCard');
      const imgEl = document.getElementById('cutinOverlayImg');
      const rarityBadgeEl = document.getElementById('cutinRarityCornerBadge');
      const tagWrapEl = document.getElementById('cutinOverlayTagWrap');
      const tagEl = document.getElementById('cutinOverlayTag');
      const titleEl = document.getElementById('cutinOverlayTitle');
      const descEl = document.getElementById('cutinOverlayDesc');
      const statsEl = document.getElementById('cutinOverlayStats');
      const quoteEl = document.getElementById('cutinOverlayQuote');
      const miniCanvas = document.getElementById('cutinWeaponMiniCanvas');

      const itemHero = SKINS[itemDef.heroId] || SKINS[selectedSkinId] || SKINS.teto;
      const srcImg = document.getElementById(`imgArt_${itemDef.id}`) || document.getElementById(itemDef.artId || itemHero.cutinImgId);
      if (srcImg && imgEl) imgEl.src = srcImg.src;

      const r = (rollResult && rollResult.rarity) ? rollResult.rarity : RARITIES[0];
      const lvlGain = r.levelGain || 1;
      if (rarityBadgeEl) {
        rarityBadgeEl.className = `absolute top-2 left-2 px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-wider shadow-lg border border-white/25 ${r.badgeClass}`;
        rarityBadgeEl.textContent = `${r.emoji} ${r.name} (+${lvlGain} УР.)`;
      }
      if (cardEl) {
        const borderCol = r.id === 'legendary'
          ? 'border-amber-400 shadow-[0_0_45px_rgba(251,191,36,0.85)]'
          : (r.id === 'epic'
              ? 'border-purple-400 shadow-[0_0_40px_rgba(192,132,252,0.8)]'
              : (r.id === 'rare'
                  ? 'border-sky-400 shadow-[0_0_40px_rgba(56,189,248,0.8)]'
                  : 'border-rose-400 shadow-[0_0_35px_rgba(244,63,94,0.75)]'));
        cardEl.className = `relative rounded-2xl overflow-hidden border-2 ${borderCol} bg-slate-950/95 backdrop-blur-md flex items-stretch min-h-[152px] sm:min-h-[176px]`;
      }

      if (tagWrapEl) {
        tagWrapEl.className = `inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] sm:text-xs font-black uppercase tracking-wider shadow ${r.badgeClass}`;
      }
      tagEl.textContent = (isWeapon ? `🔫 НОВОЕ ОРУЖИЕ (${itemHero.shortName})` : `⚡ НОВАЯ АБИЛКА (${itemHero.shortName})`) + ` • ${r.emoji} ${r.name} (СРАЗУ УР. ${newLevel})`;
      titleEl.textContent = `${itemDef.icon} ${itemDef.name} — Ур. ${newLevel}`;
      descEl.textContent = itemDef.desc;

      if (statsEl) {
        const currentStatBadges = buildCurrentItemStatsForCutin(itemDef, isWeapon, rollResult);
        statsEl.innerHTML = currentStatBadges
          .map(b => `<span class="px-2 py-0.5 rounded-md font-black text-[10px] sm:text-xs shadow ${b.cls}">${b.text}</span>`)
          .join('');
      }

      quoteEl.textContent = itemDef.heroQuote || `${itemHero.shortName}: «Испытаем ${itemDef.name} на этой орде!»`;

      if (miniCanvas) {
        const mCtx = miniCanvas.getContext('2d');
        mCtx.clearRect(0, 0, miniCanvas.width, miniCanvas.height);
        if (isWeapon) {
          drawDetailedMinimalWeapon(mCtx, 26, 14, 0, itemDef.gunStyle || 'pistol');
        } else {
          mCtx.font = '18px sans-serif';
          mCtx.fillText(itemDef.icon, 22, 20);
        }
      }

      overlay.classList.remove('hidden', 'cutin-banner-anim');
      void overlay.offsetWidth;
      overlay.classList.add('cutin-banner-anim');

      if (cutinTimeoutId) clearTimeout(cutinTimeoutId);
      cutinTimeoutId = setTimeout(() => {
        overlay.classList.add('hidden');
      }, 3900);
    }

    // Bottom Upgrade Banner showing exact Rarity & Rolled Stats (Урон, Область, КД)
    function showBottomRarityUpgradeBanner(itemDef, newLevel, rollResult, isNew) {
      const feed = document.getElementById('bottomUpgradeFeed');
      if (!feed) return;

      // Keep at most 2 banners visible so screen stays clean
      while (feed.children.length >= 2) {
        feed.removeChild(feed.firstElementChild);
      }

      const r = rollResult.rarity;
      const lvlGain = r.levelGain || 1;
      const customBadges = getCustomStatLabels(itemDef.id, rollResult, true);
      const statBadges = customBadges.map(
        b => `<span class="px-2 py-0.5 rounded font-black text-[11px] ${b.cls}">${b.text}</span>`
      );

      const el = document.createElement('div');
      el.className = `bottom-upgrade-anim w-full px-4 py-2.5 rounded-2xl border-2 backdrop-blur-md ${r.borderClass}`;
      el.innerHTML = `
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <div class="flex items-center gap-2">
            <span class="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${r.badgeClass}">
              ${r.emoji} ${r.name} (+${lvlGain} УР.)
            </span>
            <span class="text-sm font-black text-white">
              ${itemDef.icon} ${itemDef.name} <span class="text-emerald-400">Ур. ${newLevel} (+${lvlGain})</span> ${isNew ? '<span class="text-xs text-amber-300">(НОВОЕ!)</span>' : ''}
            </span>
          </div>
          <div class="flex items-center gap-1.5 flex-wrap">
            ${statBadges.join('')}
          </div>
        </div>
      `;
      feed.appendChild(el);
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 3350);
    }

    // =========================================================================
    // 9. WEAPON & ABILITY STATS WITH RARITY ACCUMULATION (DMG / AREA / CD)
    // =========================================================================
    function calcXpForLevel(lvl) {
      // Start: 20 XP for Level 1 -> 2.
      // Level 2 requires +5% of Level 1 (21), Level 3 requires +10% of Level 2 (23),
      // Level 4 requires +15% of Level 3 (27), etc.: each level costs previous * (1 + (k - 1) * 0.05)
      let xp = 20;
      for (let k = 2; k <= lvl; k++) {
        const pct = (k - 1) * 0.05;
        xp = xp * (1 + pct);
      }
      return Math.round(xp);
    }

    function getTotalItemsCount() {
      let wCount = Object.values(state.weapons).reduce((acc, w) => acc + w.level, 0);
      let aCount = Object.values(state.abilities).reduce((acc, a) => acc + a.level, 0);
      return { total: wCount + aCount, uniqueW: Object.keys(state.weapons).length, uniqueA: Object.keys(state.abilities).length };
    }

    function applyWeaponUpgrade(id, rollResult = null, silent = false) {
      const def = WEAPONS_POOL.find(w => w.id === id);
      if (!def) return;
      const skin = SKINS[selectedSkinId];
      const roll = rollResult || rollStatsForRarity(rollUpgradeRarity(), false);

      const levelGain = (roll && roll.rarity && roll.rarity.levelGain) ? roll.rarity.levelGain : 1;
      let isNew = false;
      if (!state.weapons[id]) {
        isNew = true;
        state.weapons[id] = {
          id,
          level: levelGain,
          dmgPts: 1 + roll.dmgPoints,
          areaPts: 1 + roll.areaPoints,
          cdPts: 1 + roll.cdPoints,
          timer: 0.05,
          aimAngle: -Math.PI / 2,
          recoilTimer: 0,
          orbitAngle: 0,
          def
        };
      } else {
        const w = state.weapons[id];
        w.level += levelGain;
        w.dmgPts += roll.dmgPoints;
        w.areaPts += roll.areaPoints;
        w.cdPts += roll.cdPoints;
      }

      if (!silent) {
        const curLvl = state.weapons[id].level;
        const artId = `imgArt_${def.id}`;
        showFirstTimeWeaponCutin(def, true, curLvl, roll, isNew);
        triggerCutin(artId, def.heroQuote || `${skin.shortName}: «${def.name} прокачан до Ур.${curLvl}!»`);
        showBottomRarityUpgradeBanner(def, curLvl, roll, isNew);
      }
      updateInventoryStripUI();
    }

    function getWeaponStats(wObj) {
      const def = wObj.def;
      const overdriveBoost = state.player.overdriveTimer > 0 ? 1.45 : 1.0;

      // Per-weapon damage scaling
      let dmgRate = 0.28;
      if (def.id === 'pistol' || def.id === 'shotgun') dmgRate = 0.30;
      else if (def.id === 'leek_blaster' || def.id === 'ak47' || def.id === 'plasma_rail') dmgRate = 0.32;
      else if (def.id === 'dual_sniper') dmgRate = 0.50;
      else if (def.id === 'baguette_rpg') dmgRate = 0.75;

      let rawDamage = def.baseDamage * (1 + (wObj.dmgPts - 1) * dmgRate);

      // Per-weapon area scaling
      let areaRate = 0.25;
      if (def.id === 'dual_sniper') areaRate = 0.50;
      else if (def.id === 'baguette_rpg' || def.id === 'plasma_rail') areaRate = 0.28;
      let areaScale = 1 + (wObj.areaPts - 1) * areaRate;
      let explosionAreaScale = areaScale;

      // Per-weapon fire-rate / cooldown scaling
      let cdFactor = 0.89;
      if (def.id === 'pistol') cdFactor = 1 / 1.20; // +20% fire rate per point
      else if (def.id === 'mp5') cdFactor = 1 / 1.25; // +25% fire rate per point

      const cooldown = Math.max(0.035, (def.baseCooldown * Math.pow(cdFactor, wObj.cdPts - 1)) / overdriveBoost);

      // Per-weapon bullet count & pierce scaling
      let count = def.bulletsPerShot + Math.floor((wObj.areaPts - 1) / 2);
      if (def.id === 'pistol') {
        // Мультишот +1 пуля за уровень/очко стата
        count = def.bulletsPerShot + (wObj.areaPts - 1);
      } else if (def.id === 'mp5') {
        // Длина очереди (+2 пули за стат)
        count = def.bulletsPerShot + (wObj.areaPts - 1) * 2;
      } else if (def.id === 'shotgun') {
        count = def.bulletsPerShot + (wObj.areaPts - 1) * 2;
      }

      let pierce = def.pierce + Math.floor((wObj.areaPts - 1) / 2);
      if (def.id === 'dual_sniper') {
        pierce = Math.round(def.pierce * (1 + (wObj.areaPts - 1) * 0.50));
      } else if (def.id === 'ak47') {
        pierce = def.pierce + (wObj.areaPts - 1) * 2;
      }

      // Apply character modifiers AT THE VERY END
      if (selectedSkinId === 'teto') {
        // Teto: +45% damage to handheld weapons EXCEPT leek_blaster and plasma_rail
        if (!def.isOrbitWeapon && def.id !== 'leek_blaster' && def.id !== 'plasma_rail') {
          rawDamage *= 1.45;
        }
        if (def.explosiveRadius) {
          explosionAreaScale *= 2.00;
        }
      } else if (selectedSkinId === 'miku') {
        // Miku: +100% damage from Leek (leek_blaster) applied at the end
        if (def.id === 'leek_blaster') {
          rawDamage *= 2.0;
        }
      } else if (selectedSkinId === 'neru') {
        // Neru: +50% damage bonus to Plasma Railgun (plasma_rail) applied at the end
        if (def.id === 'plasma_rail') {
          rawDamage *= 1.50;
        }
      }

      const damage = Math.round(rawDamage);
      return { damage, areaScale, explosionAreaScale, cooldown, count, pierce };
    }

    function applyAbilityUpgrade(id, rollResult = null, silent = false) {
      const def = ABILITIES_POOL.find(a => a.id === id);
      if (!def) return;
      const skin = SKINS[selectedSkinId];
      const roll = rollResult || rollStatsForRarity(rollUpgradeRarity(), false);

      const levelGain = (roll && roll.rarity && roll.rarity.levelGain) ? roll.rarity.levelGain : 1;
      let isNew = false;
      if (!state.abilities[id]) {
        isNew = true;
        state.abilities[id] = {
          id,
          level: levelGain,
          dmgPts: 1 + roll.dmgPoints,
          areaPts: 1 + roll.areaPoints,
          cdPts: 1 + roll.cdPoints,
          timer: 0.4,
          activeTimer: 0,
          maxActiveTimer: 0,
          def
        };
        if (id === 'plush_teto') syncPlushPets();
        if (id === 'drone_swarm') syncOrbitDrones();
      } else {
        const a = state.abilities[id];
        a.level += levelGain;
        a.dmgPts += roll.dmgPoints;
        a.areaPts += roll.areaPoints;
        a.cdPts += roll.cdPoints;

        if (id === 'plush_teto') syncPlushPets();
        if (id === 'drone_swarm') syncOrbitDrones();
      }

      if (!silent) {
        const curLvl = state.abilities[id].level;
        const artId = `imgArt_${def.id}`;
        showFirstTimeWeaponCutin(def, false, curLvl, roll, isNew);
        triggerCutin(artId, def.heroQuote || `${skin.shortName}: «${def.name} прокачана до Ур.${curLvl}!»`);
        showBottomRarityUpgradeBanner(def, curLvl, roll, isNew);
      }
      updateInventoryStripUI();
    }

    function getAbilityStats(aObj) {
      const def = aObj.def;
      const id = def.id;

      // Per-ability damage rate
      let dmgRate = 0.32;
      if (id === 'c130_airstrike' || id === 'twin_mega_beam' || id === 'meteor_rain' || id === 'black_hole') dmgRate = 0.35;
      else if (id === 'drone_swarm' || id === 'road_roller' || id === 'flash_panic') dmgRate = 0.30;
      else if (id === 'cryo_blizzard' || id === 'orbital_laser') dmgRate = 0.50;
      else if (id === 'napalm_ring' || id === 'chibi_turret') dmgRate = 1.00;
      else if (id === 'bass_shockwave' || id === 'holo_shield' || id === 'acid_juice' || id === 'magnet_pulse') dmgRate = 0;

      let rawDamage = def.baseDamage * (1 + (aObj.dmgPts - 1) * dmgRate);

      // Per-ability area rate
      let areaRate = 0.28;
      if (id === 'plush_teto' || id === 'c130_airstrike' || id === 'meteor_rain' || id === 'drill_tornado' ||
          id === 'bass_shockwave' || id === 'cryo_blizzard' || id === 'napalm_ring' || id === 'mortar_barrage' ||
          id === 'holo_shield' || id === 'magnet_pulse') {
        areaRate = 0.50;
      } else if (id === 'road_roller') {
        areaRate = 0.25;
      } else if (id === 'flash_panic') {
        areaRate = 0.40;
      } else if (id === 'orbital_laser') {
        areaRate = 0.45;
      } else if (id === 'acid_juice') {
        // For PoPiPo, Stat 3 (cdPts) increases radius by +35%
        areaRate = 0;
      }
      let areaScale = id === 'acid_juice'
        ? (1 + (aObj.cdPts - 1) * 0.35)
        : (1 + (aObj.areaPts - 1) * areaRate);

      // Per-ability cooldown calculation
      let rawCooldown = def.baseCooldown;
      if (id === 'c130_airstrike' || id === 'flash_panic' || id === 'drill_tornado') {
        rawCooldown = def.baseCooldown * Math.pow(0.85, aObj.cdPts - 1);
      } else if (id === 'twin_mega_beam' || id === 'acid_juice') {
        rawCooldown = def.baseCooldown * Math.pow(0.85, aObj.areaPts - 1);
      } else if (id === 'road_roller') {
        rawCooldown = def.baseCooldown * Math.pow(0.80, aObj.cdPts - 1);
      } else if (id === 'neru_phone') {
        rawCooldown = def.baseCooldown * Math.pow(0.75, aObj.cdPts - 1);
      } else if (id === 'bass_shockwave') {
        rawCooldown = def.baseCooldown * Math.pow(0.80, aObj.dmgPts - 1);
      } else if (id === 'orbital_laser' || id === 'black_hole') {
        rawCooldown = def.baseCooldown * Math.pow(0.90, aObj.cdPts - 1);
      } else if (id === 'holo_shield') {
        rawCooldown = def.baseCooldown * Math.pow(0.70, aObj.dmgPts - 1);
      } else if (id === 'magnet_pulse' || id === 'chibi_turret') {
        rawCooldown = def.baseCooldown * Math.pow(0.70, aObj.cdPts - 1);
      } else if (id === 'triple_baka_overdrive') {
        rawCooldown = def.baseCooldown * Math.pow(0.86, aObj.cdPts - 1);
      } else {
        rawCooldown = def.baseCooldown * Math.pow(0.91, aObj.cdPts - 1);
      }

      // Apply character modifiers AT THE VERY END
      if (selectedSkinId === 'teto') {
        // Teto: +45% damage and +100% area to explosive abilities (Plush Teto, Bombardment, Meteors, UTAU, Katyusha)
        if (TETO_EXPLOSIVE_ABILITIES.has(id)) {
          rawDamage *= 1.45;
          areaScale *= 2.00;
        }
      } else if (selectedSkinId === 'miku') {
        // Miku: +100% damage to Giant Drills (drill_tornado) applied at the end
        if (id === 'drill_tornado') {
          rawDamage *= 2.0;
        }
      } else if (selectedSkinId === 'neru') {
        // Neru: +50% damage to abilities (except Plush Teto, Bombardment, Meteors, Triple Baka, Drills, Snow Miku, Acid Juice, and 0-dmg abilities)
        if (def.baseDamage > 0 && !NERU_EXCLUDED_DAMAGE_ABILITIES.has(id)) {
          rawDamage *= 1.50;
        }
        // Neru: -50% ability cooldown reduction applied at the end (перезарядка абилок в 2 раза быстрее!)
        rawCooldown *= 0.50;
      }

      const minCd = selectedSkinId === 'neru' ? 0.5 : (id === 'triple_baka_overdrive' ? 3.0 : 1.2);
      const damage = Math.round(rawDamage);
      const cooldown = Math.max(minCd, rawCooldown);

      return { damage, areaScale, cooldown, level: aObj.level };
    }
