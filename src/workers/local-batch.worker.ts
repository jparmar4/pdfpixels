/// <reference lib="webworker" />

import { processBatchItemBuffer, type BatchProcessInput } from '@/lib/local-batch-processor';

self.addEventListener('message', async (event: MessageEvent<BatchProcessInput>) => {
  const result = await processBatchItemBuffer(event.data);
  if (result.bytes) {
    self.postMessage(result, [result.bytes]);
  } else {
    self.postMessage(result);
  }
});
