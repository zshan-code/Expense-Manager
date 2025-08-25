// static/js/reportGenerator.js
function generatePDF() {
    // Get visible transactions (filtered)
    const visibleRows = Array.from(document.querySelectorAll('#transactions-body tr'))
        .filter(row => row.style.display !== 'none');
    
    if (visibleRows.length === 0) {
        alert('No transactions to export!');
        return;
    }

    // Extract data from visible rows
    const transactionData = visibleRows.map(row => {
        const data = JSON.parse(row.dataset.details);
        return {
            date: data.date,
            time: data.time,
            name: data.name,
            comment: data.comment || 'N/A',
            received: data.received,
            paid: data.paid,
            balance: data.balance
        };
    });

    // Create PDF content
    const currentDate = new Date().toLocaleDateString('en-US');
    const filterValue = document.getElementById('filter-calendar').value;
    const reportTitle = filterValue ? 
        `Expense Report - ${formatMonthYear(filterValue)}` : 
        'Complete Expense Report';
    
    let pdfContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600&family=Roboto:wght@300;400&display=swap');
        
        body { 
            font-family: 'Roboto', sans-serif; 
            margin: 40px;
            color: #1e3a8a;
            background-color: #faf7f0;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #1e3a8a;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #1e3a8a;
            margin: 0;
            font-size: 28px;
            font-family: 'Playfair Display', serif;
            font-weight: 600;
        }
        .header p {
            margin: 5px 0;
            color: #6b7280;
            font-size: 14px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        th, td {
            padding: 10px 12px;
            text-align: left;
            border: 1px solid #d1d5db;
        }
        th {
            background-color: #1e3a8a;
            color: #faf7f0;
            font-weight: 500;
            font-family: 'Roboto', sans-serif;
        }
        tr:nth-child(even) {
            background-color: #f3f4f6;
        }
        tr:hover {
            background-color: #e5e7eb;
        }
        .summary {
            margin-top: 30px;
            padding: 20px;
            background-color: #f0f4f8;
            border-left: 4px solid #1e3a8a;
            border-radius: 8px;
            font-family: 'Roboto', sans-serif;
        }
        .summary h3 {
            margin-top: 0;
            color: #1e3a8a;
            font-family: 'Playfair Display', serif;
            font-size: 18px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 8px;
        }
        .summary p {
            margin: 8px 0;
            font-size: 14px;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
            border-top: 1px solid #d1d5db;
            padding-top: 20px;
            font-family: 'Roboto', sans-serif;
        }
        .positive-balance {
            color: #065f46;
        }
        .negative-balance {
            color: #b91c1c;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>💲 ${reportTitle}</h1>
        <p>Generated on: ${currentDate}</p>
        <p>Total Records: ${transactionData.length}</p>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Name</th>
                <th>Comment</th>
                <th>Received</th>
                <th>Paid</th>
                <th>Balance</th>
            </tr>
        </thead>
        <tbody>
`;

    // Add transaction rows
    transactionData.forEach(transaction => {
        const balanceClass = parseFloat(transaction.balance) >= 0 ? 'positive-balance' : 'negative-balance';
        pdfContent += `
            <tr>
                <td>${transaction.date}</td>
                <td>${transaction.time}</td>
                <td>${transaction.name}</td>
                <td>${transaction.comment}</td>
                <td>${transaction.received}</td>
                <td>${transaction.paid}</td>
                <td class="${balanceClass}">${transaction.balance}</td>
            </tr>`;
    });

    // Calculate totals
    const totalReceived = transactionData.reduce((sum, t) => sum + parseFloat(t.received || 0), 0);
    const totalPaid = transactionData.reduce((sum, t) => sum + parseFloat(t.paid || 0), 0);
    const netBalance = totalReceived - totalPaid;
    const netBalanceClass = netBalance >= 0 ? 'positive-balance' : 'negative-balance';

    pdfContent += `
        </tbody>
    </table>
    
    <div class="summary">
        <h3>Financial Summary</h3>
        <p><strong>Total Received:</strong> ${totalReceived.toFixed(2)}</p>
        <p><strong>Total Paid:</strong> ${totalPaid.toFixed(2)}</p>
        <p><strong>Net Balance:</strong> <span class="${netBalanceClass}">${netBalance.toFixed(2)}</span></p>
    </div>
    
    <div class="footer">
        <p>© ${new Date().getFullYear()} Expense Management System | Generated by Zshan</p>
    </div>
</body>
</html>`;

    // Create and download PDF
    const newWindow = window.open('', '_blank');
    newWindow.document.write(pdfContent);
    newWindow.document.close();
    
    // Auto-trigger print dialog
    setTimeout(() => {
        newWindow.print();
    }, 100);
}

function formatMonthYear(dateString) {
    const [year, month] = dateString.split('-');
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
}

// Expose functions for external use
window.reportGenerator = {
    generatePDF: generatePDF
};