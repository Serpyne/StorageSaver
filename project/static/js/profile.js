
function fillRandomPassword(/*string*/pass) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let randomString = "";

    for (let i = 0; i < pass.length; i++)
    randomString += chars.charAt(Math.floor(Math.random() * chars.length))

    let passwordText = document.getElementById("password-text");
    passwordText.innerHTML = randomString;
}

var emailPrompt;
function showEmailPrompt(/*bool*/hide_notification = false) {
    emailPrompt = document.getElementById("change-email");
    passwordPrompt = document.getElementById("change-password");
    if (emailPrompt.style.display == "block") return

    emailPrompt.style.display = "block";
    passwordPrompt.style.display = "none";

    if (hide_notification) {
        let emailNotification = document.getElementById("password-email");
        emailNotification.style.display = "none";
    }
}

var passwordPrompt;
function showPasswordPrompt(/*bool*/hide_notification = false) {
    emailPrompt = document.getElementById("change-email");
    passwordPrompt = document.getElementById("change-password");
    if (passwordPrompt.style.display == "block") return

    passwordPrompt.style.display = "block";
    emailPrompt.style.display = "none";

    if (hide_notification) {
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
    })
    .catch(error => console.log(error))
}

var SETTINGS;
var settingsContainer;
function loadSettings(/*json*/settings, /*json*/userSettings) {
    settingsContainer = document.getElementById("settings-container");
    SETTINGS = settings;

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

function checkNotifications(message) {
    let notif = document.getElementById("prompt-notification");
    let container;
    if (message.includes("email"))
        container = document.getElementsByClassName("email")[0];
    else
        container = document.getElementsByClassName("password")[0];

    container.getElementsByClassName("box")[0].appendChild(notif);
}

let dynamicStyles = null;
function addAnimation(body) {
    if (!dynamicStyles) {
        dynamicStyles = document.createElement('style');
        dynamicStyles.type = 'text/css';
        document.head.appendChild(dynamicStyles);
    }

    dynamicStyles.sheet.insertRule(body, dynamicStyles.length);
}

function lerp(a, b, step=1) {
    return a + (b - a) * step
}

let oldStorage = 0;
let newStorage = 0;
function update() {
    oldStorage = currentStorage;
    currentStorage = lerp(oldStorage, newStorage, 0.1);

    progressLabel.innerHTML = formatSize(currentStorage);

    if (currentStorage - oldStorage < 1) {
        return;
    }

    setTimeout("update();", 30);
}

var currentStorage = 0;
var maxStorage = Math.pow(10, 10);

var progressLabel;
var progressMax;
window.addEventListener("load", () => {
    progressLabel = document.getElementById("progress-label");
    progressMax = document.getElementById("progress-max");
    
    progressLabel.innerHTML = `0 MB`;
    progressMax.innerHTML = `<b>/${formatSize(maxStorage)}</b>`;

    fetch("/getFileStorage", {
        method: "POST",
        headers: {
            "Content-type": "application/json; charset=UTF-8"
        }
    })
    .then(response => response.json())
    .then(data => {
        newStorage = data.size;
        let percent = newStorage * 100 / maxStorage;

        addAnimation(`
            @keyframes progress-animation {
                from {
                    --progress: 0;
                }
                to {
                    --progress: ${percent};
                }
            }
        `);
        
        setTimeout("update();", 30);
    })
    .catch(error => console.log(error))

});