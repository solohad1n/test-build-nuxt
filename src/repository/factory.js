import { ofetch } from 'ofetch';

class FetchFactory {
  constructor(fetcher) {
    this.$fetch = fetcher;
  }

  async call(method, url, data = null, fetchOptions = {}) {
    const options = {
      method,
      ...fetchOptions,
    };

    if (method !== 'GET' && method !== 'HEAD') {
      options.body = data;
    }

    return this.$fetch(url, options);
  }
}

export default FetchFactory;