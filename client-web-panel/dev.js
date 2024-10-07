// Import the exec function from the child_process module.
// This function is used to run commands from the Node.js environment.
const { exec } = require('child_process');



// Retrieve the FRONTEND_PORT environment variable value.
// If it is not set, default to 3000.
const port = process.env.FRONTEND_PORT || 3002;
const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1';
// Execute the next dev command with the specified port.
// The exec function spawns a child process to run the command.
const devServer = exec(`next dev -p ${port}`);

// Listens for data events on the standard output (stdout) stream of the child process.
// When ddata is received, log it to the console.
// This will display logs from the Next.js development server in real-time.
devServer.stdout.on('data', (data) => {
    console.log(`${data}`);
});


//d6 Listen for data events on the standard error (stderr) stream of the child process.
// When error data is received, log it to the console.
// This will display error messages from the Next.js development server in real-time.
devServer.stderr.on('data', (data) => {
    console.error(`${data}`);
});

// Listen for the exit event of the child process.
// When the child process exits, log its exit code to the console.
// This is useful for debugging if the Next.js development server stops or crashes.
devServer.on('exit', (code) => {
    console.log(`Child exited with code ${code}`);
});
