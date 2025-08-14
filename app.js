// DOM Elements
const textDisplay = document.getElementById("text-display");
const textInput = document.getElementById("text-input");
const instruction = document.getElementById("instruction");
const timerElement = document.getElementById("timer");
const timerBox = document.getElementById("timer-box");
const wpmElement = document.getElementById("wpm");
const accuracyElement = document.getElementById("accuracy");
const errorsElement = document.getElementById("errors");
const summaryModal = document.getElementById("summary-modal");
const modalWpm = document.getElementById("modal-wpm");
const modalAccuracy = document.getElementById("modal-accuracy");
const modalErrors = document.getElementById("modal-errors");
const quoteElement = document.getElementById("motivational-quote");
const restartBtn = document.getElementById("restart-btn");
const generateBtn = document.getElementById("generate-btn");
const defaultPassageBtn = document.getElementById("default-passage-btn");
const resetBtn = document.getElementById("reset-btn");
const askAiBtn = document.getElementById("ask-ai-btn");
const hideTimerToggle = document.getElementById("hide-timer-toggle");
const blurTextToggle = document.getElementById("blur-text-toggle");
const timeSelect = document.getElementById("time-select");
const cursor = document.getElementById("cursor");
const confettiContainer = document.getElementById("confetti-container");
const fireworkContainer = document.getElementById("firework-container");

// AI Help Modal Elements
const helpModal = document.getElementById("help-modal");
const closeHelpBtn = document.getElementById("close-help-btn");
const aiQuestionInput = document.getElementById("ai-question");
const submitQuestionBtn = document.getElementById("submit-question-btn");
const aiResponseDisplay = document.getElementById("ai-response");

// Static Default Passages
const defaultPassage =
  "The solar system is a vast and fascinating place. It includes the sun, eight planets, numerous moons, and countless asteroids and comets. Each planet has unique characteristics, from the scorching heat of Mercury to the frigid, distant reaches of Neptune. Exploring the cosmos helps us understand our own place in the universe and the fundamental laws that govern it.";

// State variables
let timer;
let initialTime = 60;
let timeLeft = initialTime;
let testRunning = false;
let totalTypedCharacters = 0;
let correctCharacters = 0;
let wordIndex = 0;
let errorCount = 0;
let charIndex = 0;
let isGenerating = false;
let currentPassage = defaultPassage;

// Motivational quotes for the end screen
const motivationalQuotes = [
  "The best way to predict the future is to create it.",
  "Believe you can and you're halfway there.",
  "The only way to do great work is to love what you do.",
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "Don't watch the clock; do what it does. Keep going.",
  "The future belongs to those who believe in the beauty of their dreams."
];

// Winning sound effect
const synth = new Tone.Synth().toDestination();

// Function to create confetti
function createConfetti() {
  const colors = ["#f00", "#0f0", "#00f", "#ff0", "#0ff", "#f0f"];
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement("div");
    confetti.classList.add("confetti");
    confetti.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];
    confetti.style.left = `${Math.random() * 100}vw`;
    confetti.style.animation = `confetti-fall ${
      Math.random() * 3 + 2
    }s ease-out forwards`;
    confetti.style.animationDelay = `${Math.random() * 0.5}s`;
    confettiContainer.appendChild(confetti);
  }
  setTimeout(() => {
    confettiContainer.innerHTML = "";
  }, 5000);
}

// Function to create a firework
function createFirework() {
  const firework = document.createElement("div");
  firework.classList.add("firework");
  firework.style.left = `${Math.random() * 100}vw`;
  firework.style.top = `${Math.random() * 100}vh`;
  firework.style.setProperty("--delay", `${Math.random() * 0.5}s`);
  fireworkContainer.appendChild(firework);
  setTimeout(() => {
    firework.remove();
  }, 1000);
}

// Function to launch multiple fireworks
function launchFireworks() {
  for (let i = 0; i < 5; i++) {
    setTimeout(createFirework, Math.random() * 800);
  }
}

// Function to play winning sound
async function playWinningSound() {
  await Tone.start();
  const now = Tone.now();
  synth.triggerAttackRelease("C4", "8n", now);
  synth.triggerAttackRelease("E4", "8n", now + 0.2);
  synth.triggerAttackRelease("G4", "8n", now + 0.4);
  synth.triggerAttackRelease("C5", "4n", now + 0.6);
}

