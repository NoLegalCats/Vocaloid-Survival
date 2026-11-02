#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
build_mobile.py — Автоматический компилятор мобильной версии игры в один HTML-файл:
  Vocaloid_Survival_Mobile.html

Что делает скрипт:
  1. Берёт актуальные файлы ПК-версии (play.html, css/styles.css, config/balance.json, js/*.js, images/*).
  2. НЕ добавляет папку music/ и music/playlist.js (музыка исключена из мобильной сборки).
  3. Автоматически сжимает все изображения из папки images/ (и встроенные PNG/JPEG) через Pillow (PIL)
     для уменьшения веса файла и быстрой загрузки на смартфонах.
  4. Встраивает мобильную адаптацию интерфейса (крупный сенсорный джойстик слева внизу, большая кнопка
     рывка ⚡ ДЕШ справа внизу, компактная верхняя панель без музыкального плеера, кнопка показа/скрытия
     таблицы статов 📊, удобная прокрутка карточек прокачки и выбора героини на экранах телефонов).
  5. Сохраняет готовый файл Vocaloid_Survival_Mobile.html (ПК-версия play.html остаётся без изменений).
"""

import base64
import io
import json
import os
import re
import sys

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
OUTPUT_FILENAME = "Vocaloid_Survival_Mobile.html"


def compress_image_bytes(raw_bytes, ext_or_mime, is_hero_sprite=False, is_cutin=False):
    """Сжимает изображение для мобильной версии, сохраняя прозрачность для PNG-спрайтов."""
    if not HAS_PIL:
        mime = "image/png" if "png" in ext_or_mime.lower() else "image/jpeg"
        return mime, base64.b64encode(raw_bytes).decode("ascii")

    try:
        img = Image.open(io.BytesIO(raw_bytes))
        is_png = ("png" in ext_or_mime.lower()) or (img.mode in ("RGBA", "LA") or "transparency" in img.info)

        if is_png:
            img = img.convert("RGBA")
            if is_hero_sprite:
                # Сжимаем спрайт-лист героини с сохранением пропорций кадров и альфа-канала
                w, h = img.size
                if w > 960:
                    scale = 960.0 / w
                    img = img.resize((int(round(w * scale)), int(round(h * scale))), Image.Resampling.LANCZOS)
            # Квантизация RGBA до 128 цветов даёт ~60-70% сжатия PNG без потери читаемости пиксель-арта
            quantized = img.quantize(colors=128, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
            out = io.BytesIO()
            quantized.save(out, format="PNG", optimize=True, compress_level=9)
            return "image/png", base64.b64encode(out.getvalue()).decode("ascii")
        else:
            img = img.convert("RGB")
            w, h = img.size
            max_dim = 200 if is_cutin else 128
            if max(w, h) > max_dim:
                scale = float(max_dim) / float(max(w, h))
                img = img.resize((max(1, int(round(w * scale))), max(1, int(round(h * scale)))), Image.Resampling.LANCZOS)
            out = io.BytesIO()
            img.save(out, format="JPEG", quality=68, optimize=True, progressive=True)
            return "image/jpeg", base64.b64encode(out.getvalue()).decode("ascii")
    except Exception:
        mime = "image/png" if "png" in ext_or_mime.lower() else "image/jpeg"
        return mime, base64.b64encode(raw_bytes).decode("ascii")


def compress_data_uri(data_uri):
    m = re.match(r"^data:(image/[a-zA-Z0-9+.-]+);base64,(.+)$", data_uri, re.S)
    if not m:
        return data_uri
    mime, b64_data = m.group(1), m.group(2)
    try:
        raw = base64.b64decode(b64_data)
        new_mime, new_b64 = compress_image_bytes(raw, mime, is_hero_sprite=(len(raw) > 80000))
        return f"data:{new_mime};base64,{new_b64}"
    except Exception:
        return data_uri


MOBILE_CSS_OVERRIDES = """
/* === АВТОМАТИЧЕСКАЯ МОБИЛЬНАЯ АДАПТАЦИЯ ИНТЕРФЕЙСА (Vocaloid_Survival_Mobile.html) === */
html, body {
  touch-action: none;
  overscroll-behavior: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-touch-callout: none;
}

/* Скрываем элементы папки music/ в мобильной однофайловой версии */
#btnConnectMusicFolder,
#btnNextMusicTrack,
#musicTrackStatusLabel,
#btnHudConnectMusic,
#btnHudNextMusicTrack,
#hudMusicTrackLabel,
#musicFolderInput {
  display: none !important;
}

/* Делаем модальные окна плавно прокручиваемыми пальцем на экранах телефонов */
#startModal,
#levelUpModal,
#bossChestModal,
#endModal,
#customConfigModal {
  touch-action: pan-y !important;
  overflow-y: auto !important;
  -webkit-overflow-scrolling: touch !important;
}

