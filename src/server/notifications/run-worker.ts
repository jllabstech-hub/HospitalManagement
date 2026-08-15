import { processNotificationOutbox } from './worker';

const limit = Number(process.argv[2] || 50);
processNotificationOutbox(limit)
  .then((result) => {
    console.log(JSON.stringify(result));
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
