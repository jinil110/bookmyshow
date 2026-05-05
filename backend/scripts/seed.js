require("dotenv").config({ path: __dirname + "/../../.env" });
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Movie = require("../models/Movie");
const Show = require("../models/Show");
const User = require("../models/User");

const seedData = async () => {
  try {
    await connectDB();

    await Movie.deleteMany();
    await Show.deleteMany();
    await User.deleteMany();

    await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: "password123",
      role: "admin",
    });

    // Using high-quality TMDB-style movie poster URLs from The Movie DB CDN
    const movies = [
      {
        title: "Dune: Part Two",
        description: "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe, he endeavors to prevent a terrible future only he can foresee.",
        duration: "2h 46m",
        rating: "UA",
        category: "Sci-Fi",
        poster: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
        banner: "https://image.tmdb.org/t/p/original/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
        isTrending: true,
        isLatest: true,
      },
      {
        title: "Godzilla x Kong: The New Empire",
        description: "Two ancient titans, Godzilla and Kong, clash in an epic battle as humans unravel their intertwined origins and connection to Skull Island's mysteries.",
        duration: "1h 55m",
        rating: "UA",
        category: "Action",
        poster: "https://image.tmdb.org/t/p/w500/z1p34vh7dEOnLDmyCrlUVLuoDzd.jpg",
        banner: "https://image.tmdb.org/t/p/original/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
        isTrending: true,
        isLatest: true,
      },
      {
        title: "Kung Fu Panda 4",
        description: "After Po is tapped to become the Spiritual Leader of the Valley of Peace, he needs to find and train a new Dragon Warrior while a wicked sorceress plans to use a magical staff to resurrect all of the master villains.",
        duration: "1h 34m",
        rating: "U",
        category: "Animation",
        poster: "https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg",
        banner: "https://image.tmdb.org/t/p/original/mC9soFcoBKYxbJhxFkbmpFJZUK2.jpg",
        isTrending: false,
        isLatest: true,
      },
      {
        title: "Oppenheimer",
        description: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb during World War II.",
        duration: "3h",
        rating: "UA",
        category: "Drama",
        poster: "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
        banner: "https://image.tmdb.org/t/p/original/rLb2cwF3Pazuxaj0sRXQ037tGI1.jpg",
        isTrending: false,
        isLatest: false,
      },
      {
        title: "Civil War",
        description: "A terrifying journey through a near-future America balancing on the brink of civil war. A team of journalists race against time to reach the White House.",
        duration: "1h 49m",
        rating: "A",
        category: "Thriller",
        poster: "https://image.tmdb.org/t/p/w500/sh7Rg8Er3tFcN9BpKIPOMvALgZd.jpg",
        banner: "https://image.tmdb.org/t/p/original/jPdIzO38lhSwNXuYYKJiPiB1VVN.jpg",
        isTrending: true,
        isLatest: true,
      },
      {
        title: "Deadpool & Wolverine",
        description: "Deadpool is offered a place in the Marvel Cinematic Universe by the Time Variance Authority, but instead recruits a variant of Wolverine to help him.",
        duration: "2h 7m",
        rating: "A",
        category: "Action",
        poster: "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
        banner: "https://image.tmdb.org/t/p/original/nHf61UzkfFno5X1ofIjWpbVohaZ.jpg",
        isTrending: true,
        isLatest: true,
      },
      {
        title: "Inside Out 2",
        description: "Follow Riley in her teenage years as new emotions — Anxiety, Envy, Ennui, and Embarrassment — join Joy, Sadness, Anger, Fear, and Disgust in her mind.",
        duration: "1h 40m",
        rating: "U",
        category: "Animation",
        poster: "https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg",
        banner: "https://image.tmdb.org/t/p/original/xg27NrXi7VXCGUr7MG75UqLl6Vg.jpg",
        isTrending: false,
        isLatest: true,
      },
      {
        title: "Kingdom of the Planet of the Apes",
        description: "Several generations after the reign of Caesar, a young ape goes on a journey that will lead him to question everything he's been taught about the past.",
        duration: "2h 25m",
        rating: "UA",
        category: "Sci-Fi",
        poster: "https://image.tmdb.org/t/p/w500/gKkl37BQuKTanygYQG1pyYgLVgf.jpg",
        banner: "https://image.tmdb.org/t/p/original/fqv8v6AycXKsivp1T5yKtLbGXce.jpg",
        isTrending: false,
        isLatest: true,
      },
      {
        title: "Furiosa: A Mad Max Saga",
        description: "As the world falls, young Furiosa is snatched from the Green Place and survives many trials while plotting her way back home.",
        duration: "2h 28m",
        rating: "A",
        category: "Action",
        poster: "https://image.tmdb.org/t/p/w500/iADOJ8Zymht2JPMoy3R7xceZprc.jpg",
        banner: "https://image.tmdb.org/t/p/original/ssF2VZJdJ0xL3QfQ8WfQmR0jScD.jpg",
        isTrending: true,
        isLatest: true,
      },
      {
        title: "The Fall Guy",
        description: "A stuntman must track down a missing movie star while trying to win back the love of his life.",
        duration: "2h 6m",
        rating: "UA",
        category: "Comedy",
        poster: "https://image.tmdb.org/t/p/w500/tSz1qsmSJon0rqjHBxXZmrotuse.jpg",
        banner: "https://image.tmdb.org/t/p/original/s5znBQmprDJJ553IMQfwEVlfroH.jpg",
        isTrending: false,
        isLatest: true,
      },
      {
        title: "A Quiet Place: Day One",
        description: "Witness the terrifying beginning of the invasion as New York City descends into silence.",
        duration: "1h 40m",
        rating: "UA",
        category: "Horror",
        poster: "https://image.tmdb.org/t/p/w500/hU42CRk14JuPEdqZG3AWmagiPAP.jpg",
        banner: "https://image.tmdb.org/t/p/original/86T3Y4Q0nFhtp7WJf6n9Y2VCxA6.jpg",
        isTrending: true,
        isLatest: true,
      },
      {
        title: "Challengers",
        description: "A former tennis prodigy turned coach puts her husband into a challenger event where he faces his old best friend.",
        duration: "2h 11m",
        rating: "A",
        category: "Drama",
        poster: "https://image.tmdb.org/t/p/w500/H6vke7zGiuLsz4v4RPeReb9rsv.jpg",
        banner: "https://image.tmdb.org/t/p/original/1XDDXPXGiI8id7MrUxK36ke7gkX.jpg",
        isTrending: false,
        isLatest: true,
      }
    ];

    const insertedMovies = await Movie.insertMany(movies);

    const today = new Date();
    const days = [0, 1, 2, 3, 4].map(i => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      return d.toISOString().split("T")[0];
    });

    const cityTheaters = {
      Mumbai: [
        { theaterName: "PVR: Phoenix Palladium", area: "Lower Parel" },
        { theaterName: "INOX: R-City Mall", area: "Ghatkopar" },
        { theaterName: "PVR: Juhu", area: "Juhu" }
      ],
      Delhi: [
        { theaterName: "PVR: Select Citywalk", area: "Saket" },
        { theaterName: "INOX: Nehru Place", area: "Nehru Place" },
        { theaterName: "Cinépolis: DLF Avenue", area: "Saket" }
      ],
      Bengaluru: [
        { theaterName: "PVR: Orion Mall", area: "Rajajinagar" },
        { theaterName: "INOX: Garuda Mall", area: "Magrath Road" },
        { theaterName: "Cinépolis: Royal Meenakshi", area: "Bannerghatta" }
      ],
      Hyderabad: [
        { theaterName: "AMB Cinemas", area: "Gachibowli" },
        { theaterName: "PVR: Nexus Mall", area: "Kukatpally" },
        { theaterName: "INOX: GVK One", area: "Banjara Hills" }
      ],
      Ahmedabad: [
        { theaterName: "PVR: Acropolis Mall", area: "Thaltej" },
        { theaterName: "INOX: Himalaya Mall", area: "Drive In Road" },
        { theaterName: "Cinépolis: Alpha One", area: "Vastrapur" }
      ]
    };
    const timesUTC = [
      { h: 4, m: 30 },  // 10:00 AM IST
      { h: 8, m: 0 },   // 1:30 PM IST
      { h: 12, m: 30 }, // 6:00 PM IST
      { h: 16, m: 0 },  // 9:30 PM IST
    ];
    const prices = [180, 220, 260, 300];

    const shows = [];
    for (const movie of insertedMovies) {
      for (const dateStr of days) {
        for (const [city, theaters] of Object.entries(cityTheaters)) {
          const theaterPair = theaters.slice(0, 2);
          for (const theater of theaterPair) {
          for (let t = 0; t < timesUTC.length; t++) {
            const showDate = new Date(dateStr + "T00:00:00.000Z");
            showDate.setUTCHours(timesUTC[t].h, timesUTC[t].m, 0, 0);
            shows.push({
              movie: movie._id,
              theaterName: theater.theaterName,
              area: theater.area,
              city,
              date: dateStr,
              time: showDate.toISOString(),
              price: prices[t],
            });
          }
        }
        }
      }
    }

    await Show.insertMany(shows);

    console.log(`✅ Seeded ${insertedMovies.length} movies, ${shows.length} shows!`);
    process.exit();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedData();
