// static/js/dashboard.js
// Clock
function updateClock() {
    const now = new Date();
    const options = { timeZone: 'Asia/Karachi', hour: 'numeric', minute: 'numeric', hour12: true };
    document.getElementById('clock').textContent = now.toLocaleTimeString('en-US', options);
}
setInterval(updateClock, 1000);
updateClock();

// Add Modal
document.getElementById('add-transaction-btn').addEventListener('click', () => {
    document.getElementById('add-modal').classList.remove('hidden');
});
document.getElementById('close-add-modal').addEventListener('click', () => {
    document.getElementById('add-modal').classList.add('hidden');
});

// Details Modal Functions
function showDetailsModal(data) {
    const content = `
        <div class="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p class="mb-2"><strong class="text-gray-700">Date:</strong> <span class="text-black">${data.date}</span></p>
            <p class="mb-2"><strong class="text-gray-700">Time:</strong> <span class="text-black">${data.time}</span></p>
            <p class="mb-2"><strong class="text-gray-700">Name:</strong> <span class="text-black">${data.name}</span></p>
            <p class="mb-2"><strong class="text-gray-700">Comment:</strong> <span class="text-black">${data.comment || 'No comment'}</span></p>
            <p class="mb-2"><strong class="text-gray-700">Received:</strong> <span class="text-black">${data.received}</span></p>
            <p class="mb-2"><strong class="text-gray-700">Paid:</strong> <span class="text-black">${data.paid}</span></p>
            <p><strong class="text-gray-700">Balance:</strong> <span class="text-black font-medium">${data.balance}</span></p>
        </div>
    `;
    document.getElementById('details-content').innerHTML = content;
    document.getElementById('details-modal').classList.remove('hidden');
}

document.getElementById('close-details-modal').addEventListener('click', () => {
    document.getElementById('details-modal').classList.add('hidden');
});

// Initialize Details Buttons
function initializeDetailsButtons() {
    document.querySelectorAll('.details-btn').forEach(btn => {
        btn.removeEventListener('click', handleDetailsClick);
        btn.addEventListener('click', handleDetailsClick);
    });
}

function handleDetailsClick(e) {
    e.stopPropagation();
    const data = JSON.parse(e.target.closest('.details-btn').dataset.details);
    showDetailsModal(data);
}

// Row Click Event (for backward compatibility)
function attachRowClickEvents() {
    document.querySelectorAll('.transaction-row').forEach(row => {
        row.addEventListener('click', (e) => {
            if (e.target.classList.contains('delete-btn') || 
                e.target.classList.contains('details-btn') ||
                e.target.closest('.delete-btn') ||
                e.target.closest('.details-btn')) return;
            
            const data = JSON.parse(row.dataset.details);
            showDetailsModal(data);
        });
    });
}

// Add validation to prevent paying more than remaining balance
document.getElementById('add-form').addEventListener('submit', function(e) {
    const received = parseFloat(document.getElementById('received').value) || 0;
    const paid = parseFloat(document.getElementById('paid').value) || 0;
    
    // Get the current balance from the page (from the most recent transaction)
    const balanceElements = document.querySelectorAll('.transaction-row .balance-amount');
    let currentBalance = 0;
    
    if (balanceElements.length > 0) {
        // Get the balance from the first row (most recent transaction)
        const balanceText = balanceElements[0].textContent.trim();
        currentBalance = parseFloat(balanceText) || 0;
    }
    
    // Check if paid amount exceeds current balance
    if (paid > 0 && paid > currentBalance) {
        e.preventDefault();
        alert(`Error: You cannot pay more than the current balance (${currentBalance.toFixed(2)}).`);
        return false;
    }
    
    // Existing validation
    if (received === 0 && paid === 0) {
        e.preventDefault();
        alert('Please fill either Received Amount or Paid Amount!');
        return false;
    }
});

// Delete Function - ACTUAL BACKEND REQUEST
async function deleteTransaction(transactionId, buttonElement) {
    try {
        const response = await fetch(`/delete/${transactionId}/`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('[name=csrfmiddlewaretoken]').value
            }
        });

        const result = await response.json();

        if (result.success) {
            buttonElement.closest('tr').remove();
            alert('Transaction deleted successfully!');
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete transaction. Please try again.');
    }
}

// Initialize Delete Buttons
function initializeDeleteButtons() {
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.removeEventListener('click', handleDeleteClick);
        btn.addEventListener('click', handleDeleteClick);
    });
}

function handleDeleteClick(e) {
    e.stopPropagation();
    const btn = e.target.closest('.delete-btn');
    
    // Check if the delete button is disabled (expired)
    if (btn.classList.contains('delete-expired')) {
        alert('This transaction can no longer be deleted. The 30-minute window has expired.');
        return;
    }
    
    if (confirm('Are you sure you want to delete this transaction?')) {
        deleteTransaction(btn.dataset.id, btn);
    }
}