#startModal > div,
#levelUpModal > div,
#bossChestModal > div,
#endModal > div {
  max-height: 92dvh !important;
  overflow-y: auto !important;
  touch-action: pan-y !important;
}

/* Всегда показываем сенсорный джойстик в мобильной сборке */
#joystickZone {
  display: block !important;
  left: 14px !important;
  bottom: 14px !important;
  width: 124px !important;
  height: 124px !important;
  z-index: 35 !important;
  background: radial-gradient(circle, rgba(15, 23, 42, 0.55) 0%, rgba(2, 6, 23, 0.82) 100%) !important;
  border: 2.5px solid rgba(34, 211, 238, 0.55) !important;
  box-shadow: 0 0 22px rgba(34, 211, 238, 0.25) !important;
}

/* Крупная сенсорная кнопка РЫВКА (⚡ ДЕШ) справа внизу под большой палец правой руки */
#dashCircleWidget {
  position: fixed !important;
  right: 16px !important;
  bottom: 20px !important;
  width: 72px !important;
  height: 72px !important;
  z-index: 40 !important;
  background: rgba(15, 23, 42, 0.92) !important;
  border-width: 3px !important;
  box-shadow: 0 0 24px rgba(34, 211, 238, 0.45) !important;
  touch-action: manipulation !important;
}

#dashCircleWidget span:first-child {
  font-size: 18px !important;
}

#dashCircleText {
  font-size: 10px !important;
}

/* Компактная полоска HP по центру снизу между джойстиком и кнопкой рывка */
#bottomPlayerHud {
  bottom: 10px !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  padding: 5px 10px !important;
  max-width: calc(100vw - 310px) !important;
  min-width: 155px !important;
  z-index: 32 !important;
}

#bottomHpBarTrack {
  width: 100% !important;
  min-width: 140px !important;
  max-width: 240px !important;
  height: 18px !important;
}

#bottomStatsSubtext {
  font-size: 8.5px !important;
  max-width: 230px !important;
}

