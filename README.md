# Web Server

This is the server application made for Linux to receive communication from a browser on the clients' computer.

[//]: # (TODO: Add a complete guide and description for the module)

## Installation
Describe the installation  process for the program.
 
## Usage
[//]: # (TODO: Describe the usage of the program and different usecases)
Describe how to use the webpage and if there is a setup process

Change ip in scripts
change path in index.js


### Generate a sensor ID
There can be added a function for the user to add a new sensor configuration. There should not be the option to edit a sensor that has already implemented.
The options for adding a new sensor are:

- sensorID: This can also be generated automatically
- unitID: Can be in a dropdown list, or typed manually
- type: Dropdown with the option for temperature or CO2
- monitor: when enabled the sensor is only for monitoring

If monitor is false, the following options are available:

- control type: reverse (i.e heating a room) or direct (i.e cooling a room)
- output: true/false
- setpoint: The setpoint for the controller



## Contributing
[//]: # (TODO: Describe how to contribute to the program)
If you want to contribute to this project you need to use the same structure and guidelines followed by this project.

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## Branches
wip - Works in progress; stuff I know won't be finished soon

feat - Feature I'm adding or expanding

bug - Bug fix or experiment

junk - Throwaway branch created to experiment

## License
[MIT](https://choosealicense.com/licenses/mit/)