// NEW: Auto-delete functionality (30-minute countdown)
function updateDeleteButtonStatus() {
    const now = new Date();
    const options = { timeZone: 'Asia/Karachi' };
    const nowInKarachi = new Date(now.toLocaleString('en-US', options));
    const nowSeconds = Math.floor(nowInKarachi.getTime() / 1000); // Current time in seconds
    const thirtyMinutes = 30 * 60; // 30 minutes in seconds
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        const createdTime = parseInt(btn.dataset.created, 10); // Parse as integer
        if (isNaN(createdTime)) {
            console.error('Invalid created timestamp:', btn.dataset.created, 'for button:', btn);
            btn.classList.add('delete-expired', 'opacity-50', 'cursor-not-allowed');
            btn.disabled = true;
            btn.querySelector('.time-remaining').textContent = 'Expired';
            return;
        }
        
        console.log('Now:', nowSeconds, 'Created:', createdTime, 'Diff:', nowSeconds - createdTime);
        const elapsedTime = nowSeconds - createdTime;
        const timeRemaining = thirtyMinutes - elapsedTime;
        
        const timeRemainingElement = btn.querySelector('.time-remaining');
        
        if (timeRemaining <= 0) {
            btn.classList.add('delete-expired', 'opacity-50', 'cursor-not-allowed');
            btn.disabled = true;
            timeRemainingElement.textContent = 'Expired';
        } else {
            const minutes = Math.floor(timeRemaining / 60);
            const seconds = timeRemaining % 60;
            timeRemainingElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // Gradually fade out as time runs out
            const opacity = 1 - (elapsedTime / thirtyMinutes) * 0.7; // Reduce opacity by up to 70%
            btn.style.opacity = opacity;
        }
    });
}

// Initialize all buttons on page load
initializeDeleteButtons();
initializeDetailsButtons();
attachRowClickEvents();

// Start the countdown timer for delete buttons
setInterval(updateDeleteButtonStatus, 1000);
updateDeleteButtonStatus(); // Initial call

// Search Functionality
document.getElementById('search-name').addEventListener('input', () => {
    const term = document.getElementById('search-name').value.toLowerCase();
    document.querySelectorAll('#transactions-body tr').forEach(row => {
        const name = row.children[2].textContent.toLowerCase();
        row.style.display = name.includes(term) ? '' : 'none';
    });
});

// Calendar Filter Function - FIXED
document.getElementById('filter-calendar').addEventListener('change', filterTransactionsByCalendar);

// Clear Calendar Filter
document.getElementById('clear-calendar').addEventListener('click', () => {
    document.getElementById('filter-calendar').value = '';
    filterTransactionsByCalendar(); // This will show all transactions
});

// PDF Download Functionality (call the new file)
document.getElementById('download-pdf-btn').addEventListener('click', () => {
    window.reportGenerator.generatePDF();
});

// Handle form submission with validation
document.getElementById('add-form').addEventListener('submit', (e) => {
    const received = document.getElementById('received').value;
    const paid = document.getElementById('paid').value;
    
    if ((!received || received === '' || received === '0') && 
        (!paid || paid === '' || paid === '0')) {
        e.preventDefault();
        alert('Please fill either Received Amount or Paid Amount!');
        return false;
    }
    
    if (!received || received === '') {
        document.getElementById('received').value = '0';
    }
    if (!paid || paid === '') {
        document.getElementById('paid').value = '0';
    }
});

// Close modals when clicking outside
document.getElementById('add-modal').addEventListener('click', (e) => {
    if (e.target.id === 'add-modal') {
        document.getElementById('add-modal').classList.add('hidden');
    }
});

function filterTransactionsByCalendar() {
    const selectedDate = document.getElementById('filter-calendar').value; // Format: YYYY-MM
    
    if (!selectedDate) {
        // Show all transactions if no date is selected
        document.querySelectorAll('#transactions-body tr').forEach(row => {
            row.style.display = '';
        });
        return;
    }

    const [selectedYear, selectedMonth] = selectedDate.split('-');
    
    document.querySelectorAll('#transactions-body tr').forEach(row => {
        const data = JSON.parse(row.dataset.details);
        
        // Handle different date formats - could be YYYY-MM-DD or other formats
        let rowYear, rowMonth;
        
        if (data.date.includes('-')) {
            // Format like 2025-08-25 or 2025-8-25
            const dateParts = data.date.split('-');
            rowYear = dateParts[0];
            rowMonth = dateParts[1].padStart(2, '0'); // Ensure 2 digits (08 not 8)
        } else {
            // If date is in different format, try to parse it
            const dateObj = new Date(data.date);
            rowYear = dateObj.getFullYear().toString();
            rowMonth = (dateObj.getMonth() + 1).toString().padStart(2, '0');
        }
        
        // Debug: Log to see what we're comparing
        console.log(`Comparing: Selected(${selectedYear}-${selectedMonth}) vs Row(${rowYear}-${rowMonth})`);
        
        const matches = rowYear === selectedYear && rowMonth === selectedMonth;
        row.style.display = matches ? '' : 'none';
    });
}

document.getElementById('details-modal').addEventListener('click', (e) => {
    if (e.target.id === 'details-modal') {
        document.getElementById('details-modal').classList.add('hidden');
    }
});