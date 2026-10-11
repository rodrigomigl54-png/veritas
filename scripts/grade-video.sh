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
# (The intro/hero drone clips now come from the winery's own video: scripts/encode-drone.sh.)
# Sky (Pexels #11519743): real blue sky with drifting clouds for the barrel + glasses scene.
SKY=assets/source/intro/pexels-sky-11519743.mp4
ffmpeg -v error -y -i "$SKY" -vf "trim=start=0:end=8,setpts=PTS-STARTPTS,fps=30,scale=1920:1080:flags=lanczos,eq=saturation=1.12:contrast=1.04,format=yuv420p" -an -c:v libx264 -preset slow -crf 25 -maxrate 4M -bufsize 8M -movflags +faststart "$OUT/sky-1080.mp4"
ffmpeg -v error -y -i "$SKY" -vf "trim=start=0:end=8,setpts=PTS-STARTPTS,fps=30,scale=1920:1080:flags=lanczos,eq=saturation=1.12:contrast=1.04" -an -c:v libvpx-vp9 -crf 36 -b:v 3M -row-mt 1 "$OUT/sky-1080.webm"
ffmpeg -v error -y -i "$SKY" -vf "trim=start=0:end=8,setpts=PTS-STARTPTS,fps=30,scale=1280:720:flags=lanczos,eq=saturation=1.12:contrast=1.04,format=yuv420p" -an -c:v libx264 -preset slow -crf 27 -maxrate 2M -bufsize 4M -movflags +faststart "$OUT/sky-720.mp4"
ffmpeg -v error -y -ss 0 -i "$SKY" -vf "scale=1920:1080:flags=lanczos,eq=saturation=1.12:contrast=1.04" -frames:v 1 -q:v 3 "$OUT/sky-poster.jpg"
echo sky done
