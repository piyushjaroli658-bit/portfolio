const chatInput = document.getElementById("userInput");
const chatButton = document.getElementById("sendButton");
const chatMessages = document.getElementById("chatMessages");
const chatStatus = document.getElementById("chatStatus");

function showChatMessage(role, text) {
  const message = document.createElement("div");

  message.className =
    "chat-message " +
    (role === "user" ? "chat-user" : "chat-assistant");

  // Use textContent so message text is not treated as HTML.
  message.textContent = text;

  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendChatMessage() {
  const question = chatInput.value.trim();

  if (!question || chatButton.disabled) {
    return;
  }

  if (question.length > 1000) {
    chatStatus.textContent =
      "Please keep your question under 1000 characters.";
    return;
  }

  showChatMessage("user", question);
  chatInput.value = "";
  chatButton.disabled = true;
  chatStatus.textContent = "AI is thinking...";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error || "The AI service is temporarily unavailable."
      );
    }

    if (
      typeof data.answer !== "string" ||
      !data.answer.trim()
    ) {
      throw new Error("The AI service returned an empty answer.");
    }

    showChatMessage("assistant", data.answer);
  } catch (error) {
    console.error("Chat request failed:", error.message);

    if (!navigator.onLine) {
      showChatMessage(
        "assistant",
        "You appear to be offline. Please reconnect and try again."
      );
    } else {
      showChatMessage(
        "assistant",
        error.message || "Unable to contact the AI assistant."
      );
    }
  } finally {
    chatButton.disabled = false;
    chatStatus.textContent = "";
  }
}

chatButton.addEventListener("click", sendChatMessage);

chatInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    sendChatMessage();
  }
});
