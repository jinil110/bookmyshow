const https = require('https');
const fs = require('fs');

const movies = [
  {id: 'm1', wikiTitle: 'Jawan_(film)', title: "Jawan", desc: "A high-octane action thriller which outlines the emotional journey of a man who is set to rectify the wrongs in the society.", category: "Action", isLatest: true, isTrending: true},
  {id: 'm2', wikiTitle: 'Pathaan_(film)', title: "Pathaan", desc: "An Indian spy takes on the leader of a group of mercenaries who have nefarious plans to target his homeland.", category: "Action", isLatest: false, isTrending: false},
  {id: 'm3', wikiTitle: 'Kalki_2898_AD', title: "Kalki 2898 AD", desc: "A modern-day avatar of Vishnu, a Hindu god, who is believed to have descended to earth to protect the world from evil forces.", category: "Sci-Fi", isLatest: true, isTrending: true},
  {id: 'm4', wikiTitle: 'Animal_(2023_Indian_film)', title: "Animal", desc: "A son undergoes a remarkable transformation as the bond with his father begins to fracture.", category: "Drama", isLatest: false, isTrending: true},
  {id: 'm5', wikiTitle: 'Fighter_(2024_film)', title: "Fighter", desc: "Top IAF aviators come together in the face of imminent danger, to form Air Dragons.", category: "Action", isLatest: true, isTrending: false},
  {id: 'm6', wikiTitle: 'Deadpool_%26_Wolverine', title: "Deadpool & Wolverine", desc: "A listless Wade Wilson toils away in civilian life with his days as the morally flexible mercenary, Deadpool, behind him.", category: "Action", isLatest: true, isTrending: true},
  {id: 'm7', wikiTitle: 'Godzilla_x_Kong:_The_New_Empire', title: "Godzilla x Kong: The New Empire", desc: "Godzilla and Kong must reunite against a colossal undiscovered threat hidden within our world.", category: "Sci-Fi", isLatest: true, isTrending: false},
  {id: 'm8', wikiTitle: 'Inside_Out_2', title: "Inside Out 2", desc: "Teenager Riley's mind headquarters is undergoing a sudden demolition to make room for new Emotions!", category: "Animation", isLatest: true, isTrending: true},
  {id: 'm9', wikiTitle: 'Dune:_Part_Two', title: "Dune: Part Two", desc: "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge.", category: "Sci-Fi", isLatest: false, isTrending: true},
  {id: 'm10', wikiTitle: 'Oppenheimer_(film)', title: "Oppenheimer", desc: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.", category: "Biography", isLatest: false, isTrending: false}
];

const fetchImage = (title) => {
  return new Promise((resolve) => {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${title}`;
    https.get(url, { headers: { 'User-Agent': 'BookMyShow-Bot/1.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.thumbnail && json.thumbnail.source) {
            // Wikipedia returns a 320px thumbnail by default.
            // Replace 320px with 500px to get a medium size poster
            let imgUrl = json.thumbnail.source.replace('320px', '500px');
            resolve(imgUrl);
          } else {
            resolve('https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&w=500&q=80');
          }
        } catch(e) {
          resolve('https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&w=500&q=80');
        }
      });
    }).on('error', () => {
      resolve('https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&w=500&q=80');
    });
  });
};

(async () => {
  const result = [];
  for (let m of movies) {
    const imgUrl = await fetchImage(m.wikiTitle);
    result.push({
      id: m.id,
      title: m.title,
      description: m.desc,
      duration: "2h 30m",
      rating: "UA",
      category: m.category,
      price: Math.floor(Math.random() * 100) + 200,
      poster: imgUrl,
      banner: imgUrl, // The banner will just use the same image but styled properly
      isLatest: m.isLatest,
      isTrending: m.isTrending
    });
  }
  fs.writeFileSync('d:/bookmyshow/data/movies.json', JSON.stringify(result, null, 2));
  console.log('Movies successfully updated with medium Wikipedia images!');
})();
