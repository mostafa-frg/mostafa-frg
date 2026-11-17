#!/usr/bin/env bash
set -euo pipefail
PKG="/data/data/com.termux/files/usr/bin/pkg"
if [ ! -x "$PKG" ]; then
  printf '%s\n' "This installer is for Termux only."
  exit 1
fi
BASE="$(cd "$(dirname "$(readlink -f "$0")")" && pwd)"
BIN="$HOME/.local/bin"
mkdir -p "$BIN"
ok()   { printf '[✓] %s\n' "$1"; }
warn() { printf '[!] %s\n' "$1"; }
if [ "${MOSTA_SKIP_PKG_UPDATE:-0}" != "1" ]; then
  pkg update -y || warn "Package index update failed; trying the currently configured package cache."
fi
install_group() {
  local group="$1"
  shift
  local package_index=""
  local package
  local -a available=() unavailable=()
  if command -v apt-cache >/dev/null 2>&1; then
    package_index="$(apt-cache pkgnames 2>/dev/null || true)"
  fi
  for package in "$@"; do
    if [ -n "$package_index" ] && ! grep -Fxq "$package" <<<"$package_index"; then
      unavailable+=("$package")
    else
      available+=("$package")
    fi
  done
  if [ "${#available[@]}" -gt 0 ]; then
    printf '\n%s\n' "Installing $group package group (${#available[@]} packages)..."
    if pkg install -y "${available[@]}"; then
      ok "$group package batch completed"
    else
      warn "Batch install failed; retrying packages individually so one missing package cannot block the rest."
      for package in "${available[@]}"; do
        if pkg install -y "$package"; then ok "$package"; else warn "$package could not be installed from the enabled repositories"; fi
      done
    fi
  fi
  for package in "${unavailable[@]}"; do
    warn "$package is not listed in the currently enabled Termux repositories; skipped."
  done
}
core_packages=(
  nmap netcat-openbsd dnsutils tracepath traceroute tcpdump socat
  curl wget openssh whois iproute2 iputils jq openssl-tool procps
  lsof htop tmux rsync termux-tools coreutils grep sed gawk
  findutils file less tar unzip zip python git iperf3 ipcalc net-tools
)
extra_packages=(mtr strace ripgrep fd fzf tree ncdu micro figlet toilet)
install_group "core" "${core_packages[@]}"
if [ "${MOSTA_INSTALL_EXTRAS:-1}" != "0" ]; then
  install_group "extras" "${extra_packages[@]}"
else
  warn "Optional extras skipped because MOSTA_INSTALL_EXTRAS=0."
fi
aliases=(
  mnmap mnc mdig mtcpdump msocat mtracepath mtraceroute mwhois
  mcurl mwget mssh mnslookup mss mip mping mps mtop mjq mopenssl
  mhtop mtmux mrsync mlsof msha256sum mfile miperf3 mipcalc
  mnetstat mifconfig mmtr mstrace mripgrep mfd mfzf mtree mncdu
  mmicro mfiglet mtoilet mtermux-info mtermux-storage
)
for name in "${aliases[@]}"; do
  ln -sfn "$BASE/mosta-external" "$BIN/$name"
done
printf '\n%s\n' "Mosta Termux command links are ready."
printf '%s\n' "Run: mosta-doctor"
printf '%s\n' "List commands: mosta-tools"
printf '%s\n' "Re-run this installer any time: mosta-external-install"
printf '%s\n' "Package availability is checked against the enabled repositories; Android permissions can still restrict some operations."
