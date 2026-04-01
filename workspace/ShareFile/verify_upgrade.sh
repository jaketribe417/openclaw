#!/bin/bash
echo "=== OpenClaw Manus Upgrade Verification ==="
echo ""

echo "=== Persona Files ==="
for f in manus pev tips writing; do
  if [ -f ~/.openclaw/skills/manus-core/${f}.md ]; then
    size=$(wc -c < ~/.openclaw/skills/manus-core/${f}.md)
    echo "✅ ${f}.md: ${size} bytes"
  else
    echo "❌ MISSING: ${f}.md"
  fi
done

if [ -f ~/.openclaw/skills/manus-core/combined_system.md ]; then
  size=$(wc -c < ~/.openclaw/skills/manus-core/combined_system.md)
  echo "✅ combined_system.md: ${size} bytes"
else
  echo "❌ MISSING: combined_system.md"
fi

echo ""
echo "=== Core Skills (Phase 3B) ==="
for s in app-deployment knowledge-base data-apis document-writer model-routing benchmark-suite; do
  if [ -f ~/.openclaw/skills/${s}/SKILL.md ]; then
    size=$(wc -c < ~/.openclaw/skills/${s}/SKILL.md)
    echo "✅ ${s}: ${size} bytes"
  else
    echo "❌ MISSING: ${s}"
  fi
done

echo ""
echo "=== Extension Skills (Phase 3C+4) ==="
for s in knowledge-inject auto-offload context-enhancer smart-context event-logger parallel-tasks; do
  if [ -f ~/.openclaw/skills/manus-extensions/${s}/SKILL.md ]; then
    size=$(wc -c < ~/.openclaw/skills/manus-extensions/${s}/SKILL.md)
    echo "✅ manus-extensions/${s}: ${size} bytes"
  else
    echo "❌ MISSING: manus-extensions/${s}"
  fi
done

echo ""
echo "=== Utilities ==="
if [ -f ~/.openclaw/skills/direct-browser/scripts/browser_state.py ]; then
  echo "✅ browser_state.py"
else
  echo "❌ MISSING: browser_state.py"
fi

echo ""
echo "=== Backups ==="
ls -la ~/.openclaw/workspace/sharefile/backups/ 2>/dev/null | tail -n +2

echo ""
echo "=== Baseline Results ==="
if [ -f ~/.openclaw/workspace/sharefile/baseline_functional_test.json ]; then
  cat ~/.openclaw/workspace/sharefile/baseline_functional_test.json
else
  echo "⚠️  No baseline results found"
fi

echo ""
echo "=== Check Complete ==="
