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
# Bright, fresh summer look: denoise, Lanczos upscale (in grade()), strong adaptive sharpening,
# lifted mids, greener foliage, clear (slightly bluer) sky, very light vignette.
GRADE="cas=0.55,eq=brightness=0.035:contrast=1.06:saturation=1.38:gamma=1.08,colorbalance=rs=-0.03:gs=0.05:bs=0.02:rm=-0.05:gm=0.07:bm=-0.02:rh=-0.02:gh=0.02:bh=0.05,curves=g='0/0 0.5/0.54 1/1',vignette=angle=PI/6,format=gbrp"
grade() { # $1=w $2=h $3=trim/speed filter prefix
  echo "[0:v]$3,scale=$1:$2:flags=lanczos,$GRADE[a];[1:v]scale=$1:$2,format=gbrp[g];[a][g]blend=all_mode=screen:all_opacity=0.12,format=yuv420p[v]"
}
# Intro flight: 2.5–9.5 s at 1.4× → 5 s, ends on the horizon (then the camera whips up into the sky).
INTRO="trim=start=3.0:end=8.6,setpts=(PTS-STARTPTS)/1.4,fps=30"
ffmpeg -v error -y -i "$SRC" -loop 1 -i "$GLOW" -filter_complex "$(grade 1920 1080 "$INTRO")" -map "[v]" -an -t 4 -c:v libx264 -preset slow -crf 20 -maxrate 9M -bufsize 18M -profile:v high -movflags +faststart "$OUT/intro-drone-1080.mp4"
ffmpeg -v error -y -i "$SRC" -loop 1 -i "$GLOW" -filter_complex "$(grade 1920 1080 "$INTRO")" -map "[v]" -an -t 4 -c:v libvpx-vp9 -crf 30 -b:v 7M -maxrate 9M -row-mt 1 "$OUT/intro-drone-1080.webm"
ffmpeg -v error -y -i "$SRC" -loop 1 -i "$GLOW" -filter_complex "$(grade 1280 720 "$INTRO")" -map "[v]" -an -t 4 -c:v libx264 -preset slow -crf 25 -maxrate 3M -bufsize 6M -movflags +faststart "$OUT/intro-drone-720.mp4"
ffmpeg -v error -y -i "$SRC" -loop 1 -i "$GLOW" -filter_complex "$(grade 1280 720 "$INTRO")" -map "[v]" -an -t 4 -c:v libvpx-vp9 -crf 37 -b:v 2500k -maxrate 3M -row-mt 1 "$OUT/intro-drone-720.webm"
# Hero loop: 3–9 s slowed to 0.6× (10 s) with short dips to dark so the loop seam is invisible.
HERO="trim=start=3:end=9,setpts=(PTS-STARTPTS)/0.6,fps=30,fade=t=in:st=0:d=0.6,fade=t=out:st=9.4:d=0.6"
ffmpeg -v error -y -i "$SRC" -loop 1 -i "$GLOW" -filter_complex "$(grade 1600 900 "$HERO")" -map "[v]" -an -t 10 -c:v libx264 -preset slow -crf 23 -maxrate 4M -bufsize 8M -movflags +faststart "$OUT/hero-loop.mp4"
ffmpeg -v error -y -i "$SRC" -loop 1 -i "$GLOW" -filter_complex "$(grade 1600 900 "$HERO")" -map "[v]" -an -t 10 -c:v libvpx-vp9 -crf 34 -b:v 3M -maxrate 4M -row-mt 1 "$OUT/hero-loop.webm"
# Stills (posters, section photos, gallery) from the graded footage.
mkdir -p assets/source/frames
for t in 0.7 3.5 6.5 8.5 9.8 11.5; do
  ffmpeg -v error -y -ss "$t" -i "$SRC" -loop 1 -i "$GLOW" -filter_complex "$(grade 1920 1080 "null")" -map "[v]" -frames:v 1 -q:v 2 "assets/source/frames/dron-$t.jpg"
done
cp assets/source/frames/dron-3.5.jpg "$OUT/intro-poster.jpg"
echo done

# Sky (Pexels #11519743): real blue sky with drifting clouds for the barrel + glasses scene.
SKY=assets/source/intro/pexels-sky-11519743.mp4
ffmpeg -v error -y -i "$SKY" -vf "trim=start=0:end=8,setpts=PTS-STARTPTS,fps=30,scale=1920:1080:flags=lanczos,eq=saturation=1.12:contrast=1.04,format=yuv420p" -an -c:v libx264 -preset slow -crf 25 -maxrate 4M -bufsize 8M -movflags +faststart "$OUT/sky-1080.mp4"
ffmpeg -v error -y -i "$SKY" -vf "trim=start=0:end=8,setpts=PTS-STARTPTS,fps=30,scale=1920:1080:flags=lanczos,eq=saturation=1.12:contrast=1.04" -an -c:v libvpx-vp9 -crf 36 -b:v 3M -row-mt 1 "$OUT/sky-1080.webm"
ffmpeg -v error -y -i "$SKY" -vf "trim=start=0:end=8,setpts=PTS-STARTPTS,fps=30,scale=1280:720:flags=lanczos,eq=saturation=1.12:contrast=1.04,format=yuv420p" -an -c:v libx264 -preset slow -crf 27 -maxrate 2M -bufsize 4M -movflags +faststart "$OUT/sky-720.mp4"
ffmpeg -v error -y -ss 0 -i "$SKY" -vf "scale=1920:1080:flags=lanczos,eq=saturation=1.12:contrast=1.04" -frames:v 1 -q:v 3 "$OUT/sky-poster.jpg"
echo sky done
