import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('Hypotheca indexer scaffold ready');
  console.log('TODO: poll Mirror Node and index claim events');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
