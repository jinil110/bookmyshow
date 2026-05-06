const https = require('https');
const movies = [
  {id: 'm1', tmdbId: 980489, title: "Jawan", desc: "A high-octane action thriller which outlines the emotional journey of a man who is set to rectify the wrongs in the society.", category: "Action", isLatest: true, isTrending: true},
  {id: 'm2', tmdbId: 864696, title: "Pathaan", desc: "An Indian spy takes on the leader of a group of mercenaries who have nefarious plans to target his homeland.", category: "Action", isLatest: false, isTrending: false},
  {id: 'm3', tmdbId: 693134, title: "Kalki 2898 AD", desc: "A modern-day avatar of Vishnu, a Hindu god, who is believed to have descended to earth to protect the world from evil forces.", category: "Sci-Fi", isLatest: true, isTrending: true},
  {id: 'm4', tmdbId: 951491, title: "Animal", desc: "A son undergoes a remarkable transformation as the bond with his father begins to fracture, and he becomes consumed by a quest for vengeance.", category: "Drama", isLatest: false, isTrending: true},
  {id: 'm5', tmdbId: 955555, title: "Fighter", desc: "Top IAF aviators come together in the face of imminent danger, to form Air Dragons.", category: "Action", isLatest: true, isTrending: false},
  {id: 'm6', tmdbId: 533535, title: "Deadpool & Wolverine", desc: "A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him.", category: "Action", isLatest: true, isTrending: true},
  {id: 'm7', tmdbId: 823464, title: "Godzilla x Kong: The New Empire", desc: "Following their explosive showdown, Godzilla and Kong must reunite against a colossal undiscovered threat hidden within our world.", category: "Action", isLatest: true, isTrending: true},
  {id: 'm8', tmdbId: 1022789, title: "Inside Out 2", desc: "Teenager Riley's mind headquarters is undergoing a sudden demolition to make room for something entirely unexpected: new Emotions!", category: "Animation", isLatest: true, isTrending: true},
  {id: 'm9', tmdbId: 438631, title: "Dune: Part Two", desc: "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.", category: "Sci-Fi", isLatest: false, isTrending: true},
  {id: 'm10', tmdbId: 872585, title: "Oppenheimer", desc: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.", category: "Biography", isLatest: false, isTrending: false}
];

const fetchImg = (id) => {
  return new Promise(resolve => {
    https.get('https://www.themoviedb.org/movie/' + id, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const match = data.match(/property="og:image" content="([^"]+)"/);
        if (match) {
          resolve(match[1]);
        } else {
          resolve('https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&w=800&q=80');
        }
      });
    });
  });
};

(async () => {
  const result = [];
  for (let m of movies) {
    const poster = await fetchImg(m.tmdbId);
    result.push({
      id: m.id,
      title: m.title,
      description: m.desc,
      duration: "2h 30m",
      rating: "UA",
      category: m.category,
      price: Math.floor(Math.random() * 100) + 200,
      poster: poster,
      banner: poster.replace('w500', 'original'), // A trick to get high res version for banner
      isLatest: m.isLatest,
      isTrending: m.isTrending
    });
  }
  const fs = require('fs');
  fs.writeFileSync('d:/bookmyshow/data/movies.json', JSON.stringify(result, null, 2));
  console.log('Movies written!');
})();
