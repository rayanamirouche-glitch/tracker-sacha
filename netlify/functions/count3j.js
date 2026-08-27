const FICHES = require('./fiches.json');

exports.handler = async (event) => {
  const q = event.queryStringParameters || {};
  const start = parseInt(q.start || '0', 10);
  const n = parseInt(q.n || '3', 10);
  const KEY = process.env.SERPAPI_KEY;

  // Récupère les place_id déjà liés via la fonction data du site (zéro résolution en plus)
  const base = process.env.URL || ('https://' + (event.headers && event.headers.host));
  let ids = {};
  try {
    const dr = await fetch(base + '/.netlify/functions/data');
    const data = await dr.json();
    ids = data.ids || {};
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'data unreachable' }) };
  }

  const fmt = (t) => new Date(t).toISOString().slice(0, 10);
  const days = [fmt(Date.now() - 2 * 864e5), fmt(Date.now() - 864e5), fmt(Date.now())]; // [J-2, J-1, J]

  const results = {};
  for (const f of FICHES.slice(start, start + n)) {
    const pid = ids[f.name];
    if (!pid) { results[f.name] = { err: 'non liée' }; continue; }
    try {
      let j0 = 0, j1 = 0, j2 = 0, next = null, guard = 0, stop = false;
      do {
        const u = new URL('https://serpapi.com/search.json');
        u.searchParams.set('engine', 'google_maps_reviews');
        u.searchParams.set('place_id', pid);
        u.searchParams.set('sort_by', 'newestFirst');
        u.searchParams.set('hl', 'fr');
        u.searchParams.set('api_key', KEY);
        if (next) u.searchParams.set('next_page_token', next);
        const r = await fetch(u);
        const jj = await r.json();
        const revs = jj.reviews || [];
        for (const rv of revs) {
          let day = (rv.iso_date || rv.iso_date_of_last_edit || '').slice(0, 10);
          if (!day) {
            const rel = (rv.date || '').toLowerCase();
            if (/heure|minute|instant|seconde/.test(rel)) day = days[2];
            else if (/il y a (un|1) jour/.test(rel)) day = days[1];
            else if (/il y a 2 jours/.test(rel)) day = days[0];
            else { stop = true; break; }
          }
          if (day === days[2]) j0++;
          else if (day === days[1]) j1++;
          else if (day === days[0]) j2++;
          else if (day < days[0]) { stop = true; break; }
        }
        next = (!stop && jj.serpapi_pagination && jj.serpapi_pagination.next_page_token) || null;
      } while (next && ++guard < 4);
      results[f.name] = { j0, j1, j2 };
    } catch (e) {
      results[f.name] = { err: 'api' };
    }
  }

  return {
    statusCode: 200,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ days, results })
  };
};
