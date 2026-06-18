import 'dotenv/config';
import { runSingleScraper } from '../src/scrapers/orchestrator';

async function main() {
  const success = await runSingleScraper('khanacademy');
  process.exit(success ? 0 : 1);
}

main().catch((err) => {
  console.error('[scripts/scraper-khanacademy] Fatal error:', err);
  process.exit(1);
});
