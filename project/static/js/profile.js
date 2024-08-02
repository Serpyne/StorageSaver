
function fillRandomPassword(/*string*/pass) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomString = "";

    for (let i = 0; i < pass.length; i++)
    randomString += chars.charAt(Math.floor(Math.random() * chars.length))

    let passwordText = document.getElementById("password-text");
    passwordText.innerHTML = randomString;
}

function showPasswordPrompt(/*bool*/hide_notifation = false) {
    let passwordPrompt = document.getElementById("change-password");
    if (passwordPrompt.style.display == "block") return

    passwordPrompt.style.display = "block";

    if (hide_notifation) {
        let passwordNotification = document.getElementById("password-notification");
        passwordNotification.style.display = "none";
    }
}

function toggleSetting(/*string*/setting, /*HTMLElement*/switchElement) {
    options = SETTINGS[setting];
    if (!options)
        return;

    let state = switchElement.checked;
    
    let label = switchElement.parentElement.parentElement.getElementsByTagName("H1")[0]
    if (state)
        label.textContent = options[1];
    else
        label.textContent = options[0];

    fetch("/changeSetting", {
        method: "POST",
        body: JSON.stringify({setting: setting, value: state}),
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
    })
    .catch(error => console.log(error))
}

var SETTINGS;
var settingsContainer;
function loadSettings(/*json*/settings, /*json*/userSettings) {
    SETTINGS = settings;
    settingsContainer = document.getElementById("settings-container")

    for (let setting of Object.keys(settings)) {
        options = settings[setting];

        let settingFrame = document.createElement("div");
        let switchLabel = document.createElement("label");
        let checkbox = document.createElement("input");
        let slider = document.createElement("span");
        let settingLabel = document.createElement("h1");

        settingFrame.className = "setting";
        switchLabel.className = "switch";
        checkbox.type = "checkbox";
        checkbox.addEventListener("click", (event) => toggleSetting(setting, event.target));
        slider.className = "slider";

        value = userSettings[setting];
        if (value) {
            checkbox.checked = true;
            settingLabel.textContent = options[1];
        } else
            settingLabel.textContent = options[0];

        switchLabel.appendChild(checkbox);
        switchLabel.appendChild(slider);
        settingFrame.appendChild(switchLabel);
        settingFrame.appendChild(settingLabel);

        settingsContainer.appendChild(settingFrame);
    }
}