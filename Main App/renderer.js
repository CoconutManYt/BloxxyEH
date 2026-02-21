// renderer.js
// const ipc = window.api; // always use the exposed API
console.log("I am loaded trust")

document.addEventListener('DOMContentLoaded', () => {
  const ipc = window.api; // always use the exposed API
if(window != null){
  console.log("window")
}
if(window.api != null){
  console.log("api")
}

  // ==============================
  //  SETTINGS SAVE/LOAD
  // ==============================

  function getAllSettings() {
    const settings = {};
    document.querySelectorAll('input[id], select[id], textarea[id]').forEach(el => {
      if (el.type === 'checkbox') settings[el.id] = el.checked;
      else settings[el.id] = el.value;
    });
    return settings;
  }

  function applySettings(settings) {
    for (const id in settings) {
      const el = document.getElementById(id);
      if (!el) continue;
      if (el.type === 'checkbox') el.checked = settings[id];
      else el.value = settings[id];

      // Trigger input/change events so UI updates
      el.dispatchEvent(new Event('input'));
      el.dispatchEvent(new Event('change'));
    }
  }

  async function loadSettings() {
    try {
      const saved = await ipc.invoke?.('load-all-options') || await ipc.invoke('load-all-options');
      if (saved) applySettings(saved);
    } catch (err) {
      console.warn("Failed to load settings:", err);
    }
  }
  const saveBtn = document.getElementById("saveStgs")
  const popup = document.getElementById('settingsPopup')

  const closePopup = () => popup?.classList.remove('open')

  document.getElementById('popupOk')?.addEventListener('click', closePopup)
  document.getElementById('popupClose')?.addEventListener('click', closePopup)

  saveBtn.addEventListener('click', () => {
    const settings = getAllSettings()
    ipc.send('save-all-options', settings)

    // Populate popup body
    const popupBody = document.getElementById('popupBody')
    if (popupBody) {
      popupBody.innerHTML = Object.entries(settings).map(([key, value]) => `
        <div class="popup-row">
          <span class="popup-key">${key}</span>
          <span class="popup-val">${value === true ? 'on' : value === false ? 'off' : value || '—'}</span>
        </div>
      `).join('')
    }

    popup?.classList.add('open')
  })

  loadSettings();

  // ==============================
  //  NAVIGATION
  // ==============================
  const navBtns = document.querySelectorAll('.nav-btn[data-page]');
  const pages = document.querySelectorAll('.page');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.page;

      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      pages.forEach(p => p.classList.remove('active'));
      const targetPage = document.getElementById('page-' + target);
      if (targetPage) targetPage.classList.add('active');
    });
  });

  // ==============================
  //  WINDOW CONTROLS
  // ==============================
  document.getElementById('minimBtn')?.addEventListener('click', () => ipc.send('minimize-window'));
  document.getElementById('fullBtn')?.addEventListener('click', () => ipc.send('toggle-maximize'));
  document.getElementById('closeBtn')?.addEventListener('click', () => window.close());

  // ==============================
  //  TOGGLE DISPLAY
  // ==============================
  const activeToggle = document.querySelector("#autofarmToggle input");
  const activeText = document.getElementById("displayActivity");
  const statusText = document.getElementById("statusText");
  const statusDot = document.getElementById("statusDot");

  function updateToggleDisplay() {
    if (!activeToggle) return;

    if (activeToggle.checked) {
      activeText.textContent = "ON";
      activeText.style.color = "var(--green)";
      statusText.textContent = "Running";
      statusDot.style.background = "var(--green)";
      statusDot.style.boxShadow = "0 0 8px var(--green)";
    } else {
      activeText.textContent = "OFF";
      activeText.style.color = "var(--red)";
      statusText.textContent = "Stopped";
      statusDot.style.background = "var(--red)";
      statusDot.style.boxShadow = "0 0 8px var(--red)";
    }
  }

  if (activeToggle) {
    activeToggle.addEventListener("change", updateToggleDisplay);
    updateToggleDisplay();
  }

  // ==============================
  //  SLIDERS
  // ==============================
  document.querySelectorAll('.slider').forEach(slider => {
    const display = slider.closest('.slider-wrap')?.querySelector('.slider-val');
    if (!display) return;

    const updateDisplay = () => {
      if (slider.id === "timeSlider") display.textContent = `${slider.value}min`;
      else display.textContent = `${slider.value}px`;
    };

    slider.addEventListener('input', updateDisplay);
    updateDisplay();
  });

  // ==============================
  //  KEYBINDS & EXE
  // ==============================

  const safeKeybindEl = document.getElementById("safeKeybind");
if (safeKeybindEl) ipc.send('register-keybind', safeKeybindEl.textContent.trim(), 'safeKeyPressed');

ipc.on('safeKeyPressed', async () => {
  if (!statusText || !statusDot) return;

  statusText.textContent = "Doing Safe Robbery";
  statusDot.style.background = "var(--green)";
  statusDot.style.boxShadow = "0 0 8px var(--green)";

  const exePath = "modules/safeRobbery/safeRobbery.exe";
  try {
    const result = await ipc.invoke('run-exe', exePath, ['arg1', 'arg2']);
    console.log("EXE output:", result.stdout);
    updateToggleDisplay();
  } catch (err) {
    console.error("Error running EXE:", err);
    alert("Failed to run program: " + err.message);
  }
});

const closeKeybindEl = document.getElementById("closeKeybind");
if (closeKeybindEl) ipc.send('register-keybind', closeKeybindEl.textContent.trim(), 'closeKeyPressed');

ipc.on('closeKeyPressed', () => {
  window.close();
});

  // ==============================
  //  SERVER JOIN
  // ==============================
  const PLACE_ID = "7711635737";
  const serverLink = document.getElementById("privLink");
  const resetBtn = document.getElementById("resetBtn");

  if (resetBtn) {
  resetBtn.onclick = () => {
    ipc.send('exec-cmd', 'taskkill /F /IM "RobloxPlayerBeta.exe"');
    const url = serverLink?.value;
    if (url) ipc.send('exec-cmd', `start "" "${url}"`);
  };
}

[1, 2, 3, 4, 5].forEach(id => {
  const input = document.getElementById(`server${id}`);
  const nameInput = document.getElementById(`server${id}name`);
  const btn = document.getElementById(`server${id}btn`);
  if (!input || !btn) return;

  btn.onclick = () => {
    ipc.send('exec-cmd', 'taskkill /F /IM "RobloxPlayerBeta.exe"');
    if (input.value) {
      const url = `https://www.roblox.com/games/start?placeId=${PLACE_ID}&launchData=joinCode%3D${input.value}`;
      ipc.send('exec-cmd', `start "" "${url}"`);
    }
  };

  if (nameInput) {
    nameInput.addEventListener("input", () => {
      const label = nameInput.closest(".section")?.querySelector(".section-label");
      if (label) label.textContent = nameInput.value.trim() || `Server ${id}`;
    });
  }
});

  // ==============================
  //  SCREEN SIZE
  // ==============================
  const screenSizeEl = document.getElementById("screenSize");
  const screenSize2 = document.getElementById("screenSpec");

  ipc.invoke('get-screen-size').then(({ width, height }) => {
    if (screenSizeEl) screenSizeEl.innerText = `${width} × ${height}`;
    if (screenSize2) screenSize2.innerText = `${width} × ${height}`;
  }).catch(() => {
    if (screenSizeEl) screenSizeEl.innerText = "Couldn't get screen size";
    if (screenSize2) screenSize2.innerText = "Couldn't get screen size";
  });

});
