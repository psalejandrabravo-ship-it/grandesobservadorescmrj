import { useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Maximize2, Minimize2, MoreHorizontal, Play, Volume2, VolumeX } from "lucide-react";
import { AFTER_ASK, GUIDE_COMMON, SITUATIONS, VIDEO_SRC, type Situation } from "./content";
import { EmojiFace } from "./EmojiFace";
import { PLAY } from "./playdata";
import { freshPieces, isComplete, magnet, moveGroup, PIECES, TARGET, trySnap, type Piece, type PieceId } from "./puzzle";
import { sfx } from "./sfx";

type Screen = "home" | "video" | "situation" | "closing" | "activity";
type LogoMode = "mirarim" | "institutional" | "both" | "none";

type Settings = {
  version: 1;
  voice: boolean;
  effects: boolean;
  introSeen: boolean;
  last: number | null;
  logoMode: LogoMode;
  instName: string;
  instLogo: string | null;
};

const KEY = "mirarim-grandes-observadores-settings";

const DEFAULTS: Settings = {
  version: 1,
  voice: true,
  effects: true,
  introSeen: false,
  last: null,
  logoMode: "mirarim",
  instName: "",
  instLogo: null,
};

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const p = JSON.parse(raw) as Partial<Settings>;
    if (p.version !== 1) return { ...DEFAULTS };
    return {
      ...DEFAULTS,
      voice: p.voice !== false,
      effects: p.effects !== false,
      introSeen: Boolean(p.introSeen),
      last: typeof p.last === "number" ? p.last : null,
      logoMode: p.logoMode ?? "mirarim",
      instName: String(p.instName ?? "").slice(0, 80),
      instLogo: typeof p.instLogo === "string" && p.instLogo.length < 350000 ? p.instLogo : null,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

function shrinkLogo(dataUrl: string, limit = 280000, start = 720): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let max = start;
      let png = "";
      while (max >= 48) {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext("2d", { alpha: true });
        if (!ctx) {
          reject(new Error("canvas"));
          return;
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        png = canvas.toDataURL("image/png");
        if (png.length < limit) break;
        max = Math.round(max * 0.72);
      }
      resolve(png);
    };
    img.onerror = () => reject(new Error("image"));
    img.src = dataUrl;
  });
}

function decodeOnce(value: string) {
  if (!/%[0-9A-Fa-f]{2}/.test(value)) return value;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function readShare(hash: string): { m?: LogoMode; n?: string; l?: string } | null {
  const body = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!body) return null;
  try {
    if (body.startsWith("mirarim=")) {
      const parsed = JSON.parse(decodeOnce(body.slice("mirarim=".length))) as {
        m?: LogoMode;
        n?: string;
        l?: string;
      };
      return parsed;
    }
    const out: { m?: LogoMode; n?: string; l?: string } = {};
    for (const part of body.split("&")) {
      const i = part.indexOf("=");
      if (i < 0) continue;
      const key = decodeOnce(part.slice(0, i));
      const value = decodeOnce(part.slice(i + 1));
      if (key === "m") out.m = value as LogoMode;
      if (key === "n") out.n = value;
      if (key === "l") out.l = value;
    }
    return out.m || out.n || out.l ? out : null;
  } catch {
    return null;
  }
}

const CLIP: Record<PieceId, string> = {
  tl: "polygon(0% 0%, 50% 0%, 50% 16%, 63% 20%, 66% 25%, 63% 30%, 50% 34%, 50% 50%, 34% 50%, 30% 38%, 25% 36%, 20% 38%, 16% 50%, 0% 50%)",
  tr: "polygon(50% 0%, 100% 0%, 100% 50%, 84% 50%, 80% 63%, 75% 66%, 70% 63%, 66% 50%, 50% 50%, 50% 34%, 63% 30%, 66% 25%, 63% 20%, 50% 16%)",
  bl: "polygon(0% 50%, 16% 50%, 20% 38%, 25% 36%, 30% 38%, 34% 50%, 50% 50%, 50% 66%, 37% 70%, 34% 75%, 37% 80%, 50% 84%, 50% 100%, 0% 100%)",
  br: "polygon(50% 50%, 66% 50%, 70% 63%, 75% 66%, 80% 63%, 84% 50%, 100% 50%, 100% 100%, 50% 100%, 50% 84%, 37% 80%, 34% 75%, 37% 70%, 50% 66%)",
};

