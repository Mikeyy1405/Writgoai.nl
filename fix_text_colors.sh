#!/bin/bash

echo "🎨 Fixing text colors for better readability..."
echo ""

# Navigate to nextjs_space directory
cd /home/ubuntu/writgoai_app/nextjs_space || exit 1

# Count occurrences before fixing
echo "📊 Current color usage:"
echo "  text-gray-800: $(grep -r "text-gray-800" app/ components/ --include="*.tsx" --include="*.jsx" 2>/dev/null | wc -l) occurrences"
echo "  text-gray-700: $(grep -r "text-gray-700" app/ components/ --include="*.tsx" --include="*.jsx" 2>/dev/null | wc -l) occurrences"
echo "  text-blue-900: $(grep -r "text-blue-900" app/ components/ --include="*.tsx" --include="*.jsx" 2>/dev/null | wc -l) occurrences"
echo "  text-blue-800: $(grep -r "text-blue-800" app/ components/ --include="*.tsx" --include="*.jsx" 2>/dev/null | wc -l) occurrences"
echo ""

# Fix gray colors (make them lighter for better contrast on white bg)
echo "🔧 Fixing gray colors..."
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's/text-gray-900/text-gray-800/g' {} + 2>/dev/null
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's/text-gray-800/text-gray-700/g' {} + 2>/dev/null

# Fix blue colors (make them lighter)
echo "🔧 Fixing blue colors..."
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's/text-blue-900/text-blue-700/g' {} + 2>/dev/null
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's/text-blue-800/text-blue-600/g' {} + 2>/dev/null

# Fix slate colors
echo "🔧 Fixing slate colors..."
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's/text-slate-900/text-slate-700/g' {} + 2>/dev/null
find app components -type f \( -name "*.tsx" -o -name "*.jsx" \) -exec sed -i 's/text-slate-800/text-slate-600/g' {} + 2>/dev/null

# Count after fixing
echo ""
echo "📊 After fixing:"
echo "  text-gray-800: $(grep -r "text-gray-800" app/ components/ --include="*.tsx" --include="*.jsx" 2>/dev/null | wc -l) occurrences"
echo "  text-gray-700: $(grep -r "text-gray-700" app/ components/ --include="*.tsx" --include="*.jsx" 2>/dev/null | wc -l) occurrences"
echo "  text-blue-700: $(grep -r "text-blue-700" app/ components/ --include="*.tsx" --include="*.jsx" 2>/dev/null | wc -l) occurrences"
echo "  text-blue-600: $(grep -r "text-blue-600" app/ components/ --include="*.tsx" --include="*.jsx" 2>/dev/null | wc -l) occurrences"
echo ""

echo "✅ Text colors updated for better contrast!"
echo ""
echo "⚠️  Note: Please review the changes and test the UI to ensure everything looks good."
