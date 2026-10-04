# Mosta Tool Index

Reference index for native Linux/Termux security and networking tools.

The CSV maps each upstream tool to its intended Mosta command alias. Mosta does not rename or reimplement the upstream executable.

For the supported core Termux networking set:

    cd ../mosta-terminal
    ./install.sh

Then inspect availability with:

    mosta-doctor
    mosta-tools

Tools that require root, extra repositories, GUI components, or device-specific capabilities are intentionally treated as separate compatibility cases.
