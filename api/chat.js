const recentRequests = new Map();

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      error: "Method not allowed."
    });
  }

  const ip = (
    req.headers["x-forwarded-for"] || "unknown"
  ).toString().split(",")[0].trim();

  // Best-effort in-memory limit.
  // Use Vercel Firewall or a durable rate limiter for production.
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 15;
  const previous = recentRequests.get(ip) || [];

  const recent = previous.filter(
    timestamp => now - timestamp < windowMs
  );

  if (recent.length >= maxRequests) {
    return res.status(429).json({
      error: "Too many requests. Please wait a minute."
    });
  }

  recent.push(now);
  recentRequests.set(ip, recent);

  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.error("GROQ_API_KEY is not configured.");
    return res.status(503).json({
      error: "The AI assistant is not configured yet."
    });
  }

  const body = req.body || {};
  const question =
    typeof body.question === "string"
      ? body.question.trim()
      : "";

  if (!question) {
    return res.status(400).json({
      error: "Please enter a question."
    });
  }

  if (question.length > 1000) {
    return res.status(400).json({
      error: "Please keep your question under 1000 characters."
    });
  }

  const portfolioContext = `
You are the AI assistant for Piyush Jaroli's personal portfolio.

Verified information shown on the portfolio:
- Piyush is an undergraduate Computer Science student.
- His specialization is Artificial Intelligence and Machine Learning.
- Listed skills: C++, C, Python, Agentic AI, and Data Structures and Algorithms.
- Python Programs Collection: links to Fibonacci, factorial, and structure-to-dictionary repositories.
- Messy Python Code Improvement: a Python code-improvement project.
- Bug Fixing in Python: a project documenting Python debugging work.
- Interactive Quiz Application: a quiz project.
- Book Reading List: a reading-list project.
- GitHub profile: https://github.com/piyushjaroli658-bit
- Contact email: piyushjaroli658@gmail.com

Only answer using the information above or details explicitly provided by the user.
Do not invent grades, dates, employment, internships, achievements, or project features.
If you do not know an answer, clearly say that the portfolio does not provide that information.
Keep answers concise and professional, ideally under 100 words.
`;

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          temperature: 0.3,
          max_tokens: 250,
          messages: [
            {
              role: "system",
              content: portfolioContext
            },
            {
              role: "user",
              content: question
            }
          ]
        }),
        signal: AbortSignal.timeout(20000)
      }
    );

    if (response.status === 429) {
      return res.status(429).json({
        error: "The AI service is busy. Please try again shortly."
      });
    }
    
    if (!response.ok) {
      const errorText = await response.text();

      console.error(
        "Groq API error:",
        response.status,
        errorText
      );

      return res.status(502).json({
        error: "The AI service is temporarily unavailable.",
        details: errorText,
        status: response.status
      });
    }


    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content;

    if (typeof answer !== "string" || !answer.trim()) {
      return res.status(502).json({
        error: "The AI service returned an invalid response."
      });
    }

    return res.status(200).json({
      answer: answer.trim()
    });
  } catch (error) {
    console.error("Chat endpoint error:", error.message);

    return res.status(502).json({
      error: "Unable to contact the AI service. Please try again."
    });
  }
};
