// Quick smoke script to run the compiled vibe analyzer against example prompts.
// Usage: from the `backend` directory run `node scripts/run_vibe_test.js`

async function main() {
  try {
    // The analyzer is compiled to `dist/lib/vibe-analyzer.js` after `npm run build`.
    // Use dynamic import so this script works when the project is ESM.
    const modPath = new URL('../dist/lib/vibe-analyzer.js', import.meta.url).pathname;
    let analyzerMod;
    try {
      analyzerMod = await import(new URL('../dist/lib/vibe-analyzer.js', import.meta.url).toString());
    } catch (e) {
      console.error('Could not import analyzer from dist. Run `npm run build` first.');
      throw e;
    }

    const analyzeVibeText = (analyzerMod && (analyzerMod.default || analyzerMod)) || null;
    if (!analyzeVibeText) {
      console.error('Analyzer export not found in dist. Run `npm run build` first.');
      process.exit(2);
    }

    const prompts = [
      'happy upbeat party energy',
      'sad mellow acoustic evening',
      'angry fierce workout',
      'calm focus study instrumental',
      'romantic slow love',
      'chill lofi relaxing night',
    ];

    for (const p of prompts) {
      try {
        const vec = await analyzeVibeText(p);
        console.log('PROMPT:', p);
        console.log('VECTOR:', JSON.stringify(vec));
        console.log('');
      } catch (e) {
        console.error('Error analyzing prompt:', p, e && e.message ? e.message : e);
      }
    }
  } catch (err) {
    console.error('Unexpected error running vibe test', err);
    process.exit(1);
  }
}

main();
