// Global variables
let currentPage = 1;
const recordsPerPage = 10;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    checkHealth();
    showNewEntry(); // Default screen
});

// Utility Functions
function showLoading() {
    document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

function showMessage(message, type = 'info') {
    const messageEl = document.getElementById('result-message');
    messageEl.textContent = message;
    messageEl.className = `result-message ${type}`;
    messageEl.classList.remove('hidden');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        messageEl.classList.add('hidden');
    }, 5000);
}

function setActiveButton(activeBtn) {
    // Remove active class from all buttons
    document.querySelectorAll('.operation-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    // Add active class to clicked button
    activeBtn.classList.add('active');
}

function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    // Show target screen
    document.getElementById(screenId).classList.add('active');
}

// API Functions
async function makeRequest(url, options = {}) {
    try {
        showLoading();
        const response = await fetch(url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    } finally {
        hideLoading();
    }
}

// Screen Navigation Functions
function showNewEntry() {
    setActiveButton(event?.target || document.querySelector('.operation-btn'));
    showScreen('new-entry-screen');
    clearForm();
}

function showGetRecord() {
    setActiveButton(event.target);
    showScreen('get-record-screen');
    document.getElementById('record-id').value = '';
    document.getElementById('record-display').classList.add('hidden');
}

function showUpdateRecord() {
    setActiveButton(event.target);
    showScreen('update-record-screen');
    document.getElementById('update-id').value = '';
    document.getElementById('update-json-input').value = '';
}

function showDeleteRecord() {
    setActiveButton(event.target);
    showScreen('delete-record-screen');
    document.getElementById('delete-id').value = '';
}

function showAllRecords() {
    setActiveButton(event?.target || document.querySelector('.operation-btn:nth-child(5) button'));
    showScreen('list-records-screen');
    currentPage = 1;
    loadAllRecords();
}

function showCreateSlide() {
    setActiveButton(event.target);
    showScreen('create-slide-screen');
    clearSlideForm();
    document.getElementById('slide-result').classList.add('hidden');
}

// Header Functions
function showCreateTable() {
    showMessage('Table creation feature coming soon!', 'info');
}

async function checkHealth() {
    try {
        const data = await makeRequest('/api/health');
        const statusEl = document.getElementById('connection-status');
        
        if (data.status === 'OK') {
            statusEl.innerHTML = '<i class="fas fa-circle"></i> Database Connected';
            statusEl.className = 'status-indicator online';
        } else {
            statusEl.innerHTML = '<i class="fas fa-circle"></i> Database Disconnected';
            statusEl.className = 'status-indicator offline';
        }
    } catch (error) {
        const statusEl = document.getElementById('connection-status');
        statusEl.innerHTML = '<i class="fas fa-circle"></i> Connection Error';
        statusEl.className = 'status-indicator offline';
        showMessage('Failed to check database connection', 'error');
    }
}

// CRUD Operations
async function createRecord() {
    const jsonInput = document.getElementById('json-input').value.trim();
    
    if (!jsonInput) {
        showMessage('Please enter JSON data', 'error');
        return;
    }
    
    try {
        const data = JSON.parse(jsonInput);
        const result = await makeRequest('/api/users', {
            method: 'POST',
            body: JSON.stringify(data)
        });
        
        showMessage(result.message, 'success');
        clearForm();
        
        // Show the created record
        displaySingleRecord(result.data, 'Created Record');
    } catch (error) {
        if (error.message.includes('JSON')) {
            showMessage('Invalid JSON format. Please check your input.', 'error');
        } else {
            showMessage(error.message, 'error');
        }
    }
}

async function getRecord() {
    const recordId = document.getElementById('record-id').value;
    
    if (!recordId) {
        showMessage('Please enter a record ID', 'error');
        return;
    }
    
    try {
        const result = await makeRequest(`/api/users/${recordId}`);
        displaySingleRecord(result.data, 'Retrieved Record');
        showMessage('Record retrieved successfully', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
        document.getElementById('record-display').classList.add('hidden');
    }
}

async function loadRecordForUpdate() {
    const recordId = document.getElementById('update-id').value;
    
    if (!recordId) {
        showMessage('Please enter a record ID first', 'error');
        return;
    }
    
    try {
        const result = await makeRequest(`/api/users/${recordId}`);
        const { created_at, id, ...updateData } = result.data;
        document.getElementById('update-json-input').value = JSON.stringify(updateData, null, 2);
        showMessage('Record loaded successfully', 'success');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function updateRecord() {
    const recordId = document.getElementById('update-id').value;
    const jsonInput = document.getElementById('update-json-input').value.trim();
    
    if (!recordId) {
        showMessage('Please enter a record ID', 'error');
        return;
    }
    
    if (!jsonInput) {
        showMessage('Please enter JSON data', 'error');
        return;
    }
    
    try {
        const data = JSON.parse(jsonInput);
        const result = await makeRequest(`/api/users/${recordId}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
        
        showMessage(result.message, 'success');
        
        // Show the updated record
        displaySingleRecord(result.data, 'Updated Record');
    } catch (error) {
        if (error.message.includes('JSON')) {
            showMessage('Invalid JSON format. Please check your input.', 'error');
        } else {
            showMessage(error.message, 'error');
        }
    }
}

async function deleteRecord() {
    const recordId = document.getElementById('delete-id').value;
    
    if (!recordId) {
        showMessage('Please enter a record ID', 'error');
        return;
    }
    
    if (!confirm(`Are you sure you want to delete record #${recordId}? This action cannot be undone.`)) {
        return;
    }
    
    try {
        const result = await makeRequest(`/api/users/${recordId}`, {
            method: 'DELETE'
        });
        
        showMessage(result.message, 'success');
        document.getElementById('delete-id').value = '';
        
        // Show the deleted record
        displaySingleRecord(result.data, 'Deleted Record');
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

async function loadAllRecords() {
    try {
        const result = await makeRequest(`/api/users?page=${currentPage}&limit=${recordsPerPage}`);
        displayRecordsTable(result.data, result.pagination);
        showMessage(`Loaded ${result.data.length} records`, 'success');
    } catch (error) {
        showMessage(error.message, 'error');
        document.getElementById('records-table').innerHTML = '<p>Failed to load records</p>';
    }
}

// Display Functions
function displaySingleRecord(record, title) {
    const recordDisplay = document.getElementById('record-display');
    
    recordDisplay.innerHTML = `
        <div class="record-item">
            <h4>${title}</h4>
            <pre>${JSON.stringify(record, null, 2)}</pre>
        </div>
    `;
    
    recordDisplay.classList.remove('hidden');
}

function displayRecordsTable(records, pagination) {
    const tableContainer = document.getElementById('records-table');
    
    if (records.length === 0) {
        tableContainer.innerHTML = '<p>No records found</p>';
        updatePagination(pagination);
        return;
    }
    
    // Get all unique keys from records for table headers
    const keys = new Set();
    records.forEach(record => {
        Object.keys(record).forEach(key => keys.add(key));
    });
    
    const headers = Array.from(keys);
    
    let tableHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    ${headers.map(header => `<th>${header}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                ${records.map(record => `
                    <tr>
                        ${headers.map(header => {
                            let value = record[header];
                            if (value === null || value === undefined) {
                                value = '';
                            } else if (typeof value === 'object') {
                                value = JSON.stringify(value);
                            } else if (header === 'created_at' && value) {
                                value = new Date(value).toLocaleString();
                            }
                            return `<td>${value}</td>`;
                        }).join('')}
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
    
    tableContainer.innerHTML = tableHTML;
    updatePagination(pagination);
}

function updatePagination(pagination) {
    const pageInfo = document.getElementById('page-info');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');
    
    pageInfo.textContent = `Page ${pagination.currentPage} of ${pagination.totalPages} (${pagination.totalUsers} total)`;
    
    prevBtn.disabled = !pagination.hasPrev;
    nextBtn.disabled = !pagination.hasNext;
}

function changePage(direction) {
    currentPage += direction;
    if (currentPage < 1) currentPage = 1;
    loadAllRecords();
}

// Utility Functions
function clearForm() {
    document.getElementById('json-input').value = '';
}

// Format JSON function for better display
function formatJSON(jsonString) {
    try {
        const parsed = JSON.parse(jsonString);
        return JSON.stringify(parsed, null, 2);
    } catch (e) {
        return jsonString;
    }
}

// Add some example data to the JSON input for better UX
function addExampleData() {
    const exampleData = {
        name: "John Doe",
        email: "john.doe@example.com",
        age: 30
    };
    
    document.getElementById('json-input').value = JSON.stringify(exampleData, null, 2);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to submit forms
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const activeScreen = document.querySelector('.screen.active');
        const primaryBtn = activeScreen?.querySelector('.primary-btn');
        if (primaryBtn) {
            primaryBtn.click();
        }
    }
    
    // Escape to clear forms
    if (e.key === 'Escape') {
        const activeScreen = document.querySelector('.screen.active');
        if (activeScreen?.id === 'new-entry-screen') {
            clearForm();
        }
    }
});

// Auto-format JSON on blur
document.addEventListener('blur', function(e) {
    if (e.target.tagName === 'TEXTAREA' && e.target.value.trim()) {
        try {
            const formatted = formatJSON(e.target.value);
            e.target.value = formatted;
        } catch (error) {
            // Invalid JSON, leave as is
        }
    }
}, true);

// Add example button for new entry
document.addEventListener('DOMContentLoaded', function() {
    const newEntryScreen = document.getElementById('new-entry-screen');
    const buttonGroup = newEntryScreen.querySelector('.button-group');
    
    const exampleBtn = document.createElement('button');
    exampleBtn.className = 'secondary-btn';
    exampleBtn.innerHTML = '<i class="fas fa-lightbulb"></i> Example';
    exampleBtn.onclick = addExampleData;
    
    buttonGroup.appendChild(exampleBtn);
});

// Google Slides Functions
async function createGoogleSlide() {
    const title = document.getElementById('slide-title').value.trim();
    const content = document.getElementById('slide-content').value.trim();
    const layout = document.getElementById('slide-layout').value;
    const theme = document.getElementById('slide-theme').value;
    
    if (!title) {
        showMessage('Please enter a presentation title', 'error');
        return;
    }
    
    if (!content) {
        showMessage('Please enter slide content', 'error');
        return;
    }
    
    try {
        const slideData = {
            title,
            content,
            layout,
            theme
        };
        
        const result = await makeRequest('/api/slides/create', {
            method: 'POST',
            body: JSON.stringify(slideData)
        });
        
        showMessage('Google Slide created successfully!', 'success');
        displaySlideResult(result);
        
    } catch (error) {
        // Handle authentication required error
        if (error.message.includes('Authentication required') || error.message.includes('Authentication expired')) {
            showAuthenticationPrompt();
        } else {
            showMessage(error.message || 'Failed to create Google Slide', 'error');
        }
    }
}

// Show authentication prompt
async function showAuthenticationPrompt() {
    const shouldAuth = confirm('You need to authenticate with Google to create slides. Would you like to authenticate now?');
    
    if (shouldAuth) {
        try {
            const authResponse = await makeRequest('/api/slides/auth');
            
            // Open authentication URL in new window
            const authWindow = window.open(authResponse.authUrl, 'GoogleAuth', 'width=500,height=600');
            
            // Check if auth window is closed (user completed auth)
            const checkClosed = setInterval(() => {
                if (authWindow.closed) {
                    clearInterval(checkClosed);
                    showMessage('Authentication completed! You can now create Google Slides.', 'success');
                    
                    // Update UI to show authenticated state
                    updateAuthenticationStatus(true);
                }
            }, 1000);
            
        } catch (error) {
            showMessage('Failed to start authentication process', 'error');
        }
    }
}

// Update authentication status in UI
function updateAuthenticationStatus(isAuthenticated) {
    const createBtn = document.querySelector('#create-slide-screen .primary-btn');
    const infoCard = document.querySelector('.info-card');
    
    if (isAuthenticated) {
        createBtn.innerHTML = '<i class="fab fa-google"></i> Create Slide (Authenticated)';
        createBtn.style.background = 'linear-gradient(135deg, #51cf66, #40c057)';
        
        if (infoCard) {
            infoCard.innerHTML = `
                <i class="fas fa-check-circle" style="color: #51cf66;"></i>
                <h4>Google Authentication Active</h4>
                <p>You're connected! Ready to create real Google Slides presentations.</p>
            `;
            infoCard.style.background = 'linear-gradient(135deg, #e8f5e8, #f0f9f0)';
            infoCard.style.borderColor = '#51cf66';
        }
    } else {
        createBtn.innerHTML = '<i class="fab fa-google"></i> Create Slide';
        createBtn.style.background = 'linear-gradient(135deg, #667eea, #764ba2)';
    }
}

function displaySlideResult(result) {
    const slideResult = document.getElementById('slide-result');
    const linkText = document.getElementById('slide-link-text');
    const slideLink = document.getElementById('slide-link');
    
    // Access the data from the nested response structure
    const slideData = result.data || result;
    
    linkText.textContent = `"${slideData.title}" has been created in your Google Drive`;
    slideLink.href = slideData.url;
    
    slideResult.classList.remove('hidden');
    
    // Scroll to result
    slideResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearSlideForm() {
    document.getElementById('slide-title').value = '';
    document.getElementById('slide-content').value = '';
    document.getElementById('slide-layout').value = 'TITLE_AND_BODY';
    document.getElementById('slide-theme').value = 'default';
    document.getElementById('slide-result').classList.add('hidden');
}

function addSlideExample() {
    document.getElementById('slide-title').value = 'My Amazing Presentation';
    document.getElementById('slide-content').value = 'Welcome to our presentation!\n\nKey Points:\n• Revolutionary new features\n• Improved user experience\n• Cutting-edge technology\n\nThank you for your attention!';
    document.getElementById('slide-layout').value = 'TITLE_AND_BODY';
    document.getElementById('slide-theme').value = 'modern';
} 

