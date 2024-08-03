
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

function changeSetting(/*string*/setting, /*HTMLElement*/element) {
    let options = SETTINGS[setting];
    if (!options)
        return;

    let label;
    let state;
    if (setting.includes("switch")) {
       label = element.parentElement.parentElement.getElementsByTagName("H1")[0]
        state = element.checked;
        
        if (state)
            label.textContent = options[1];
        else
            label.textContent = options[0];
    }

    else if (setting.includes("slider")) {
        label = element.parentElement.getElementsByTagName("H1")[0]
        state = element.value;
        
        label.textContent = options[state];
    }

    if (state == null)
        return;
    
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

function createSwitch(setting, value, options) {
    let settingFrame = document.createElement("div");
    let switchLabel = document.createElement("label");
    let switchElement = document.createElement("input");
    let slider = document.createElement("span");
    let settingLabel = document.createElement("h1");

    settingFrame.className = "setting";
    switchLabel.className = "switch";
    switchElement.type = "checkbox";
    switchElement.addEventListener("click", (event) => changeSetting(setting, event.target));
    slider.className = "slider";

    switchLabel.appendChild(switchElement);
    switchLabel.appendChild(slider);
    settingFrame.appendChild(switchLabel);
    settingFrame.appendChild(settingLabel);

    settingsContainer.appendChild(settingFrame);

    if (value) {
        switchElement.checked = true;
        settingLabel.textContent = options[1];
    } else
        settingLabel.textContent = options[0];
}

function createSlider(/*int*/min, /*int*/max, /*int*/value) {
    let settingFrame = document.createElement("div");
    let settingLabel = document.createElement("h1");
    
    let slider = document.createElement("input");
    slider.type = "range";
    slider.min = min;
    slider.max = max;
    slider.value = value;

    settingFrame.appendChild(slider);
    settingFrame.appendChild(settingLabel);
    settingsContainer.appendChild(settingFrame);
    
    return slider, settingLabel;
}

var SETTINGS;
var settingsContainer;
function loadSettings(/*json*/settings, /*json*/userSettings) {
    settingsContainer = document.getElementById("settings-container");
    SETTINGS = settings;

    for (let setting of Object.keys(settings)) {
        let settingType = setting.split("-");
        settingType = settingType[settingType.length - 1];
        let options = SETTINGS[setting];

        if (settingType === "switch") {
            createSwitch(setting, userSettings[setting], options);

        } else if (settingType === "slider") {
            let settingFrame = document.createElement("div");
            let settingLabel = document.createElement("h1");
            settingFrame.className = "setting";
            
            let sliderElement = document.createElement("input");
            sliderElement.type = "range";
            sliderElement.className = "range-slider";
            sliderElement.min = 0;
            sliderElement.max = options.length - 1;
            sliderElement.value = userSettings[setting];
            
            settingFrame.appendChild(sliderElement);
            settingFrame.appendChild(settingLabel);
            settingsContainer.appendChild(settingFrame);

            settingLabel.textContent = options[sliderElement.value];

            sliderElement.addEventListener("input", () => {
                settingLabel.textContent = options[sliderElement.value];
            });
            sliderElement.addEventListener("change", () => {
                changeSetting(setting, sliderElement);
            });
        }
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