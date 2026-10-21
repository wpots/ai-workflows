#!/usr/bin/env node
// Turns a raw recording into a clip for a Slides deck: the typing at 1×, the
// rest sped up, the last frame held, re-encoded small, plus a still of the
// last frame for the slide's picture. Needs ffmpeg and ffprobe on PATH.
//
// node .claude/skills/record-skill-demo/kit/prepare-clip.mjs <raw.mp4> <clip.mp4>
//   [--keep 10]  seconds at 1× before the speed-up: until the prompt is sent
//   [--speed 4]  speed of the rest; 1 only re-encodes and holds the end
//   [--hold 8]   seconds the last frame stays up
//   [--crf 26]   H.264 quality; higher is smaller
// Writes <clip.mp4> and <clip>.jpg. The sound is dropped: VHS records none.

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const DECK_CLIP_LIMIT_MB = 20;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    keep: { type: "string", default: "10" },
    speed: { type: "string", default: "4" },
    hold: { type: "string", default: "8" },
    crf: { type: "string", default: "26" },
  },
});

const [input, output] = positionals;
if (!input || !output) {
  process.stderr.write("usage: prepare-clip.mjs <raw.mp4> <clip.mp4> [--keep 10] [--speed 4] [--hold 8] [--crf 26]\n");
  process.exit(2);
}

const keep = Number(values.keep);
const speed = Number(values.speed);
const hold = Number(values.hold);
const crf = Number(values.crf);
if (![keep, speed, hold, crf].every(Number.isFinite) || keep < 0 || speed < 1 || hold < 0) {
  process.stderr.write("--keep and --hold must be 0 or more, --speed 1 or more\n");
  process.exit(2);
}

const seconds = (file) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]).toString().trim());

const rawSeconds = seconds(input);
if (speed > 1 && keep >= rawSeconds) {
  process.stderr.write(`--keep ${keep} is not shorter than the recording (${rawSeconds.toFixed(1)} s)\n`);
  process.exit(2);
}

const holdEnd = `tpad=stop_mode=clone:stop_duration=${hold}`;
const filter =
  speed === 1
    ? `[0:v]${holdEnd}[out]`
    : [
        "[0:v]split=2[typing][rest]",
        `[typing]trim=end=${keep},setpts=PTS-STARTPTS[v1]`,
        `[rest]trim=start=${keep},setpts=(PTS-STARTPTS)/${speed}[v2]`,
        "[v1][v2]concat=n=2:v=1:a=0[joined]",
        `[joined]${holdEnd}[out]`,
      ].join(";");

fs.mkdirSync(path.dirname(output), { recursive: true });
execFileSync(
  "ffmpeg",
  [
    "-v", "error", "-y", "-i", input,
    "-filter_complex", filter, "-map", "[out]", "-an",
    "-c:v", "libx264", "-preset", "medium", "-crf", String(crf), "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", output,
  ],
  { stdio: ["ignore", "inherit", "inherit"] },
);

const still = path.join(path.dirname(output), `${path.parse(output).name}.jpg`);
execFileSync("ffmpeg", ["-v", "error", "-y", "-sseof", "-0.5", "-i", output, "-frames:v", "1", "-q:v", "2", still], {
  stdio: ["ignore", "inherit", "inherit"],
});

const clipSeconds = seconds(output);
const megabytes = fs.statSync(output).size / 1024 / 1024;
const wholeSeconds = Math.round(clipSeconds);
const clock = `${Math.floor(wholeSeconds / 60)}:${String(wholeSeconds % 60).padStart(2, "0")}`;
process.stdout.write(`clip:  ${output} (${clock}, ${megabytes.toFixed(1)} MB; raw ${rawSeconds.toFixed(1)} s)\n`);
process.stdout.write(`still: ${still}\n`);
if (megabytes > DECK_CLIP_LIMIT_MB) {
  process.stdout.write(`over the deck's ${DECK_CLIP_LIMIT_MB} MB clip limit: raise --crf or --speed\n`);
  process.exitCode = 1;
}
