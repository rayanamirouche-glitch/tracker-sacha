// Proxy Google Places — nombre d'avis + résolution place_id
// Clé requise : variable d'environnement PLACES_API_KEY
exports.handler = async (event) => {
  const K = process.env.PLACES_API_KEY;
  if (!K) return { statusCode: 500, body: JSON.stringify({ error: "PLACES_API_KEY manquante" }) };
  const { q, place_id } = event.queryStringParameters || {};
  let url;
  if (q) {
    url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(q)}&inputtype=textquery&fields=place_id,name,formatted_address&key=${K}`;
  } else if (place_id) {
    url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(place_id)}&fields=name,user_ratings_total,rating&key=${K}`;
  } else {
    return { statusCode: 400, body: JSON.stringify({ error: "param q ou place_id requis" }) };
  }
  try {
    const r = await fetch(url);
    const j = await r.json();
    return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*" }, body: JSON.stringify(j) };
  } catch (e) {
    return { statusCode: 502, body: JSON.stringify({ error: String(e) }) };
  }
};