// Function to fetch a new typing passage from the Gemini API
async function getNewPassage() {
  isGenerating = true;
  generateBtn.disabled = true;
  defaultPassageBtn.disabled = true;
  resetBtn.disabled = true;
  askAiBtn.disabled = true;
  textInput.disabled = true;
  textDisplay.innerHTML = `<div class="loading"><span></span><span></span><span></span></div>`;

  const retryFetch = async (url, options, retries = 3) => {
    let lastError;
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        return result;
      } catch (error) {
        lastError = error;
        await new Promise((res) => setTimeout(res, Math.pow(2, i) * 1000));
      }
    }
    throw lastError;
  };

  try {
    const prompt =
      "Generate a new, compelling 100-word paragraph for a typing test. The paragraph should be about a general topic, such as technology, science, history, or nature. It should contain no more than 100 words and no special characters, only standard English punctuation and letters.";

    let chatHistory = [];
    chatHistory.push({
      role: "user",
      parts: [
        {
          text: prompt
        }
      ]
    });
    const payload = {
      contents: chatHistory
    };
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const response = await retryFetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (
      response.candidates &&
      response.candidates.length > 0 &&
      response.candidates[0].content &&
      response.candidates[0].content.parts &&
      response.candidates[0].content.parts.length > 0
    ) {
      currentPassage = response.candidates[0].content.parts[0].text
        .replace(/\n/g, " ")
        .trim();
    } else {
      currentPassage = defaultPassage;
    }
  } catch (error) {
    currentPassage = defaultPassage;
  } finally {
    isGenerating = false;
    generateBtn.disabled = false;
    defaultPassageBtn.disabled = false;
    resetBtn.disabled = false;
    askAiBtn.disabled = false;
    textInput.disabled = false;
    initializeTest();
  }
}

// Renders the text passage on the screen
function renderText() {
  const words = currentPassage.split(" ");
  textDisplay.innerHTML = words
    .map(
      (word) =>
        `<span class="word">${word
          .split("")
          .map((char) => `<span class="char">${char}</span>`)
          .join("")}</span>`
    )
    .join('<span class="word-separator"> </span>');

  if (textDisplay.querySelector(".word")) {
    textDisplay.querySelector(".word").classList.add("current");
  }
}

// Resets and initializes the typing test
function initializeTest() {
  clearInterval(timer);
  renderText();

  // Reset state
  timeLeft = initialTime;
  testRunning = false;
  totalTypedCharacters = 0;
  correctCharacters = 0;
  wordIndex = 0;
  errorCount = 0;
  charIndex = 0;

  // Reset UI
  timerElement.textContent = `${timeLeft}s`;
  wpmElement.textContent = 0;
  accuracyElement.textContent = "0%";
  errorsElement.textContent = 0;
  textInput.value = "";
  summaryModal.classList.remove("active");
  instruction.style.display = "block";

  positionCursor();
  textInput.focus();
}

// Starts the countdown timer
function startTimer() {
  timer = setInterval(() => {
    timeLeft--;
    timerElement.textContent = `${timeLeft}s`;
    if (timeLeft <= 0) {
      endTest();
    }
  }, 1000);
}

// Ends the test and shows the summary modal
function endTest() {
  clearInterval(timer);
  testRunning = false;
  textInput.disabled = true;
  instruction.style.display = "none";
  cursor.style.visibility = "hidden";

  createConfetti();
  launchFireworks();
  playWinningSound();

  const finalWPM = Math.round(correctCharacters / 5 / (initialTime / 60));
  const finalAccuracy =
    totalTypedCharacters > 0
      ? ((correctCharacters / totalTypedCharacters) * 100).toFixed(2)
      : 0;

  modalWpm.textContent = finalWPM;
  modalAccuracy.textContent = `${finalAccuracy}%`;
  modalErrors.textContent = errorCount;

  let message = "";
  if (errorCount === 0) {
    message = "🍒 Your Tashaq's are not being Kashaled";
  } else if (errorCount === 3) {
    message = "🍒 Your Tashaqs are being kashaled";
  } else {
    message =
      motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
  }

  quoteElement.textContent = message;

  summaryModal.classList.add("active");
}

