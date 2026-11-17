# MOSTA Terminal — Termux Installation and Field Guide

This guide installs the repository's command-line labs and a branded command layer inside the official Termux app on Android. It is written for a fresh Termux profile and does not require a GitHub token because this repository is public.

> Compatibility is reported honestly: a package is shown as installed only when its executable is present. Android permissions, device kernels, Wi-Fi drivers, CPU architecture, and repository mirrors can change what works on a particular phone. This is not a promise that every Linux desktop tool works on stock Android.

## 1. Before installing

1. Install Termux from an official source: [Termux app installation](https://github.com/termux/termux-app#installation).
2. Keep Termux and any Termux add-on apps from the same distribution source. Mixing signatures between sources can prevent add-ons from working.
3. Open Termux and wait for the first shell prompt.
4. Keep several hundred megabytes free if you want the optional command-line packages and Python lab dependencies.
5. Do not run random installer commands copied from unknown repositories. This project uses Git to download the public source so the files remain inspectable.

The package manager uses the repositories configured in your Termux installation. If a mirror is unavailable, use the official repository selector, then retry. The installer does not silently add third-party repositories.

## 2. Fresh installation — copy these commands

Run the commands one at a time in Termux:

    pkg update -y
    pkg install -y git
    git clone --depth 1 https://github.com/mostafa-frg/mostafa-frg.git
    cd mostafa-frg/cyber-labs/mosta-terminal
    bash install.sh

After installation, reload the active shell configuration:

    source ~/.zshrc 2>/dev/null || source ~/.bashrc 2>/dev/null || true
    hash -r

Now run the health check and command index:

    mosta-doctor
    mosta
    mosta-tools

The repository is installed under:

    $HOME/mostafa-frg

The launchers are linked into:

    $HOME/.local/bin

The installer adds that directory to existing Bash and Zsh startup files. If a command is not found, reload your shell and verify that the path is present:

    echo "$PATH"
    ls -la "$HOME/.local/bin"

## 3. One-paste installation

For a fresh Termux session, this is the same sequence in one command:

    pkg update -y && pkg install -y git && git clone --depth 1 https://github.com/mostafa-frg/mostafa-frg.git && cd mostafa-frg/cyber-labs/mosta-terminal && bash install.sh

Then run:

    source ~/.zshrc 2>/dev/null || source ~/.bashrc 2>/dev/null || true
    hash -r
    mosta-doctor

Do not append a pipe-to-shell command. Cloning first leaves the installer and its source code visible on disk for inspection.

## 4. What the installer does

The installer:

- Detects Termux and installs Python and Git when needed.
- Creates the Mosta command links under the user's home directory.
- Attempts the repository's Python requirements one project at a time.
- Continues past a failed optional Python dependency on Termux and prints a warning, rather than leaving the user with no command links.
- Checks the active Termux package index before requesting each native package group.
- Skips package names that are not listed in the currently enabled repositories.
- Retries packages individually if a grouped package installation fails.
- Creates fixed aliases that call the real upstream executable with the arguments you supplied.
- Does not add a third-party repository, change Android security settings, root the phone, or enable monitor mode.

The external package installer can be run again at any time:

    mosta-external-install

To install only the core package group and skip optional extras:

    MOSTA_INSTALL_EXTRAS=0 bash install.sh

The default is to attempt both the core group and optional extras. A skipped or unavailable package is a warning, not a successful installation. Run mosta-doctor to see the commands that are actually available.

## 5. Mosta's own Python and shell labs

These commands run the repository's own lab code. Use the built-in help before supplying data:

    mnet --help
    mhttp --help
    mpcap --help
    msoc --help
    mconf --help
    mroute --help
    mtriage --help
    mtool --help
    mfim --help
    mdet --help
    mlog --help
    mnorm --help
    mpipe --help

Additional lab commands:

    mrt
    mvlan
    mfw
    mospf
    mstp
    mnat
    macl
    msnmp
    msyslog
    mflow
    mipam
    msubnet
    mtopo
    mad
    mpriv
    mreport
    mcfg
    mdns
    mmon
    mscan
    mauto

A command may need a specific input file or argument. Read its help and the matching project README before using it. The installer does not make a lab compatible with Android if one of that lab's Python dependencies cannot run on the device.

## 6. Native network and administration commands

The Mosta aliases are wrappers, not replacements. For example, mnmap invokes the installed nmap executable, mip invokes ip, and mjq invokes jq. The original arguments are passed through unchanged.

| Alias | Underlying command | Typical purpose |
|---|---|---|
| mnmap | nmap | Authorized host and service discovery |
| mnc | nc | TCP/UDP connectivity checks |
| mdig | dig | DNS record lookup |
| mnslookup | nslookup | DNS lookup |
| mtcpdump | tcpdump | Packet capture where Android permissions allow |
| msocat | socat | Socket and stream diagnostics |
| mtracepath | tracepath | Path and MTU diagnostics |
| mtraceroute | traceroute | Network path tracing |
| mmtr | mtr | Combined latency and route view, if available |
| mwhois | whois | Domain registration lookup |
| mcurl | curl | HTTP requests and API checks |
| mwget | wget | File retrieval |
| mssh | ssh | Secure remote shell |
| mip | ip | Interface, route, and neighbour inspection |
| mping | ping | ICMP reachability |
| mss | ss | Socket statistics |
| mps | ps | Process listing |
| mtop | top | Live process view |
| mjq | jq | JSON parsing and filtering |
| mopenssl | openssl | TLS and cryptographic diagnostics |
| miperf3 | iperf3 | Throughput tests between authorized endpoints |
| mipcalc | ipcalc | IPv4 subnet calculations |
| mhtop | htop | Interactive process monitor |
| mtmux | tmux | Persistent terminal sessions |
| mrsync | rsync | File synchronization |
| mlsof | lsof | Open files and sockets |
| msha256sum | sha256sum | File integrity hashes |
| mfile | file | File type identification |

Optional aliases are also created when their packages are available:

    mnetstat     netstat
    mifconfig    ifconfig
    mstrace      strace
    mripgrep     rg
    mfd          fd
    mfzf         fzf
    mtree        tree
    mncdu        ncdu
    mmicro       micro
    mfiglet      figlet
    mtoilet      toilet

Termux environment helpers:

    mtermux-info
    mtermux-storage

The storage helper asks Android for shared-storage access. It does not grant unrestricted access to the whole Android filesystem.

## 7. Practical examples

### Inspect your phone's network

    mip -br addr
    mip route
    mss -tuna
    mping -c 4 1.1.1.1

Some socket and interface details may be hidden by Android's app sandbox.

### Check DNS

    mdig example.com A
    mdig example.com AAAA
    mnslookup example.com
    mwhois example.com

### Check a host you own or are authorized to assess

Replace the example private address with a device on your own lab network:

    mnmap -sT -sV -p 22,80,443 192.168.1.10

For an unrooted Android device, TCP connect scans are generally a more compatible starting point than raw-packet SYN scans. Do not scan public or third-party targets without explicit authorization.

### Measure throughput between your own devices

On the device acting as the test server:

    miperf3 -s

On the client device, use the server's private LAN address:

    miperf3 -c 192.168.1.10 -t 10

Stop the server when the test is complete. Do not expose an iperf3 server to an untrusted network.

### Calculate a subnet

    mipcalc 192.168.10.0/24

### Filter JSON

    mjq '.events[] | .src_ip' events.json

### Inspect a TLS endpoint

    mopenssl s_client -connect example.com:443 -servername example.com

This makes a normal TLS connection to the named host. It is not a vulnerability scan.

### Capture packets — only where permitted

    mtcpdump -D
    mtcpdump -i any -c 50 -w capture.pcap

Packet capture may fail on an unrooted Android phone because Android restricts raw socket and interface access. The alias cannot bypass those restrictions. If capture is unavailable, use an authorized capture source and analyze the supplied file with the repository's offline PCAP lab:

    mpcap --help

### Check file integrity

    mfim --help

The File Integrity Monitor supports a baseline and later comparison. Read its project README for the exact init/check syntax and protect any HMAC key as a secret.

## 8. Tool groups and platform boundaries

### Intended for the Termux core set

The installer attempts portable command-line packages for network diagnostics, DNS, sockets, packet tools, process inspection, JSON, TLS, file integrity, transfer, and terminal sessions. Availability is checked against the repositories configured on the phone.

### Optional Termux packages

MTR, strace, ripgrep, fd, fzf, tree, ncdu, micro, figlet, and toilet are optional. They are useful additions, but the script skips any package missing from the active repository.

### Not promised on stock Android

The following tools may require a full Linux distribution, GUI stack, root access, kernel features, special repositories, or device-specific setup:

- Wireshark GUI, Burp Suite, and OWASP ZAP.
- Aircrack-ng, Kismet, Wifite, and monitor-mode workflows.
- Raw packet capture and raw-socket scans.
- Masscan, Metasploit, Zeek, Suricata, and other larger Linux-oriented tools.
- Any feature that requires kernel modules or privileged access unavailable to the Termux app.

The catalog may contain aliases for Linux tools, but a wrapper does not install the upstream program. If the executable is absent, the wrapper exits with a clear command-not-installed message.

## 9. Monitor mode and Wi-Fi injection: important reality check

Termux alone cannot guarantee monitor mode or packet injection. These capabilities depend on all of the following:

- Android version and kernel configuration.
- Root status and the permissions available to the Termux process.
- The Wi-Fi chipset and its driver.
- Whether an external USB adapter is supported by the device and kernel.
- USB OTG power and hardware compatibility.
- The specific tool build and interface support.

Do not assume that installing Aircrack-ng or Nmap automatically enables monitor mode. The toolkit deliberately does not claim to bypass Android restrictions.

## 10. Troubleshooting

### Package not found

Refresh the index and choose a working official mirror:

    pkg update -y
    termux-change-repo
    pkg update -y

Then rerun:

    mosta-external-install

The package list available from a mirror can differ or be temporarily unavailable. The installer skips package names that are not present in the active package index.

### Command not found after installation

    source ~/.zshrc 2>/dev/null || source ~/.bashrc 2>/dev/null || true
    hash -r
    echo "$PATH"
    ls -la "$HOME/.local/bin"

If the local bin directory is not in PATH, add this line to the startup file for the shell you actually use:

    export PATH="$HOME/.local/bin:$PATH"

Restart Termux or source that file again.

### Python dependency failed

The installer reports the specific requirements file that failed and continues creating command links on Termux. This means some labs may remain unavailable until their dependency is installed successfully.

Update the Termux package index first:

    pkg update -y
    pkg install -y python clang make pkg-config openssl-tool libffi

Then inspect the affected project's requirements file and retry only that project:

    python3 -m pip install -r ../PROJECT-DIRECTORY/requirements.txt

Replace PROJECT-DIRECTORY with the actual lab folder. Do not install arbitrary dependency files from unknown repositories.

### Storage permission

Run only if you need to access shared Android folders:

    mtermux-storage

Then approve the Android permission dialog. You can inspect the shared-storage links with:

    ls -la "$HOME/storage"

### Network tool reports permission denied

This is commonly an Android permission, kernel, or root boundary rather than a broken Mosta alias. Try a non-privileged diagnostic first, such as ping, DNS lookup, or an Nmap TCP connect scan. Do not try to bypass Android's sandbox.

### Termux repository or signature problems

Use the official Termux installation instructions and repository configuration. Avoid mixing Termux APKs and add-ons from different sources, and do not add random third-party signing keys to make one package install.

## 11. Update the toolkit

From the repository directory:

    cd "$HOME/mostafa-frg"
    git pull --ff-only
    cd cyber-labs/mosta-terminal
    bash install.sh

Then verify:

    mosta-doctor
    mosta-tools

The installer refreshes the links and retries the supported package groups. It does not change Production services or remote databases.

## 12. Security and safe-use rules

- Test only your own systems, lab devices, or targets covered by written authorization.
- Use Nmap, Netcat, packet capture, and throughput tools only within the scope you are allowed to test.
- Do not put passwords, API keys, or private tokens in command history, screenshots, public issues, or sample files.
- Treat packet captures and logs as potentially sensitive data.
- Keep Termux and packages updated from trusted official sources.
- Review commands before running them, especially commands that write files, change network state, or contact remote hosts.

Mosta adds a consistent command interface and diagnostics. It does not make an upstream tool safer by itself, bypass Android controls, or guarantee that every feature works on every device.
