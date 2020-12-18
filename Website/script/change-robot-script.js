/***********************************************************************************************************************
 * SCRIPT FOR SENSOR PAGE
 * THIS IS A PROGRAM FOR UPDATING THE WEBPAGE FOR SENSOR INFO
 * WRITTEN AS A PART OF THE SUBJECT IELEA2001
 ***********************************************************************************************************************/

/*********************************************************************
 * GLOBAL VARIABLES
 *********************************************************************/

let robotSettings = {};
let robotID;
let sensorSelectors = [];
let lastSelector;

// Used for sensor Id if there is NO sensor connected
let none = 'Ingen';
// Need to have the possibility to set a sensor to not connected
let sensorIDs = [none];

/*********************************************************************
 * DOCUMENT ELEMENTS
 *********************************************************************/
let sensorPicker = document.getElementById("sensor-picker");
let robotOptions = document.getElementById("robot-picker");
let updateSetting = document.getElementById('update-robot-settings');
let robotName = document.getElementById('robot-id');
let addRobot = document.getElementById('add-robot');
let errorMessage = document.getElementById('error');


/*********************************************************************
 * MAIN PROGRAM
 *********************************************************************/

// Start a connection to the robot server, in the namespace webpage
const socket = io('http://192.168.137.105:3000/webserver', {
    // Retry the connection every 10 seconds if it fails
    reconnectionDelayMax: 10000,
});

// Monitor the dropdown menu and change the selected robot when it is changed
robotOptions.addEventListener('change', changeRobot);
updateSetting.addEventListener('click', sendNewRobotSettings);
addRobot.addEventListener('click', setNewRobotParameters)

/*********************************************************************
 * EVENT LISTENERS
 *********************************************************************/
// On the first connection to the server
socket.on('connect', () => {
    console.log(socket.id);
    console.log(socket.nsp);
    console.log('Get all sensor info');
    getAllSensors();

})

/**
 * When receiving the sensor names from the server,
 * add them to the dropdown menu
 */
socket.on('allSensors', (sensors) => {
    console.log('Received sensor names from server');
    let allSensorIds = JSON.parse(sensors);
    allSensorIds.forEach(sensor => {
        sensorIDs.push(sensor);
    });
    // Get all the robot ids
    getAllRobots();
});

/**
 * When receiving all the robots, add them to the robot selector
 */
socket.on('allRobots', (robots) => {
    console.log('Received sensor names from server');
    let parsedRobots = JSON.parse(robots);
    // Add all the sensor names to the dropdown menu
    addOptionsToDropdown(robotOptions, parsedRobots, parsedRobots);
});

/**
 * When receiving the configuration for a new robot,
 * update the webpage with the new data.
 */
socket.on('robotInfo', (robotInfo, callback) => {
    let parsedRobotInfo = JSON.parse(robotInfo);
    // Set the global variable for the robot config
    robotID = Object.keys(parsedRobotInfo)[0]
    console.log("Received sensor settings for robot " + robotID);
    robotSettings = parsedRobotInfo;
    if (callback) callback();
});

/**
 * Give feedback to the user if the configuration was successful or not.
 */
socket.on('newRobotSettings', feedback => {
    if (feedback) {
        alert('Instillingene ble lagret!');
        // Reload the page after alert, to reset the page
        window.location.reload();
    } else {
        alert('Noe gikk galt! Instillingene ble ikke lagret!');
    }
})


/*********************************************************************
 * PROGRAM FUNCTIONS
 *********************************************************************/

/**
 * Function to get all the sensor names from the server
 */
function getAllSensors() {
    socket.emit('allSensors', true);
}

/**
 * Function to get all the robot names from the server
 */
function getAllRobots() {
    socket.emit('allRobots', true);
}

/**
 * Function to add multiple options to a dropdown selector.
 * All the options that is added is given as a parameter.
 * @param dropdown      The dropdown element
 * @param optionsToAdd  Array containing all the options to add
 * @param optionNames   The display text for the option
 * @param removePrevious
 * @param callback      Runs after all options has been added
 */
function addOptionsToDropdown(dropdown, optionsToAdd, optionNames,removePrevious, callback) {
    if (removePrevious) {
        let optionsNumber = dropdown.options.length - 1
        while (dropdown.options.length > 0){
            dropdown.remove(0)
        }
    }
    optionsToAdd.forEach((option, index, array) => {
        // Make a new option
        let newOption = document.createElement('option');
        // Add a display text for the option
        newOption.appendChild(document.createTextNode(option));
        // Assign the value for the option to the same as the display text
        newOption.value = option;
        newOption.innerText = optionNames[index];
        // Add the option to the dropdown menu
        dropdown.appendChild(newOption);
        // Do the callback on the last cycle
        if (index === array.length) {
            if (callback) callback();
        }
    });
}

/**
 * Function for changing the sensor
 * This is used as the listening function for the dropdown menu
 */
