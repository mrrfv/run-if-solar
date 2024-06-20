import 'dotenv/config';
import chalk from 'chalk';
import { spawn } from 'child_process';

async function getCurrentPower() {
    const { HASS_API_ENDPOINT, HASS_AUTHORIZATION_TOKEN, HASS_SENSOR_ID } = process.env;

    const res = await fetch(`${HASS_API_ENDPOINT}/states/${HASS_SENSOR_ID}`, {
        headers: {
            'Authorization': `Bearer ${HASS_AUTHORIZATION_TOKEN}`
        }
    });
    
    const data = await res.json();
    
    if (typeof data.state === 'string') {
        // If the state is a string, we can assume it's a number, possibly with a unit of measurement
        return parseFloat(data.state.replace(/[^\d.]/g, ''));
    } else {
        return { state: data.state };
    }
}

function log(message) {
    console.log(chalk.yellow(message));
}

// Stores the current state of the running process
// There should only be one process running at a time
let child_proc = null;
let processRunning = false;

async function loop() {
    const currentPower = await getCurrentPower();
    log(`Current solar panel output: ${currentPower}`);

    if (currentPower >= parseFloat(process.env.POWER_GENERATION_TARGET)) {
        log(`Solar panel output is above target`);

        // If the process is already running, we don't need to start it again
        if (processRunning || child_proc !== null) {
            log('Process is already running');
            return;
        }

        // Run the process
        try {
            log(`Starting the process at ${process.env.PROCESS_PATH} with args ${process.env.PROCESS_ARGS}`);
            child_proc = spawn(process.env.PROCESS_PATH, JSON.parse(process.env.PROCESS_ARGS));
            processRunning = true;
            child_proc.stdout.on('data', (data) => {
                console.log(data.toString());
            });
            child_proc.stderr.on('data', (data) => {
                console.error(data.toString());
            });
            child_proc.on('close', (code) => {
                log(`child process exited with code ${code}`);
                processRunning = false;
            });
        } catch (e) {
            log('Failed to start the process', e);
            processRunning = false;
        }
    } else {
        log('Solar panel output is below target');
        if (processRunning) {
            log('Solar panel output is below target, stopping the configured process');
            child_proc.kill();
        }
    }
}

loop();
setInterval(loop, (process.env.POLL_INTERVAL || 1) * 1000 * 60);
