#!/usr/bin/env bash
set -euo pipefail

raw="${1-}"

# Quitar acentos y pasar a ASCII
transliterated="$(printf '%s' "$raw" | iconv -f UTF-8 -t ASCII//TRANSLIT 2>/dev/null)" || transliterated="$raw"

# Minúsculas + caracteres válidos + limpieza de guiones
slug="$(printf '%s' "$transliterated" \
  | tr '[:upper:]' '[:lower:]' \
  | sed -E 's/[^a-z0-9_-]+/-/g; s/-+/-/g; s/^[-_]+//; s/[-_]+$//')"

if [ -z "$slug" ]; then
  printf 'Error: el nombre "%s" no produce un nombre de worktree válido.\n' "$raw" >&2
  exit 1
fi

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

max_len=50
hash_len=4

# Simplificar nombres demasiado largos
if [ "${#slug}" -gt "$max_len" ]; then
  base="${slug:0:$max_len}"
  # Cortar en el último guion para no partir palabras
  if [[ "$base" == *-* ]]; then
    base="${base%-*}"
  fi
  [ -n "$base" ] && slug="$base" || slug="${slug:0:$max_len}"
fi

# Sufijo corto solo si el nombre ya existe
if [ -e ".worktrees/$slug" ] || git show-ref --verify --quiet "refs/heads/$slug"; then
  base="${slug:0:$((max_len - hash_len - 1))}"
  [[ "$base" == *-* ]] && base="${base%-*}"
  suffix="$(printf '%s' "$slug" | sha1sum | cut -c1-4)"
  slug="${base}-${suffix}"
fi

printf 'Creando worktree en .worktrees/%s\n' "$slug"
git worktree add ".worktrees/$slug"
