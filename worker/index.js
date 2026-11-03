// Cloudflare Worker: /api/* goes to the park API, everything else is the static game in dist/.
import { handlePark } from './park-api.js';

export default {
  async fetch(req, env) {
    if (new URL(req.url).pathname.startsWith('/api/')) {
      try {
        return await handlePark(req, env);
      } catch (e) {
        console.error(e);
        return Response.json({ error: '공원 서버에 문제가 생겼습니다.' }, { status: 500 });
      }
    }
    return env.ASSETS.fetch(req);
  },
};
