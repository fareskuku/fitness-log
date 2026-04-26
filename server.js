const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    if (req.url === '/' && req.method === 'GET') {
        const htmlPath = path.join(__dirname, 'index.html');
        fs.readFile(htmlPath, 'utf-8', (err, data) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Error loading page');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    }
    else if (req.url === '/css/style.css' && req.method === 'GET') {
        const cssPath = path.join(__dirname, 'css', 'style.css');
        fs.readFile(cssPath, 'utf-8', (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('CSS not found');
            } else {
                res.writeHead(200, { 'Content-Type': 'text/css' });
                res.end(data);
            }
        });
    }
    else if (req.url === '/js/script.js' && req.method === 'GET') {
        const jsPath = path.join(__dirname, 'js', 'script.js');
        fs.readFile(jsPath, 'utf-8', (err, data) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('JS not found');
            } else {
                res.writeHead(200, { 'Content-Type': 'application/javascript' });
                res.end(data);
            }
        });
    }
    else if (req.url === '/api/workouts' && req.method === 'GET') {
        (async () => {
            const workouts = await getWorkouts();
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(workouts));
        })();
    }
    else if (req.url.startsWith('/api/workouts/') && req.method === 'GET') {
        (async () => {
            const workoutId = req.url.split('/')[3];
            const workouts = await getWorkouts();
            const workout = workouts.find(w => w.id === parseInt(workoutId));
            if (workout) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(workout));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Workout not found' }));
            }
        })();
    }
    else if (req.url === '/api/workouts' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const newWorkout = JSON.parse(body);
                const addedWorkout = await addWorkout(newWorkout);
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(addedWorkout));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    }
    else if (req.url === '/api/workouts' && req.method === 'PUT') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', async () => {
            try {
                const updatedWorkout = JSON.parse(body);
                const result = await updateWorkout(updatedWorkout);
                if (result) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(result));
                } else {
                    res.writeHead(404, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Workout not found' }));
                }
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
        });
    }
    else if (req.url.startsWith('/api/workouts/') && req.method === 'DELETE') {
        (async () => {
            const workoutId = req.url.split('/')[3];
            const result = await deleteWorkout(parseInt(workoutId));
            if (result) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Workout not found' }));
            }
        })();
    }
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Route not found' }));
    }
});

const getWorkouts = async () => {
    const workoutsPath = path.join(__dirname, 'data', 'workouts.json');
    const data = await fs.promises.readFile(workoutsPath, 'utf-8');
    return JSON.parse(data);
};

const addWorkout = async (workout) => {
    const workoutsPath = path.join(__dirname, 'data', 'workouts.json');
    const data = await fs.promises.readFile(workoutsPath, 'utf-8');
    const workouts = JSON.parse(data);
    const newId = workouts.length > 0 ? workouts[workouts.length - 1].id + 1 : 1;
    workout.id = newId;
    workouts.push(workout);
    await fs.promises.writeFile(workoutsPath, JSON.stringify(workouts, null, 2));
    return workout;
};

const updateWorkout = async (workout) => {
    const workoutsPath = path.join(__dirname, 'data', 'workouts.json');
    const data = await fs.promises.readFile(workoutsPath, 'utf-8');
    const workouts = JSON.parse(data);
    const index = workouts.findIndex(w => w.id === workout.id);
    if (index !== -1) {
        workouts[index] = { ...workouts[index], ...workout };
        await fs.promises.writeFile(workoutsPath, JSON.stringify(workouts, null, 2));
        return workouts[index];
    }
    return null;
};

const deleteWorkout = async (id) => {
    const workoutsPath = path.join(__dirname, 'data', 'workouts.json');
    const data = await fs.promises.readFile(workoutsPath, 'utf-8');
    const workouts = JSON.parse(data);
    const index = workouts.findIndex(w => w.id === id);
    if (index !== -1) {
        const deletedWorkout = workouts.splice(index, 1)[0];
        await fs.promises.writeFile(workoutsPath, JSON.stringify(workouts, null, 2));
        return deletedWorkout;
    }
    return null;
};

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`http://localhost:${PORT}`);
});