const ORIGIN = "50% 50%";

function Scene({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div className={`grid aspect-[3/2] place-items-center rounded-card bg-paper p-6 text-center text-indigo ${className}`}>
        <p>No pudimos cargar esta imagen. Puedes volver al inicio e intentarlo nuevamente.</p>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={`aspect-[3/2] w-full max-h-[52vh] rounded-card object-cover ${className}`}
      onError={() => setErr(true)}
    />
  );
}

function Puzzle({
  image,
  alt,
  seed,
  effects,
  onDone,
  resetKey,
}: {
  image: string;
  alt: string;
  seed: number;
  effects: boolean;
  onDone: () => void;
  resetKey: number;
}) {
  const [pieces, setPieces] = useState<Piece[]>(() => freshPieces(seed));
  const piecesRef = useRef(pieces);
  const [done, setDone] = useState(false);
  const [dragging, setDragging] = useState(false);
  const board = useRef<HTMLDivElement>(null);
  const drag = useRef<{ group: number; x: number; y: number } | null>(null);
  const live = useRef<HTMLDivElement>(null);
  const finished = useRef(false);
  const timer = useRef<number | null>(null);

  const armDone = () => {
    if (finished.current) return;
    finished.current = true;
    drag.current = null;
    setDragging(false);
    setDone(true);
    sfx.done(effects);
    if (live.current) live.current.textContent = "La escena está completa.";
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => onDone(), 700);
  };

  useEffect(() => {
    const next = freshPieces(seed + resetKey);
    piecesRef.current = next;
    setPieces(next);
    setDone(false);
    finished.current = false;
    drag.current = null;
    if (timer.current) window.clearTimeout(timer.current);
  }, [seed, resetKey]);

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  const pct = (cx: number, cy: number) => {
    const r = board.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: ((cx - r.left) / r.width) * 100, y: ((cy - r.top) / r.height) * 100 };
  };

  const finishDrag = () => {
    try {
      const active = drag.current;
      if (!active || finished.current) return;
      drag.current = null;
      setDragging(false);
      const res = trySnap(piecesRef.current);
      if (res.snapped) sfx.snap(effects);
      else sfx.miss(effects);
      piecesRef.current = res.pieces;
      if (isComplete(res.pieces)) armDone();
      setPieces(res.pieces);
    } catch {
      drag.current = null;
      setDragging(false);
    }
  };

  const nudge = (id: PieceId, dx: number, dy: number) => {
    if (done) return;
    const piece = pieces.find((p) => p.id === id);
    if (!piece) return;
    setPieces((cur) => {
      try {
        const moved = moveGroup(cur, piece.group, dx, dy);
        const res = trySnap(moved);
        if (res.snapped) sfx.snap(effects);
        piecesRef.current = res.pieces;
        if (isComplete(res.pieces)) armDone();
        return res.pieces;
      } catch {
        return cur;
      }
    });
  };

  return (
    <div
      ref={board}
      className="relative mx-auto aspect-[3/2] w-full max-w-5xl touch-none overflow-hidden rounded-card bg-paper"
      onPointerMove={(e) => {
        const active = drag.current;
        if (!active || finished.current) return;
        try {
          const point = pct(e.clientX, e.clientY);
          const dx = point.x - active.x;
          const dy = point.y - active.y;
          const group = active.group;
          drag.current = { group, x: point.x, y: point.y };
          const moved = moveGroup(piecesRef.current, group, dx, dy);
          const pulled = magnet(moved, group);
          if (pulled.locked) sfx.snap(effects);
          piecesRef.current = pulled.pieces;
          if (isComplete(pulled.pieces)) armDone();
          setPieces(pulled.pieces);
        } catch {
          drag.current = null;
          setDragging(false);
        }
      }}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
    >
      {pieces.filter((piece) => piece && typeof piece.group === "number").map((piece) => (
        <button
          key={piece.id}
          type="button"
          aria-label={`Pieza ${PIECES.indexOf(piece.id) + 1} de 4`}
          className="absolute h-full w-full border-0 bg-transparent p-0"
          style={{
            clipPath: CLIP[piece.id],
            backgroundImage: `url(${image})`,
            backgroundSize: "100% 100%",
            backgroundRepeat: "no-repeat",
            transform: `translate(${piece.x}%, ${piece.y}%) scale(${done ? 1 : 0.5})`,
            transformOrigin: ORIGIN,
            transition: dragging ? "none" : "transform 0.35s ease",
            filter: "drop-shadow(0 8px 6px rgba(30,24,48,0.22))",
            zIndex: drag.current?.group === piece.group ? 5 : 1,
          }}
          onPointerDown={(e) => {
            if (done || finished.current) return;
            e.currentTarget.setPointerCapture(e.pointerId);
            const pt = pct(e.clientX, e.clientY);
            drag.current = { group: piece.group, x: pt.x, y: pt.y };
            setDragging(true);
            sfx.pickup(effects);
          }}
          onKeyDown={(e) => {
            const step = e.shiftKey ? 8 : 4;
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              nudge(piece.id, -step, 0);
            }
            if (e.key === "ArrowRight") {
              e.preventDefault();
              nudge(piece.id, step, 0);
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              nudge(piece.id, 0, -step);
            }
            if (e.key === "ArrowDown") {
              e.preventDefault();
              nudge(piece.id, 0, step);
            }
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              const t = TARGET[piece.id];
              nudge(piece.id, (t.x - piece.x) * 0.65, (t.y - piece.y) * 0.65);
            }
          }}
        />
      ))}
      <div ref={live} className="sr-only" aria-live="polite" />
      <p className="sr-only">Flechas para mover. Enter o espacio acerca la pieza.</p>
    </div>
  );
}

