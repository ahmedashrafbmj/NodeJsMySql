const express = require("express");
const mysql = require("mysql");
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');


// creating connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "createdbycodebyahmed"
});

// connect
db.connect((err) => {
    if (err) {
        throw err;
    } else {
        console.log("MySql connected...");
    }
});

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/create", (req, res) => {
    let sql = "CREATE DATABASE createdbycodebyahmed";
    db.query(sql, (err, result) => {
        if (err) {
            console.log(err, "err");
        } else {
            res.send("Database created");
            console.log("Database created...", result);
        }
    });
});

app.get('/craetetable', (req, res) => {
    let sql = "CREATE TABLE users(id int AUTO_INCREMENT, username VARCHAR(255),email VARCHAR(255),password VARCHAR(255), PRIMARY KEY (id))";
    db.query(sql, (err, result) => {
        if (err) {
            console.log(err, "err");
        } else {
            res.send("Table created");
            console.log("Table created...", result);    
        }
    });
})
// signup with jwt
app.post('/signup', (req, res) => {
    const { username, email, password } = req.body;
    let sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
    db.query(sql, [username, email, password], (err, result) => {
      if (err) {
        console.log(err,"err");
        res.status(500).send("Error creating user");
      } else {
        const user = { username, email };
        const token = jwt.sign(user, 'my_secret_key');
        res.json({ token });
      }
    });
  });



  app.post('/login', (req, res) => {
    const { email, password } = req.body;
    let sql = "SELECT * FROM users WHERE email = ?";
    db.query(sql, [email], (err, results) => {
      if (err) {
        console.log(err);
        res.status(500).send("Error logging in");
      } else if (results.length === 0 ) {
        res.status(401).send("User not found");
      } else {
        const user = results[0];
        if (user.password !== password || user.email !== email) {
          res.status(401).send("Invalid email or password");
        } else {
          const token = jwt.sign({ username: user.username, email: user.email }, 'my_secret_key');
          res.json({ token,  email: user.email,password: user.password, });
        }
      }
    });
  });



  
  function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).send('Unauthorized');
    }
  
    jwt.verify(token, 'my_secret_key', (err, decoded) => {
      if (err) {
        console.log(err);
        return res.status(403).send('Invalid token');
      }
  
      req.user = decoded;
      next();
    });
  }

// add post
app.post('/posts', verifyToken,(req, res) => {
    let post = {title: req.body.title, body: req.body.body};
    let sql = "INSERT INTO posts SET ?";
    db.query(sql, post, (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send("Error creating post");
      } else {
        let selectSql = "SELECT * FROM posts WHERE id = ?";
        db.query(selectSql, [result.insertId], (err, results) => {
          if (err) {
            console.log(err);
            res.status(500).send("Error retrieving post");
          } else {
            res.json(results[0]);
          }
        });
      }
    });
  });

// get all post
app.get('/posts',verifyToken, (req, res) => {
    let sql = "SELECT * FROM posts"
    db.query(sql, (err, result) => {
        if (err) {
            console.log(err, "err");
        } else {
            res.send({message:"Post fetched...",data:result});
            console.log("Post fetched...", result);
        }
    });
})

// update post
app.put('/posts/:id',verifyToken, (req, res) => {
    const id = req.params.id;
    const { title, body } = req.body;
    let sql = "UPDATE posts SET title = ?, body = ? WHERE id = ?";
    db.query(sql, [title, body, id], (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send("Error updating post");
      } else if (result.affectedRows === 0) {
        res.status(404).send("Post not found");
      } else {
        res.send("Post updated successfully");
      }
    });
  });


// delete post
  app.delete('/posts/:id',verifyToken, (req, res) => {
    const id = req.params.id;
    let sql = "DELETE FROM posts WHERE id = ?";
    db.query(sql, [id], (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send("Error deleting post");
      } else if (result.affectedRows === 0) {
        res.status(404).send("Post not found");
      } else {
        res.send("Post delete successfully");
      }
    });
  });

//   find by id
app.get('/posts/:id',verifyToken, (req, res) => {
    const id = req.params.id;
    let sql = "SELECT * FROM posts WHERE id = ?";
    db.query(sql, [id], (err, results) => {
      if (err) {
        console.log(err);
        res.status(500).send("Error retrieving post");
      } else if (results.length === 0) {
        res.status(404).send("Post not found");
      } else {
        res.json(results[0]);
      }
    });
  });
  

app.listen("3000", () => {
    console.log("Server is running on 3000");
});