// Updates the WPM, Accuracy, and Errors metrics in real-time
function updateMetrics() {
  const timeElapsed = initialTime - timeLeft;
  const currentWPM =
    timeElapsed > 0
      ? Math.round(correctCharacters / 5 / (timeElapsed / 60))
      : 0;
  const currentAccuracy =
    totalTypedCharacters > 0
      ? ((correctCharacters / totalTypedCharacters) * 100).toFixed(2)
      : 0;

  wpmElement.textContent = currentWPM > 0 ? currentWPM : 0;
  accuracyElement.textContent = `${currentAccuracy}%`;
  errorsElement.textContent = errorCount;
}

// Positions the cursor at the current typing position
function positionCursor() {
  if (isGenerating || !testRunning) {
    cursor.style.visibility = "hidden";
    return;
  }

  const wordsElements = textDisplay.querySelectorAll(".word");
  const currentWordEl = wordsElements[wordIndex];

  if (!currentWordEl) {
    cursor.style.visibility = "hidden";
    return;
  }

  const containerRect = textDisplay.getBoundingClientRect();
  let rect;
  let topPosition = 0;

  const chars = currentWordEl.querySelectorAll(".char");
  if (charIndex === 0) {
    rect = currentWordEl.getBoundingClientRect();
    topPosition = rect.top;
    cursor.style.left = `${rect.left - containerRect.left}px`;
  } else if (charIndex <= chars.length) {
    rect = chars[charIndex - 1].getBoundingClientRect();
    topPosition = rect.top;
    cursor.style.left = `${rect.left + rect.width - containerRect.left}px`;
  } else {
    rect = chars[chars.length - 1].getBoundingClientRect();
    topPosition = rect.top;
    cursor.style.left = `${rect.left + rect.width - containerRect.left}px`;
  }

  cursor.style.top = `${topPosition - containerRect.top}px`;
  cursor.style.visibility = "visible";
}

// Main function to handle user input
function handleInput(event) {
  if (!testRunning) {
    testRunning = true;
    startTimer();
    instruction.style.display = "none";
    cursor.style.visibility = "visible";
  }

  const words = currentPassage.split(" ");
  const typedText = textInput.value;
  const currentWordEl = textDisplay.querySelectorAll(".word")[wordIndex];
  const currentWordText = words[wordIndex];
  const currentWordChars = currentWordEl.querySelectorAll(".char");

  // Logic to handle moving to the next word
  if (event.data === " ") {
    // Before moving to the next word, tally the errors for the current word
    let currentWordErrors = 0;
    let currentWordCorrect = 0;
    const minLength = Math.min(typedText.trim().length, currentWordText.length);

    for (let i = 0; i < minLength; i++) {
      if (typedText.trim()[i] === currentWordText[i]) {
        currentWordCorrect++;
      } else {
        currentWordErrors++;
      }
    }

    // Add extra typed characters as errors
    if (typedText.trim().length > currentWordText.length) {
      currentWordErrors += typedText.trim().length - currentWordText.length;
    }

    // Any untyped characters on a word are also considered errors when moving on
    currentWordErrors +=
      currentWordText.length -
      (currentWordCorrect + (typedText.trim().length - currentWordCorrect));

    correctCharacters += currentWordCorrect;
    errorCount += currentWordErrors;
    totalTypedCharacters += typedText.trim().length;

    // Mark any untyped characters as incorrect
    for (let i = typedText.trim().length; i < currentWordText.length; i++) {
      currentWordChars[i].classList.add("incorrect");
    }

    currentWordEl.classList.remove("current");
    currentWordEl.classList.add("typed");
    wordIndex++;
    charIndex = 0;
    textInput.value = "";

    if (wordIndex < words.length) {
      textDisplay.querySelectorAll(".word")[wordIndex].classList.add("current");
    } else {
      endTest();
    }
  } else {
    charIndex = typedText.length;
  }

  // Live character feedback for the current word
  currentWordChars.forEach((charSpan, index) => {
    if (index < typedText.length) {
      if (charSpan.textContent === typedText[index]) {
        charSpan.classList.remove("incorrect");
        charSpan.classList.add("correct");
      } else {
        charSpan.classList.remove("correct");
        charSpan.classList.add("incorrect");
      }
    } else {
      charSpan.classList.remove("correct", "incorrect");
    }
  });

  // Update metrics based on all words
  let totalTyped = 0;
  let totalCorrect = 0;
  let totalErrors = 0;

  for (let i = 0; i < wordIndex; i++) {
    const wordChars = textDisplay
      .querySelectorAll(".word")
      [i].querySelectorAll(".char");
    wordChars.forEach((charSpan) => {
      totalTyped++;
      if (charSpan.classList.contains("correct")) {
        totalCorrect++;
      } else if (charSpan.classList.contains("incorrect")) {
        totalErrors++;
      }
    });
  }

  const currentWordTyped = typedText.length;
  const currentWordCorrect = [...currentWordText].filter(
    (char, i) => char === typedText[i]
  ).length;
  const currentWordErrors = currentWordTyped - currentWordCorrect;

  totalTypedCharacters = totalTyped + currentWordTyped;
  correctCharacters = totalCorrect + currentWordCorrect;
  errorCount = totalErrors + currentWordErrors;

  updateMetrics();
  positionCursor();
}

