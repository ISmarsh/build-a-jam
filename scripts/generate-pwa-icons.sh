#!/usr/bin/env bash
#
# generate-pwa-icons.sh — Generate PWA icons from a Lucide icon + color scheme
#
# Convention: Use Lucide icons (ISC licensed) as the source glyph,
# render via ImageMagick onto a colored background with configurable
# padding, corner rounding, and maskable safe-zone compliance.
#
# USAGE:
#   ./generate-pwa-icons.sh [options]
#
# OPTIONS:
#   -i, --icon <name>        Lucide icon name (e.g., "music", "zap", "brain")
#   -b, --bg <hex>           Background color as hex (e.g., "#6d28d9")
#   -f, --fg <hex>           Foreground/stroke color (default: "#ffffff")
#   -s, --stroke <width>     Stroke width in SVG units (default: 2)
#   -o, --outdir <path>      Output directory (default: ./public)
#   -p, --padding <percent>  Icon padding as % of canvas (default: 20)
#   -r, --round <pixels>     Corner radius for regular icons, 0=square (default: 80)
#   --no-maskable            Skip maskable icon generation
#   --no-favicon             Skip favicon.ico generation
#   --no-apple               Skip apple-touch-icon generation
#   -h, --help               Show this help
#
# DEPENDENCIES:
#   - ImageMagick 7+ (magick command)
#   - Node.js + npm — to fetch lucide-static SVGs (or provide your own)
#
# INSTALL DEPENDENCIES:
#   Windows:      winget install ImageMagick.ImageMagick
#   Ubuntu/WSL2:  sudo apt install imagemagick
#   macOS:        brew install imagemagick
#
# EXAMPLES:
#   # Build-a-Jam: music icon, purple background
#   ./generate-pwa-icons.sh -i music -b "#6d28d9"
#
#   # Ohm: zap icon, dark blue background, thicker stroke
#   ./generate-pwa-icons.sh -i zap -b "#1a1a2e" -s 2.5
#
#   # Custom SVG (skip lucide fetch)
#   ./generate-pwa-icons.sh -i ./my-custom-icon.svg -b "#059669"

set -euo pipefail

# ── Defaults ──────────────────────────────────────────────────────────
ICON_NAME=""
BG_COLOR="#6d28d9"
FG_COLOR="#ffffff"
STROKE_WIDTH="2"
OUT_DIR="./public"
PADDING_PERCENT=20
CORNER_RADIUS=80
GEN_MASKABLE=true
GEN_FAVICON=true
GEN_APPLE=true

# ── PWA icon sizes ───────────────────────────────────────────────────
# Standard sizes needed for a complete PWA manifest
SIZES=(64 192 512)
APPLE_SIZE=180
FAVICON_SIZES=(16 32 48)

# Maskable icons need a larger safe zone (padding)
# Per spec: 10% on each side minimum, we use 20% for comfort
MASKABLE_PADDING_PERCENT=25

# ── Parse arguments ──────────────────────────────────────────────────
show_help() {
  sed -n '/^# USAGE:/,/^# EXAMPLES:/p' "$0" | sed 's/^# \?//'
  echo ""
  echo "  # Build-a-Jam: music icon, purple background"
  echo "  ./generate-pwa-icons.sh -i music -b \"#6d28d9\""
  exit 0
}

while [[ $# -gt 0 ]]; do
  case $1 in
    -i|--icon)       ICON_NAME="$2"; shift 2 ;;
    -b|--bg)         BG_COLOR="$2"; shift 2 ;;
    -f|--fg)         FG_COLOR="$2"; shift 2 ;;
    -s|--stroke)     STROKE_WIDTH="$2"; shift 2 ;;
    -o|--outdir)     OUT_DIR="$2"; shift 2 ;;
    -p|--padding)    PADDING_PERCENT="$2"; shift 2 ;;
    -r|--round)      CORNER_RADIUS="$2"; shift 2 ;;
    --no-maskable)   GEN_MASKABLE=false; shift ;;
    --no-favicon)    GEN_FAVICON=false; shift ;;
    --no-apple)      GEN_APPLE=false; shift ;;
    -h|--help)       show_help ;;
    *)               echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [[ -z "$ICON_NAME" ]]; then
  echo "Error: --icon is required (lucide icon name or path to .svg)"
  echo "Run with --help for usage."
  exit 1
fi

# ── Resolve source SVG ───────────────────────────────────────────────
WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

if [[ -f "$ICON_NAME" ]]; then
  # Direct path to SVG provided
  SOURCE_SVG="$ICON_NAME"
  echo "Using custom SVG: $SOURCE_SVG"
else
  # Fetch from lucide-static npm package
  LUCIDE_SVG="node_modules/lucide-static/icons/${ICON_NAME}.svg"
  if [[ ! -f "$LUCIDE_SVG" ]]; then
    echo "Lucide icon '$ICON_NAME' not found locally. Installing lucide-static..."
    npm install --no-save lucide-static 2>/dev/null
  fi
  if [[ ! -f "$LUCIDE_SVG" ]]; then
    echo "Error: Lucide icon '$ICON_NAME' not found."
    echo "Browse available icons at: https://lucide.dev/icons/"
    exit 1
  fi
  SOURCE_SVG="$LUCIDE_SVG"
  echo "Using Lucide icon: $ICON_NAME ($SOURCE_SVG)"
