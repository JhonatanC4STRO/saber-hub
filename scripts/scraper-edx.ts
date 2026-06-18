import 'dotenv/config';
import { runSingleScraper } from '../src/scrapers/orchestrator';

async function main() {
  const success = await runSingleScraper('edx');
  process.exit(success ? 0 : 1);
}

main().catch((err) => {
  console.error('[scripts/scraper-edx] Fatal error:', err);
  process.exit(1);
});
