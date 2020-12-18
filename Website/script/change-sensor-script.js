/***********************************************************************************************************************
 * SCRIPT FOR SENSOR PAGE
 * THIS IS A PROGRAM FOR UPDATING THE WEBPAGE FOR SENSOR INFO
 * WRITTEN AS A PART OF THE SUBJECT IELEA2001
 ***********************************************************************************************************************/

/*********************************************************************
 * GLOBAL VARIABLES
 *********************************************************************/

let sensorSettings = {};
let sensorID;

/*********************************************************************
 * DOCUMENT ELEMENTS
 *********************************************************************/
let sensorOptions = document.getElementById("sensor-picker");
let sensorName = document.getElementById("sensor-id");
let sensorType = document.getElementById("sensor-type");
let sensorSetpoint = document.getElementById("sensor-setpoint");
let sensorFunction = document.getElementById("sensor-function");
let robotID = document.getElementById("robot-id");
let updateSetting = document.getElementById('update-sensor-settings');
let hideSetpoint = document.getElementById('hide-setpoint');
let errorMessage = document.getElementById('error');
let addSensor = document.getElementById('add-sensor')


/*********************************************************************
 * MAIN PROGRAM
 *********************************************************************/

// Start a connection to the robot server, in the namespace webpage
const socket = io('http://192.168.137.105:3000/webserver', {
    // Retry the connection every 10 seconds if it fails
    reconnectionDelayMax: 10000,
});

// Monitor the dropdown menu and change the selected sensor when it is changed
sensorOptions.addEventListener('change', changeSensor);
// updateTimeRange.addEventListener('click', userSpecifiedTime);
updateSetting.addEventListener('click', sendNewSensorSettings);
sensorType.addEventListener('change', setTypeOptions)
// sensorName.addEventListener('change', setSensorTypeOptions)
sensorFunction.addEventListener('change', checkForSetpoint)
addSensor.addEventListener('click', setNewSensorParameters)

/*********************************************************************
 * EVENT LISTENERS
 *********************************************************************/
// On the first connection to the server
socket.on('connect', () => {
    console.log(socket.id);
    console.log(socket.nsp);
    console.log('Get all sensor info');
    getAllSensors();
    getAllRobots();
})

/**
 * When receiving the sensor names from the server,
 * add them to the dropdown menu
 */
socket.on('allSensors', (sensors) => {
    console.log('Received sensor names from server');
    let parsedSensors = JSON.parse(sensors);
    // Add all the sensor names to the dropdown menu
    addOptionsToDropdown(sensorOptions, parsedSensors, parsedSensors);
});

/**
 * When receiving all the robots, add them to the robot selector
 */
socket.on('allRobots', (robots) => {
    console.log('Received sensor names from server');
    let parsedRobots = JSON.parse(robots);
    // Add all the sensor names to the dropdown menu
    addOptionsToDropdown(robotID, parsedRobots, parsedRobots);
});

/**
 * When receiving the configuration for a new sensor,
 * update the webpage with the new data.
 */
socket.on('sensorInfo', (sensorInfo, callback) => {
    let parsedSensorInfo = JSON.parse(sensorInfo);
    // Set the new setting to the global variables
    sensorID = Object.keys(parsedSensorInfo)[0]
    console.log("Received sensor settings for sensor " + sensorID);
    sensorSettings = parsedSensorInfo;
    // Run the callback if it is defined
    if (callback) callback();
});

/**
 * Give feedback to the user if the configuration was successful or not.
 */