function changeRobot() {
    // Get the new sensor ID from the dropdown menu
    let newRobot = robotOptions.value;
    console.log("Changed robot to: " + newRobot);
    // getSensorInfo(newSensor);
    // Get the new sensor information. The callback is run when the sensor data is received
    socket.emit('robotInfo', newRobot, setRobotValues);
    // Empty last values in newest sensor values
}

/**
 * Function to set new sensor info, on the summary part of the page
 */
function setRobotValues() {
    robotName.value = robotID
    addSensors();
}

/**
 * Function to remove all the previous element (i.e. the sensors for the last selected robot)
 */
function removePreviousLines() {
    sensorSelectors = [];
    // Remove all the previous sensors
    let line = document.getElementsByClassName('info-line');
    while (line.length > 0) {
        line[0].parentNode.removeChild(line[0])
    }
}

/**
 * Function to add new set the new sensor selectors
 */
function addSensors(){

    let sensorsConnected = robotSettings[robotID];

    // Add an empty sensor, the user can then add a new sensor
    sensorsConnected.push(none);
    removePreviousLines();

    // Add all the sensors to the webpage
    sensorsConnected.forEach((sensor) => {
        addSensorToLine(sensor);
    })
    // Set a listener event on the last sensor
    setListenerForSensor();
}

/**
 * Function for adding a listener event to the last sensor on the page
 */
function setListenerForSensor(){
    // Find the index for the last sensor
    let lastSensor = sensorSelectors[sensorSelectors.length - 1];
    lastSelector = document.getElementById(lastSensor);
    // add the listener event
    lastSelector.addEventListener('change', addNewSensor);
}

/**
 * Function that adds a new sensor line
 * if the last sensor place is used
 */
function addNewSensor(){
    // Add new sensor selector
    if (lastSelector.value !== none){
        addSensorToLine(none);
        setListenerForSensor();
    }
}

/**
 *  Function to retreve the last changes from the user and tries to send it.
 *  If the configuration passes validation the user is asked to confirm before sending.
 */
function sendNewRobotSettings(){
    let sensorIDs = []
    // Get all the sensors selected on the page
    sensorSelectors.forEach(sensor => {
        let sensorID = document.getElementById(sensor).value;
        if (!(sensorID === none)) {
            sensorIDs.push(sensorID);
        }
    })
    // Check the robot configuration
    if (checkIDs(sensorIDs)){
        console.log(sensorIDs)
        let settingToSend = {}
        settingToSend[robotID] = sensorIDs;
        errorMessage.innerText = "";
        // Send a confirmation question to the user
        if (confirm("Bekreft at du vil sende innstillingene!")) {
            socket.emit('newRobotSettings', JSON.stringify(settingToSend));
            console.log(settingToSend);
        }
    } else {
        errorMessage.innerText = "Kan ikke lagre disse innstillingene!"
    }
}

/**
 * Function to check all the sensor ids given are valid.
 * There should never occur any problems with the validation,
 * since the sensorIds are given from the server.
 * Only here as a backup. Returns true if the names are OK.
 * @param sensors - the array of the sensorIDs
 * @return {boolean}
 */
function checkIDs(sensors){
    // Defined valid ID settings
    let regexForID = new RegExp('^[a-zA-Z0-9#]+$'); // Ids can only contain letters and numbers (and #)

    // Status flags
    let sensorsNotOk = false;
    let robotIdOK = false;
    // Check every sensor if the id is valid
    sensors.forEach(name => {
        if (!regexForID.test(name)) {
            sensorsNotOk = true;
        }
    });
    // Check the robot id
    if (regexForID.test(robotID) && robotID !== undefined) {
        robotIdOK = true;
    }

    return (!sensorsNotOk) && robotIdOK;
}

/**
 *
 * @param sensor
 */
function addSensorToLine(sensor) {
    // The length of the array is the last index +1
    let lastSensor = sensorSelectors.length;
    let newSensorOption = document.createElement('div')
    newSensorOption.setAttribute('class', 'info-line');

    // Create the sensor description
    let description = document.createElement('p');
    description.innerText = 'Sensor ' + (lastSensor + 1) + ':';
    description.setAttribute('class', 'info-text');

    // Create a new sensor picker whit all the sensorIds as possible selections
    let select = document.createElement('select');
    let selectId = 'sensor' + lastSensor;
    sensorSelectors.push(selectId);
    addOptionsToDropdown(select, sensorIDs, sensorIDs);
    select.value = sensor;
    // set the id of the selector
    select.setAttribute('id', selectId);
    // set the class of the selector
    select.setAttribute('class', 'info-box');
    // Add the description and the selector to the info line
    newSensorOption.appendChild(description);
    newSensorOption.appendChild(select);
    // Append the new info line with the selector to the document
    sensorPicker.appendChild(newSensorOption);
}

/**
 * Function to enable the robot field if the user is adding a new robot.
 * And removes all the previous settings
 */
function setNewRobotParameters(){
    // Remove all the sensor selectors
    removePreviousLines();
    robotName.disabled = false;
    robotName.addEventListener("change", function(){robotID = robotName.value});
    // Add one sensor selector
    addSensorToLine(none);
    setListenerForSensor();
}
