export type UploadResult = {
  status: number;
  headers: Headers;
  body: ArrayBuffer;
};

export function uploadForm(
  url: string,
  form: FormData,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Upload aborted'));
      return;
    }
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    signal?.addEventListener('abort', abort);
    xhr.open('POST', url);
    xhr.responseType = 'arraybuffer';
    xhr.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable || event.total <= 0) return;
      onProgress(Math.min(70, Math.round((event.loaded / event.total) * 70)));
    };
    xhr.onerror = () => {
      signal?.removeEventListener('abort', abort);
      reject(new Error('Upload failed'));
    };
    xhr.onabort = () => {
      signal?.removeEventListener('abort', abort);
      reject(new Error('Upload aborted'));
    };
    xhr.onload = () => {
      signal?.removeEventListener('abort', abort);
      onProgress?.(90);
      const headers = new Headers();
      for (const line of xhr.getAllResponseHeaders().trim().split(/[\r\n]+/)) {
        const index = line.indexOf(':');
        if (index === -1) continue;
        headers.append(line.slice(0, index).trim(), line.slice(index + 1).trim());
      }
      resolve({
        status: xhr.status,
        headers,
        body: xhr.response instanceof ArrayBuffer ? xhr.response : new ArrayBuffer(0),
      });
    };
    xhr.send(form);
  });
}

export function fetchWithUploadProgress(
  url: string,
  form: FormData,
  onProgress?: (percent: number) => void,
  signal?: AbortSignal,
): Promise<Response> {
  return uploadForm(url, form, onProgress, signal).then(
    (result) => new Response(result.body, { status: result.status, headers: result.headers }),
  );
}
