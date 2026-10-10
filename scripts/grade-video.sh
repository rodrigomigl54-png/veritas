#!/usr/bin/env bash
# Builds the intro / hero videos from the source drone clip (Pexels #19237031) with a warm
# "golden hour" grade, lanczos upscale + contrast-adaptive sharpening, sun glow and vignette.
# Usage: bash scripts/grade-video.sh   (needs ffmpeg with libx264 + libvpx-vp9)
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=assets/source/pexels-vineyard-drone-19237031.mp4
GLOW=assets/source/sun-glow.png
OUT=public/video
mkdir -p "$OUT"
GRADE="cas=0.45,colortemperature=temperature=4700:mix=0.8,eq=contrast=1.12:saturation=1.32:gamma=0.94,curves=r='0/0.03 0.5/0.55 1/1':g='0/0.02 0.5/0.48 1/0.96':b='0/0.03 0.5/0.40 1/0.84',vignette=angle=PI/4.6,format=gbrp"
grade() { # $1=w $2=h $3=trim/speed filter prefix
  echo "[0:v]$3,scale=$1:$2:flags=lanczos,$GRADE[a];[1:v]scale=$1:$2,format=gbrp[g];[a][g]blend=all_mode=screen:all_opacity=0.7,format=yuv420p[v]"
}
# Intro flight: 2.5–9.5 s at 1.4× → 5 s, ends on the horizon (then the camera whips up into the sky).
INTRO="trim=start=2.5:end=9.5,setpts=(PTS-STARTPTS)/1.4,fps=30"
ffmpeg -v error -y -i "$SRC" -loop 1 -i "$GLOW" -filter_complex "$(grade 1920 1080 "$INTRO")" -map "[v]" -an -t 5 -c:v libx264 -preset slow -crf 23 -maxrate 6M -bufsize 12M -profile:v high -movflags +faststart "$OUT/intro-drone-1080.mp4"
ffmpeg -v error -y -i "$SRC" -loop 1 -i "$GLOW" -filter_complex "$(grade 1920 1080 "$INTRO")" -map "[v]" -an -t 5 -c:v libvpx-vp9 -crf 34 -b:v 5M -maxrate 6M -row-mt 1 "$OUT/intro-drone-1080.webm"
ffmpeg -v error -y -i "$SRC" -loop 1 -i "$GLOW" -filter_complex "$(grade 1280 720 "$INTRO")" -map "[v]" -an -t 5 -c:v libx264 -preset slow -crf 25 -maxrate 3M -bufsize 6M -movflags +faststart "$OUT/intro-drone-720.mp4"
ffmpeg -v error -y -i "$SRC" -loop 1 -i "$GLOW" -filter_complex "$(grade 1280 720 "$INTRO")" -map "[v]" -an -t 5 -c:v libvpx-vp9 -crf 37 -b:v 2500k -maxrate 3M -row-mt 1 "$OUT/intro-drone-720.webm"
# Hero loop: 3–9 s slowed to 0.6× (10 s) with short dips to dark so the loop seam is invisible.
HERO="trim=start=3:end=9,setpts=(PTS-STARTPTS)/0.6,fps=30,fade=t=in:st=0:d=0.6,fade=t=out:st=9.4:d=0.6"
ffmpeg -v error -y -i "$SRC" -loop 1 -i "$GLOW" -filter_complex "$(grade 1600 900 "$HERO")" -map "[v]" -an -t 10 -c:v libx264 -preset slow -crf 27 -maxrate 2500k -bufsize 5M -movflags +faststart "$OUT/hero-loop.mp4"
ffmpeg -v error -y -i "$SRC" -loop 1 -i "$GLOW" -filter_complex "$(grade 1600 900 "$HERO")" -map "[v]" -an -t 10 -c:v libvpx-vp9 -crf 40 -b:v 2M -maxrate 2500k -row-mt 1 "$OUT/hero-loop.webm"
# Stills (posters, section photos, gallery) from the graded footage.
mkdir -p assets/source/frames
for t in 0.7 3.5 6.5 8.5 9.8 11.5; do
  ffmpeg -v error -y -ss "$t" -i "$SRC" -loop 1 -i "$GLOW" -filter_complex "$(grade 1920 1080 "null")" -map "[v]" -frames:v 1 -q:v 2 "assets/source/frames/dron-$t.jpg"
done
cp assets/source/frames/dron-3.5.jpg "$OUT/intro-poster.jpg"
echo done