fi

# ── Prepare the icon SVG ─────────────────────────────────────────────
# Lucide SVGs use stroke="currentColor" which must be replaced.
# Also adjust stroke-width if requested.
PREPARED_SVG="$WORK_DIR/icon-prepared.svg"
sed \
  -e "s/stroke=\"currentColor\"/stroke=\"${FG_COLOR}\"/g" \
  -e "s/stroke-width=\"[^\"]*\"/stroke-width=\"${STROKE_WIDTH}\"/g" \
  "$SOURCE_SVG" > "$PREPARED_SVG"

echo "Config: bg=$BG_COLOR fg=$FG_COLOR stroke=$STROKE_WIDTH padding=${PADDING_PERCENT}%"

# ── Helper: generate a single icon ───────────────────────────────────
generate_icon() {
  local size=$1
  local output=$2
  local padding_pct=$3
  local radius=$4

  local icon_size=$(( size * (100 - 2 * padding_pct) / 100 ))
  local offset=$(( (size - icon_size) / 2 ))

  # Step 1: Create background
  local bg_file="$WORK_DIR/bg-${size}.png"
  magick -size "${size}x${size}" "xc:${BG_COLOR}" "$bg_file"

  # Step 2: Render SVG to PNG at target size
  local icon_file="$WORK_DIR/icon-${size}.png"
  magick -density 600 -background none "$PREPARED_SVG" \
    -resize "${icon_size}x${icon_size}" \
    -gravity center \
    -extent "${icon_size}x${icon_size}" \
    "$icon_file"

  # Step 3: Composite icon onto background
  local composite_file="$WORK_DIR/composite-${size}.png"
  magick "$bg_file" "$icon_file" \
    -gravity center -composite \
    "$composite_file"

  # Step 4: Apply corner rounding (if radius > 0)
  if [[ "$radius" -gt 0 ]]; then
    local mask_file="$WORK_DIR/mask-${size}.png"
    magick -size "${size}x${size}" xc:none \
      -fill white -draw "roundrectangle 0,0,$((size-1)),$((size-1)),$radius,$radius" \
      "$mask_file"
    magick "$composite_file" "$mask_file" \
      -alpha off -compose CopyOpacity -composite \
      "$output"
  else
    cp "$composite_file" "$output"
  fi

  echo "  ✓ ${output} (${size}x${size}, padding=${padding_pct}%, radius=${radius}px)"
}

# ── Generate all icons ───────────────────────────────────────────────
mkdir -p "$OUT_DIR"

echo ""
echo "Generating PWA icons..."

# Standard icons (with corner rounding)
for size in "${SIZES[@]}"; do
  generate_icon "$size" "${OUT_DIR}/pwa-${size}x${size}.png" "$PADDING_PERCENT" "$CORNER_RADIUS"
done

# Maskable icons (larger padding, no rounding — OS applies its own mask)
if $GEN_MASKABLE; then
  echo ""
  echo "Generating maskable icons..."
  for size in "${SIZES[@]}"; do
    generate_icon "$size" "${OUT_DIR}/pwa-maskable-${size}x${size}.png" "$MASKABLE_PADDING_PERCENT" 0
  done
fi

# Apple touch icon (180x180, with rounding)
if $GEN_APPLE; then
  echo ""
  echo "Generating Apple touch icon..."
  generate_icon "$APPLE_SIZE" "${OUT_DIR}/apple-touch-icon.png" "$PADDING_PERCENT" 40
fi

# Favicon.ico (multi-resolution)
if $GEN_FAVICON; then
  echo ""
  echo "Generating favicon.ico..."
  FAVICON_ARGS=()
  for size in "${FAVICON_SIZES[@]}"; do
    local_file="$WORK_DIR/favicon-${size}.png"
    generate_icon "$size" "$local_file" 15 0
    FAVICON_ARGS+=("$local_file")
  done
  magick "${FAVICON_ARGS[@]}" "${OUT_DIR}/favicon.ico"
  echo "  ✓ ${OUT_DIR}/favicon.ico (${FAVICON_SIZES[*]})"
fi

# ── Summary ──────────────────────────────────────────────────────────
echo ""
echo "Done! Generated icons in ${OUT_DIR}/"
echo ""
echo "Add to your manifest:"
echo '  icons: ['
for size in "${SIZES[@]}"; do
  echo "    { src: \"pwa-${size}x${size}.png\", sizes: \"${size}x${size}\", type: \"image/png\" },"
done
if $GEN_MASKABLE; then
  echo "    { src: \"pwa-maskable-512x512.png\", sizes: \"512x512\", type: \"image/png\", purpose: \"maskable\" },"
fi
echo '  ]'
