const express = require("express");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.set("trust proxy", 1); // Required for Render (proxy environment)

// Only allow your portfolio's domain
app.use(cors({
  origin: "https://devmique.vercel.app" 
}));
app.use(express.json({ limit: "10kb" })); // prevent large payload attacks


// Rate limit: max 5 emails per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: "Too many requests, please try again later." }
});
app.use("/contact", limiter);


const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  family: 4, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000
});

app.get("/", (req, res) => {
  res.send("Portfolio Email API running");
});

app.post("/contact", async (req, res) => {
  const { email, message } = req.body;

  if (!email || !message) {
    return res.status(400).json({ error: "Missing fields" });
  }
  if (!email.includes("@")) {
    return res.status(400).json({ error: "Invalid email" });
  }
  if (email.length > 254 || message.length > 2000) {
    return res.status(400).json({ error: "Input too long" });
  }

  try {
    await transporter.sendMail({
      from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
      replyTo: email,
      to: process.env.EMAIL_USER,
      subject: "Portfolio Contact",
      text: `From: ${email}\n\n${message}`
    });

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Email failed" });
  }
});
transporter.verify((error, success) => {
  if (error) {
    console.log("SMTP Error:", error);
  } else {
    console.log("SMTP Server is ready");
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));