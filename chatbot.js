const chatInput = document.getElementById("userInput");
const chatButton = document.getElementById("sendButton");
const chatMessages = document.getElementById("chatMessages");
const chatStatus = document.getElementById("chatStatus");

// Temperature for our experiment
let chatTemperature = 0.9;

function showChatMessage(role, text) {
  const message = document.createElement("div");

  message.className =
    "chat-message " +
    (role === "user" ? "chat-user" : "chat-assistant");

  message.textContent = text;
  chatMessages.appendChild(message);

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Disable chat when local configuration is absent
if (typeof CONFIG === "undefined" ||
    !CONFIG.apiKey ||
    CONFIG.apiKey === "YOUR_PRIVATE_GROQ_KEY") {
  chatButton.disabled = true;
  chatStatus.textContent =
    "AI chat is available in the local demonstration only.";
}

async function sendChatMessage() {
  if (chatButton.disabled) return;

  const question = chatInput.value.trim();

  if (!question) return;

  showChatMessage("user", question);
  chatInput.value = "";

  chatButton.disabled = true;
  chatStatus.textContent = "AI is thinking...";

  try {
    const response = await fetch(
      CONFIG.baseUrl.replace(/\/$/, "") +
      "/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + CONFIG.apiKey
        },
        body: JSON.stringify({
          model: CONFIG.model,
          temperature: chatTemperature,
          messages: [
            {
              role: "system",
              content:
                "You are an AI assistant for a portfolio " +
                "website that includes a weather application. " +
                "Answer questions about HTML, CSS, JavaScript, " +
                "APIs, and the projects described to you. " +
                "Do not invent personal information. " +
                "Keep replies under 60 words."
            },
            {
              role: "user",
              content: question
            }
          ]
        })
      }
    );

    if (response.status === 429) {
      throw new Error("RATE_LIMIT");
    }

    if (!response.ok) {
      throw new Error("API_ERROR");
    }

    const data = await response.json();

    const answer = data.choices?.[0]?.message?.content;

    if (typeof answer !== "string" || !answer.trim()) {
      throw new Error("INVALID_RESPONSE");
    }

    showChatMessage("assistant", answer);

  } catch (error) {
    console.error("Chat error:", error.message);

    if (error.message === "RATE_LIMIT") {
      showChatMessage(
        "assistant",
        "Too many requests. Please wait and try again."
      );
    } else if (!navigator.onLine) {
      showChatMessage(
        "assistant",
        "No internet connection. Please reconnect."
      );
    } else {
      showChatMessage(
        "assistant",
        "AI service unavailable. Please try again."
      );
    }
  } finally {
    chatButton.disabled = false;
    chatStatus.textContent = "";
  }
}

chatButton.addEventListener("click", sendChatMessage);

chatInput.addEventListener("keydown", function(event) {
  if (event.key === "Enter") {
    sendChatMessage();
  }
});