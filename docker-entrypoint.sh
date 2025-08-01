#!/bin/sh

# Runtime environment variable injection for Vite app
echo "🚀 Starting ChronoGuide App..."

# Create runtime config file with environment variables
cat > ./dist/config.js << EOF
window.__RUNTIME_CONFIG__ = {
  VITE_OPENAI_API_KEY: "${VITE_OPENAI_API_KEY:-}",
  VITE_GEOAPIFY_API_KEY: "${VITE_GEOAPIFY_API_KEY:-}"
};
EOF

# Inject the config script into index.html if not already present
if ! grep -q "config.js" ./dist/index.html; then
  sed -i 's|<head>|<head>\n    <script src="/config.js"></script>|' ./dist/index.html
fi

echo "✅ Runtime configuration injected"
echo "🌟 Environment variables loaded:"
echo "   - VITE_OPENAI_API_KEY: ${VITE_OPENAI_API_KEY:+***}"
echo "   - VITE_GEOAPIFY_API_KEY: ${VITE_GEOAPIFY_API_KEY:+***}"
echo "   - PORT: ${PORT:-8080}"

# Start the server
echo "🚀 Starting server on port ${PORT:-8080}..."
exec node server.cjs 