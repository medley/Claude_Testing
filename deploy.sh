#!/bin/bash

# Fast deploy script - only stages tracked files
set -e

# Check if in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a git repository"
    exit 1
fi

# Check for changes
if git diff-index --quiet HEAD -- 2>/dev/null; then
    echo "✅ No changes to commit"
    exit 0
fi

# Get commit message
if [ -z "$1" ]; then
    echo "💬 Enter commit message:"
    read -r COMMIT_MSG
else
    COMMIT_MSG="$1"
fi

# Validate commit message
if [ -z "$COMMIT_MSG" ]; then
    echo "❌ Error: Commit message cannot be empty"
    exit 1
fi

# Stage ONLY tracked files (no directory scanning)
echo "📦 Staging changes..."
git add -u

echo "💾 Committing: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"

echo "🚀 Pushing to GitHub..."
git push

echo ""
echo "✅ Successfully deployed!"
echo "🌐 Live in 2-3 minutes: https://medley.github.io/kids-games/"
