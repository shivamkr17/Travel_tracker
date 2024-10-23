// import express from "express";
const express = require('express')
const bodyParser = require('body-parser')
// import bodyParser from "body-parser";
// import pg, { Client } from "pg";
const {Client} = require('pg')
const app = express();
const port = 3000;

// const db = new pg.Client({
//     user: "postgres",
//     host: "localhost",
//     database: "cities",
//     password: "7759921185sS",
//     port: 5432,
//   });
//   db.connect();s
const db = new Client({
  connectionString:"postgresql://monatibrewal1234:VJ2XE8qSjCsu@ep-super-rain-a1bkwqzy.ap-southeast-1.aws.neon.tech/TravelTracker?sslmode=require"
});
db.connect()
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = [
  { id: 1, name: "Shivam", color: "teal" }
];

async function checkVisisted() {
  const result = await db.query(
    "SELECT state_code FROM visited_city JOIN users ON users.id = user_id WHERE user_id = $1; ",
    [currentUserId]
  );
  let visited_cities = [];
  result.rows.forEach((state) => {
    visited_cities.push(state.state_code);
  });
  return visited_cities;
}

async function getCurrentUser() {
  const result = await db.query("SELECT * FROM users");
  users = result.rows;
  return users.find((user) => user.id == currentUserId);
}

app.get("/", async (req, res) => {
  const visited_cities = await checkVisisted();
  const currentUser = await getCurrentUser();
  res.render("index.ejs", {
    visited_cities: visited_cities,
    total: visited_cities.length,
    users: users,
    color: currentUser ? currentUser.color : 'defaultColor'
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["state"];
  // const currentUser = await getCurrentUser();

  try {
    const result = await db.query(
      "SELECT state_code FROM visited_cities WHERE LOWER(state_name) LIKE '%' || $1 || '%';",
      [input.toLowerCase()]
    );

    const data = result.rows[0];

    if (data && data.state_code) {
      const stateCode = data.state_code;

      // Check if the state has already been visited by the current user
      const visitedCities = await checkVisisted();
      if (!visitedCities.includes(stateCode)) {
        await db.query(
          "INSERT INTO visited_city (state_code, user_id) VALUES ($1, $2)",
          [stateCode, currentUserId]
        );
        res.redirect("/");
      } else {
        console.log("State is already visited.");
        res.status(400).send("State is already visited.");
      }
    } else {
      console.error("Error: 'data' or 'state_code' is undefined.", { data });
      // Handle the case where no matching state code is found
      res.status(404).send("No matching state code found.");
    }
  } catch (err) {
    console.error("Error during database operation:", err);
    // Handle the error or return an appropriate response
    res.status(500).send("Internal server error");
  }
});

app.post("/user", async (req, res) => {
  if (req.body.add === "new") {
    res.render("new.ejs");
  } else {
    currentUserId = req.body.user;
    res.redirect("/");
  }
});

app.post("/new", async (req, res) => {
  const name = req.body.name;
  const color = req.body.color;

  console.log(color)

  const result = await db.query(
    "INSERT INTO users (name, color) VALUES($1, $2) RETURNING *;",
    [name, color]
  );

  const id = result.rows[0].id;
  currentUserId = id;

  res.redirect("/");
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
  