// Function to get a response from the AI helper
async function getAIResponse(question) {
  submitQuestionBtn.disabled = true;
  aiResponseDisplay.innerHTML = `<div class="loading"><span></span><span></span><span></span></div>`;
  const prompt = `You are a typing tutor AI. Provide a helpful, concise, and encouraging response to the following question related to typing, grammar, or writing.
Question: ${question}
Response:`;

  const retryFetch = async (url, options, retries = 3) => {
    let lastError;
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        return result;
      } catch (error) {
        lastError = error;
        await new Promise((res) => setTimeout(res, Math.pow(2, i) * 1000));
      }
    }
    throw lastError;
  };

  try {
    let chatHistory = [];
    chatHistory.push({
      role: "user",
      parts: [
        {
          text: prompt
        }
      ]
    });
    const payload = {
      contents: chatHistory
    };
    const apiKey = "";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

    const response = await retryFetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (
      response.candidates &&
      response.candidates.length > 0 &&
      response.candidates[0].content &&
      response.candidates[0].content.parts &&
      response.candidates[0].content.parts.length > 0
    ) {
      aiResponseDisplay.textContent =
        response.candidates[0].content.parts[0].text;
    } else {
      aiResponseDisplay.textContent =
        "Sorry, I couldn't generate a response. Please try again.";
    }
  } catch (error) {
    console.error("API Call failed:", error);
    aiResponseDisplay.textContent =
      "Sorry, I couldn't connect to the AI. Please check your network and try again.";
  } finally {
    submitQuestionBtn.disabled = false;
  }
}

// Event Listeners
textInput.addEventListener("input", handleInput);
textInput.addEventListener("keydown", (event) => {
  if (event.key === "Backspace") {
    // If the user hits backspace, reset the current word
    textInput.value = "";
    const currentWordEl = textDisplay.querySelectorAll(".word")[wordIndex];
    if (currentWordEl) {
      currentWordEl.querySelectorAll(".char").forEach((charSpan) => {
        charSpan.classList.remove("correct", "incorrect");
      });
    }
    charIndex = 0;
    positionCursor();
  }
});

summaryModal.addEventListener("click", (event) => {
  if (event.target === summaryModal) {
    summaryModal.classList.remove("active");
  }
});

restartBtn.addEventListener("click", () => {
  initializeTest();
});

generateBtn.addEventListener("click", () => {
  if (!isGenerating) {
    getNewPassage();
  }
});

defaultPassageBtn.addEventListener("click", () => {
  if (!isGenerating) {
    currentPassage = defaultPassage;
    initializeTest();
  }
});

resetBtn.addEventListener("click", () => {
  initializeTest();
});

askAiBtn.addEventListener("click", () => {
  helpModal.classList.add("active");
  aiQuestionInput.value = "";
  aiResponseDisplay.textContent = "";
  aiQuestionInput.focus();
});

closeHelpBtn.addEventListener("click", () => {
  helpModal.classList.remove("active");
});

submitQuestionBtn.addEventListener("click", () => {
  const question = aiQuestionInput.value.trim();
  if (question) {
    getAIResponse(question);
  }
});

helpModal.addEventListener("click", (event) => {
  if (event.target === helpModal) {
    helpModal.classList.remove("active");
  }
});

hideTimerToggle.addEventListener("change", (e) => {
  if (e.target.checked) {
    timerBox.classList.add("hidden");
  } else {
    timerBox.classList.remove("hidden");
  }
});

blurTextToggle.addEventListener("change", (e) => {
  if (e.target.checked) {
    textDisplay.classList.add("blurred");
  } else {
    textDisplay.classList.remove("blurred");
  }
});

timeSelect.addEventListener("change", (e) => {
  initialTime = parseInt(e.target.value, 10);
  initializeTest();
});

// Initialize the app on load
window.onload = function () {
  initializeTest();
};
