const express = require('express');
const router = express.Router();
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const { User, Hunt, Pokemon } = require('../models');
const { populate } = require('../models/User');

router.get("/", (req, res) => {
  User.find({
  })
    .populate({path:'hunts', populate:{path:'pokemon'}})
    .then(users => {
      res.json(users);
    }).catch(err => {
      res.status(500).json({ msg: "Can't find the users." });
    });
});


router.get("/getuserfromtoken", (req, res) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    const userData = jwt.verify(token, process.env.JWT_SECRET)
    res.json({ user: userData })
  } catch (error) {
    res.status(500).json({ user: false })
  }
})

router.post("/signup", (req, res) => {
  User.create(req.body).then(newUser => {
    const token = jwt.sign({
      id: newUser.id,
      username: newUser.username
    }, process.env.JWT_SECRET, {
      expiresIn: "2h"
    })
    return res.json({
      token,
      user: newUser
    })
  })
})

router.get("/:id", (req, res) => {
  User.findOne({ _id: req.params.id })
    .then((user) =>
      !user
        ? res.status(404).json({ message: 'User was not found!' })
        : res.json(user)
    )
    .catch((err) => res.status(500).json(err));
})

router.delete("/:id", (req, res) => {
  User.findOneAndRemove({ _id: req.params.id })
    .then((user) =>
      !user
        ? res.status(404).json({ message: 'No User with this id!' })
        : Hunt.deleteMany(
          { users: req.params.id },
          { _id: { $in: user.hunts } },
          { new: true }
        )
    )
    .then(() => res.json({ nessage: "User and all their Hunts have been successfully deleted!" }))
    .catch((err) => res.status(500).json(err));
})




router.post("/login", (req, res) => {
  User.findOne({
    where: {
      username: req.body.username
    }
  }).then(foundUser => {
    if (!foundUser) {
      return res.status(401).json({ msg: "Your username or password is incorrect!" });
    } else if (!bcrypt.compare(req.body.password, foundUser.password)) {
      return res.status(401).json({ msg: "Your username or password is incorrect!" });
    } else {
      const token = jwt.sign({
        id: foundUser.id,
        username: foundUser.username
      }, process.env.JWT_SECRET, {
        expiresIn: "2h"
      })
      return res.json({
        token,
        user: foundUser
      })
    }
  })
})

module.exports = router  
