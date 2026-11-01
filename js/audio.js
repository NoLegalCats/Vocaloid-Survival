// =========================================================================
    // 1. WEB AUDIO SYNTHESIZER (Throttled so intense bullet-heaven stays 60fps)
    // =========================================================================
    const SoundFX = {
      ctx: null,
      muted: false,
      lastShootTime: 0,
      lastBoomTime: 0,
      lastDingTime: 0,
      init() {
        if (!this.ctx) {
          const AudioCtx = window.AudioContext || window.webkitAudioContext;
          if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
      },
      playShoot(freq = 320, dur = 0.04, type = 'sawtooth', vol = 0.028) {
        if (this.muted || !this.ctx) return;
        const nowMs = performance.now();
        if (nowMs - this.lastShootTime < 35) return;
        this.lastShootTime = nowMs;
        try {
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = type;
          osc.frequency.setValueAtTime(freq, now);
          osc.frequency.exponentialRampToValueAtTime(55, now + dur);
          gain.gain.setValueAtTime(vol, now);
          gain.gain.linearRampToValueAtTime(0.001, now + dur);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + dur);
        } catch (e) {}
      },
      playLaser(freq = 920, dur = 0.12) {
        if (this.muted || !this.ctx) return;
        const nowMs = performance.now();
        if (nowMs - this.lastShootTime < 45) return;
        this.lastShootTime = nowMs;
        try {
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          osc.frequency.exponentialRampToValueAtTime(180, now + dur);
          gain.gain.setValueAtTime(0.04, now);
          gain.gain.linearRampToValueAtTime(0.001, now + dur);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + dur);
        } catch (e) {}
      },
      playBoom(dur = 0.28, vol = 0.075) {
        if (this.muted || !this.ctx) return;
        const nowMs = performance.now();
        if (nowMs - this.lastBoomTime < 55) return;
        this.lastBoomTime = nowMs;
        try {
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(140, now);
          osc.frequency.exponentialRampToValueAtTime(24, now + dur);
          gain.gain.setValueAtTime(vol, now);
          gain.gain.linearRampToValueAtTime(0.001, now + dur);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + dur);
        } catch (e) {}
      },
      playPlushSquash() {
        if (this.muted || !this.ctx) return;
        const nowMs = performance.now();
        if (nowMs - this.lastBoomTime < 50) return;
        this.lastBoomTime = nowMs;
        try {
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(300, now);
          osc.frequency.exponentialRampToValueAtTime(65, now + 0.20);
          gain.gain.setValueAtTime(0.08, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.20);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.20);
        } catch (e) {}
      },
      playXpDing(pitchMultiplier = 1) {
        if (this.muted || !this.ctx) return;
        const nowMs = performance.now();
        if (nowMs - this.lastDingTime < 30) return;
        this.lastDingTime = nowMs;
        try {
          const now = this.ctx.currentTime;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(580 * pitchMultiplier, now);
          osc.frequency.setValueAtTime(820 * pitchMultiplier, now + 0.025);
          gain.gain.setValueAtTime(0.02, now);
          gain.gain.linearRampToValueAtTime(0.001, now + 0.06);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.06);
        } catch (e) {}
      },
      playLevelUp(isLegendary = false) {
        if (this.muted || !this.ctx) return;
        try {
          const notes = isLegendary
            ? [523.25, 659.25, 783.99, 1046.5, 1318.5]
            : [523.25, 659.25, 783.99, 1046.5];
          notes.forEach((n, idx) => {
            const now = this.ctx.currentTime + idx * 0.05;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(n, now);
            gain.gain.setValueAtTime(0.06, now);
            gain.gain.linearRampToValueAtTime(0.001, now + 0.16);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.16);
          });
        } catch (e) {}
      }
    };
