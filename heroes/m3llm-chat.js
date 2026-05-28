(function () {
  window.M3Heroes = window.M3Heroes || {};

  const SCRIPT = [
    {
      role: "bot",
      text: "Hi! Ask me anything about your account.",
    },
    {
      role: "user",
      text: "What's my hosting plan?",
    },
    {
      role: "bot",
      text: "Managed M3 hosting—SSL, backups, and 99.9% uptime included.",
    },
    {
      role: "user",
      text: "Landing page cost?",
    },
    {
      role: "bot",
      text: "From $2,400. We can scope it in your portal.",
    },
    {
      role: "user",
      text: "Perfect, thanks!",
    },
    {
      role: "bot",
      text: "Anytime! Let me know if you have any other questions.",
    },
  ];

  const TYPE_SPEED = {
    bot: 22,
    user: 50,
  };

  function sleep(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms);
    });
  }

  function formatBrandText(text) {
    return text.replace(/\bM3\b/g, 'M<sup class="m3-chat-demo__mark">3</sup>');
  }

  function buildChatMarkup() {
    return `
      <div class="m3-chat-demo" aria-hidden="true">
        <div class="m3-chat-demo__window">
          <div class="m3-chat-demo__header">
            <span class="m3-chat-demo__title">M<sup class="m3-chat-demo__mark">3</sup> assistant</span>
            <button class="m3-chat-demo__close" type="button" aria-label="Close chat" tabindex="-1"></button>
          </div>
          <div class="m3-chat-demo__body">
            <div class="m3-chat-demo__messages"></div>
          </div>
          <div class="m3-chat-demo__composer">
            <span class="m3-chat-demo__input">Message...</span>
            <span class="m3-chat-demo__send" aria-hidden="true"></span>
          </div>
        </div>
      </div>
    `;
  }

  function createBubble(message) {
    const bubble = document.createElement("div");
    bubble.className = `m3-chat-demo__bubble m3-chat-demo__bubble--${message.role}`;
    bubble.style.opacity = "0";
    bubble.style.transform = "translateY(8px)";
    return bubble;
  }

  window.M3Heroes.mountM3LlmChat = async function mountM3LlmChat(container) {
    container.innerHTML = buildChatMarkup();
    container.classList.add("feature-hero__chat-mount");

    const messagesEl = container.querySelector(".m3-chat-demo__messages");
    const inputEl = container.querySelector(".m3-chat-demo__input");

    let paused = true;
    let cancelled = false;
    let conversationStarted = false;

    async function waitWhilePaused() {
      while (paused && !cancelled) {
        await sleep(120);
      }
    }

    async function interruptibleSleep(ms) {
      const step = 50;
      let elapsed = 0;

      while (elapsed < ms) {
        if (cancelled) return;
        await waitWhilePaused();
        if (cancelled) return;

        const chunk = Math.min(step, ms - elapsed);
        await sleep(chunk);
        elapsed += chunk;
      }
    }

    async function revealBubble(bubble) {
      messagesEl.appendChild(bubble);
      messagesEl.scrollTop = messagesEl.scrollHeight;

      if (window.gsap) {
        await new Promise((resolve) => {
          gsap.to(bubble, {
            opacity: 1,
            y: 0,
            duration: 0.52,
            ease: "power2.out",
            onComplete: resolve,
          });
        });
        return;
      }

      bubble.style.opacity = "1";
      bubble.style.transform = "translateY(0)";
    }

    async function typeIntoComposer(text) {
      inputEl.textContent = "";
      inputEl.classList.add("is-typing");

      for (let i = 0; i < text.length; i += 1) {
        await waitWhilePaused();
        if (cancelled) return;

        inputEl.textContent = text.slice(0, i + 1);
        await interruptibleSleep(TYPE_SPEED.user);
      }

      inputEl.classList.remove("is-typing");
      await interruptibleSleep(350);
      if (cancelled) return;
      inputEl.textContent = "Message...";
    }

    async function typeIntoBubble(bubble, text) {
      bubble.textContent = "\u00a0";

      for (let i = 0; i < text.length; i += 1) {
        await waitWhilePaused();
        if (cancelled) return;

        bubble.textContent = text.slice(0, i + 1);
        messagesEl.scrollTop = messagesEl.scrollHeight;
        await interruptibleSleep(TYPE_SPEED.bot);
      }

      bubble.innerHTML = formatBrandText(text);
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    async function playConversation() {
      while (!cancelled) {
        await waitWhilePaused();
        if (cancelled) return;

        messagesEl.innerHTML = "";
        inputEl.textContent = "Message...";

        for (const message of SCRIPT) {
          await waitWhilePaused();
          if (cancelled) return;

          if (message.role === "user") {
            await typeIntoComposer(message.text);
            if (cancelled) return;

            const bubble = createBubble(message);
            bubble.textContent = message.text;
            await revealBubble(bubble);
            await interruptibleSleep(900);
            continue;
          }

          await interruptibleSleep(200);
          if (cancelled) return;

          const bubble = createBubble(message);
          await revealBubble(bubble);
          await typeIntoBubble(bubble, message.text);
          await interruptibleSleep(1200);
        }

        await interruptibleSleep(1800);
      }
    }

    function startConversation() {
      if (conversationStarted || cancelled) return;
      conversationStarted = true;
      playConversation();
    }

    return {
      destroy() {
        cancelled = true;
        container.innerHTML = "";
        container.classList.remove("feature-hero__chat-mount");
      },
      pause() {
        paused = true;
      },
      resume() {
        paused = false;
        startConversation();
      },
      setVisible() {},
      resize() {},
    };
  };
})();
