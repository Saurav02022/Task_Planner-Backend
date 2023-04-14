const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

require("dotenv").config();

const { userModel } = require("../models/userModel");
const userRouter = express.Router();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.gmail,
    pass: process.env.gmailPassword,
  },
});

function HtmlPage(msg, firstName, lastName, thankYouMsg) {
  return `
   <!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Email Verification</title>
    <style>
      body {
        background-color: #f4f4f4;
        font-family: Arial, sans-serif;
        font-size: 16px;
        line-height: 1.5;
        color: #333;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #fff;
        border-radius: 5px;
        box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
      }
      h1 {
        font-size: 24px;
        font-weight: bold;
        text-align: center;
        margin-bottom: 20px;
      }
      p {
        margin-bottom: 20px;
      }
      a {
        color: white;
        text-decoration: none;
        font-size:16px
      }
      .btn {
        display: inline-block;
        padding: 10px 20px;
        background-color: #38aa8c;
        text-align: center;
        border-radius: 5px;
        transition: all 0.3s ease;
      }
      .btn:hover {
        background-color:#38aa8c;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>${thankYouMsg}</h1>
      <p>
      ${msg}
      </p>
       <p>${firstName && lastName ? "Hi" : ""} ${firstName} ${lastName}</p>
      <p>Thank you to signup on our website</p>
      <a href="https://taskplanner-ruby.vercel.app/login" class="btn" target="blank"style="background-color:#38aa8c">Visit Our Website</a>
    </div>
  </body>
</html>
  `;
}

//register a new user
userRouter.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (firstName && email && password && lastName) {
      // Check if user already exists
      const userEmailExists = await userModel.findOne({ email: email });
      if (userEmailExists) {
        return res.send({
          message: "Email already exists Please Login",
        });
      }
      // Hash the password before storing it in the database
      bcrypt.hash(password, 10, async (err, hash_password) => {
        if (err) {
          return res.send({
            message: "Error While registration",
          });
        }
        const verificationToken =
          Math.random().toString(36).substring(2, 15) +
          Math.random().toString(36).substring(2, 15);
        const newUserRegistration = new userModel({
          firstName,
          lastName,
          email,
          password: hash_password,
          verificationToken,
          isVerified: false,
        });

        await newUserRegistration.save();

        const mailOptions = {
          from: process.env.gmail,
          to: email,
          subject: "Verify Your Email",
          html: `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Email Verification</title>
    <style>
      body {
        background-color: #f4f4f4;
        font-family: Arial, sans-serif;
        font-size: 16px;
        line-height: 1.5;
        color: #333;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        background-color: #fff;
        border-radius: 5px;
        box-shadow: 0px 0px 5px rgba(0, 0, 0, 0.1);
      }
      h1 {
        font-size: 24px;
        font-weight: bold;
        text-align: center;
        margin-bottom: 20px;
      }
      p {
        margin-bottom: 20px;
      }
      a {
        color: white;
        text-decoration: none;
        font-size:16px
      }
      .btn {
        display: inline-block;
        padding: 10px 20px;
        background-color: #38aa8c;
        text-align: center;
        border-radius: 5px;
        transition: all 0.3s ease;
      }
      .btn:hover {
        background-color:#38aa8c;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Email Verification</h1>
      <p>Thank you for signing up. To verify your email address, please click the button below:</p>
       <p>Hi ${firstName} ${lastName},</p>
      <a href="https://cautious-pink-flannel-nightgown.cyclic.app/user/verify?token=${verificationToken}" class="btn" style="background-color:#38aa8c">Verify Email Address</a>
      <p>If you did not register on our website, please ignore this email.</p>
      <p>Thank you to signup on our website</p>
      <a href="https://taskplanner-ruby.vercel.app/login" class="btn" style="background-color:#38aa8c">Visit Our Website</a>
    </div>
  </body>
</html>
`,
        };
        await transporter.sendMail(mailOptions);
        await res.send({ message: "Verification email sent" });
      });
    }
  } catch (err) {
    res.send({
      message: "Server error",
    });
  }
});

userRouter.get("/verify", async (req, res) => {
  const { token } = req.query;
  const user = await userModel.findOne({ verificationToken: token });
  try {
    if (!user) {
      return res.send(
        HtmlPage(
          "Please Login to Enjoy Our Services",
          "",
          "",
          "Already Verified Email Please Login."
        )
      );
    }

    user.isVerified = true;
    user.isAuthenticated = false;
    user.verificationToken = null;

    await user.save();

    res.send(
      HtmlPage(
        "Thank You to verify Your Email Address.",
        user.firstName,
        user.lastName,
        "Please Login to Enjoy Our Services"
      )
    );
  } catch (error) {
    res.send(
      HtmlPage(
        "Our server is not responding to your email address please try after some time",
        "",
        "",
        "Server Down Please try again"
      )
    );
  }
});

//login a user
userRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (email && password) {
      const user = await userModel.find({ email });
      if (user.length === 0) {
        return res.send({
          message: "User not found",
        });
      }
      if (user[0].isVerified === false) {
        return res.send({
          message: "Please Verify your email address",
        });
      }
      bcrypt.compare(password, user[0].password, (err, result) => {
        if (err) {
          return res.send({
            message: "Error while encrypting password",
          });
        }

        if (!result) {
          return res.send({
            message: "Wrong Password",
          });
        }
        const token = jwt.sign({ userId: user[0]._id }, "masai");
        res.send({
          userId: user[0]._id,
          message: "Login successfully",
          token,
          firstName: user[0].firstName,
          isAuthenticated: true,
        });
      });
    }
  } catch (err) {
    res.send({
      message: "server Error",
    });
  }
});

//read all userData
userRouter.get("/", async (req, res) => {
  try {
    const users = await userModel.find();
    res.send(users);
  } catch (err) {
    res.send(err.message);
  }
  nodemailer;
});

module.exports = {
  userRouter,
};
