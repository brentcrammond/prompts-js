const Prompts = (function () {
  let modalOpen = false;
  let previouslyFocusedElement = null;

  // Common styles
  const overlayStyle = {
    position: "fixed",
    top: "0",
    left: "0",
    right: "0",
    bottom: "0",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: "999999",
  };

  const modalStyle = {
    backgroundColor: "#fff",
    borderRadius: "6px",
    padding: "20px",
    minWidth: "300px",
    maxWidth: "80%",
    boxSizing: "border-box",
    fontFamily: "sans-serif",
    boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
  };

  const messageStyle = {
    marginBottom: "20px",
    fontSize: "16px",
    color: "#333",
    wordWrap: "break-word",
    whiteSpace: "pre-wrap",
  };

  const buttonRowStyle = {
    textAlign: "right",
    marginTop: "20px",
  };

  const buttonStyle = {
    backgroundColor: "#007bff",
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "8px 12px",
    fontSize: "14px",
    cursor: "pointer",
    marginLeft: "8px",
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "8px",
    fontSize: "14px",
    marginBottom: "20px",
    borderRadius: "4px",
    border: "1px solid #ccc",
  };

  function applyStyles(element, styles) {
    for (const prop in styles) {
      element.style[prop] = styles[prop];
    }
  }

  function createModal(message) {
    const overlay = document.createElement("div");
    applyStyles(overlay, overlayStyle);

    const modal = document.createElement("div");
    applyStyles(modal, modalStyle);

    const form = document.createElement("form");
    form.setAttribute("novalidate", "true");
    modal.appendChild(form);

    const msg = document.createElement("div");
    applyStyles(msg, messageStyle);
    msg.textContent = message;

    form.appendChild(msg);
    overlay.appendChild(modal);

    return { overlay, modal, form };
  }

  function createButton(label, onClick, type = "button") {
    const btn = document.createElement("button");
    applyStyles(btn, buttonStyle);
    btn.type = type;
    btn.textContent = label;
    if (onClick) {
      btn.addEventListener("click", onClick);
    }
    return btn;
  }

  function showModal(overlay, onClose) {
    if (modalOpen) return; // Prevent multiple modals
    modalOpen = true;

    previouslyFocusedElement = document.activeElement;
    document.body.appendChild(overlay);

    // Focus trap and ESC handler
    const focusableElements = overlay.querySelectorAll(
      'button, input, [href], select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    function keyHandler(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        cleanup();
        onClose("escape");
      } else if (e.key === "Tab") {
        // Focus trapping
        if (focusableElements.length === 1) {
          e.preventDefault(); // Only one focusable element, cycle back to it.
        } else {
          if (e.shiftKey && document.activeElement === firstFocusable) {
            // If Shift+Tab on first element, go to last
            e.preventDefault();
            lastFocusable.focus();
          } else if (!e.shiftKey && document.activeElement === lastFocusable) {
            // If Tab on last element, go to first
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    }

    document.addEventListener("keydown", keyHandler);

    function cleanup() {
      document.removeEventListener("keydown", keyHandler);
      if (overlay.parentNode) {
        document.body.removeChild(overlay);
      }
      modalOpen = false;
      if (previouslyFocusedElement && previouslyFocusedElement.focus) {
        previouslyFocusedElement.focus();
      }
    }

    return { cleanup, firstFocusable, focusableElements };
  }

  async function alert(message) {
    return new Promise((resolve) => {
      const { overlay, form } = createModal(message);

      const buttonRow = document.createElement("div");
      applyStyles(buttonRow, buttonRowStyle);

      // OK button submits the form
      const okBtn = createButton("OK", null, "submit");
      buttonRow.appendChild(okBtn);
      form.appendChild(buttonRow);

      form.onsubmit = (e) => {
        e.preventDefault();
        cleanup();
        resolve();
      };

      const { cleanup, firstFocusable } = showModal(overlay, (reason) => {
        // Escape pressed
        resolve();
      });

      // Move focus to OK button
      firstFocusable.focus();
    });
  }

  async function confirm(message) {
    return new Promise((resolve) => {
      const { overlay, form } = createModal(message);

      const buttonRow = document.createElement("div");
      applyStyles(buttonRow, buttonRowStyle);

      const cancelBtn = createButton("Cancel", (e) => {
        e.preventDefault();
        cleanup();
        resolve(false);
      });
      cancelBtn.style.backgroundColor = "#6c757d";

      const okBtn = createButton("OK", null, "submit");

      buttonRow.appendChild(cancelBtn);
      buttonRow.appendChild(okBtn);
      form.appendChild(buttonRow);

      form.onsubmit = (e) => {
        e.preventDefault();
        // Enter key (submit) is treated as clicking OK
        cleanup();
        resolve(true);
      };

      const { cleanup, focusableElements } = showModal(overlay, (reason) => {
        // If escaped, treat as cancel
        resolve(false);
      });

      // Move focus to OK button (second button)
      focusableElements[1].focus();
    });
  }

  async function prompt(message) {
    return new Promise((resolve) => {
      const { overlay, form } = createModal(message);

      const input = document.createElement("input");
      applyStyles(input, inputStyle);
      input.type = "text";
      input.name = "promptInput";
      form.appendChild(input);

      const buttonRow = document.createElement("div");
      applyStyles(buttonRow, buttonRowStyle);

      const cancelBtn = createButton("Cancel", (e) => {
        e.preventDefault();
        cleanup();
        resolve(null);
      });
      cancelBtn.style.backgroundColor = "#6c757d";

      const okBtn = createButton("OK", null, "submit");

      buttonRow.appendChild(cancelBtn);
      buttonRow.appendChild(okBtn);
      form.appendChild(buttonRow);

      form.onsubmit = (e) => {
        e.preventDefault();
        const val = input.value;
        cleanup();
        resolve(val);
      };

      const { cleanup, firstFocusable } = showModal(overlay, (reason) => {
        // If escaped, treat as cancel
        resolve(null);
      });

      // Focus on the input for convenience
      input.focus();
    });
  }

  return { alert, confirm, prompt };
})();