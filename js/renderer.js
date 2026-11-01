// =========================================================================
    // 6. NANOBANANA PIXEL-ART CHIBI HEROINE & DETAILED WEAPONS RENDERER
    // =========================================================================
    function drawSoftGroundShadow(ctx, cx, cy, rx, ry, alpha = 0.44) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(1, ry / Math.max(1, rx));
      const grad = ctx.createRadialGradient(0, 0, rx * 0.15, 0, 0, rx);
      grad.addColorStop(0, `rgba(0, 0, 0, ${alpha})`);
      grad.addColorStop(0.65, `rgba(0, 0, 0, ${alpha * 0.55})`);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawPixelHeroine(ctx, x, y, skinId, walkFrame = 0, scale = 1, charPhaseOffset = 0) {
      ctx.save();
      ctx.translate(Math.round(x), Math.round(y));
      ctx.scale(scale, scale);

      const skin = SKINS[skinId] || SKINS.teto;
      const nowSec = (typeof state !== 'undefined' && state.running && state.timeElapsed > 0)
        ? state.timeElapsed
        : (performance.now() / 1000);
      const isMoving = Math.abs(walkFrame % 1) > 0.001;
      const animCycle = isMoving ? (walkFrame * 2.6 + charPhaseOffset) : (nowSec * 3.8 + charPhaseOffset);
      const bob = isMoving
        ? Math.abs(Math.sin(walkFrame * 2.6)) * 3.2
        : Math.sin(nowSec * 3.8 + charPhaseOffset) * 1.3;
      const tilt = isMoving
        ? Math.sin(walkFrame * 2.6) * 0.055
        : Math.sin(nowSec * 2.2 + charPhaseOffset) * 0.018;

      // 1. Мягкая центрированная тень прямо под ножками героини
      drawSoftGroundShadow(ctx, 0, 20, 18, 8.5, 0.52);

      // 2. Отрисовка 8-кадрового пиксель-арт спрайта (анимация ног, волос и моргания глаз, без нимба!)
      const spriteMap = {
        teto: 'imgSpriteTeto',
        miku: 'imgSpriteMiku',
        neru: 'imgSpriteNeru'
      };
      const spriteEl = document.getElementById(spriteMap[skinId] || 'imgSpriteTeto');

      ctx.save();
      ctx.translate(0, -bob);
      ctx.rotate(tilt);

      if (spriteEl && spriteEl.complete && spriteEl.naturalWidth > 0) {
        // Выбор кадра движения ног и волос (0..3) + периодическое моргание глаз (+4)
        const baseFrame = ((Math.floor(animCycle) % 4) + 4) % 4;
        const blinkPhase = (nowSec + charPhaseOffset * 0.91) % 2.65;
        const isBlinking = (blinkPhase < 0.15) || (blinkPhase > 1.85 && blinkPhase < 1.97 && ((Math.floor((nowSec + charPhaseOffset) / 2.65) % 2) === 0));
        const frameIdx = baseFrame + (isBlinking ? 4 : 0);

        ctx.shadowColor = 'rgba(255, 255, 255, 0.75)';
        ctx.shadowBlur = 6;
        if (spriteEl.naturalWidth >= 640) {
          const totalFrames = 8;
          const fw = Math.floor(spriteEl.naturalWidth / totalFrames);
          const fh = spriteEl.naturalHeight;
          ctx.drawImage(spriteEl, frameIdx * fw, 0, fw, fh, -27, -32, 54, 54);
        } else {
          ctx.drawImage(spriteEl, -27, -32, 54, 54);
        }
        ctx.shadowBlur = 0;
      } else {
        ctx.fillStyle = skin.hairColor;
        ctx.beginPath();
        ctx.arc(0, -6, 16, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
      ctx.restore();
    }

    function drawDetailedMinimalWeapon(ctx, x, y, angle, style, recoil = 0) {
      ctx.save();
      ctx.translate(x - Math.cos(angle) * recoil, y - Math.sin(angle) * recoil);
      ctx.rotate(angle);
      if (Math.cos(angle) < 0) {
        ctx.scale(1, -1);
      }

      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 1.4;

      switch (style) {
        case 'minigun':
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-5, -6, 13, 12);
          ctx.strokeRect(-5, -6, 13, 12);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(8, -5, 16, 2.2);
          ctx.fillRect(8, -1.2, 16, 2.2);
          ctx.fillRect(8, 2.6, 16, 2.2);
          ctx.fillStyle = '#475569';
          ctx.fillRect(15, -6, 3.5, 12);
          ctx.fillStyle = '#facc15';
          ctx.fillRect(-2, 5, 6, 4.5);
          break;

        case 'ak47':
          ctx.fillStyle = '#b45309';
          ctx.fillRect(-7, -2.5, 7, 4.5);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(0, -4, 12, 6);
          ctx.fillStyle = '#b45309';
          ctx.fillRect(7, -3, 6, 3.5);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(13, -2.5, 9, 2.5);
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(4, 2, 4, 6.5);
          break;

        case 'mp5':
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-3, -4, 14, 6);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(11, -2.5, 6, 3);
          ctx.fillStyle = '#334155';
          ctx.fillRect(5, 2, 3, 6.5);
          break;

        case 'sniper':
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-5, -3, 18, 5);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(1, -6.5, 9, 3);
          ctx.fillStyle = '#bae6fd';
          ctx.fillRect(13, -2, 14, 2.5);
          break;

        case 'shotgun':
          ctx.fillStyle = '#78350f';
          ctx.fillRect(-6, -2.5, 7, 4.5);
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(1, -4, 15, 4);
          ctx.fillStyle = '#fdba74';
          ctx.fillRect(3, 0, 10, 2.5);
          break;

        case 'rpg':
          ctx.fillStyle = '#334155';
          ctx.fillRect(-7, -3.5, 21, 6);
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(14, -6);
          ctx.lineTo(24, -0.5);
          ctx.lineTo(14, 5);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;

        case 'leek':
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(-6, -3, 9, 6);
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(3, -4.5, 12, 4);
          ctx.fillRect(3, 0.5, 12, 4);
          break;

        case 'railgun':
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(-5, -5, 19, 9);
          ctx.fillStyle = '#c084fc';
          ctx.fillRect(0, -2, 18, 3.5);
          break;

        case 'dual_ar':
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-4, -3.5, 14, 5.5);
          ctx.fillStyle = '#f43f5e';
          ctx.fillRect(0, -2.5, 11, 2.5);
          ctx.fillRect(10, -2, 7, 2.5);
          break;

        default:
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(0, -3.5, 11, 5);
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(1, -3.5, 10, 2.2);
          break;
      }

      ctx.restore();
    }

    function drawAllEquippedWeapons(ctx, p) {
      const gunWeapons = Object.values(state.weapons).filter(w => !w.def.isOrbitWeapon);
      const total = gunWeapons.length;
      gunWeapons.forEach((wObj, idx) => {
        const slotAngle = total === 1
          ? 0
          : -Math.PI + (idx / Math.max(1, total)) * Math.PI * 2 + Math.sin(state.timeElapsed * 1.5 + idx) * 0.08;
        const radius = total === 1 ? 18 : 32;
        const wx = p.x + Math.cos(slotAngle) * radius;
        const wy = p.y - 4 + Math.sin(slotAngle) * (radius * 0.78);

        drawSoftGroundShadow(ctx, wx, wy + 12, 7, 3.5, 0.32);

        ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
        ctx.strokeStyle = wObj.def.color;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.arc(wx, wy, 7.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        const aimAngle = wObj.aimAngle !== undefined ? wObj.aimAngle : p.facingAngle;
        const recoil = wObj.recoilTimer > 0 ? wObj.recoilTimer * 40 : 0;
        drawDetailedMinimalWeapon(ctx, wx, wy, aimAngle, wObj.def.gunStyle || 'pistol', recoil);
      });
    }

    
// =========================================================================
    // 17. STRAIGHT 3D BRIDGE OVER WATER, NATURAL SHADOWS, C-130 & SPECTACULAR VFX
    // =========================================================================
    function shadeHexColor(hex, factor = 1.0) {
      if (!hex || !hex.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) return hex || '#4ade80';
      let r, g, b;
      if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
      } else {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
      }
      r = Math.max(0, Math.min(255, Math.round(r * factor)));
      g = Math.max(0, Math.min(255, Math.round(g * factor)));
      b = Math.max(0, Math.min(255, Math.round(b * factor)));
      return `rgb(${r}, ${g}, ${b})`;
    }

    // Прямой 3D-бокс без бокового скоса (верхняя грань уходит строго вверх по оси Z/Y, поэтому объекты стоят ровно на своих тенях!)
    function drawStraightBox3D(ctx, cx, cy, zBottom, w, hFront, depthTop, frontCol, topCol, outlineCol = '#090d16', lineW = 1.6) {
      const hw = w * 0.5;
      const baseY = cy - zBottom;
      const frontTopY = baseY - hFront;
      const backTopY = frontTopY - depthTop;

      ctx.save();
      ctx.lineJoin = 'round';

      // Верхняя грань (Top Face)
      ctx.fillStyle = topCol || frontCol;
      ctx.beginPath();
      ctx.rect(cx - hw, backTopY, w, depthTop + 0.5);
      ctx.fill();
      if (outlineCol) {
        ctx.strokeStyle = outlineCol;
        ctx.lineWidth = lineW;
        ctx.strokeRect(cx - hw, backTopY, w, depthTop);
      }

      // Передняя грань (Front Face)
      ctx.fillStyle = frontCol;
      ctx.beginPath();
      ctx.rect(cx - hw, frontTopY, w, hFront);
      ctx.fill();
      if (outlineCol) {
        ctx.strokeStyle = outlineCol;
        ctx.lineWidth = lineW;
        ctx.strokeRect(cx - hw, frontTopY, w, hFront);
      }

      ctx.restore();
      return { frontTopY, backTopY, baseY };
    }

    // Отрисовка 4-лучевой аниме-искры (как в видео kakki_sousaku_ch на 00:07 и 00:10!)
    function drawFourPointStar(ctx, x, y, radius, color = '#ffffff', innerRatio = 0.24, rot = 0) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = color;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const r = i % 2 === 0 ? radius : radius * innerRatio;
        const a = (i * Math.PI) / 4;
        if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
        else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Детализированный французский багет (для Багетной Базуки и Багетной Катюши!)
    function drawDetailedBaguetteSprite(ctx, x, y, angle, scale = 1, withRocketFlame = true) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.scale(scale, scale);

      if (withRocketFlame) {
        const flk = Math.sin(state.timeElapsed * 28) * 3;
        ctx.fillStyle = 'rgba(249, 115, 22, 0.85)';
        ctx.beginPath();
        ctx.moveTo(-12, -4);
        ctx.lineTo(-24 - flk, 0);
        ctx.lineTo(-12, 4);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(-13, 0, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Хрустящая корочка багета
      ctx.fillStyle = '#d97706';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.roundRect(-13, -5.5, 26, 11, 5.5);
      ctx.fill();
      ctx.stroke();

      // Светлый подрумяненный верх и диагональные надрезы на багете
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(-11, -4, 22, 5, 3);
      ctx.fill();

      ctx.strokeStyle = '#fef3c7';
      ctx.lineWidth = 1.6;
      for (let s = -7; s <= 7; s += 4.5) {
        ctx.beginPath();
        ctx.moveTo(s, -3.2);
        ctx.lineTo(s + 2.2, 3.2);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawProceduralStreetDecals(ctx, canvasHeight) {
      const viewTop = state.cameraY - 140;
      const viewBottom = state.cameraY + canvasHeight + 140;

      for (let i = 0; i < state.streetDecals.length; i++) {
        const d = state.streetDecals[i];
        if (d.y < viewTop || d.y > viewBottom) continue;

        if (d.type === 'crack') {
          ctx.save();
          ctx.translate(d.x, d.y);
          ctx.strokeStyle = 'rgba(71, 85, 105, 0.34)';
          ctx.lineWidth = 3.0;
          ctx.beginPath();
          for (const seg of d.mainSegs) {
            ctx.moveTo(seg.x1 + 1, seg.y1 + 1);
            ctx.lineTo(seg.x2 + 1, seg.y2 + 1);
          }
          ctx.stroke();

          ctx.strokeStyle = '#070a10';
          ctx.lineWidth = 2.0;
          ctx.beginPath();
          for (const seg of d.mainSegs) {
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
          }
          for (const br of d.branches) {
            ctx.moveTo(br.x1, br.y1);
            ctx.lineTo(br.x2, br.y2);
          }
          ctx.stroke();
          ctx.restore();
        } else if (d.type === 'stain') {
          ctx.save();
          ctx.translate(d.x, d.y);
          ctx.rotate(d.angle || 0);
          ctx.fillStyle = d.color;
          if (d.isRect) {
            ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
          } else {
            ctx.beginPath();
            ctx.ellipse(0, 0, d.w * 0.55, d.h * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        } else if (d.type === 'tire_skid') {
          ctx.save();
          ctx.translate(d.x, d.y);
          ctx.rotate(d.angle || -Math.PI / 2);
          ctx.fillStyle = 'rgba(9, 11, 16, 0.52)';
          ctx.fillRect(-d.length / 2, -8, d.length, 4.5);
          ctx.fillRect(-d.length / 2, 4, d.length, 4.5);
          ctx.restore();
        } else if (d.type === 'loose_tire') {
          const r = d.radius || 10;
          drawSoftGroundShadow(ctx, d.x, d.y + 2, r * 1.15, r * 0.85, 0.45);
          ctx.save();
          ctx.translate(d.x, d.y);
          ctx.fillStyle = '#18181b';
          ctx.strokeStyle = '#3f3f46';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.ellipse(0, 0, r, r * 0.78, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#090d16';
          ctx.beginPath();
          ctx.ellipse(0, 0, r * 0.45, r * 0.35, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (d.type === 'trash') {
          if (d.subType === 'paper') {
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.rotate(d.angle || 0);
            ctx.fillStyle = 'rgba(0,0,0,0.35)';
            ctx.fillRect(-d.w / 2 + 1, -d.h / 2 + 1.5, d.w, d.h);
            ctx.fillStyle = d.tint || '#e2e8f0';
            ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
            ctx.restore();
          } else if (d.subType === 'cardboard') {
            drawSoftGroundShadow(ctx, d.x, d.y + 3, d.w * 0.7, d.h * 0.55, 0.38);
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.rotate(d.angle || 0);
            ctx.fillStyle = '#92400e';
            ctx.strokeStyle = '#451a03';
            ctx.lineWidth = 1.2;
            ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
            ctx.strokeRect(-d.w / 2, -d.h / 2, d.w, d.h);
            ctx.restore();
          } else if (d.subType === 'rubble') {
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.rotate(d.angle || 0);
            ctx.fillStyle = '#475569';
            ctx.fillRect(-d.w / 2, -d.h / 2, d.w, d.h);
            ctx.restore();
          } else if (d.subType === 'cone') {
            drawSoftGroundShadow(ctx, d.x, d.y + 3, 8, 4.5, 0.45);
            ctx.save();
            ctx.translate(d.x, d.y);
            ctx.fillStyle = '#ea580c';
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 1.2;
            ctx.fillRect(-6, -1, 12, 5);
            ctx.strokeRect(-6, -1, 12, 5);
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.moveTo(-5, 2);
            ctx.lineTo(0, -11);
            ctx.lineTo(5, 2);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(-2.8, -5.5, 5.6, 2.5);
            ctx.restore();
          }
        } else if (d.type === 'destroyed_remnant') {
          ctx.save();
          ctx.translate(d.x, d.y);
          ctx.rotate(d.angle || 0);
          const hw = d.halfW || 24;
          const hh = d.halfH || 20;
          ctx.fillStyle = 'rgba(8, 10, 15, 0.78)';
          ctx.fillRect(-hw, -hh, hw * 2, hh * 2);
          ctx.strokeStyle = 'rgba(71, 85, 105, 0.42)';
          ctx.lineWidth = 1.4;
          ctx.strokeRect(-hw * 0.8, -hh * 0.8, hw * 1.6, hh * 1.6);
          ctx.restore();
        }
      }
    }

    function drawSingle3DStreetObstacle(ctx, obs) {
      if (obs.kind === 'burning_barrel') {
        ctx.save();
        const flicker = Math.sin(state.timeElapsed * 14 + obs.flamePhase) * 0.14;
        const glowR = 82 + flicker * 42;
        const grad = ctx.createRadialGradient(obs.x, obs.y, 4, obs.x, obs.y, glowR);
        grad.addColorStop(0, 'rgba(251, 146, 60, 0.44)');
        grad.addColorStop(0.5, 'rgba(234, 88, 12, 0.18)');
        grad.addColorStop(1, 'rgba(234, 88, 12, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, glowR, 0, Math.PI * 2);
        ctx.fill();

        // Естественная центрированная тень прямо под основанием бочки!
        drawSoftGroundShadow(ctx, obs.x, obs.y + 11, 18, 9, 0.58);

        ctx.translate(obs.x, obs.y);

        // Цилиндрический ржавый корпус бочки
        ctx.fillStyle = '#451a03';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-13, -12, 26, 24, 4);
        ctx.fill();
        ctx.stroke();

        // Стальные обручи бочки
        ctx.fillStyle = '#7c2d12';
        ctx.fillRect(-13.5, -4, 27, 3);
        ctx.fillRect(-13.5, 4, 27, 3);

        // Верхнее жерло бочки с раскалёнными углями
        ctx.fillStyle = '#18181b';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.ellipse(0, -12, 13, 5.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Многослойное пламя из бочки (как в видео kakki_sousaku_ch!)
        const flameH = 22 + Math.sin(state.timeElapsed * 18 + obs.flamePhase) * 5;
        ctx.fillStyle = 'rgba(234, 88, 12, 0.85)';
        ctx.beginPath();
        ctx.arc(0, -15, 13 + flicker * 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(-10, -12);
        ctx.lineTo(-4, -12 - flameH);
        ctx.lineTo(1, -12 - flameH * 0.65);
        ctx.lineTo(6, -12 - flameH * 0.92);
        ctx.lineTo(10, -12);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(0, -15, 7 + flicker * 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, -14, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (obs.kind === 'barricade') {
        const hw = obs.halfW || 36;
        const hh = obs.halfH || 13;
        ctx.save();
        ctx.translate(obs.x, obs.y);
        ctx.rotate(obs.angle || 0);

        // Центрированная мягкая тень прямо под баррикадой (никаких оторванных овалов!)
        drawSoftGroundShadow(ctx, 0, 6, hw * 1.05, hh * 0.85, 0.52);

        if (obs.variant === 'sawhorse') {
          // Стойки дорожного барьера
          ctx.fillStyle = '#475569';
          ctx.strokeStyle = '#090d16';
          ctx.lineWidth = 1.5;
          ctx.fillRect(-hw + 6, -hh - 3, 5, hh * 2 + 6);
          ctx.strokeRect(-hw + 6, -hh - 3, 5, hh * 2 + 6);
          ctx.fillRect(hw - 11, -hh - 3, 5, hh * 2 + 6);
          ctx.strokeRect(hw - 11, -hh - 3, 5, hh * 2 + 6);

          // Две светоотражающие красно-белые перекладины
          for (const barY of [-hh + 1, 2]) {
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(-hw, barY, hw * 2, 7.5);
            ctx.fillStyle = '#dc2626';
            for (let sx = -hw + 4; sx < hw - 6; sx += 14) {
              ctx.fillRect(sx, barY + 1, 7, 5.5);
            }
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 1.6;
            ctx.strokeRect(-hw, barY, hw * 2, 7.5);
          }
          // Сигнальный фонарь на барьере
          const blink = Math.sin(state.timeElapsed * 10 + obs.x) > 0;
          ctx.fillStyle = blink ? '#facc15' : '#ea580c';
          ctx.beginPath();
          ctx.arc(-hw + 8.5, -hh - 4, 3.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Бетонный дорожный блок-отбойник с мешками песка и сигнальной разметкой
          ctx.fillStyle = '#64748b';
          ctx.strokeStyle = '#090d16';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(-hw, -hh - 4, hw * 2, hh * 2 + 4, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#475569';
          ctx.fillRect(-hw + 2, -2, hw * 2 - 4, hh + 1);

          // Чёрно-жёлтая аварийная полоса
          ctx.fillStyle = '#eab308';
          ctx.fillRect(-hw + 6, -hh + 1, hw * 2 - 12, 4.5);
          ctx.fillStyle = '#090d16';
          for (let sx = -hw + 10; sx < hw - 10; sx += 14) {
            ctx.fillRect(sx, -hh + 1, 6, 4.5);
          }
        }
        ctx.restore();
      } else if (obs.kind === 'destroyed_car') {
        const hw = obs.halfW || 44;
        const hh = obs.halfH || 23;
        const pal = obs.palette || { body: '#18181b', roof: '#27272a', accent: '#3f3f46', stripe: null };

        ctx.save();
        ctx.translate(obs.x, obs.y);
        ctx.rotate(obs.angle || 0);

        // Центрированная мягкая тень прямо под кузовом машины
        drawSoftGroundShadow(ctx, 0, 4, hw * 1.12, hh * 1.12, 0.60);

        // 4 колеса в колёсных арках
        ctx.fillStyle = '#090d16';
        ctx.fillRect(-hw + 7, -hh - 3, 14, 5);
        ctx.fillRect(hw - 21, -hh - 3, 14, 5);
        ctx.fillRect(-hw + 7, hh - 2, 14, 5);
        ctx.fillRect(hw - 21, hh - 2, 14, 5);

        // Основной кузов машины
        ctx.fillStyle = pal.body;
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.roundRect(-hw, -hh, hw * 2, hh * 2, 7);
        ctx.fill();
        ctx.stroke();

        // Смятый капот с обнажённым двигателем
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(hw - 19, -hh + 5, 14, hh * 2 - 10);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(hw - 19, -hh + 5, 14, hh * 2 - 10);

        // Остекление салона и крыша
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(-hw + 11, -hh + 4, hw * 1.18, hh * 2 - 8, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = pal.roof;
        ctx.fillRect(-hw + 19, -hh + 5.5, hw * 0.74, hh * 2 - 11);
        ctx.strokeRect(-hw + 19, -hh + 5.5, hw * 0.74, hh * 2 - 11);

        if (pal.stripe === 'police') {
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-4, -hh + 7, 4.5, 7);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(-4, hh - 14, 4.5, 7);
        } else if (pal.stripe === 'taxi') {
          ctx.fillStyle = '#facc15';
          ctx.fillRect(-5, -6, 5, 12);
        }

        // Огонь из-под капота
        if (obs.hasHoodFire) {
          const flk = Math.sin(state.timeElapsed * 16 + obs.flamePhase) * 2.5;
          ctx.fillStyle = 'rgba(249, 115, 22, 0.88)';
          ctx.beginPath();
          ctx.arc(hw - 12, -2, 7.5 + flk, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(hw - 12, -2, 3.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (obs.kind === 'tire_stack') {
        ctx.save();
        drawSoftGroundShadow(ctx, obs.x, obs.y + 6, 22, 13, 0.54);
        ctx.translate(obs.x, obs.y);
        const offsets = [
          { x: -6, y: 4, r: 12 },
          { x: 7, y: 3, r: 12 },
          { x: 0, y: -4, r: 13 }
        ];
        for (const o of offsets) {
          ctx.fillStyle = '#18181b';
          ctx.strokeStyle = '#3f3f46';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#090d16';
          ctx.beginPath();
          ctx.arc(o.x, o.y, o.r * 0.46, 0, Math.PI * 2);
          ctx.fill();
        }
        if (obs.smoldering) {
          const flk = Math.sin(state.timeElapsed * 12 + obs.flamePhase) * 1.8;
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.arc(0, -4, 4.5 + flk, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    function drawPlushieTetoPhotoSprite(ctx, pet) {
      const plushImg = document.getElementById('imgPlushTeto');
      ctx.save();
      const shadowScale = Math.max(0.35, 1 - pet.z / 200);
      drawSoftGroundShadow(ctx, pet.x, pet.y + 15, 20 * shadowScale, 8.5 * shadowScale, 0.52);

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

    // Детализированные 4-винтовые квадрокоптеры (как на 00:06 и 00:08 в референсном видео!)
    function drawOrbitingDrones(ctx) {
      for (const d of state.orbitDrones) {
        ctx.save();
        drawSoftGroundShadow(ctx, d.x, d.y + 16, 10, 4.5, 0.36);
        ctx.translate(d.x, d.y - 6);

        // X-образная рама квадрокоптера
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(-11, -8);
        ctx.lineTo(11, 8);
        ctx.moveTo(11, -8);
        ctx.lineTo(-11, 8);
        ctx.stroke();

        // 4 вращающихся кольца пропеллеров по углам
        const rotPositions = [[-11, -8], [11, -8], [-11, 8], [11, 8]];
        for (const [rx, ry] of rotPositions) {
          ctx.fillStyle = 'rgba(148, 163, 184, 0.32)';
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.ellipse(rx, ry, 5.5, 3.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }

        // Центральная капсула с зелёным лазерным ядром
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(-5.5, -5.5, 11, 11, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    function drawSpinningLeeksAura(ctx) {
      if (state.spinningLeeks.length === 0) return;
      for (const l of state.spinningLeeks) {
        ctx.save();
        ctx.translate(l.x, l.y - 6);
        ctx.rotate(l.angle + state.timeElapsed * 10);
        const s = l.size / 18;
        ctx.scale(s, s);
        // Яркий изумрудно-бирюзовый шлейф-полумесяц от взмаха лука-порея
        ctx.strokeStyle = 'rgba(52, 211, 153, 0.55)';
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.arc(0, 0, 17, -0.3, Math.PI * 1.35);
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 1.5;
        ctx.fillRect(-10, -3.5, 10, 7);
        ctx.strokeRect(-10, -3.5, 10, 7);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(0, -5, 12, 4.5);
        ctx.strokeRect(0, -5, 12, 4.5);
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(0, 0.5, 12, 4.5);
        ctx.strokeRect(0, 0.5, 12, 4.5);
        ctx.restore();
      }
    }

    // 3D Кубические Зомби в стиле Minecraft с мягкой центрированной тенью прямо под ногами!
    function drawPixelZombieVariety(ctx, z) {
      ctx.save();
      const wobble = Math.sin(z.wobblePhase);
      const zx = Math.round(z.x + wobble * 1.4);
      const zy = Math.round(z.y);
      const s = z.size;

      // 1. Центрированная мягкая тень прямо под зомби (без смещения вбок!)
      drawSoftGroundShadow(ctx, zx, zy + s * 0.55, s * 0.92, s * 0.45, 0.52);

      if (z.type === 'necromancer' || z.buffTimer > 0) {
        ctx.strokeStyle = z.type === 'necromancer' ? '#c084fc' : 'rgba(192, 132, 252, 0.52)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(zx, zy + 4, s * 1.0, s * 0.46, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 2. Ноги зомби
      const legSwing = wobble * 2.0;
      drawStraightBox3D(ctx, zx - s * 0.25, zy + s * 0.5 + legSwing * 0.4, 0, s * 0.38, s * 0.48, 3, '#1e3a8a', '#2563eb', '#090d16', 1.4);
      drawStraightBox3D(ctx, zx + s * 0.25, zy + s * 0.5 - legSwing * 0.4, 0, s * 0.38, s * 0.48, 3, '#1e3a8a', '#2563eb', '#090d16', 1.4);

      // 3. Кубический торс и руки
      const shirtF = z.hitFlash > 0 ? '#ffffff' : z.shirtColor;
      const shirtT = z.hitFlash > 0 ? '#ffffff' : shadeHexColor(z.shirtColor, 1.22);
      drawStraightBox3D(ctx, zx, zy + s * 0.12, 0, s * 1.06, s * 0.62, 4, shirtF, shirtT, '#090d16', 1.6);

      let skinBase = '#4ade80';
      if (z.type === 'spitter') skinBase = '#a3e635';
      else if (z.type === 'tank') skinBase = '#22c55e';
      else if (z.chillTimer > 0) skinBase = '#67e8f9';

      const skinF = z.hitFlash > 0 ? '#ffffff' : skinBase;
      const skinT = z.hitFlash > 0 ? '#ffffff' : shadeHexColor(skinBase, 1.25);

      // Руки Minecraft-зомби по бокам
      drawStraightBox3D(ctx, zx - s * 0.68, zy + s * 0.08, 0, s * 0.30, s * 0.46, 3, skinF, skinT, '#090d16', 1.3);
      drawStraightBox3D(ctx, zx + s * 0.68, zy + s * 0.08, 0, s * 0.30, s * 0.46, 3, skinF, skinT, '#090d16', 1.3);

      // 4. Большая кубическая голова зомби (с чёткой верхней гранью и лицом как на видео!)
      const headW = s * 1.22;
      const headH = s * 0.96;
      const headBox = drawStraightBox3D(ctx, zx, zy - s * 0.34, 0, headW, headH, s * 0.32, skinF, skinT, '#090d16', 1.8);

      const faceTopY = headBox.frontTopY;
      const eyeY = faceTopY + headH * 0.36;
      ctx.fillStyle = (z.type === 'sprinter' || z.type === 'tank') ? '#ef4444' : '#090d16';
      ctx.fillRect(zx - headW * 0.34, eyeY, headW * 0.20, headH * 0.24);
      ctx.fillRect(zx + headW * 0.14, eyeY, headW * 0.20, headH * 0.24);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(zx - headW * 0.32, eyeY + 1, headW * 0.08, headH * 0.09);
      ctx.fillRect(zx + headW * 0.16, eyeY + 1, headW * 0.08, headH * 0.09);

      ctx.fillStyle = '#14532d';
      ctx.fillRect(zx - headW * 0.18, faceTopY + headH * 0.72, headW * 0.36, headH * 0.15);

      if (z.type === 'riot') {
        drawStraightBox3D(ctx, zx, faceTopY + 2, 0, headW * 1.06, headH * 0.34, 4, '#1e293b', '#475569', '#090d16', 1.4);
        drawStraightBox3D(ctx, zx - s * 0.52, zy + s * 0.22, 0, s * 0.56, s * 1.05, 3, '#475569', '#94a3b8', '#090d16', 1.5);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(zx - s * 0.68, zy - s * 0.55, s * 0.32, s * 0.20);
      } else if (z.type === 'bomber') {
        const blink = Math.sin(state.timeElapsed * 18) > 0;
        drawStraightBox3D(ctx, zx, faceTopY - 2, 0, s * 0.84, s * 0.52, 4, blink ? '#ef4444' : '#dc2626', blink ? '#fde047' : '#fca5a5', '#090d16', 1.4);
      } else if (z.type === 'necromancer') {
        drawStraightBox3D(ctx, zx, faceTopY + 1, 0, headW * 1.04, headH * 0.32, 4, '#3b0764', '#7e22ce', '#090d16', 1.4);
      }

      // Звёздочки оглушения над головой зомби (от Светошумовой Сверхновой или Бас-Дропа!)
      if (z.stunTimer > 0) {
        for (let st = 0; st < 3; st++) {
          const sa = state.timeElapsed * 7 + (st * Math.PI * 2) / 3;
          const sx = zx + Math.cos(sa) * (s * 0.72);
          const sy = faceTopY - 6 + Math.sin(sa) * 4;
          drawFourPointStar(ctx, sx, sy, 5.5, '#fde047', 0.3, sa);
        }
      }
      // Ледяная корка на замороженных зомби (от Ледникового Шторма Снежной Мику!)
      if (z.chillTimer > 0) {
        ctx.fillStyle = 'rgba(103, 232, 249, 0.32)';
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1.4;
        ctx.fillRect(zx - s * 0.68, faceTopY - 2, s * 1.36, s * 1.45);
        ctx.strokeRect(zx - s * 0.68, faceTopY - 2, s * 1.36, s * 1.45);
      }

      if (z.hp < z.maxHp && (z.type === 'tank' || z.type === 'riot' || z.type === 'necromancer')) {
        const barY = headBox.backTopY - 8;
        ctx.fillStyle = 'rgba(0,0,0,0.78)';
        ctx.fillRect(zx - s * 0.72, barY, s * 1.44, 4);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(zx - s * 0.72, barY, s * 1.44 * Math.max(0, z.hp / z.maxHp), 4);
      }

      ctx.restore();
    }

    // Детализированные многосоставные 3D-Боссы с центрированной тенью
    function drawGiantBossZombie(ctx, b) {
      ctx.save();
      const bx = Math.round(b.x);
      const by = Math.round(b.y);
      const s = b.size;
      const leapZ = b.zOffset || 0;
      const walkBob = (Math.abs(Math.sin(state.timeElapsed * 5)) * 3.5) + leapZ;
      const stride = Math.sin(state.timeElapsed * 5) * 4;

      // 1. Центрированная тень на асфальте (сжимается при прыжке босса в воздухе!)
      const shadowScale = Math.max(0.45, 1 - leapZ / 220);
      drawSoftGroundShadow(ctx, bx, by + s * 0.65, s * 1.25 * shadowScale, s * 0.58 * shadowScale, 0.65);

      ctx.strokeStyle = b.enraged ? '#ef4444' : (b.accentColor || '#facc15');
      ctx.lineWidth = b.enraged ? 4.5 : 3;
      ctx.beginPath();
      ctx.ellipse(bx, by + s * 0.55, s * 1.15, s * 0.48, 0, 0, Math.PI * 2);
      ctx.stroke();

      const bodyF = b.hitFlash > 0 ? '#ffffff' : (b.bodyColor || '#1e1b4b');
      const bodyT = b.hitFlash > 0 ? '#ffffff' : shadeHexColor(b.bodyColor || '#1e1b4b', 1.35);
      const headF = b.hitFlash > 0 ? '#ffffff' : (b.headColor || '#22c55e');
      const headT = b.hitFlash > 0 ? '#ffffff' : shadeHexColor(b.headColor || '#22c55e', 1.28);
      const coreCol = b.enraged ? '#ef4444' : (b.accentColor || '#facc15');

      // 2. Бронированные ноги
      drawStraightBox3D(ctx, bx - s * 0.36, by + s * 0.62 + stride * 0.3, 0, s * 0.46, s * 0.52, 6, '#0f172a', '#334155', '#090d16', 2.0);
      drawStraightBox3D(ctx, bx + s * 0.36, by + s * 0.62 - stride * 0.3, 0, s * 0.46, s * 0.52, 6, '#0f172a', '#334155', '#090d16', 2.0);

      // 3. Массивный торс + светящееся ядро в груди
      drawStraightBox3D(ctx, bx, by + s * 0.18 - walkBob, 0, s * 1.36, s * 0.86, 10, bodyF, bodyT, '#090d16', 2.4);
      drawStraightBox3D(ctx, bx, by - s * 0.08 - walkBob, 0, s * 0.52, s * 0.38, 4, coreCol, '#ffffff', '#090d16', 1.6);

      // 4. Шипастые наплечники и кулаки
      for (const dir of [-1, 1]) {
        drawStraightBox3D(ctx, bx + dir * s * 0.88, by - s * 0.28 - walkBob, 0, s * 0.50, s * 0.42, 8, coreCol, '#fef08a', '#090d16', 2.0);
        drawStraightBox3D(ctx, bx + dir * s * 0.90, by + s * 0.16 - walkBob, 0, s * 0.42, s * 0.48, 6, headF, headT, '#090d16', 1.8);
      }

      // 5. Голова Босса и корона / спец-экипировка
      const headW = s * 1.16;
      const headH = s * 0.88;
      const headBox = drawStraightBox3D(ctx, bx, by - s * 0.55 - walkBob, 0, headW, headH, 12, headF, headT, '#090d16', 2.4);
      const hTopY = headBox.frontTopY;

      if (b.archetype === 'cyber_riot') {
        for (const dir of [-1, 1]) {
          drawStraightBox3D(ctx, bx + dir * s * 1.12, by + s * 0.25 - walkBob, 0, s * 0.34, s * 1.18, 6, '#334155', '#38bdf8', '#00f0ff', 2.0);
        }
        ctx.fillStyle = '#00f0ff';
        ctx.fillRect(bx - headW * 0.44, hTopY + headH * 0.32, headW * 0.88, headH * 0.26);
      } else if (b.archetype === 'plague_spitter') {
        for (const dir of [-1, 1]) {
          drawStraightBox3D(ctx, bx + dir * s * 0.62, hTopY + 10, 0, s * 0.38, s * 0.78, 6, '#84cc16', '#ecfccb', '#090d16', 1.8);
        }
      } else if (b.archetype === 'pyro_bomber') {
        const blink = Math.sin(state.timeElapsed * 16) > 0;
        for (const dir of [-1, 1]) {
          drawStraightBox3D(ctx, bx + dir * s * 0.48, hTopY - 2, 0, s * 0.56, s * 0.48, 6, blink ? '#ef4444' : '#f97316', '#fde047', '#090d16', 1.8);
        }
      } else if (b.archetype === 'necro_lord') {
        drawStraightBox3D(ctx, bx, hTopY - 2, 0, headW * 0.76, headH * 0.38, 6, '#581c87', '#e879f9', '#090d16', 1.8);
        for (let cIdx = 0; cIdx < 4; cIdx++) {
          const cAng = state.timeElapsed * 2.2 + (cIdx / 4) * Math.PI * 2;
          const ox = bx + Math.cos(cAng) * (s * 1.32);
          const oy = by - s * 0.35 + Math.sin(cAng) * (s * 0.48);
          drawStraightBox3D(ctx, ox, oy, 0, 11, 20, 4, '#e879f9', '#fae8ff', '#090d16', 1.4);
        }
      } else {
        drawStraightBox3D(ctx, bx, hTopY - 2, 0, headW * 0.82, headH * 0.32, 6, '#eab308', '#fef08a', '#090d16', 1.8);
      }

      if (b.archetype !== 'cyber_riot') {
        const eyeY = hTopY + headH * 0.34;
        ctx.fillStyle = '#090d16';
        ctx.fillRect(bx - headW * 0.36, eyeY - 2, headW * 0.26, headH * 0.24);
        ctx.fillRect(bx + headW * 0.10, eyeY - 2, headW * 0.26, headH * 0.24);
        ctx.fillStyle = b.eyeColor || '#ef4444';
        ctx.fillRect(bx - headW * 0.33, eyeY, headW * 0.20, headH * 0.18);
        ctx.fillRect(bx + headW * 0.13, eyeY, headW * 0.20, headH * 0.18);
      }

      ctx.restore();
    }

    // Детализированный 4-моторный самолёт C-130 Hercules (летит снизу вверх как на видео 00:08!)
    function drawDetailedC130Hercules(ctx, x, y) {
      ctx.save();
      ctx.translate(x, y);

      // Тень самолёта на мосту
      drawSoftGroundShadow(ctx, 24, 55, 165, 55, 0.38);

      // Размах крыльев 420px
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;

      // Главные крылья C-130 (трапециевидный профиль)
      ctx.beginPath();
      ctx.moveTo(-210, 6);
      ctx.lineTo(-210, -18);
      ctx.lineTo(-34, -36);
      ctx.lineTo(34, -36);
      ctx.lineTo(210, -18);
      ctx.lineTo(210, 6);
      ctx.lineTo(34, 16);
      ctx.lineTo(-34, 16);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Элероны и расшивка крыльев
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-195, -4, 150, 8);
      ctx.fillRect(45, -4, 150, 8);

      // 4 турбовинтовых двигателя на крыльях с вращающимися пропеллерами и огнями
      const engineXs = [-145, -78, 78, 145];
      for (const ex of engineXs) {
        ctx.fillStyle = '#475569';
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.roundRect(ex - 11, -50, 22, 34, 6);
        ctx.fill();
        ctx.stroke();

        // Жёлтый свет/выхлоп гондолы двигателя
        ctx.fillStyle = 'rgba(250, 204, 21, 0.55)';
        ctx.beginPath();
        ctx.arc(ex, -52, 8, 0, Math.PI * 2);
        ctx.fill();

        // Диск вращающегося винта
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.65)';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(ex, -54, 18, 4.5, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Хвостовое оперение (горизонтальные стабилизаторы)
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(-78, 115);
      ctx.lineTo(-78, 96);
      ctx.lineTo(0, 78);
      ctx.lineTo(78, 96);
      ctx.lineTo(78, 115);
      ctx.lineTo(0, 108);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Массивный фюзеляж C-130 (носом вверх!)
      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(0, -135);
      ctx.quadraticCurveTo(28, -125, 28, -75);
      ctx.lineTo(26, 75);
      ctx.quadraticCurveTo(22, 122, 0, 132);
      ctx.quadraticCurveTo(-22, 122, -26, 75);
      ctx.lineTo(-28, -75);
      ctx.quadraticCurveTo(-28, -125, 0, -135);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Остекление кабины пилотов в носовой части
      ctx.fillStyle = '#090d16';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-16, -98);
      ctx.quadraticCurveTo(0, -112, 16, -98);
      ctx.lineTo(12, -84);
      ctx.quadraticCurveTo(0, -92, -12, -84);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Киль (вертикальный стабилизатор на хвосте)
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-4, 62, 8, 62);

      // Бортовые навигационные огни на законцовках крыльев
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(-208, -6, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(208, -6, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    function drawBridgeWaterAndPiers3D(ctx, canvasWidth, canvasHeight, roadLeft, roadRight) {
      const viewTop = state.cameraY - 260;
      const viewBottom = state.cameraY + canvasHeight + 260;

      // 1. Глубокая вода под мостом
      const waterGrad = ctx.createLinearGradient(0, viewTop, canvasWidth, viewBottom);
      waterGrad.addColorStop(0, '#031024');
      waterGrad.addColorStop(0.5, '#072242');
      waterGrad.addColorStop(1, '#04152d');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(0, viewTop, canvasWidth, viewBottom - viewTop);

      // 2. Анимированные волны на воде слева и справа от моста
      const waveStepY = 64;
      const firstWaveY = Math.floor(viewTop / waveStepY) * waveStepY;
      for (let wy = firstWaveY; wy <= viewBottom; wy += waveStepY) {
        const waveShift = Math.sin(state.timeElapsed * 2.2 + wy * 0.03) * 14;
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.20)';
        ctx.lineWidth = 2.0;

        for (let wx = 12; wx < roadLeft - 28; wx += 78) {
          ctx.beginPath();
          ctx.moveTo(wx + waveShift, wy);
          ctx.quadraticCurveTo(wx + 18 + waveShift, wy - 6, wx + 36 + waveShift, wy);
          ctx.stroke();
        }
        for (let wx = roadRight + 32; wx < canvasWidth - 12; wx += 78) {
          ctx.beginPath();
          ctx.moveTo(wx - waveShift, wy + 16);
          ctx.quadraticCurveTo(wx + 18 - waveShift, wy + 10, wx + 36 - waveShift, wy + 16);
          ctx.stroke();
        }
      }

      // 3. Мягкая тень под краями моста на воде
      ctx.fillStyle = 'rgba(2, 6, 15, 0.65)';
      ctx.fillRect(roadLeft - 24, viewTop, 24, viewBottom - viewTop);
      ctx.fillRect(roadRight, viewTop, 24, viewBottom - viewTop);

      // 4. Бетонные опоры моста с водной пеной
      const pierSpacing = 520;
      const firstPierY = Math.floor(viewTop / pierSpacing) * pierSpacing;
      for (let py = firstPierY; py <= viewBottom; py += pierSpacing) {
        const foamPulse = 1 + Math.sin(state.timeElapsed * 3.5 + py) * 0.12;
        for (const sideX of [roadLeft - 18, roadRight + 18]) {
          ctx.strokeStyle = 'rgba(186, 230, 253, 0.40)';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.ellipse(sideX, py + 42, 24 * foamPulse, 10 * foamPulse, 0, 0, Math.PI * 2);
          ctx.stroke();
          drawStraightBox3D(ctx, sideX, py + 44, 0, 26, 36, 10, '#334155', '#64748b', '#090d16', 1.8);
        }
      }

      // 5. Бетонные бортики моста
      ctx.fillStyle = '#334155';
      ctx.fillRect(roadLeft - 10, viewTop, 10, viewBottom - viewTop);
      ctx.fillRect(roadRight, viewTop, 10, viewBottom - viewTop);
      ctx.strokeStyle = '#090d16';
      ctx.lineWidth = 2;
      ctx.strokeRect(roadLeft - 10, viewTop, 10, viewBottom - viewTop);
      ctx.strokeRect(roadRight, viewTop, 10, viewBottom - viewTop);
    }

    function renderGame(ctx, canvasWidth, canvasHeight) {
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      ctx.save();
      const shakeX = state.screenShake > 0 ? (Math.random() - 0.5) * state.screenShake * 24 : 0;
      const shakeY = state.screenShake > 0 ? (Math.random() - 0.5) * state.screenShake * 24 : 0;
      // Строго прямой вертикальный вид моста без наклона/сдвига, чтобы никогда не укачивало!
      ctx.translate(shakeX, -state.cameraY + shakeY);

      const roadLeft = canvasWidth * 0.14;
      const roadRight = canvasWidth * 0.86;
      const roadWidth = roadRight - roadLeft;
      const viewTop = state.cameraY - 260;
      const viewBottom = state.cameraY + canvasHeight + 260;

      // 1. Вода под мостом и опоры
      drawBridgeWaterAndPiers3D(ctx, canvasWidth, canvasHeight, roadLeft, roadRight);

      // 2. Асфальтовое полотно прямого моста и боковые тротуары
      ctx.fillStyle = '#1b202b';
      ctx.fillRect(roadLeft, viewTop, roadWidth, viewBottom - viewTop);

      ctx.fillStyle = '#262f3f';
      ctx.fillRect(roadLeft, viewTop, 20, viewBottom - viewTop);
      ctx.fillRect(roadRight - 20, viewTop, 20, viewBottom - viewTop);

      const tileSize = 260;
      const firstTile = Math.floor(viewTop / tileSize) * tileSize;
      const lastTile = viewBottom;

      for (let ty = firstTile; ty <= lastTile; ty += tileSize) {
        // Двойная жёлтая осевая линия (как на видео!)
        ctx.fillStyle = '#eab308';
        ctx.fillRect(canvasWidth / 2 - 5.5, ty + 18, 3.5, 130);
        ctx.fillRect(canvasWidth / 2 + 2, ty + 18, 3.5, 130);

        ctx.fillStyle = 'rgba(203, 213, 225, 0.32)';
        ctx.fillRect(roadLeft + roadWidth * 0.25, ty + 40, 3, 72);
        ctx.fillRect(roadLeft + roadWidth * 0.75, ty + 40, 3, 72);

        if (Math.abs(Math.round(ty / tileSize)) % 3 === 0) {
          ctx.fillStyle = 'rgba(241, 245, 249, 0.78)';
          const stripes = 7;
          const stripeW = (roadWidth - 52) / (stripes * 2);
          for (let s = 0; s < stripes; s++) {
            ctx.fillRect(roadLeft + 26 + s * stripeW * 2, ty + 165, stripeW, 34);
          }
          const mDist = Math.max(0, Math.round(-ty / PIXELS_PER_METER));
          ctx.fillStyle = 'rgba(148, 163, 184, 0.45)';
          ctx.font = '900 13px Inter, sans-serif';
          ctx.fillText(`МОСТ • ${mDist} М`, roadLeft + 26, ty + 152);
        }

        // Аккуратные мостовые фонари с мягким тёплым светом (без квадратных кубов на бордюре!)
        for (const lx of [roadLeft + 10, roadRight - 10]) {
          const lGrad = ctx.createRadialGradient(lx, ty + 90, 4, lx, ty + 90, 74);
          lGrad.addColorStop(0, 'rgba(251, 146, 60, 0.22)');
          lGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
          ctx.fillStyle = lGrad;
          ctx.beginPath();
          ctx.arc(lx, ty + 90, 74, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#fde047';
          ctx.strokeStyle = '#090d16';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(lx, ty + 90, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
      }

      // 2.5. Нижняя стартовая граница моста (0 М) позади точки спавна игрока
      if (viewBottom >= 20) {
        const startBarY = 38;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.fillRect(roadLeft - 4, startBarY, roadWidth + 8, 22);
        ctx.strokeRect(roadLeft - 4, startBarY, roadWidth + 8, 22);
        ctx.fillStyle = '#eab308';
        for (let sx = roadLeft + 8; sx < roadRight - 14; sx += 24) {
          ctx.fillRect(sx, startBarY + 3, 12, 16);
        }
        ctx.fillStyle = '#bae6fd';
        ctx.font = '900 11px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🚧 НАЧАЛО МОСТА (0 М) — ДВИГАЙТЕСЬ ВПЕРЁД ⬆️', canvasWidth / 2, startBarY + 36);
        ctx.textAlign = 'left';
      }

      // 3. Детали на асфальте (трещины, пятна, следы шин, мусор, конусы)
      drawProceduralStreetDecals(ctx, canvasHeight);

      // 4. Барьеры арены Босса (верхний и нижний)
      if (state.boss) {
        const barrierY = state.boss.barrierY !== undefined
          ? state.boss.barrierY
          : (-state.boss.kmNumber * 1000 * PIXELS_PER_METER - Math.max(240, Math.round(canvasHeight * 0.58)));
        const barH = 26;
        const blink = Math.sin(state.timeElapsed * 10) > 0;

        ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
        ctx.fillRect(roadLeft, barrierY + 20, roadWidth, 60);
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.fillRect(roadLeft - 4, barrierY + 54, roadWidth + 8, barH);
        ctx.strokeRect(roadLeft - 4, barrierY + 54, roadWidth + 8, barH);

        ctx.fillStyle = '#eab308';
        for (let sx = roadLeft + 10; sx < roadRight - 18; sx += 24) {
          ctx.fillRect(sx, barrierY + 57, 12, barH - 6);
        }

        ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
        ctx.beginPath();
        ctx.arc(roadLeft + 12, barrierY + 48, 8, 0, Math.PI * 2);
        ctx.arc(roadRight - 12, barrierY + 48, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`⛔ ПРОХОД ЗАБЛОКИРОВАН: ПОБЕДИТЕ БОССА ${state.boss.kmNumber} КМ! ⛔`, canvasWidth / 2, barrierY + 44);

        ctx.textAlign = 'left';
      }

      // 5. Воронки от взрывов и лужи сока ПоПиПо / кислоты врагов
      for (const sm of state.scorchMarks) {
        const sGrad = ctx.createRadialGradient(sm.x, sm.y, 4, sm.x, sm.y, sm.halfSide);
        sGrad.addColorStop(0, `rgba(8, 10, 16, ${sm.alpha * 0.65})`);
        sGrad.addColorStop(1, 'rgba(8, 10, 16, 0)');
        ctx.fillStyle = sGrad;
        ctx.beginPath();
        ctx.arc(sm.x, sm.y, sm.halfSide, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const pool of state.acidPools) {
        ctx.save();
        if (pool.isHealingZone) {
          // Изумрудная зона исцеления «ПоПиПо» с пакетиками овощного сока и крестиками +HP
          ctx.fillStyle = 'rgba(74, 222, 128, 0.16)';
          ctx.strokeStyle = 'rgba(74, 222, 128, 0.55)';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.arc(pool.x, pool.y, pool.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Пакетик сока PoPiPo в центре зоны
          ctx.fillStyle = '#22c55e';
          ctx.strokeStyle = '#052e16';
          ctx.lineWidth = 1.5;
          ctx.fillRect(pool.x - 8, pool.y - 11, 16, 22);
          ctx.strokeRect(pool.x - 8, pool.y - 11, 16, 22);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(pool.x + 2, pool.y - 17, 2.5, 6);

          // Всплывающие крестики исцеления
          for (let hIdx = 0; hIdx < 3; hIdx++) {
            const ha = state.timeElapsed * 1.6 + (hIdx * Math.PI * 2) / 3;
            const hx = pool.x + Math.cos(ha) * (pool.radius * 0.55);
            const hy = pool.y + Math.sin(ha) * (pool.radius * 0.55);
            ctx.fillStyle = 'rgba(187, 247, 208, 0.72)';
            ctx.fillRect(hx - 2, hy - 6, 4, 12);
            ctx.fillRect(hx - 6, hy - 2, 12, 4);
          }
        } else {
          ctx.fillStyle = 'rgba(132, 204, 22, 0.36)';
          ctx.beginPath();
          ctx.arc(pool.x, pool.y, pool.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.48)';
          ctx.lineWidth = 6;
          ctx.stroke();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3;
          ctx.stroke();
        }
        ctx.restore();
      }

      // 6. Латунные гильзы и кристаллы опыта (как на видео!)
      ctx.save();
      ctx.fillStyle = '#facc15';
      for (const c of state.shellCasings) {
        ctx.fillRect(c.x - 2, c.y - 1, 4, 2);
      }
      ctx.restore();

      for (const xp of state.xpParticles) {
        const s = xp.size;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
        ctx.fillRect(xp.x - s / 2 + 1, xp.y - s / 2 + 1.5, s, s);
        ctx.fillStyle = xp.color;
        ctx.fillRect(xp.x - s / 2, xp.y - s / 2, s, s);
        ctx.strokeStyle = '#14532d';
        ctx.lineWidth = 1;
        ctx.strokeRect(xp.x - s / 2, xp.y - s / 2, s, s);
      }

      // 7. Тактический круг и гексагональный купол «Дива-Щит» вокруг героини
      const p = state.player;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.26)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(p.x, p.y + 4, 44, 0, Math.PI * 2);
      ctx.stroke();

      if (p.shieldTimer > 0) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = 'rgba(103, 232, 249, 0.16)';
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let h = 0; h < 6; h++) {
          const ha = state.timeElapsed * 2 + (h * Math.PI) / 3;
          const hx = Math.cos(ha) * 42;
          const hy = Math.sin(ha) * 42;
          if (h === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }

      // 8. Послойная отрисовка всех объектов, зомби, боссов, турелей, плюшек и героини по координате Y
      const renderQueue3D = [];
      for (let i = 0; i < state.streetObstacles.length; i++) {
        const obs = state.streetObstacles[i];
        if (!obs.destroyed && obs.y >= viewTop && obs.y <= viewBottom) {
          renderQueue3D.push({ sortY: obs.y, kind: 'obstacle', ref: obs });
        }
      }
      for (let i = 0; i < state.turrets.length; i++) {
        const t = state.turrets[i];
        renderQueue3D.push({ sortY: t.y, kind: 'turret', ref: t });
      }
      for (let i = 0; i < state.zombies.length; i++) {
        const z = state.zombies[i];
        if (z.y >= viewTop && z.y <= viewBottom) {
          renderQueue3D.push({ sortY: z.y, kind: 'zombie', ref: z });
        }
      }
      if (state.boss) {
        renderQueue3D.push({ sortY: state.boss.y, kind: 'boss', ref: state.boss });
      }
      renderQueue3D.push({ sortY: p.y, kind: 'player', ref: p });
      for (let i = 0; i < state.plushPets.length; i++) {
        const pet = state.plushPets[i];
        renderQueue3D.push({ sortY: pet.y, kind: 'plush', ref: pet });
      }

      renderQueue3D.sort((a, b) => a.sortY - b.sortY);

      for (let i = 0; i < renderQueue3D.length; i++) {
        const item = renderQueue3D[i];
        if (item.kind === 'obstacle') {
          drawSingle3DStreetObstacle(ctx, item.ref);
        } else if (item.kind === 'turret') {
          const t = item.ref;
          ctx.save();
          drawSoftGroundShadow(ctx, t.x, t.y + 10, 15, 7.5, 0.45);
          ctx.translate(t.x, t.y);
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = '#60a5fa';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(-11, -11, 22, 22, 5);
          ctx.fill();
          ctx.stroke();
          ctx.rotate((t.aimAngle !== undefined ? t.aimAngle : -Math.PI / 2) + Math.PI / 2);
          // Лазерный целеуказатель турели
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(0, -18);
          ctx.lineTo(0, -65);
          ctx.stroke();
          ctx.fillStyle = '#93c5fd';
          ctx.fillRect(-4.5, -19, 3.5, 14);
          ctx.fillRect(1, -19, 3.5, 14);
          ctx.restore();
        } else if (item.kind === 'zombie') {
          drawPixelZombieVariety(ctx, item.ref);
        } else if (item.kind === 'boss') {
          drawGiantBossZombie(ctx, item.ref);
        } else if (item.kind === 'player') {
          if (p.overdriveTimer > 0) {
            ctx.save();
            ctx.globalAlpha = 0.90;
            const otherTwo = ['teto', 'miku', 'neru'].filter(id => id !== selectedSkinId);
            const tbWalk = (Math.abs(p.walkFrame % 1) > 0.001) ? p.walkFrame : (state.timeElapsed * 2.2);
            drawPixelHeroine(ctx, p.x - 46, p.y + 8, otherTwo[0], tbWalk + 0.35, 1.0, 1.35);
            drawPixelHeroine(ctx, p.x + 46, p.y + 8, otherTwo[1], tbWalk + 0.70, 1.0, 2.75);
            ctx.restore();
          }
          drawPixelHeroine(ctx, p.x, p.y, selectedSkinId, p.walkFrame, 1.15, 0.0);
          drawAllEquippedWeapons(ctx, p);
          drawSpinningLeeksAura(ctx);
          drawOrbitingDrones(ctx);
        } else if (item.kind === 'plush') {
          drawPlushieTetoPhotoSprite(ctx, item.ref);
        }
      }

      // 9. ИНДИВИДУАЛЬНАЯ ОТРИСОВКА СНАРЯДОВ ВСЕХ 10 ОРУЖИЙ (Каждое оружие выглядит уникально!)
      ctx.save();
      for (const b of state.bullets) {
        if (b.isBaguetteRocket) {
          // 1. Багетная Базука РПГ-7: летящий запечённый багет с реактивной струёй
          const sc = Math.max(1, (b.radius || 7) / 6.5);
          drawDetailedBaguetteSprite(ctx, b.x, b.y, Math.atan2(b.vy, b.vx), sc, true);
        } else if (b.isPlasmaOrb || b.weaponId === 'plasma_rail') {
          // 2. Плазменный Рельсотрон «Дива»: фиолетовая сфера с электрическими дугами вокруг ядра
          ctx.save();
          ctx.translate(b.x, b.y);
          const r = Math.max(6, b.radius * 1.25);
          ctx.fillStyle = 'rgba(192, 132, 252, 0.38)';
          ctx.beginPath();
          ctx.arc(0, 0, r * 1.7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#c084fc';
          ctx.beginPath();
          ctx.arc(0, 0, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#e879f9';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(0, 0, r * 1.35, state.timeElapsed * 12, state.timeElapsed * 12 + Math.PI * 1.2);
          ctx.stroke();
          ctx.restore();
        } else if (b.isBeamShot) {
          // 3. Парные Снайперки «Синий Луч» и лазеры дронов: мощный лазерный луч с белой сердцевиной
          const bw = (b.weaponId === 'dual_sniper' ? 7.5 : 4.5) * (b.beamWidthScale || 1.0);
          ctx.save();
          ctx.strokeStyle = b.color || '#38bdf8';
          ctx.globalAlpha = 0.45;
          ctx.lineWidth = bw * 2.1;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.x - b.vx * 0.065, b.y - b.vy * 0.065);
          ctx.stroke();

          ctx.globalAlpha = 0.90;
          ctx.lineWidth = bw;
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = bw * 0.45;
          ctx.stroke();
          ctx.restore();
        } else if (b.weaponId === 'dual_ar') {
          // 4. Парные Автоматы Акимбо (как на видео 00:06-00:07): длинные неоново-розовые и жёлтые лазерные трассеры!
          ctx.save();
          ctx.strokeStyle = '#f43f5e';
          ctx.lineWidth = 5.5;
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.x - b.vx * 0.042, b.y - b.vy * 0.042);
          ctx.stroke();
          ctx.strokeStyle = '#fef08a';
          ctx.lineWidth = 2.4;
          ctx.stroke();
          ctx.restore();
        } else if (b.weaponId === 'shotgun') {
          // 5. Дробовик SPAS-12 «Дракон»: зажигательная картечь с огненным хвостом
          ctx.save();
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius * 1.35, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius * 0.7, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (b.weaponId === 'ak47') {
          // 6. Автомат АК-47: тяжёлые бронебойные пули 7.62 с огненным конусом
          ctx.save();
          ctx.strokeStyle = '#fb923c';
          ctx.lineWidth = 4.2;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.x - b.vx * 0.032, b.y - b.vy * 0.032);
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius * 0.85, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          // 7. Пистолет M1911, ПП MP5 «Шквал», Миниган и Турели: чёткие светящиеся трассеры (как на видео 00:05!)
          ctx.save();
          ctx.strokeStyle = b.color || '#fef08a';
          ctx.lineWidth = b.radius * 1.4;
          ctx.globalAlpha = 0.82;
          ctx.beginPath();
          ctx.moveTo(b.x, b.y);
          ctx.lineTo(b.x - b.vx * 0.028, b.y - b.vy * 0.028);
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(b.x, b.y, b.radius * 0.75, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
      ctx.restore();

      // 10. ВРАЩАЮЩИЙСЯ МЕГА-ЛУЧ «ДИВА» (Точно как на видео 00:10: неоновый бирюзовый + неоновый розовый гипер-лучи с белым ядром и звёздочками!)
      for (const rb of state.rotatingBeams) {
        ctx.save();
        ctx.globalAlpha = 0.42; // Полупрозрачный Вращающийся Мега-Луч «Дива»
        ctx.translate(p.x, p.y - 4);
        const angles = [
          { ang: rb.currentAngle, outer: 'rgba(244, 63, 94, 0.28)', mid: 'rgba(255, 42, 133, 0.62)' },
          { ang: rb.currentAngle + Math.PI / 2, outer: 'rgba(34, 211, 238, 0.28)', mid: 'rgba(0, 242, 254, 0.62)' }
        ];
        for (const item of angles) {
          ctx.save();
          ctx.rotate(item.ang);
          // Полупрозрачный неоновый ореол
          ctx.strokeStyle = item.outer;
          ctx.lineWidth = rb.beamWidth * 2.5;
          ctx.beginPath();
          ctx.moveTo(-rb.beamLength, 0);
          ctx.lineTo(rb.beamLength, 0);
          ctx.stroke();

          // Полупрозрачный средний слой луча
          ctx.strokeStyle = item.mid;
          ctx.lineWidth = rb.beamWidth * 1.35;
          ctx.beginPath();
          ctx.moveTo(-rb.beamLength, 0);
          ctx.lineTo(rb.beamLength, 0);
          ctx.stroke();

          // Полупрозрачное белое центральное ядро луча
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.68)';
          ctx.lineWidth = rb.beamWidth * 0.52;
          ctx.beginPath();
          ctx.moveTo(-rb.beamLength, 0);
          ctx.lineTo(rb.beamLength, 0);
          ctx.stroke();

          // Искры-звёздочки вдоль мега-луча (как на 00:10 в видео!)
          for (let dist = -360; dist <= 360; dist += 120) {
            const offset = ((state.timeElapsed * 260 + dist) % 360);
            drawFourPointStar(ctx, offset, Math.sin(state.timeElapsed * 14 + dist) * 10, 9, '#ffffff', 0.22, state.timeElapsed * 3);
          }
          ctx.restore();
        }
        // Центральная вспышка-звезда на героине
        drawFourPointStar(ctx, 0, 0, 26, '#ffffff', 0.25, state.timeElapsed * 5);
        ctx.restore();
      }

      // 11. ЗРЕЛИЩНЫЕ ВИЗУАЛЬНЫЕ ЭФФЕКТЫ ВСЕХ 20 СПОСОБНОСТЕЙ И ВЗРЫВОВ (Как на видео 00:08-00:11!)
      for (const fx of state.visualEffects) {
        const progress = Math.max(0, Math.min(1, 1 - fx.timer / Math.max(0.001, fx.maxTimer)));

        if (fx.type === 'hit_star_spark') {
          drawFourPointStar(ctx, fx.x, fx.y, fx.size * (1 - progress * 0.4), fx.color || '#67e8f9', 0.22, progress * 1.5);
          drawFourPointStar(ctx, fx.x, fx.y, fx.size * 0.55, '#ffffff', 0.22, progress * 1.5);
        } else if (fx.type === 'incoming_projectile') {
          // Летящие в точку удара снаряды: Метеорит (meteor), Багет Катюши (baguette_shell), Авиабомба C-130 (c130_bomb)
          const curX = fx.startX + (fx.targetX - fx.startX) * progress;
          const curY = fx.startY + (fx.targetY - fx.startY) * progress;

          // Прицельный круг на земле в точке будущего удара
          ctx.save();
          const bh = fx.blastHalf || 68;
          ctx.strokeStyle = fx.projType === 'baguette_shell' ? 'rgba(251, 191, 36, 0.65)' : 'rgba(239, 68, 68, 0.65)';
          ctx.fillStyle = fx.projType === 'baguette_shell' ? 'rgba(251, 191, 36, 0.12)' : 'rgba(239, 68, 68, 0.12)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(fx.targetX, fx.targetY, bh * 0.85, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          if (fx.projType === 'meteor') {
            // Огненный Метеорит с длинным пылающим кометным хвостом (как на видео 00:11!)
            const tailAng = Math.atan2(fx.targetY - fx.startY, fx.targetX - fx.startX);
            ctx.save();
            ctx.translate(curX, curY);
            ctx.rotate(tailAng);
            const tailGrad = ctx.createLinearGradient(-160, 0, 15, 0);
            tailGrad.addColorStop(0, 'rgba(239, 68, 68, 0)');
            tailGrad.addColorStop(0.5, 'rgba(249, 115, 22, 0.72)');
            tailGrad.addColorStop(1, 'rgba(254, 240, 138, 0.95)');
            ctx.fillStyle = tailGrad;
            ctx.beginPath();
            ctx.moveTo(-165, -24);
            ctx.lineTo(12, -16);
            ctx.arc(12, 0, 16, -Math.PI / 2, Math.PI / 2);
            ctx.lineTo(-165, 24);
            ctx.closePath();
            ctx.fill();

            // Раскалённое ядро метеорита
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(8, 0, 11, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          } else if (fx.projType === 'baguette_shell') {
            // Прилетающий по высокой баллистической параболе гигантский реактивный БАГЕТ для Багетной Катюши!
            const arcZ = Math.sin(progress * Math.PI) * 165;
            const prevP = Math.max(0, progress - 0.05);
            const prevX = fx.startX + (fx.targetX - fx.startX) * prevP;
            const prevY = fx.startY + (fx.targetY - fx.startY) * prevP - Math.sin(prevP * Math.PI) * 165;
            const bagAngle = Math.atan2((curY - arcZ) - prevY, curX - prevX);

            drawSoftGroundShadow(ctx, curX, curY, 14 * (1 - arcZ / 300), 6 * (1 - arcZ / 300), 0.38);
            drawDetailedBaguetteSprite(ctx, curX, curY - arcZ, bagAngle, 1.55, true);
          } else if (fx.projType === 'c130_bomb') {
            // Падающая фугасная авиабомба с оперением
            ctx.save();
            ctx.translate(curX, curY);
            ctx.fillStyle = '#334155';
            ctx.strokeStyle = '#090d16';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.ellipse(0, 0, 7, 14, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-5, 4, 10, 3);
            ctx.restore();
          }
          ctx.restore();
        } else if (fx.type === 'water_splash') {
          ctx.save();
          const r = fx.radius * (0.35 + progress * 0.85);
          ctx.strokeStyle = `rgba(186, 230, 253, ${Math.max(0, 1 - progress)})`;
          ctx.lineWidth = 3.5 * (1 - progress);
          ctx.beginPath();
          ctx.ellipse(fx.x, fx.y, r, r * 0.48, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else if (fx.type === 'voxel_splat') {
          ctx.save();
          ctx.globalAlpha = 0.72;
          ctx.fillStyle = fx.color;
          ctx.fillRect(fx.x - fx.size / 2, fx.y - fx.size / 2, fx.size, fx.size);
          ctx.restore();
        } else if (fx.type === 'muzzle_flash') {
          drawFourPointStar(ctx, fx.x, fx.y, 14, '#fef08a', 0.28, state.timeElapsed * 8);
          drawFourPointStar(ctx, fx.x, fx.y, 8, '#ffffff', 0.28, state.timeElapsed * 8);
        } else if (fx.type === 'square_target_zone') {
          ctx.strokeStyle = 'rgba(249, 115, 22, 0.48)';
          ctx.fillStyle = 'rgba(249, 115, 22, 0.08)';
          ctx.lineWidth = 2;
          const hs = fx.halfSide;
          ctx.fillRect(fx.x - hs, fx.y - hs, hs * 2, hs * 2);
          ctx.strokeRect(fx.x - hs, fx.y - hs, hs * 2, hs * 2);
        } else if (fx.type === 'square_explosion' || fx.type === 'explosion') {
          // ЭФФЕКТНЫЕ МНОГОСЛОЙНЫЕ ВЗРЫВЫ С БЕЛЫМ ЯДРОМ И УДАРНОЙ ВОЛНОЙ (Точно как на видео 00:09 и 00:11!)
          const maxR = fx.type === 'square_explosion' ? fx.halfSide * 1.15 : fx.radius;
          const curR = maxR * (0.45 + progress * 0.65);
          const alpha = Math.max(0, 1 - progress);

          ctx.save();
          // 1. Внешнее огненное свечение
          const expGrad = ctx.createRadialGradient(fx.x, fx.y, curR * 0.1, fx.x, fx.y, curR * 1.15);
          expGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.95})`);
          expGrad.addColorStop(0.32, `rgba(254, 240, 138, ${alpha * 0.88})`);
          expGrad.addColorStop(0.68, `rgba(249, 115, 22, ${alpha * 0.65})`);
          expGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
          ctx.fillStyle = expGrad;
          ctx.beginPath();
          ctx.arc(fx.x, fx.y, curR * 1.15, 0, Math.PI * 2);
          ctx.fill();

          // 2. Расширяющееся тонкое белое кольцо ударной волны (как на 00:09 в видео!)
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
          ctx.lineWidth = Math.max(1.5, 4 * (1 - progress));
          ctx.beginPath();
          ctx.arc(fx.x, fx.y, maxR * (0.55 + progress * 0.65), 0, Math.PI * 2);
          ctx.stroke();

          // 3. Звёздная вспышка в эпицентре (или кристаллы снежинок для Ледникового Шторма Снежной Мику #38bdf8!)
          if (fx.color === '#38bdf8') {
            ctx.strokeStyle = '#e0f2fe';
            ctx.lineWidth = 2.5 * (1 - progress);
            for (let sp = 0; sp < 6; sp++) {
              const sa = (sp * Math.PI) / 3 + progress * 1.5;
              ctx.beginPath();
              ctx.moveTo(fx.x, fx.y);
              ctx.lineTo(fx.x + Math.cos(sa) * curR * 0.9, fx.y + Math.sin(sa) * curR * 0.9);
              ctx.stroke();
            }
          } else if (progress < 0.45) {
            drawFourPointStar(ctx, fx.x, fx.y, curR * 0.75, '#ffffff', 0.22, progress * 3);
          }
          ctx.restore();
        } else if (fx.type === 'shockwave_ring') {
          ctx.save();
          const curR = fx.maxRadius * progress;
          ctx.globalAlpha = Math.max(0, 1 - progress);
          ctx.strokeStyle = fx.color;
          ctx.lineWidth = 4.5 * (1 - progress);
          ctx.beginPath();
          ctx.arc(fx.x, fx.y, curR, 0, Math.PI * 2);
          ctx.stroke();

          // Если это Сверхзвуковой Бас-Дроп Мику (#22d3ee) — рисуем эквалайзер и музыкальные ноты!
          if (fx.color === '#22d3ee') {
            for (let b = 0; b < 16; b++) {
              const ba = (b / 16) * Math.PI * 2 + progress * 2;
              const barLen = 10 + (b % 3) * 8;
              ctx.beginPath();
              ctx.moveTo(fx.x + Math.cos(ba) * (curR - barLen), fx.y + Math.sin(ba) * (curR - barLen));
              ctx.lineTo(fx.x + Math.cos(ba) * (curR + barLen), fx.y + Math.sin(ba) * (curR + barLen));
              ctx.stroke();
            }
          }
          ctx.restore();
        } else if (fx.type === 'laser_line') {
          // Зигзагообразная цепная молния Телефона Неро с бело-золотым свечением!
          ctx.save();
          ctx.globalAlpha = Math.max(0, 1 - progress * 0.7);
          const midX = (fx.x1 + fx.x2) * 0.5 + (Math.random() - 0.5) * 22;
          const midY = (fx.y1 + fx.y2) * 0.5 + (Math.random() - 0.5) * 22;
          ctx.strokeStyle = fx.color || '#facc15';
          ctx.lineWidth = fx.width * 1.8;
          ctx.beginPath();
          ctx.moveTo(fx.x1, fx.y1);
          ctx.lineTo(midX, midY);
          ctx.lineTo(fx.x2, fx.y2);
          ctx.stroke();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = fx.width * 0.65;
          ctx.stroke();
          drawFourPointStar(ctx, fx.x2, fx.y2, 11, '#fef08a', 0.25, progress * 4);
          ctx.restore();
        } else if (fx.type === 'c130_plane') {
          drawDetailedC130Hercules(ctx, fx.x, fx.y);
        } else if (fx.type === 'orbital_beam') {
          const bLen = fx.beamLength || 320;
          const halfLen = bLen * 0.5;
          const r = fx.radius || 54;
          ctx.save();
          const beamGrad = ctx.createLinearGradient(fx.x - r, fx.y, fx.x + r, fx.y);
          beamGrad.addColorStop(0, 'rgba(244, 63, 94, 0)');
          beamGrad.addColorStop(0.25, 'rgba(244, 63, 94, 0.55)');
          beamGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.92)');
          beamGrad.addColorStop(0.75, 'rgba(244, 63, 94, 0.55)');
          beamGrad.addColorStop(1, 'rgba(244, 63, 94, 0)');
          ctx.fillStyle = beamGrad;
          ctx.fillRect(fx.x - r, fx.y - halfLen, r * 2, bLen);

          // Спутниковые кольца захвата цели на концах луча УТАУ
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.ellipse(fx.x, fx.y, r * 0.85, 16, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else if (fx.type === 'drill_vortex') {
          ctx.save();
          ctx.globalAlpha = 0.65;
          ctx.translate(state.player.x, state.player.y);
          const numDrills = fx.drillCount || 2;
          const curRad = fx.radius * (0.35 + 0.65 * Math.sin(progress * Math.PI));
          const baseSpin = progress * Math.PI * 5;

          ctx.strokeStyle = 'rgba(244, 63, 94, 0.48)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, curRad * 0.78, 0, Math.PI * 2);
          ctx.stroke();

          for (let d = 0; d < numDrills; d++) {
            const dAng = baseSpin + (d / numDrills) * Math.PI * 2;
            ctx.save();
            ctx.rotate(dAng);
            ctx.translate(curRad * 0.48, 0);
            ctx.rotate(Math.PI / 2);

            const segs = 5;
            const drillLen = Math.max(44, fx.radius * 0.54);
            for (let s = 0; s < segs; s++) {
              const tSeg = s / segs;
              const segW = (1 - tSeg * 0.72) * (drillLen * 0.42);
              const segH = drillLen / segs;
              const sy = -drillLen * 0.45 + s * segH;

              ctx.fillStyle = s % 2 === 0 ? '#e11d48' : '#be123c';
              ctx.strokeStyle = '#090d16';
              ctx.lineWidth = 1.8;
              ctx.beginPath();
              ctx.ellipse(0, sy, segW, segH * 0.62, 0.15, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            }
            ctx.restore();
          }
          ctx.restore();
        } else if (fx.type === 'black_hole') {
          ctx.save();
          const bhR = Math.min(280, (fx.radius || 660) * 0.35);
          const bhGrad = ctx.createRadialGradient(fx.x, fx.y, 12, fx.x, fx.y, bhR);
          bhGrad.addColorStop(0, '#000000');
          bhGrad.addColorStop(0.35, 'rgba(88, 28, 135, 0.85)');
          bhGrad.addColorStop(0.75, 'rgba(192, 132, 252, 0.32)');
          bhGrad.addColorStop(1, 'rgba(192, 132, 252, 0)');
          ctx.fillStyle = bhGrad;
          ctx.beginPath();
          ctx.arc(fx.x, fx.y, bhR, 0, Math.PI * 2);
          ctx.fill();

          // Вращающиеся спиральные рукава аккреционного диска Чёрной Дыры
          ctx.strokeStyle = '#e879f9';
          ctx.lineWidth = 2.8;
          for (let arm = 0; arm < 3; arm++) {
            const a0 = state.timeElapsed * 4 + (arm * Math.PI * 2) / 3;
            ctx.beginPath();
            ctx.arc(fx.x, fx.y, 58, a0, a0 + 1.3);
            ctx.stroke();
          }
          ctx.restore();
        } else if (fx.type === 'napalm_burn_zone') {
          ctx.save();
          const hs = fx.halfSide || 140;
          ctx.fillStyle = 'rgba(249, 115, 22, 0.16)';
          ctx.strokeStyle = 'rgba(253, 224, 71, 0.55)';
          ctx.lineWidth = 2.4;
          ctx.fillRect(fx.x - hs, fx.y - hs, hs * 2, hs * 2);
          ctx.strokeRect(fx.x - hs, fx.y - hs, hs * 2, hs * 2);

          // Языки пламени по периметру Термитного Кольца
          ctx.fillStyle = 'rgba(251, 146, 60, 0.65)';
          for (let f = -hs + 20; f <= hs - 20; f += 45) {
            const fh = 10 + Math.sin(state.timeElapsed * 14 + f) * 5;
            ctx.beginPath();
            ctx.arc(fx.x + f, fx.y - hs, fh, 0, Math.PI * 2);
            ctx.arc(fx.x + f, fx.y + hs, fh, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        } else if (fx.type === 'magnet_rect_pulse') {
          ctx.save();
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.68)';
          ctx.fillStyle = 'rgba(52, 211, 153, 0.12)';
          ctx.lineWidth = 2.8;
          ctx.fillRect(fx.x - fx.halfWidth, fx.y - fx.halfHeight, fx.halfWidth * 2, fx.halfHeight * 2);
          ctx.strokeRect(fx.x - fx.halfWidth, fx.y - fx.halfHeight, fx.halfWidth * 2, fx.halfHeight * 2);
          // Крупная иконка магнита в центре импульса притяжения
          ctx.font = '26px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('🧲', state.player.x, state.player.y - 42 - progress * 16);
          ctx.textAlign = 'left';
          ctx.restore();
        } else if (fx.type === 'boss_hazard_zone') {
          ctx.save();
          const r = fx.radius || 75;
          const fillRatio = Math.max(0, Math.min(1, progress));
          ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
          ctx.beginPath();
          ctx.arc(fx.x, fx.y, r, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(239, 68, 68, 0.36)';
          ctx.beginPath();
          ctx.arc(fx.x, fx.y, r * fillRatio, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(fx.x, fx.y, r, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeStyle = '#fde047';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(fx.x - 12, fx.y);
          ctx.lineTo(fx.x + 12, fx.y);
          ctx.moveTo(fx.x, fx.y - 12);
          ctx.lineTo(fx.x, fx.y + 12);
          ctx.stroke();
          ctx.restore();
        } else if (fx.type === 'boss_laser_sweep') {
          ctx.save();
          ctx.translate(fx.x, fx.y);
          const curAng = fx.startAngle + fx.totalSweep * progress;
          const isFiring = progress >= 0.25;
          const count = fx.beamCount || 2;
          const bLen = fx.beamLength || 650;
          const bWidth = fx.beamWidth || 18;
          for (let bIdx = 0; bIdx < count; bIdx++) {
            ctx.save();
            ctx.rotate(curAng + (bIdx / count) * Math.PI);
            if (!isFiring) {
              ctx.strokeStyle = 'rgba(239, 68, 68, 0.78)';
              ctx.setLineDash([12, 8]);
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(-bLen, 0);
              ctx.lineTo(bLen, 0);
              ctx.stroke();
            } else {
              ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
              ctx.lineWidth = bWidth * 1.6;
              ctx.beginPath();
              ctx.moveTo(-bLen, 0);
              ctx.lineTo(bLen, 0);
              ctx.stroke();
              ctx.strokeStyle = fx.color || '#ef4444';
              ctx.lineWidth = bWidth;
              ctx.beginPath();
              ctx.moveTo(-bLen, 0);
              ctx.lineTo(bLen, 0);
              ctx.stroke();
              ctx.strokeStyle = '#fef08a';
              ctx.lineWidth = bWidth * 0.35;
              ctx.beginPath();
              ctx.moveTo(-bLen, 0);
              ctx.lineTo(bLen, 0);
              ctx.stroke();
            }
            ctx.restore();
          }
          ctx.restore();
        } else if (fx.type === 'road_roller') {
          // Детализированный Дорожный Каток «Неро» с вращающимся стальным валом и фарами
          ctx.save();
          const hw = fx.halfWidth || 55;
          drawSoftGroundShadow(ctx, fx.x, fx.y + 8, hw * 1.08, 48, 0.55);
          ctx.translate(fx.x, fx.y);

          // Вращающийся передний стальной барабан катка
          ctx.fillStyle = '#64748b';
          ctx.strokeStyle = '#090d16';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.roundRect(-hw * 1.04, -64, hw * 2.08, 30, 5);
          ctx.fill();
          ctx.stroke();

          // Полосы вращения на барабане
          const drumOffset = ((state.timeElapsed * 140) % 14);
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 1.6;
          for (let dy = -60 + drumOffset; dy < -36; dy += 12) {
            ctx.beginPath();
            ctx.moveTo(-hw, dy);
            ctx.lineTo(hw, dy);
            ctx.stroke();
          }

          // Жёлтый бронированный корпус катка
          ctx.fillStyle = '#eab308';
          ctx.strokeStyle = '#090d16';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.roundRect(-hw, -34, hw * 2, 78, 6);
          ctx.fill();
          ctx.stroke();

          // Кабина водителя и выхлопная труба
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-hw * 0.65, -12, hw * 1.3, 42);
          ctx.strokeRect(-hw * 0.65, -12, hw * 1.3, 42);
          ctx.restore();
        }
      }

      // 12. Снаряды врагов (с чёткой красной обводкой!)
      for (const ep of state.enemyProjectiles) {
        ctx.save();
        ctx.fillStyle = 'rgba(239, 68, 68, 0.32)';
        ctx.beginPath();
        ctx.arc(ep.x, ep.y, ep.radius + 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = ep.color || '#a3e635';
        ctx.beginPath();
        ctx.arc(ep.x, ep.y, ep.radius + 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2.8;
        ctx.stroke();
        ctx.restore();
      }

      // 13. Всплывающие числа урона
      ctx.font = '900 11px Inter, sans-serif';
      for (const dn of state.damageNumbers) {
        ctx.strokeStyle = '#090d16';
        ctx.lineWidth = 2.5;
        ctx.strokeText(dn.text, dn.x, dn.y);
        ctx.fillStyle = dn.color;
        ctx.fillText(dn.text, dn.x, dn.y);
      }

      ctx.restore();
    }

    function renderCutinBanner() {
      const canvas = document.getElementById('cutinCanvas');
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const w = canvas.width;
      const h = canvas.height;

      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      const artImg = document.getElementById(state.cutinArtId || SKINS[selectedSkinId].cutinImgId);
      if (artImg && artImg.complete && artImg.naturalWidth > 0) {
        ctx.drawImage(artImg, 0, 0, w, h);
      }

      ctx.strokeStyle = 'rgba(255,255,255,0.18)';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 6; i++) {
        const y = ((i * 13 + state.timeElapsed * 55) % h);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y - 6);
        ctx.stroke();
      }
    }
