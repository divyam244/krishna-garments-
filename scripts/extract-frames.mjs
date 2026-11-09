/**
 * KRISHNA GARMENTS — hero frame extractor
 *
 * Turns the supplied garment-manufacturing video into a scroll-playable frame
 * sequence (AVIF with WebP fallback) plus a JSON manifest describing the real
 * shot stages detected from the source timeline.
 *
 * Usage:  node scripts/extract-frames.mjs [path/to/video.mp4]
 */

import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'hero-frames');

// --- Source ------------------------------------------------------------------
// Default path contains spaces and lives outside the repo, so we resolve it
// lazily and allow an override as argv[2].
const DEFAULT_SOURCE = process.env.HERO_VIDEO_PATH;
const SOURCE = resolve(process.argv[2] || DEFAULT_SOURCE || '.');

if (!existsSync(SOURCE)) {
  console.error(
    `[extract-frames] source video not found: ${SOURCE}\n` +
      `Pass the path as an argument or set HERO_VIDEO_PATH in .env.`,
  );
  process.exit(1);
}

// --- Probe -------------------------------------------------------------------
function probe() {
  const out = run(
    'ffprobe',
    [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=nb_frames,r_frame_rate,width,height:format=duration',
      '-of', 'json',
      SOURCE,
    ],
  );
  const json = JSON.parse(out);
  const s = json.streams[0];
  const [num, den] = s.r_frame_rate.split('/').map(Number);
  return {
    width: s.width,
    height: s.height,
    fps: num / den,
    nbFrames: Number(s.nb_frames),
    duration: Number(json.format.duration),
  };
}

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) {
    throw new Error(`${cmd} failed:\n${r.stderr || r.stdout}`);
  }
  return r.stdout;
}

const info = probe();

// The video is 24fps CFR. Sampling every frame gives the smoothest possible
// scroll scrub, but 239 x 2 renditions is heavy for mobile data. We sample at a
// constant stride so playback stays perfectly linear and reversible.
const TARGET_FRAMES = Number(process.env.HERO_FRAME_COUNT || 160);
const STRIDE = Math.max(1, Math.round(info.nbFrames / TARGET_FRAMES));
const FRAME_COUNT = Math.floor((info.nbFrames - 1) / STRIDE) + 1;

// Two renditions: desktop quality and a much lighter mobile set.
const SETS = [
  { id: 'hi', width: 1280, crf: 34 },
  { id: 'lo', width: 640, crf: 36 },
];

console.log(
  `[extract-frames] source ${info.width}x${info.height} @${info.fps.toFixed(2)}fps ` +
    `${info.nbFrames} frames / ${info.duration.toFixed(2)}s\n` +
    `[extract-frames] stride=${STRIDE} -> ${FRAME_COUNT} frames per rendition`,
);

// Clean previous output so stale frames never leak into a shorter run.
rmSync(OUT, { recursive: true, force: true });

// --- Encoder selection -------------------------------------------------------
// AVIF is smaller at equal quality; fall back to WebP when this FFmpeg build
// lacks libavif (gyan.dev full builds usually have libaom AV1 but not SVT-AV1).
function pickEncoder() {
  const encoders = run('ffmpeg', ['-hide_banner', '-encoders']);
  if (/libavif|avif/.test(encoders)) return { ext: 'avif', codec: 'libavif' };
  return { ext: 'webp', codec: 'libwebp' };
}
const encoder = pickEncoder();
console.log(`[extract-frames] encoder: ${encoder.codec} (.${encoder.ext})`);

for (const set of SETS) {
  const dir = join(OUT, set.id);
  mkdirSync(dir, { recursive: true });

  // Delogo filter cleans the bottom-right Gemini watermark, then resamples fps and scales
  const delogo = 'delogo=x=1690:y=730:w=220:h=230';
  const outFps = info.fps / STRIDE;
  const scale = `scale=${set.width}:-2:flags=lanczos`;

  run('ffmpeg', [
    '-y', '-v', 'error',
    '-i', SOURCE,
    '-vf', `${delogo},fps=${outFps.toFixed(6)},${scale}`,
    '-frames:v', String(FRAME_COUNT),
    '-c:v', encoder.codec,
    ...(encoder.codec === 'libwebp' ? ['-quality', String(100 - set.crf / 2)] : ['-crf', String(set.crf)]),
    '-pix_fmt', 'yuv420p',
    join(dir, `frame-%03d.${encoder.ext}`),
  ]);

  console.log(`[extract-frames] ${set.id}: wrote ${FRAME_COUNT} frames`);
}

// --- Stage map ---------------------------------------------------------------
// Derived from frame-by-frame inspection of the actual source footage. Times are
// seconds into the original clip; we convert them to our sampled index space.
const srcToIdx = (t) => Math.min(FRAME_COUNT - 1, Math.round((t * info.fps) / STRIDE));

const STAGES = [
  { id: 'fabric-roll',   label: 'Raw fabric roll',        t: [0.0, 1.9] },
  { id: 'unrolling',     label: 'Fabric unrolling',       t: [1.9, 2.1] },
  { id: 'stitching',     label: 'Machine stitching',      t: [2.1, 4.0] },
  { id: 'transform',     label: 'Fabric becomes garment', t: [4.0, 5.0] },
  { id: 'floating',      label: 'Finished jacket floats', t: [5.0, 7.4] },
  { id: 'reveal-360',    label: '360° reveal',            t: [7.4, 9.0] },
  { id: 'brand-reveal',  label: 'Krishna Garments',       t: [9.0, info.duration] },
].map((s, i) => ({
  order: i,
  id: s.id,
  label: s.label,
  from: srcToIdx(s.t[0]),
  to: srcToIdx(s.t[1]),
  fromTime: Number(s.t[0].toFixed(3)),
  toTime: Number(Math.min(s.t[1], info.duration).toFixed(3)),
}));

// --- Manifest ----------------------------------------------------------------
const files = Array.from({ length: FRAME_COUNT }, (_, i) =>
  `frame-${String(i + 1).padStart(3, '0')}.${encoder.ext}`,
);

const manifest = {
  version: 1,
  generator: 'scripts/extract-frames.mjs',
  source: {
    width: info.width,
    height: info.height,
    fps: info.fps,
    totalFrames: info.nbFrames,
    duration: info.duration,
  },
  output: {
    count: FRAME_COUNT,
    stride: STRIDE,
    effectiveFps: info.fps / STRIDE,
    format: encoder.ext,
    sets: SETS.map((s) => ({ id: s.id, width: s.width, path: `/hero-frames/${s.id}` })),
    files,
  },
  stages: STAGES,
};

mkdirSync(join(OUT, 'manifest'), { recursive: true });
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
writeFileSync(join(OUT, 'manifest', 'index.json'), JSON.stringify(manifest));

console.log('[extract-frames] stages:');
for (const s of STAGES) {
  console.log(
    `  ${String(s.from).padStart(3)}–${String(s.to).padStart(3)}  ${s.id.padEnd(14)} ${s.label}`,
  );
}
console.log(`[extract-frames] manifest -> ${join(OUT, 'manifest.json')}`);
