# Linux Desktop Tool Index

Reference index for native Linux desktop networking, administration, and security utilities.

The CSV maps each upstream tool to its optional command alias. The wrapper layer does not rename, reimplement, or bundle upstream executables.

From the repository root, install the optional Linux command aliases with:

    cd cyber-labs/mosta-terminal
    ./install.sh

Then inspect command availability:

    mosta-doctor
    mosta-tools

Tools that require elevated privileges, a graphical desktop, specialized hardware, or separate upstream installation are identified as optional. Availability depends on the Linux distribution and local configuration.