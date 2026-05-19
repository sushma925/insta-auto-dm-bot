require("dotenv").config();

const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const keywords = require("./keywords.json");

const app = express();

app.use(bodyParser.json());
app.use(express.static("public"));

const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const IG_USERNAME = "sushma.tales";

// Homepage
app.get("/", (req, res) => {
  res.send("Instagram Auto DM Bot is Live 🚀");
});

// Webhook verification
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  res.sendStatus(403);
});

// Receive Instagram comments
app.post("/webhook", async (req, res) => {
  try {
    const body = req.body;

    if (body.entry) {
      for (const entry of body.entry) {
        for (const change of entry.changes || []) {

          const commentText =
            change.value?.text?.toLowerCase();

          const userId =
            change.value?.from?.id;

          if (!commentText || !userId) continue;

          for (const keyword in keywords) {
            if (commentText.includes(keyword)) {

              // Reply to comment
              await replyToComment(
                change.value.id,
                "Check your DM 👀"
              );

              // Send DM
              await sendDM(
                userId,
                `Hey 👋 Follow @${IG_USERNAME} to unlock your link 🔓

Click below after following:
https://insta-auto-dm-bot-3nco.onrender.com/unlock.html?key=${keyword}`
              );

              break;
            }
          }
        }
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
});

// Reply to comment
async function replyToComment(commentId, message) {
  try {
    await axios.post(
      `https://graph.facebook.com/v23.0/${commentId}/replies`,
      { message },
      {
        params: {
          access_token: PAGE_ACCESS_TOKEN
        }
      }
    );
  } catch (err) {
    console.log("Reply error:", err.response?.data);
  }
}

// Send Instagram DM
async function sendDM(userId, message) {
  try {
    await axios.post(
      `https://graph.facebook.com/v23.0/me/messages`,
      {
        recipient: { id: userId },
        message: { text: message }
      },
      {
        params: {
          access_token: PAGE_ACCESS_TOKEN
        }
      }
    );
  } catch (err) {
    console.log("DM error:", err.response?.data);
  }
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
  console.log(`Server running on ${PORT}`)
);
