import 'dotenv/config';
import { runSingleScraper } from '../src/scrapers/orchestrator';

async function main() {
  const success = await runSingleScraper('sena');
  process.exit(success ? 0 : 1);
}

main().catch((err) => {
  console.error('[scripts/scraper-sena] Fatal error:', err);
  process.exit(1);
});
