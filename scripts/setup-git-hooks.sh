#!/usr/bin/env sh
# Enable this repository's versioned Git hooks for the current clone.
set -eu

git config core.hooksPath .githooks
echo "Git hooks enabled. Install TruffleHog if needed: brew install trufflehog"
