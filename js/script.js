const API_URL = '/api/workouts';

window.onload = () => {
    loadAllWorkouts();
    document.getElementById('date').valueAsDate = new Date();
};

document.getElementById('createForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const duration = parseInt(document.getElementById('duration').value);
    const caloriesBurned = parseInt(document.getElementById('caloriesBurned').value) || Math.round(duration * 8);
    
    const workout = {
        exerciseType: document.getElementById('exerciseType').value,
        duration: duration,
        caloriesBurned: caloriesBurned,
        date: document.getElementById('date').value,
        intensity: document.getElementById('intensity').value,
        notes: document.getElementById('notes').value
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(workout)
        });
        const result = await response.json();
        showToast('Workout created successfully! 🎉', 'success');
        loadAllWorkouts();
        document.getElementById('createForm').reset();
        document.getElementById('date').valueAsDate = new Date();
        document.getElementById('caloriesBurned').value = '';
    } catch (error) {
        showToast('Error creating workout', 'error');
    }
});

async function loadAllWorkouts() {
    try {
        const response = await fetch(API_URL);
        const workouts = await response.json();
        displayWorkouts(workouts);
        updateStats(workouts);
    } catch (error) {
        document.getElementById('workoutsList').innerHTML = '<div class="loading"><i class="fas fa-exclamation-circle"></i><p>Error loading workouts</p></div>';
    }
}

function updateStats(workouts) {
    const totalWorkouts = workouts.length;
    const totalCalories = workouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0);
    const totalMinutes = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
    
    document.getElementById('totalWorkouts').textContent = totalWorkouts;
    document.getElementById('totalCalories').textContent = totalCalories.toLocaleString();
    document.getElementById('totalMinutes').textContent = totalMinutes;
}

async function searchWorkout() {
    const id = document.getElementById('searchId').value;
    if (!id) {
        loadAllWorkouts();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${id}`);
        if (response.ok) {
            const workout = await response.json();
            displayWorkouts([workout]);
            showToast(`Found workout #${id}`, 'success');
        } else {
            showToast('Workout not found', 'error');
            loadAllWorkouts();
        }
    } catch (error) {
        showToast('Error searching workout', 'error');
    }
}

async function updateWorkout() {
    const id = document.getElementById('updateId').value;
    if (!id) {
        showToast('Please enter a Workout ID', 'error');
        return;
    }

    try {
        const getResponse = await fetch(`${API_URL}/${id}`);
        if (!getResponse.ok) {
            showToast('Workout not found', 'error');
            return;
        }
        const existing = await getResponse.json();

        const updatedWorkout = {
            id: parseInt(id),
            exerciseType: document.getElementById('updateExerciseType').value || existing.exerciseType,
            duration: parseInt(document.getElementById('updateDuration').value) || existing.duration,
            caloriesBurned: parseInt(document.getElementById('updateCaloriesBurned').value) || existing.caloriesBurned,
            date: document.getElementById('updateDate').value || existing.date,
            intensity: document.getElementById('updateIntensity').value || existing.intensity,
            notes: document.getElementById('updateNotes').value || existing.notes
        };

        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedWorkout)
        });

        if (response.ok) {
            showToast('Workout updated successfully! ✏️', 'success');
            loadAllWorkouts();
            clearUpdateForm();
        } else {
            showToast('Error updating workout', 'error');
        }
    } catch (error) {
        showToast('Error updating workout', 'error');
    }
}

async function deleteWorkout() {
    const id = document.getElementById('updateId').value;
    if (!id) {
        showToast('Please enter a Workout ID', 'error');
        return;
    }

    if (confirm('Are you sure you want to delete this workout?')) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                showToast('Workout deleted successfully! 🗑️', 'success');
                loadAllWorkouts();
                clearUpdateForm();
            } else {
                showToast('Workout not found', 'error');
            }
        } catch (error) {
            showToast('Error deleting workout', 'error');
        }
    }
}

function displayWorkouts(workouts) {
    const container = document.getElementById('workoutsList');
    if (!workouts || workouts.length === 0) {
        container.innerHTML = '<div class="loading"><i class="fas fa-dumbbell"></i><p>No workouts found. Add your first workout!</p></div>';
        return;
    }

    container.innerHTML = workouts.map(workout => `
        <div class="workout-card">
            <div class="workout-header">
                <h3><i class="fas fa-hashtag"></i> ${workout.id} - ${workout.exerciseType}</h3>
                <span class="workout-badge intensity-${workout.intensity}">${workout.intensity.toUpperCase()}</span>
            </div>
            <div class="workout-details">
                <div class="detail-item">
                    <i class="fas fa-calendar"></i>
                    <span>${workout.date}</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-hourglass-half"></i>
                    <span>${workout.duration} minutes</span>
                </div>
                <div class="detail-item">
                    <i class="fas fa-fire"></i>
                    <span>${workout.caloriesBurned} calories burned</span>
                </div>
                ${workout.notes ? `
                <div class="detail-item">
                    <i class="fas fa-pen"></i>
                    <span>${workout.notes}</span>
                </div>
                ` : ''}
            </div>
            <div class="workout-actions">
                <button class="btn-small" onclick="populateUpdateForm(${workout.id})">
                    <i class="fas fa-edit"></i> Edit
                </button>
                <button class="btn-small btn-outline" onclick="quickDelete(${workout.id})">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        </div>
    `).join('');
}

async function populateUpdateForm(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);
        const workout = await response.json();
        document.getElementById('updateId').value = workout.id;
        document.getElementById('updateExerciseType').value = workout.exerciseType;
        document.getElementById('updateDuration').value = workout.duration;
        document.getElementById('updateCaloriesBurned').value = workout.caloriesBurned;
        document.getElementById('updateDate').value = workout.date;
        document.getElementById('updateIntensity').value = workout.intensity;
        document.getElementById('updateNotes').value = workout.notes;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        showToast(`Editing workout #${id}`, 'success');
    } catch (error) {
        showToast('Error loading workout data', 'error');
    }
}

async function quickDelete(id) {
    if (confirm('Delete this workout?')) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                showToast('Workout deleted! 🗑️', 'success');
                loadAllWorkouts();
            }
        } catch (error) {
            showToast('Error deleting', 'error');
        }
    }
}

function clearUpdateForm() {
    document.getElementById('updateId').value = '';
    document.getElementById('updateExerciseType').value = '';
    document.getElementById('updateDuration').value = '';
    document.getElementById('updateCaloriesBurned').value = '';
    document.getElementById('updateDate').value = '';
    document.getElementById('updateIntensity').value = '';
    document.getElementById('updateNotes').value = '';
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
