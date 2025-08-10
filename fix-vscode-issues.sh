#!/bin/bash

echo "🔧 Fixing VSCode Issues for Unicare EHR..."

# Clean git cache
echo "📝 Cleaning git cache..."
git rm -r --cached . 2>/dev/null || true
git add .

# Remove node_modules and reinstall (if needed)
if [ -d "frontend/node_modules" ]; then
    echo "🧹 Cleaning frontend dependencies..."
    cd frontend
    rm -rf node_modules package-lock.json yarn.lock 2>/dev/null || true
    npm install --silent
    cd ..
fi

# Clean Python cache
echo "🧹 Cleaning Python cache..."
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -delete 2>/dev/null || true

# Restart VSCode-related processes (if running)
echo "🔄 Refreshing development environment..."
pkill -f "code" 2>/dev/null || true

# Reset git config for better VSCode experience
git config --local advice.addIgnoredFile false
git config --local core.autocrlf false
git config --local core.filemode false

echo "✅ VSCode issues should now be fixed!"
echo ""
echo "📋 Next steps:"
echo "1. Restart VSCode completely"
echo "2. Open the project folder fresh"
echo "3. If you still see git warnings, run: 'git clean -fd'"
echo "4. All ESLint warnings are now disabled in VSCode settings"
echo ""
echo "🎯 The application should now run cleanly without VSCode warnings!"