@media (max-width: 900px) {
  #hudHeader {
    padding: 4px 6px !important;
  }
  #hudBuildBar {
    max-width: 54vw !important;
    overflow-x: auto !important;
    flex-wrap: nowrap !important;
    padding: 3px 5px !important;
  }
  /* Таблица характеристик слева скрыта по умолчанию на узком экране и открывается кнопкой 📊 Статы */
  #statsPanelCard.mobile-collapsed {
    display: none !important;
  }
  #choiceCardsList {
    gap: 8px !important;
  }
}
"""

MOBILE_JS_ENHANCEMENTS = """
// === МОБИЛЬНОЕ СЕНСОРНОЕ УПРАВЛЕНИЕ И АДАПТАЦИЯ HUD (Vocaloid_Survival_Mobile.html) ===
(function() {
  window.IS_MOBILE_BUILD = true;
  window.MUSIC_FOLDER_TRACKS = [];

  window.addEventListener('DOMContentLoaded', () => {
    // 1. Скрываем строку музыкального плеера в стартовом меню и в правом HUD
    const musSlider = document.getElementById('musicVolumeSlider');
    if (musSlider && musSlider.parentElement) {
      musSlider.parentElement.style.display = 'none';
    }
    const musSliderStart = document.getElementById('musicVolumeSliderStart');
    if (musSliderStart && musSliderStart.closest('.mt-2')) {
      const box = musSliderStart.closest('.mt-2');
      // Оставляем только ползунок прозрачности эффектов, скрывая музыкальные элементы
      const musRow = musSliderStart.parentElement;
      if (musRow) musRow.style.display = 'none';
    }
    const hudMusicBtn = document.getElementById('btnHudConnectMusic');
    if (hudMusicBtn && hudMusicBtn.parentElement && hudMusicBtn.parentElement.parentElement) {
      const musicGroup = hudMusicBtn.parentElement;
      musicGroup.style.display = 'none';
    }

    // 2. На мобильном экране делаем панель характеристик (#statsPanelCard) сворачиваемой по кнопке 📊 Статы
    const statsCard = document.getElementById('statsPanelCard');
    if (statsCard && window.innerWidth <= 900) {
      statsCard.classList.add('mobile-collapsed');
    }

    const btnAutoFire = document.getElementById('btnToggleAutoFire');
    if (btnAutoFire && btnAutoFire.parentElement && !document.getElementById('btnMobileToggleStats')) {
      const btnStats = document.createElement('button');
      btnStats.id = 'btnMobileToggleStats';
      btnStats.type = 'button';
      btnStats.className = 'px-2 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-cyan-500/60 text-[10px] font-black text-cyan-200 shadow flex items-center gap-1';
      btnStats.innerHTML = '📊 <span>Статы</span>';
      btnStats.addEventListener('click', (e) => {
        e.stopPropagation();
        const sc = document.getElementById('statsPanelCard');
        if (sc) sc.classList.toggle('mobile-collapsed');
      });
      btnAutoFire.parentElement.appendChild(btnStats);
    }

    // 3. Делаем кнопку #dashCircleWidget мгновенно срабатывающей при касании пальцем (touchstart)
    setTimeout(() => {
      const dashBtn = document.getElementById('dashCircleWidget');
      const dashLabel = document.getElementById('dashCircleText');
      if (dashLabel) dashLabel.textContent = 'РЫВОК';
      if (dashBtn) {
        dashBtn.addEventListener('touchstart', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (typeof state !== 'undefined' && state.running && !state.paused) {
            state.triggerDashRequested = true;
          }
        }, { passive: false });
      }
    }, 150);

    // 4. Плавающий сенсорный джойстик по всей нижней левой четверти экрана для максимального удобства на телефоне
    let dynamicJoyTouchId = null;
    let dynamicOriginX = 0;
    let dynamicOriginY = 0;
    const maxRadius = 48;

    window.addEventListener('touchstart', (e) => {
      if (typeof state === 'undefined' || !state.running || state.paused) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        const targetEl = t.target;
        if (targetEl && targetEl.closest && targetEl.closest('button, input, select, a, #levelUpModal, #startModal, #bossChestModal, #endModal')) {
          continue;
        }
        // Левая половина экрана (нижние 75% высоты) управляет движением героини
        if (dynamicJoyTouchId === null && t.clientX < window.innerWidth * 0.5 && t.clientY > window.innerHeight * 0.25) {
          dynamicJoyTouchId = t.identifier;
          dynamicOriginX = t.clientX;
          dynamicOriginY = t.clientY;
          break;
        }
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (dynamicJoyTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const t = e.changedTouches[i];
        if (t.identifier === dynamicJoyTouchId) {
          const dx = t.clientX - dynamicOriginX;
          const dy = t.clientY - dynamicOriginY;
          const dist = Math.hypot(dx, dy);
          const clamped = Math.min(dist, maxRadius);
          const angle = Math.atan2(dy, dx);
          if (typeof joystickState !== 'undefined') {
            joystickState.active = dist > 4;
            joystickState.dx = dist > 4 ? (Math.cos(angle) * clamped) / maxRadius : 0;
            joystickState.dy = dist > 4 ? (Math.sin(angle) * clamped) / maxRadius : 0;
          }
          const knob = document.getElementById('joystickKnob');
          if (knob) {
            const kx = Math.cos(angle) * clamped * 0.75;
            const ky = Math.sin(angle) * clamped * 0.75;
            knob.style.transform = `translate(calc(-50% + ${kx}px), calc(-50% + ${ky}px))`;
          }
          break;
        }
      }
    }, { passive: true });

    const endDynamicTouch = (e) => {
      if (dynamicJoyTouchId === null) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        if (e.changedTouches[i].identifier === dynamicJoyTouchId) {
          dynamicJoyTouchId = null;
          if (typeof joystickState !== 'undefined') {
            joystickState.active = false;
            joystickState.dx = 0;
            joystickState.dy = 0;
          }
          const knob = document.getElementById('joystickKnob');
          if (knob) knob.style.transform = 'translate(-50%, -50%)';
          break;
        }
      }
    };
    window.addEventListener('touchend', endDynamicTouch, { passive: true });
    window.addEventListener('touchcancel', endDynamicTouch, { passive: true });
  });
})();
"""


def build_mobile_html(output_path=None):
    if output_path is None:
        output_path = os.path.join(ROOT_DIR, OUTPUT_FILENAME)

    play_html_path = os.path.join(ROOT_DIR, "play.html")
    css_path = os.path.join(ROOT_DIR, "css", "styles.css")
    balance_json_path = os.path.join(ROOT_DIR, "config", "balance.json")

    with open(play_html_path, "r", encoding="utf-8") as f:
        html = f.read()

    with open(css_path, "r", encoding="utf-8") as f:
        css_content = f.read()

    # 1. Заменяем viewport на мобильный с блокировкой масштабирования
    html = re.sub(
        r'<meta\s+name="viewport"[^>]*>',
        '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />',
        html
    )
    html = html.replace(
        "<title>VOCALOID SURVIVAL 3D: МОСТ НАД ВОДОЙ</title>",
        "<title>VOCALOID SURVIVAL 3D: MOBILE EDITION</title>"
    )

    # 2. Встраиваем CSS + мобильные адаптивные стили вместо <link rel="stylesheet" href="css/styles.css" />
    inline_style_block = f"<style>\n{css_content}\n{MOBILE_CSS_OVERRIDES}\n</style>"
    html = re.sub(r'<link\s+rel="stylesheet"\s+href="css/styles\.css"\s*/?>', lambda _: inline_style_block, html)

    # 3. Сжимаем все локальные картинки images/* и заменяем пути на встроенные data:image/...;base64,...
    image_cache = {}

    def get_compressed_image_data_uri(rel_path):
        rel_clean = rel_path.strip().replace("\\", "/")
        if rel_clean in image_cache:
            return image_cache[rel_clean]
        full_p = os.path.join(ROOT_DIR, rel_clean)
        if not os.path.exists(full_p):
            return rel_path
        with open(full_p, "rb") as img_f:
            raw = img_f.read()
        is_hero = "hero_" in os.path.basename(rel_clean).lower() or "sprite_" in os.path.basename(rel_clean).lower()
        is_cutin = "cutin_" in os.path.basename(rel_clean).lower()
        mime, b64 = compress_image_bytes(raw, rel_clean, is_hero_sprite=is_hero, is_cutin=is_cutin)
        uri = f"data:{mime};base64,{b64}"
        image_cache[rel_clean] = uri
        return uri

    # Сжимаем уже встроенные data:image/... в play.html (например imgPlushTeto)
    html = re.sub(
        r'src="(data:image/[^"]+)"',
        lambda m: f'src="{compress_data_uri(m.group(1))}"',
        html
    )

    # Заменяем src="images/..." в HTML
    html = re.sub(
        r'src="(images/[^"]+)"',
        lambda m: f'src="{get_compressed_image_data_uri(m.group(1))}"',
        html
    )

    # 4. Собираем и объединяем JS-модули БЕЗ music/playlist.js
    js_files = [
        "js/balance-data.js",
        "js/audio.js",
        "js/state-and-stats.js",
        "js/street-and-combat.js",
        "js/renderer.js",
        "js/ui-and-main.js",
    ]

    combined_js_parts = [
        "// === MOBILE SINGLE-FILE BUILD (NO MUSIC FOLDER) ===",
        MOBILE_JS_ENHANCEMENTS.strip(),
    ]

    # Если есть свежий config/balance.json, синхронизируем его с balance-data.js
    balance_json_str = None
    if os.path.exists(balance_json_path):
        try:
            with open(balance_json_path, "r", encoding="utf-8") as bf:
                parsed_bal = json.load(bf)
            balance_json_str = json.dumps(parsed_bal, ensure_ascii=False, indent=2)
        except Exception:
            pass

    for jf in js_files:
        jpath = os.path.join(ROOT_DIR, jf)
        with open(jpath, "r", encoding="utf-8") as f:
            jcode = f.read()

        if jf == "js/balance-data.js" and balance_json_str:
            jcode = re.sub(
                r"window\.DEFAULT_BALANCE_CONFIG\s*=\s*\{.*?\};\s*window\.BALANCE_CONFIG",
                f"window.DEFAULT_BALANCE_CONFIG = {balance_json_str};\n    window.BALANCE_CONFIG",
                jcode,
                flags=re.S
            )

        # Заменяем любые оставшиеся ссылки на images/... внутри JS на сжатые data URI
        jcode = re.sub(
            r"""(['"])(images/[a-zA-Z0-9_.-]+\.(?:png|jpg|jpeg))(\1)""",
            lambda m: f"{m.group(1)}{get_compressed_image_data_uri(m.group(2))}{m.group(3)}",
            jcode
        )
        combined_js_parts.append(f"// === {jf} ===\n{jcode}")

    full_script_tag = "<script>\n" + "\n\n".join(combined_js_parts) + "\n</script>"

    # Удаляем теги подключения модульных скриптов (включая music/playlist.js!) и вставляем единый скрипт
    html = re.sub(
        r'\s*<script\s+src="music/playlist\.js"></script>.*?<script\s+src="js/ui-and-main\.js"></script>',
        lambda _: "\n  " + full_script_tag,
        html,
        flags=re.S
    )

    with open(output_path, "w", encoding="utf-8") as out_f:
        out_f.write(html)

    size_kb = os.path.getsize(output_path) / 1024.0
    print(f"[build_mobile] Готово! Скомпилирован мобильный файл: {output_path} ({size_kb:.1f} KB)")
    print(f"[build_mobile] Сжато уникальных изображений: {len(image_cache)} (Pillow активен: {HAS_PIL})")
    return output_path


if __name__ == "__main__":
    out = sys.argv[1] if len(sys.argv) > 1 else None
    build_mobile_html(out)