socket.on('newSensorSettings', feedback => {
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
 * Function for checking of the sensor configuration.
 * Runs when the user tries to save the configuration.
 * This is mostly as a failsafe in case the webpage is showing the wrong settings.
 */
function sendNewSensorSettings() {
    // Define what the valid formats are
    let regexControlType = new RegExp('^reverse$|^direct$|^none$'); // Valid control types are: direct, reverse, none
    let regexSensorType = new RegExp('^temperature$|^co2$'); // Valid types are: temperature, co2
    let regexForID = new RegExp('^[a-zA-Z0-9#]+$'); // Ids can only contain letters and numbers (and #)
    let regexSetpoint = new RegExp('^[0-9]+[.][0-9]+$|^[0-9]+$')
    let regexControlledItem = new RegExp('^false$|^true$');

    // Get the new sensors settings
    let settings = getNewSensorSettings();

    // Status flags
    let sensorIdOK = false;
    let controlTypeOK = false;
    let robotIdOK = false;
    let sensorTypeOK = false;
    let setpointOK = false;
    let controlledItemOK = false;

    // Check the controlled item selection
    if (regexControlledItem.test(settings['controlledItem'])) {
        controlledItemOK = true;
        console.log('bool ok')
    }
    // Check the sensor ID
    if (regexForID.test(sensorID)) {
        sensorIdOK = true;
        console.log('sensor ok')
    }
    // Check the control type
    if (regexControlType.test(settings['controlType'])) {
        // console.log('fdsfsd')
        controlTypeOK = true;
        console.log('control type ok')
    }
    // Check the sensor type
    if (regexSensorType.test(settings['type'])) {
        sensorTypeOK = true;
        console.log('type ok')

    }
    // Check the robot ID
    if (regexForID.test(settings['robot'])) {
        robotIdOK = true;
        console.log('robot ok')

    }
    // Check the setpoint
    if (regexSetpoint.test(settings['setpoint'])) {
        setpointOK = true;
        console.log('setpoint ok')
        errorMessage.innerText = '';

    }

    if (sensorIdOK && controlTypeOK && sensorTypeOK && robotIdOK && setpointOK && controlledItemOK) {
        errorMessage.innerText = "";
        // Ask the user for confirmation if the settings are ok
        if (confirm("Bekreft at du vil sende innstillingene?")) {
            let settingsToSend = {}
            settingsToSend[sensorID] = settings
            console.log(settingsToSend);
            socket.emit('newSensorSettings', JSON.stringify(settingsToSend));
        }
    } else {
        errorMessage.innerText = "Kan ikke lagre disse innstillingene!"
    }
}


/**
 * Function to get the sensor info for a single sensor, given the sensorID for the sensor
 * @param sensor    The ID of the sensor
 */
function getSensorInfo(sensor) {
    socket.emit('sensorInfo', sensor);
}

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
function addOptionsToDropdown(dropdown, optionsToAdd, optionNames, removePrevious, callback) {
    if (removePrevious) {
        let optionsNumber = dropdown.options.length - 1
        while (dropdown.options.length > 0) {
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
function changeSensor() {
    // Get the new sensor ID from the dropdown menu
    let newSensor = sensorOptions.value;
    console.log("Changed sensor to: " + newSensor);
    // getSensorInfo(newSensor);
    // Get the new sensor information. The callback is run when the sensor data is received
    socket.emit('sensorInfo', newSensor, setSensorValues);
    // Empty last values in newest sensor values
}

/**
 * Function to set new sensor info, on the summary part of the page
 */
function setSensorValues() {
    // Set the new sensor ID to the header
    sensorName.value = sensorID;

    // Options for sensor type: co2 or temperature
    // Options for function: heating / cooling (temp) (if co2) only: air quality

    // If the sensor is measuring co2 change the function text and read value name
    sensorType.value = sensorSettings[sensorID]['type']

    setTypeOptions();
    // Reformat the user setting to the same format as the sensor configuration
    if (sensorSettings[sensorID]['controlledItem'] === false) {
        // console.log('heating')
        sensorFunction.value = 'monitor';
    } else if (sensorSettings[sensorID]['type'] === "co2") {
        // console.log('cooling')
        sensorFunction.value = 'airQuality';
    } else if (sensorSettings[sensorID]['controlType'] === 'reverse') {
        console.log('airQuality')
        sensorFunction.value = 'heating';
    } else{
        sensorFunction.value = 'cooling';

    }
    // Display the setpoint for the new sensor
    sensorSetpoint.value = sensorSettings[sensorID]['setpoint'];
    // Display the robotID for the new sensor
    robotID.value = sensorSettings[sensorID]['robot'];
    // setSensorTypeOptions();
    checkForSetpoint();
}

/**
 * Function to set the correct options for the dropdown menu
 * for selecting sensor type and function
 */
function setTypeOptions() {
    let optionsForTemperature = ['heating', 'cooling', 'monitor'];
    let optionNamesTemp = ['Varme', 'Kjøling', 'Overvåkning']
    let optionsForCo2 = ['airQuality', 'monitor'];
    let optionNamesCo2 = ['Luftkvalitet', 'Overvåkning'];

    if (sensorType.value === 'temperature') {
        addOptionsToDropdown(sensorFunction, optionsForTemperature, optionNamesTemp, true);
    } else if (sensorType.value === 'co2') {
        addOptionsToDropdown(sensorFunction, optionsForCo2, optionNamesCo2, true);
    }
}

/**
 * Function to set the visibility of the setpoint option
 * Depending on the previous choices for the function
 */
function checkForSetpoint() {
    // console.log('teklfdmg') // Used for debugging
    if (sensorFunction.value === 'monitor') {
        // console.log('teklfdmg') // Used for debugging
        hideSetpoint.style.display = 'none';
    } else {
        hideSetpoint.style.display = 'inline-flex';
    }
}

/**
 * Function to format the user inputs to the same format as the sensor-config
 * Returns the final settings.
 * @return {{robot, setpoint: number, controlType: string, controlledItem: boolean, type}}
 */
function getNewSensorSettings() {
    let type = sensorType.value;
    let setpoint = sensorSetpoint.value;
    let robot = robotID.value;
    let controlType;
    let output = true;

    if (sensorFunction.value === 'heating') {
        console.log('heating')
        controlType = 'reverse';
    } else if (sensorFunction.value === 'cooling') {
        console.log('cooling')
        controlType = 'direct';
    } else if (sensorFunction.value === 'airQuality') {
        console.log('airQuality')
        controlType = 'direct';
    } else if (sensorFunction.value === 'monitor') {
        controlType = 'none'
        output = false
        setpoint = 0;
    }

    return {
        robot: robot,
        type: type,
        controlType: controlType,
        controlledItem: output,
        setpoint: setpoint,
    }
}

/**
 * Function to enable the sensorID field if the user is adding a new sensor.
 */
function setNewSensorParameters() {
    sensorName.disabled = false;
    sensorName.addEventListener("change", function () {
        sensorID = sensorName.value
    });
}
