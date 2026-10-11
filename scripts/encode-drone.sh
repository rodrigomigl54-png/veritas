#!/usr/bin/env bash
# Intro + hero clips from the winery's own drone video (assets/source/veritas-drone.mp4, 1080×1920 portrait).
#  - portrait versions (phones): full frame 1080×1920
#  - landscape versions (desktop): 16:9 crop with the horizon in the upper third, Lanczos-scaled to 1920×1080
set -euo pipefail
cd "$(dirname "$0")/.."
SRC=assets/source/veritas-drone.mp4
OUT=public/video
mkdir -p "$OUT"
LOOK="cas=0.35,eq=saturation=1.06:contrast=1.03"
P="fps=30,$LOOK,format=yuv420p"
L="fps=30,crop=1080:608:0:640,scale=1920:1080:flags=lanczos,$LOOK,format=yuv420p"
INTRO="trim=start=0:end=5.6,setpts=PTS-STARTPTS"
HERO="trim=start=0:end=9.5,setpts=PTS-STARTPTS,fade=t=in:st=0:d=0.5,fade=t=out:st=9.0:d=0.5"
enc() { # $1 filter $2 name $3 x264 crf $4 vp9 crf $5 maxrate
  ffmpeg -v error -y -i "$SRC" -vf "$1" -an -c:v libx264 -preset slow -crf "$3" -maxrate "$5" -bufsize 16M -profile:v high -movflags +faststart "$OUT/$2.mp4"
  ffmpeg -v error -y -i "$SRC" -vf "$1" -an -c:v libvpx-vp9 -crf "$4" -b:v "$5" -row-mt 1 "$OUT/$2.webm"
}
enc "$INTRO,$P" intro-portrait 23 33 6M
enc "$INTRO,$L" intro-landscape 22 32 6M
enc "$HERO,$P" hero-portrait 25 36 4M
enc "$HERO,$L" hero-landscape 24 35 4M
ffmpeg -v error -y -ss 0 -i "$SRC" -vf "$LOOK" -frames:v 1 -q:v 3 "$OUT/poster-portrait.jpg"
ffmpeg -v error -y -ss 0 -i "$SRC" -vf "crop=1080:608:0:640,scale=1920:1080:flags=lanczos,$LOOK" -frames:v 1 -q:v 3 "$OUT/poster-landscape.jpg"
mkdir -p assets/source/frames
ffmpeg -v error -y -ss 4 -i "$SRC" -vf "crop=1080:608:0:640,scale=1920:1080:flags=lanczos,$LOOK" -frames:v 1 -q:v 2 assets/source/frames/veritas-dron-wide.jpg
ffmpeg -v error -y -ss 6 -i "$SRC" -vf "$LOOK" -frames:v 1 -q:v 2 assets/source/frames/veritas-dron-tall.jpg
echo drone done