export function Game() {
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");
  const [phase, setPhase] = useState<"before" | "build" | "after">("before");
  const [marks, setMarks] = useState<string[]>([]);
  const [voiceError, setVoiceError] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [videoMissing, setVideoMissing] = useState(false);
  const [index, setIndex] = useState(0);
  const [visited, setVisited] = useState<number[]>([]);
  const [guide, setGuide] = useState(false);
  const [menu, setMenu] = useState(false);
  const [how, setHow] = useState(false);
  const [about, setAbout] = useState(false);
  const [config, setConfig] = useState(false);
  const [verdict, setVerdict] = useState<null | "ok" | "hint">(null);
  const [resume, setResume] = useState(false);
  const [leave, setLeave] = useState<number | null>(null);
  const [resetAsk, setResetAsk] = useState(false);
  const [complete, setComplete] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fs, setFs] = useState(false);
  const [fsMsg, setFsMsg] = useState("");
  const [storageNote, setStorageNote] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const guideRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const s = load();
    const shared = readShare(window.location.hash);
    if (shared) {
      if (shared.m === "mirarim" || shared.m === "institutional" || shared.m === "both" || shared.m === "none") {
        s.logoMode = shared.m;
      }
      if (typeof shared.n === "string") s.instName = shared.n.slice(0, 80);
      if (typeof shared.l === "string" && shared.l.startsWith("data:image") && shared.l.length < 320000) {
        s.instLogo = shared.l;
      }
    }
    setSettings(s);
    setResume(s.last !== null);
    setReady(true);
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      setStorageNote(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      setStorageNote(true);
    }
  }, [settings, ready]);

  useEffect(() => {
    const onFs = () => setFs(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setGuide(false);
        setMenu(false);
        setHow(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (guide) guideRef.current?.focus();
  }, [guide]);

  const stop = () => {
    window.speechSynthesis?.cancel();
    audio.current?.pause();
    setPlaying(false);
  };

  const listen = (src: string, spoken: string) => {
    if (!settings.voice) return;
    stop();
    setVoiceError("");
    window.speechSynthesis?.cancel();
    const say = () => {
      if (used) return;
      used = true;
      if (!window.speechSynthesis) {
        setPlaying(false);
        setVoiceError("El audio no está disponible. Puedes leer la consigna en pantalla.");
        return;
      }
      const utter = new SpeechSynthesisUtterance(spoken);
      utter.lang = "es-CL";
      utter.rate = 0.92;
      utter.onend = () => setPlaying(false);
      utter.onerror = () => {
        setPlaying(false);
        setVoiceError("El audio no está disponible. Puedes leer la consigna en pantalla.");
      };
      setPlaying(true);
      window.speechSynthesis.speak(utter);
    };
    let used = false;
    const el = new Audio(src);
    audio.current = el;
    setPlaying(true);
    el.onended = () => {
      used = true;
      setPlaying(false);
    };
    el.onerror = () => say();
    void el.play().catch(() => say());
    sfx.tap(settings.effects);
  };

  const openSit = (i: number, force = false) => {
    if (screen === "situation" && phase === "build" && !complete && !force) {
      setLeave(i);
      return;
    }
    stop();
    setIndex(i);
    setPhase("build");
    setMarks([]);
    setScreen("situation");
    setComplete(false);
    setResetKey((n) => n + 1);
    setVisited((v) => (v.includes(i) ? v : [...v, i]));
    setSettings((s) => ({ ...s, last: i }));
    setMenu(false);
    setVerdict(null);
  };

  const sit: Situation = SITUATIONS[index] ?? SITUATIONS[0];
  const beat = PLAY[index] ?? PLAY[0];
  const pad = String(sit.id).padStart(2, "0");
  const voiceAntes = `/assets/audio/voice/sit-${pad}-antes.mp3`;
  const voiceDespues = `/assets/audio/voice/sit-${pad}-despues.mp3`;
  const afterAsk = AFTER_ASK[index];

  return (
    <div className="flex min-h-dvh flex-col bg-cream text-ink">
      <header className={`flex flex-wrap items-center gap-2 bg-indigo px-3 py-2 text-cream ${screen === "home" ? "hidden" : ""}`}>
        <div className="flex min-h-11 items-center gap-2">
          <img
            src="/assets/brand/colegio-robert-johnson.png"
            alt="Colegio Metodista Robert Johnson"
            className="h-11 w-auto"
          />
        </div>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">
          {screen === "situation" ? `Situación ${index + 1} de 10` : "Grandes observadores"}
        </p>
        <button
          type="button"
          className="min-h-11 rounded-full px-3 text-sm"
          aria-pressed={settings.voice}
          onClick={() => {
            stop();
            setSettings((s) => ({ ...s, voice: !s.voice }));
          }}
        >
          {settings.voice ? (
            <span className="inline-flex items-center gap-1">
              <Volume2 size={18} aria-hidden /> Voz activada
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <VolumeX size={18} aria-hidden /> Voz silenciada
            </span>
          )}
        </button>
        <button
          type="button"
          className="min-h-11 rounded-full px-3 text-sm"
          aria-pressed={settings.effects}
          onClick={() => setSettings((s) => ({ ...s, effects: !s.effects }))}
        >
          {settings.effects ? "Efectos activados" : "Efectos silenciados"}
        </button>
        <button
          type="button"
          className="min-h-11 rounded-full px-3 text-sm"
          onClick={async () => {
            try {
              if (document.fullscreenElement) await document.exitFullscreen();
              else await document.documentElement.requestFullscreen();
              setFsMsg("");
            } catch {
              setFsMsg("Tu navegador no permitió abrir la pantalla completa. Puedes volver a intentarlo.");
            }
          }}
        >
          {fs ? (
            <span className="inline-flex items-center gap-1">
              <Minimize2 size={18} aria-hidden /> Salir de pantalla completa
            </span>
          ) : (
            <span className="inline-flex items-center gap-1">
              <Maximize2 size={18} aria-hidden /> Pantalla completa
            </span>
          )}
        </button>
        <button
          type="button"
          className="grid min-h-11 min-w-11 place-items-center rounded-full"
          aria-label="Opciones de la educadora"
          aria-expanded={menu}
          onClick={() => {
            sfx.tap(settings.effects);
            setMenu((v) => !v);
          }}
        >
          <MoreHorizontal aria-hidden />
        </button>
      </header>

      {storageNote && (
        <p className="px-4 py-2 text-sm text-indigo">Tus preferencias no se conservarán al cerrar esta página.</p>
      )}
      {fsMsg && <p className="px-4 py-2 text-sm">{fsMsg}</p>}

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4">
        {screen === "home" && (
          <section className="fixed inset-0 z-10 overflow-auto text-cream">
            <img
              src="/assets/illustrations/cover-hero.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-indigo/55" />
            <div className="relative z-10 flex min-h-dvh flex-col">
              <div className="flex justify-end p-4">
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm"
                  onClick={async () => {
                    try {
                      if (document.fullscreenElement) await document.exitFullscreen();
                      else await document.documentElement.requestFullscreen();
                    } catch {
                      setFsMsg("Tu navegador no permitió abrir la pantalla completa. Puedes volver a intentarlo.");
                    }
                  }}
                >
                  <Maximize2 size={16} aria-hidden /> Pantalla completa
                </button>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 pb-10 text-center">
              <div className="flex flex-col items-center gap-2">
                <img
                  src="/assets/brand/colegio-robert-johnson.png"
                  alt="Colegio Metodista Robert Johnson"
                  className="h-44 w-auto"
                />
              </div>
                <h1 className="text-4xl font-extrabold sm:text-5xl">Grandes observadores</h1>
                <p className="text-lg">Nos detenemos y miramos con atención.</p>
                <p className="text-sm font-bold text-gold">10 situaciones · para mirar juntos</p>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    className="inline-flex min-h-12 items-center gap-2 rounded-full bg-coral px-6 font-extrabold text-paper"
                    onClick={() => {
                      stop();
                      setResume(false);
                      setVideoMissing(false);
                      setScreen("video");
                    }}
                  >
                    <Play size={18} aria-hidden /> Jugar
                  </button>
                  <button type="button" className="min-h-12 rounded-full border border-white/50 bg-white/15 px-5 font-semibold" onClick={() => setHow(true)}>
                    Cómo se juega
                  </button>
                  <button type="button" className="min-h-12 rounded-full border border-white/50 bg-white/15 px-5 font-semibold" onClick={() => setConfig(true)}>
                    Configuración
                  </button>
                </div>
                <button type="button" className="mt-2 text-sm underline-offset-2 hover:underline" onClick={() => setAbout(true)}>
                  Acerca de
                </button>
                <p className="mt-3 text-sm">Psicóloga Alejandra Bravo Pino</p>
              </div>
            </div>
          </section>
        )}

        {screen === "video" && (
          <section className="mx-auto flex w-full max-w-4xl flex-col gap-4">
            <h2 className="text-2xl font-extrabold text-indigo">Miremos juntos</h2>
            {videoMissing ? (
              <p className="rounded-card bg-paper p-4">
                El video todavía no está cargado. Cuando lo subas, aparecerá aquí. Puedes seguir al juego.
              </p>
            ) : (
              <video
                className="w-full rounded-card bg-ink"
                controls
                playsInline
                preload="metadata"
                src={VIDEO_SRC}
                onError={() => setVideoMissing(true)}
              />
            )}
            <button
              type="button"
              className="min-h-12 w-fit rounded-full bg-coral px-5 font-extrabold text-paper"
              onClick={() => openSit(0, true)}
            >
              Ir al juego
            </button>
          </section>
        )}

        {screen === "situation" && phase === "build" && (
          <>
            <p className="rounded-card border-2 border-gold bg-paper p-4 text-indigo md:hidden">
              Para mover las piezas con más espacio, gira tu dispositivo.
            </p>
            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_17rem]">
              <Puzzle
                key={`${sit.id}-${resetKey}`}
                image={sit.image}
                alt={sit.alt}
                seed={sit.id}
                effects={settings.effects}
                resetKey={resetKey}
                onDone={() => {
                  setComplete(true);
                  setPhase("after");
                  setVerdict(null);
                }}
              />
              <aside className="space-y-3 rounded-card bg-paper p-4 text-lg leading-relaxed">
                <p className="text-sm font-bold text-indigo">Mientras armamos</p>
                <p>{beat.looks[0]}</p>
                <p>{beat.looks[1]}</p>
              </aside>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="min-h-12 rounded-full border-2 border-indigo px-4"
                onClick={() => {
                  setComplete(false);
                  setResetKey((n) => n + 1);
                }}
              >
                Reiniciar piezas
              </button>
              <button
                type="button"
                className="min-h-12 rounded-full border-2 border-indigo px-4"
                onClick={() => {
                  stop();
                  if (index === 0) setScreen("video");
                  else openSit(index - 1, true);
                }}
              >
                Anterior
              </button>
            </div>
          </>
        )}

        {(screen === "closing" || (screen === "situation" && verdict === "ok")) && (
          <Confetti count={screen === "closing" ? 72 : 26} />
        )}

        {screen === "situation" && phase === "after" && verdict === null && (
          <section className="screen-in mx-auto flex w-full max-w-4xl flex-col gap-4">
            <p className="text-2xl font-extrabold text-indigo">{beat.story}</p>
            <h2 className="text-xl">{beat.ask}</h2>
            <div className="grid grid-cols-3 gap-3">
              {beat.choices.map((choice) => (
                <button
                  key={choice.label}
                  type="button"
                  className="flex min-h-16 flex-col items-center justify-center gap-1 rounded-card bg-paper px-2 py-3"
                  onClick={() => {
                    if (choice.ok) {
                      setVerdict("ok");
                      sfx.cheer(settings.effects);
                    } else {
                      setVerdict("hint");
                      sfx.hint(settings.effects);
                    }
                  }}
                >
                  <EmojiFace mood={choice.mood} />
                  <span className="text-center text-base font-extrabold text-indigo">{choice.label}</span>
                </button>
              ))}
            </div>
            <Scene src={sit.image} alt={sit.alt} className="max-h-[36vh]" />
          </section>
        )}

        {screen === "situation" && phase === "after" && verdict !== null && (
          <section className="screen-in mx-auto flex w-full max-w-3xl flex-col items-center gap-4 text-center">
            <h2 className={`title-pop text-4xl font-extrabold ${verdict === "ok" ? "text-coral" : "text-indigo"}`}>
              {verdict === "ok" ? "Muy bien" : "Pensemos bien"}
            </h2>
            <Scene src={sit.image} alt={sit.alt} className="max-h-[42vh]" />
            <p className="text-lg">{verdict === "ok" ? beat.why : beat.hint}</p>
            <button
              type="button"
              className="min-h-12 rounded-full bg-coral px-5 font-extrabold text-paper"
              onClick={() => {
                stop();
                if (index < 9) openSit(index + 1, true);
                else {
                  sfx.applause(settings.effects);
                  setScreen("closing");
                }
              }}
            >
              {index < 9 ? "Siguiente situación" : "Recibir la medalla"}
            </button>
          </section>
        )}

        {screen === "closing" && (
          <section className="screen-in mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
            <div className="title-pop" aria-hidden>
              <svg viewBox="0 0 120 150" className="h-44 w-36">
                <path d="M46 48 L30 10 L58 36 Z" fill="#e07a5f" />
                <path d="M74 48 L90 10 L62 36 Z" fill="#2b2155" />
                <circle cx="60" cy="84" r="42" fill="#e6b325" />
                <circle cx="60" cy="84" r="33" fill="#f7f1e4" />
                <circle cx="60" cy="82" r="10" fill="#2b2155" />
                <path d="M38 82 Q60 70 82 82 Q60 94 38 82 Z" fill="none" stroke="#2b2155" strokeWidth="3" />
              </svg>
            </div>
            <p className="text-sm font-bold uppercase tracking-wide text-coral">Felicitaciones</p>
            <h1 className="text-3xl font-extrabold text-indigo">Ahora son Grandes observadores</h1>
            <p>Se detuvieron, miraron con atención y reconocieron las señales de las otras personas.</p>
            <p className="text-sm font-extrabold text-indigo">Psicóloga Alejandra Bravo Pino</p>
            <button
              type="button"
              className="text-base font-extrabold text-coral underline underline-offset-4"
              onClick={() => setScreen("activity")}
            >
              Ver actividad
            </button>
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" className="min-h-12 rounded-full border-2 border-indigo px-4" onClick={() => setMenu(true)}>
                Volver a una situación
              </button>
              <button type="button" className="min-h-12 rounded-full border-2 border-indigo px-4" onClick={() => openSit(0, true)}>
                Repetir la actividad
              </button>
              <button
                type="button"
                className="min-h-12 rounded-full bg-coral px-5 font-extrabold text-paper"
                onClick={() => {
                  stop();
                  setScreen("home");
                }}
              >
                Volver al inicio
              </button>
            </div>
          </section>
        )}

        {screen === "activity" && (
          <section className="screen-in mx-auto flex w-full max-w-3xl flex-col items-center gap-4">
            <h2 className="text-2xl font-extrabold text-indigo">Actividad para recortar</h2>
            <img
              src="/assets/actividad-recorte.png"
              alt="Ficha para recortar y pegar: La construcción se cayó"
              className="w-full rounded-card border border-indigo/15 bg-paper"
            />
            <button
              type="button"
              className="min-h-12 rounded-full border-2 border-indigo px-5"
              onClick={() => setScreen("closing")}
            >
              Volver
            </button>
          </section>
        )}
      </main>
      {screen !== "home" && (
        <p className="px-4 pb-3 text-center text-xs text-indigo">Psicóloga Alejandra Bravo Pino</p>
      )}

      {screen !== "home" && (
        <button
          type="button"
          className="fixed top-1/3 right-0 z-20 flex min-h-11 items-center gap-2 rounded-l-xl bg-indigo px-3 py-4 font-extrabold text-cream"
          onClick={() => {
            sfx.tap(settings.effects);
            setGuide(true);
          }}
        >
          <BookOpen size={18} aria-hidden /> Guía
        </button>
      )}

      {guide && (
        <div
          ref={guideRef}
          tabIndex={-1}
          role="dialog"
          aria-labelledby="guia-titulo"
          className="fixed inset-y-0 right-0 z-30 w-full max-w-md overflow-auto bg-paper p-5 shadow-xl"
        >
          <h2 id="guia-titulo" className="text-xl font-extrabold text-indigo">
            Guía{screen === "situation" ? ` · ${sit.title}` : ""}
          </h2>
          <button type="button" className="mt-2 min-h-11 rounded-full border-2 border-indigo px-4" onClick={() => setGuide(false)}>
            Cerrar guía
          </button>
          {screen === "situation" ? (
            <div className="mt-4 space-y-3 text-sm leading-relaxed">
              <h3 className="font-extrabold">Pregunta antes de armar</h3>
              <p>{sit.main}</p>
              <h3 className="font-extrabold">Qué observar en esta situación</h3>
              <ul className="list-disc pl-5">{sit.observe.map((x) => <li key={x}>{x}</li>)}</ul>
              <h3 className="font-extrabold">También puedes preguntar</h3>
              <ul className="list-disc pl-5">{sit.extra.map((x) => <li key={x}>{x}</li>)}</ul>
              <h3 className="font-extrabold">Pregunta después de armar</h3>
              <p>{afterAsk}</p>
              <h3 className="font-extrabold">Antes de armar</h3>
              <p>{GUIDE_COMMON.before}</p>
              <h3 className="font-extrabold">Durante el armado</h3>
              <p>{GUIDE_COMMON.during} {sit.voiceText}</p>
              <h3 className="font-extrabold">Después de armar</h3>
              <p>{GUIDE_COMMON.after}</p>
              <h3 className="font-extrabold">Cierre sugerido</h3>
              <p>{GUIDE_COMMON.close}</p>
            </div>
          ) : (
            <p className="mt-4">Invita a detenerse y mirar. No hay una emoción correcta.</p>
          )}
        </div>
      )}

      {menu && (
        <div className="fixed inset-0 z-40 grid place-items-start justify-end bg-ink/30 p-4" onClick={() => setMenu(false)}>
          <div
            role="dialog"
            aria-label="Elegir situación"
            className="mt-16 max-h-[80dvh] w-full max-w-sm overflow-auto rounded-card bg-paper p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-extrabold text-indigo">Elegir situación</h2>
            <ul className="mt-3 grid gap-2">
              {SITUATIONS.map((s, i) => {
                const status = screen === "situation" && i === index ? "Actual" : visited.includes(i) ? "Visitada" : "No visitada";
                return (
                  <li key={s.id}>
                    <button type="button" className="min-h-11 w-full rounded-xl bg-cream px-3 text-left" onClick={() => openSit(i)}>
                      {s.id}. {s.title} — {status}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="min-h-11 rounded-full border-2 border-indigo px-3" onClick={() => setResetAsk(true)}>
                Reiniciar actividad
              </button>
            </div>
          </div>
        </div>
      )}

      {how && (
        <Modal onClose={() => setHow(false)} title="Cómo se juega">
          <ul className="list-disc space-y-1 pl-5">
            <li>Mientras arman, lean las dos ideas para mirar.</li>
            <li>Unan las cuatro piezas. Quedan separadas para ver cada una.</li>
            <li>Cuando la escena está completa, lean qué pasó.</li>
            <li>Elijan el rostro que mejor acompaña la situación.</li>
          </ul>
        </Modal>
      )}

      {about && (
        <Modal onClose={() => setAbout(false)} title="Acerca de">
          <p>
            Grandes observadores es una actividad del Colegio Metodista Robert Johnson para detenerse, armar una escena cotidiana y conversar sobre lo que podría estar sintiendo alguien. No diagnostica ni reemplaza el criterio de quien facilita.
          </p>
          <p className="mt-3 font-extrabold text-indigo">Psicóloga Alejandra Bravo Pino</p>
        </Modal>
      )}

      {config && (
        <Modal onClose={() => setConfig(false)} title="Configuración">
          <div className="mt-3 flex flex-col gap-2">
            <button type="button" className="min-h-11 rounded-full border-2 border-indigo px-4 text-left" onClick={() => setSettings((s) => ({ ...s, voice: !s.voice }))}>
              {settings.voice ? "Voz activada" : "Voz silenciada"}
            </button>
            <button type="button" className="min-h-11 rounded-full border-2 border-indigo px-4 text-left" onClick={() => setSettings((s) => ({ ...s, effects: !s.effects }))}>
              {settings.effects ? "Efectos activados" : "Efectos silenciados"}
            </button>
          </div>
        </Modal>
      )}

      {resume && screen === "home" && (
        <Modal title="Continuar">
          <p>¿Quieres continuar desde la última situación o comenzar nuevamente?</p>
          <div className="mt-3 flex gap-2">
            <button type="button" className="min-h-11 rounded-full bg-coral px-4 font-extrabold text-paper" onClick={() => openSit(settings.last ?? 0, true)}>
              Continuar
            </button>
            <button
              type="button"
              className="min-h-11 rounded-full border-2 border-indigo px-4"
              onClick={() => {
                setResume(false);
                setSettings((s) => ({ ...s, last: null }));
              }}
            >
              Comenzar nuevamente
            </button>
          </div>
        </Modal>
      )}

      {leave !== null && (
        <Modal title="Cambiar">
          <p>¿Quieres cambiar de situación? Las piezas de esta situación volverán a su posición inicial.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" className="min-h-11 rounded-full border-2 border-indigo px-4" onClick={() => setLeave(null)}>
              Seguir aquí
            </button>
            <button
              type="button"
              className="min-h-11 rounded-full bg-coral px-4 font-extrabold text-paper"
              onClick={() => {
                const i = leave;
                setLeave(null);
                openSit(i, true);
              }}
            >
              Cambiar de situación
            </button>
          </div>
        </Modal>
      )}

      {resetAsk && (
        <Modal title="Reiniciar">
          <p>¿Quieres reiniciar la actividad? Se perderá el avance actual, pero se conservarán tus preferencias.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" className="min-h-11 rounded-full border-2 border-indigo px-4" onClick={() => setResetAsk(false)}>
              Cancelar
            </button>
            <button
              type="button"
              className="min-h-11 rounded-full bg-coral px-4 font-extrabold text-paper"
              onClick={() => {
                setVisited([]);
                setSettings((s) => ({ ...s, last: null }));
                setResetAsk(false);
                setMenu(false);
                stop();
                setScreen("home");
              }}
            >
              Reiniciar
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
}

function Confetti({ count }: { count: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.45,
        duration: 2.2 + Math.random() * 1.6,
        color: ["#e07a5f", "#e6b84c", "#2b2155", "#fffaf3", "#6f8f9a"][i % 5],
        drift: `${-40 + Math.random() * 80}px`,
        spin: `${180 + Math.random() * 540}deg`,
        width: 7 + (i % 4) * 3,
      })),
    [count],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {bits.map((bit) => (
        <span
          key={bit.id}
          className="confetti-bit"
          style={{
            left: `${bit.left}%`,
            width: bit.width,
            height: bit.width * 0.55,
            background: bit.color,
            animationDelay: `${bit.delay}s`,
            animationDuration: `${bit.duration}s`,
            ["--drift" as string]: bit.drift,
            ["--spin" as string]: bit.spin,
          }}
        />
      ))}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4">
      <div role="dialog" aria-label={title} className="w-full max-w-md rounded-card bg-paper p-5">
        <h2 className="text-lg font-extrabold text-indigo">{title}</h2>
        <div className="mt-2">{children}</div>
        {onClose && (
          <button type="button" className="mt-4 min-h-11 rounded-full bg-coral px-4 font-extrabold text-paper" onClick={onClose}>
            Cerrar
          </button>
        )}
      </div>
    </div>
  );
}
