#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Automatic sync for music/ folder -> music/playlist.json, music/playlist.txt, and music/playlist.js.
"""

import os
import json
import sys
import time

try:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
except Exception:
    pass

AUDIO_EXTENSIONS = {
    ".mp3", ".wav", ".ogg", ".oga", ".opus", ".flac",
    ".m4a", ".aac", ".mp4", ".webm", ".weba", ".wma",
    ".mka", ".ape", ".wv"
}

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
MUSIC_DIR = ROOT_DIR if os.path.basename(ROOT_DIR).lower() == "music" else os.path.join(ROOT_DIR, "music")
PLAYLIST_TXT_PATH = os.path.join(MUSIC_DIR, "playlist.txt")
PLAYLIST_JSON_PATH = os.path.join(MUSIC_DIR, "playlist.json")
PLAYLIST_JS_PATH = os.path.join(MUSIC_DIR, "playlist.js")


def read_previous_tracks():
    if os.path.exists(PLAYLIST_TXT_PATH):
        try:
            with open(PLAYLIST_TXT_PATH, "r", encoding="utf-8") as f:
                return [line.strip() for line in f if line.strip()]
        except Exception:
            pass
    return None


def scan_music_folder():
    if not os.path.exists(MUSIC_DIR):
        os.makedirs(MUSIC_DIR, exist_ok=True)
    tracks = []
    for entry in sorted(os.listdir(MUSIC_DIR), key=lambda s: s.lower()):
        full_path = os.path.join(MUSIC_DIR, entry)
        if os.path.isfile(full_path):
            _, ext = os.path.splitext(entry)
            if ext.lower() in AUDIO_EXTENSIONS:
                tracks.append(entry)
    return tracks


def update_playlists(force=False):
    current_tracks = scan_music_folder()
    prev_tracks = read_previous_tracks()

    if not force and prev_tracks is not None and prev_tracks == current_tracks:
        return False, current_tracks, [], []

    prev_set = set(prev_tracks or [])
    curr_set = set(current_tracks)
    added = [t for t in current_tracks if t not in prev_set]
    removed = [t for t in (prev_tracks or []) if t not in curr_set]

    txt_body = ("\n".join(current_tracks) + "\n") if current_tracks else ""
    with open(PLAYLIST_TXT_PATH, "w", encoding="utf-8") as f:
        f.write(txt_body)

    lines = []
    if prev_tracks is not None and (added or removed):
        prev_items = ",\n".join("  " + json.dumps(t, ensure_ascii=False) for t in prev_tracks)
        lines.append("window.MUSIC_PREVIOUS_TRACKS = [")
        if prev_items:
            lines.append(prev_items)
        lines.append("];")

    curr_items = ",\n".join("  " + json.dumps(t, ensure_ascii=False) for t in current_tracks)
    lines.append("window.MUSIC_PLAYLIST_JSON = [")
    if curr_items:
        lines.append(curr_items)
    lines.append("];")
    lines.append("window.MUSIC_FOLDER_TRACKS = window.MUSIC_PLAYLIST_JSON;")
    lines.append("")

    js_body = "\n".join(lines)
    with open(PLAYLIST_JSON_PATH, "w", encoding="utf-8") as f:
        f.write(js_body)
    with open(PLAYLIST_JS_PATH, "w", encoding="utf-8") as f:
        f.write(js_body)

    return True, current_tracks, added, removed


def main():
    watch_mode = "--watch" in sys.argv
    changed, tracks, added, removed = update_playlists(force=True)
    print(f"[sync_music] Active tracks in music/: {len(tracks)}")
    for a in added:
        print(f"  [+] Added:   {a}")
    for r in removed:
        print(f"  [-] Removed: {r}")

    if watch_mode:
        print("[sync_music] Watching music/ folder in real time (Ctrl+C to stop)...")
        try:
            while True:
                time.sleep(1.5)
                changed, tracks, added, removed = update_playlists(force=False)
                if changed:
                    print(f"[sync_music] Updated playlist ({len(tracks)} tracks):")
                    for a in added:
                        print(f"  [+] Added:   {a}")
                    for r in removed:
                        print(f"  [-] Removed: {r}")
        except KeyboardInterrupt:
            pass


if __name__ == "__main__":
    main()
