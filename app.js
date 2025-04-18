// —––– CLASES —––––––––––––––––––––––––––––––––––––––––––––––––––––––
class Property {
  constructor(name, address, type, area, coefficient) {
    this.name = name;
    this.address = address;
    this.type = type;
    this.area = area;
    // Ensure coefficient is parsed correctly, handling '%' and ','
    this.coefficient = parseFloat(
      String(coefficient).replace('%','').replace(',','.')
    ) / 100;
     // Basic validation
    if (isNaN(this.coefficient) || this.coefficient < 0 || this.coefficient > 1) {
         console.error(`Invalid coefficient for property "${this.name}": ${coefficient}`);
         this.coefficient = 0; // Default to 0 if invalid
     }
  }
}

class Expense {
  constructor(description, amount, category, date = new Date()) {
    this.description = description;
    this.amount = parseFloat(amount);
     if (isNaN(this.amount) || this.amount < 0) {
         console.error(`Invalid amount for expense "${description}": ${amount}`);
         this.amount = 0; // Default to 0 if invalid
     }
    this.category = category;
    this.date = date;
    this.id = Date.now() + Math.random().toString(36).substr(2,9);
  }
}

class Payment {
  constructor(resident, amount, date = new Date()) {
    this.resident = resident; // Store the resident object reference
    this.amount = parseFloat(amount);
     if (isNaN(this.amount) || this.amount < 0) {
         console.error(`Invalid amount for payment to "${resident?.name}": ${amount}`);
         this.amount = 0; // Default to 0 if invalid
     }
    this.date = date;
    this.id = Date.now() + Math.random().toString(36).substr(2,9);
  }
}

// —––– DATOS INICIALES —––––––––––––––––––––––––––––––––––––––––––––––
const residents = [
  new Property('Juan Sabio','Es:1 Pl:00 Pt:01','Almacén-Estacionamiento','29 m2','1,97%'),
  new Property('Pedro','Es:1 Pl:00 Pt:02','Almacén-Estacionamiento','50 m2','2,73%'),
  new Property('Mateo','Es:1 Pl:00 Pt:04','Almacén-Estacionamiento','33 m2','2,63%'),
  new Property('Pepito','Es:1 Pl:EN Pt:01','Residencial','103 m2','5,97%'),
  new Property('Humberto','Es:1 Pl:EN Pt:02','Residencial','87 m2','6,37%'),
  new Property('Olga','Es:1 Pl:01 Pt:01','Residencial','108 m2','5,97%'),
  new Property('Isabel Cortes','Es:1 Pl:01 Pt:02','Residencial','92 m2','6,37%'),
  new Property('Raúl Bolaños','Es:1 Pl:02 Pt:01','Residencial','108 m2','5,97%'),
  new Property('Laura Andrés','Es:1 Pl:02 Pt:02','Residencial','92 m2','6,37%'),
  new Property('Vanessa Intriago','Es:1 Pl:03 Pt:01','Residencial','108 m2','5,97%'),
  new Property('Lorenzo Góngora','Es:1 Pl:03 Pt:02','Residencial','92 m2','6,37%'),
  new Property('Felipe Casanova','Es:1 Pl:04 Pt:01','Residencial','108 m2','5,97%'),
  new Property('Cristián Amada','Es:1 Pl:04 Pt:02','Residencial','57 m2','5,44%'),
  new Property('Rosa Martínez','Es:1 Pl:05 Pt:01','Residencial','132 m2','8,78%'),
  new Property('Franklin Carranza','Es:1 Pl:06 Pt:01','Residencial','113 m2','7,29%'),
  new Property('Ramon Valdez','Es:1 Pl:07 Pt:01','Residencial','180 m2','11,94%')
];

let expenses = [];
let payments = [];

// —––– INIT / LOCALSTORAGE —––––––––––––––––––––––––––––––––––––––––––
function initApp() {
  console.log('App initializing...');
  loadData();
  console.log('Data loaded. Residents array:', residents); // Check if residents is populated
  renderResidents();
  console.log('Residents rendered.');
  updatePaymentStatus();
  console.log('Payment status updated.');
  updateSummary();
  console.log('Summary updated.');
  updateHistory();
  console.log('History updated. App initialization complete.');
}

function loadData() {
  console.log('Attempting to load data from localStorage...');
  const saved = localStorage.getItem('communityData');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      console.log('Data parsed successfully from localStorage.');

      // Load expenses
      if (data.expenses && Array.isArray(data.expenses)) {
         expenses = data.expenses.map(e => {
          // Recreate Expense objects, preserving date and ID
          const exp = new Expense(e.description, e.amount, e.category, new Date(e.date));
          exp.id = e.id || (Date.now() + Math.random().toString(36).substr(2,9)); // Ensure ID exists
          return exp;
        });
         console.log('Expenses loaded:', expenses.length, 'items.');
      } else {
          expenses = [];
          console.log('No valid expenses data found in localStorage. Initializing empty expenses array.');
      }

      // Load payments
      if (data.payments && Array.isArray(data.payments)) {
         payments = data.payments.map(p => {
           // Find the resident by name from the constant residents list
           const resident = residents.find(r => r.name === p.resident?.name); // Use optional chaining just in case
           // Only create payment if resident is found to avoid issues
           if (resident) {
             // Recreate Payment objects, linking to the correct resident object and preserving date/ID
             const pay = new Payment(resident, p.amount, new Date(p.date));
             pay.id = p.id || (Date.now() + Math.random().toString(36).substr(2,9)); // Ensure ID exists
             return pay;
           } else {
             console.warn(`Resident "${p.resident?.name || 'N/A'}" not found for payment ID ${p.id || 'N/A'}. Skipping payment.`);
             return null; // Skip payments for non-existent or malformed residents
           }
         }).filter(p => p !== null); // Remove any null entries resulting from skipped payments
         console.log('Payments loaded:', payments.length, 'items.');

      } else {
          payments = [];
          console.log('No valid payments data found in localStorage. Initializing empty payments array.');
      }
      console.log('Data loading from localStorage complete.');

    } catch (error) {
      console.error('Error parsing or processing data from localStorage:', error);
      // Optionally clear corrupted data if parsing fails and prompt the user
      if (confirm('Hubo un error al cargar los datos guardados. Es posible que estén corruptos. ¿Deseas borrarlos y empezar de nuevo?')) {
          clearAllData(false); // Clear without prompt recursion
      } else {
         // Initialize with empty data if user doesn't want to clear
         expenses = [];
         payments = [];
         console.log('LocalStorage data load failed, initialized with empty arrays.');
      }
    }
  } else {
    console.log('No communityData found in localStorage.');
    // Data structures are already initialized as empty arrays []
  }
}

function saveData() {
  try {
    localStorage.setItem('communityData',
      JSON.stringify({ expenses, payments })
    );
    console.log('Data saved to localStorage.');
  } catch (error) {
      console.error('Error saving data to localStorage:', error);
      alert('No se pudieron guardar los datos. Por favor, comprueba el espacio de almacenamiento del navegador.');
  }
}

// Added a flag to prevent recursive prompts
function clearAllData(askForConfirmation = true) {
  if (askForConfirmation) {
    if (!confirm('¿Estás seguro de que quieres borrar todos los datos? Esta acción no se puede deshacer.')) {
      return; // Stop if user cancels
    }
  }
  localStorage.removeItem('communityData');
  expenses = []; // Clear current data in memory
  payments = []; // Clear current data in memory
  console.log('All data cleared from localStorage and memory.');
  initApp(); // Re-initialize the app to update the UI with empty state
  if (askForConfirmation) {
     alert('Todos los datos han sido eliminados.');
  }
}

// —––– RENDERIZADOS —––––––––––––––––––––––––––––––––––––––––––––––––
function renderResidents() {
  console.log('Rendering residents select dropdown...');
  const selectElement = document.getElementById('residentSelect');
  if (selectElement) {
    selectElement.innerHTML =
      residents.map(r => `
        <option value="${r.name}">
          ${r.name} – ${r.type} (${(r.coefficient*100).toFixed(2)}%)
        </option>
      `).join('');
     console.log('Residents select dropdown rendered.');
  } else {
     console.error('Element with ID "residentSelect" not found.');
  }
}

function updatePaymentStatus() {
  console.log('Updating payment status display...');
  const paymentStatusElement = document.getElementById('paymentStatus');
  if (paymentStatusElement) {
    paymentStatusElement.innerHTML =
      residents.map(resident => {
        const totalDue   = calculateTotalDue(resident);
        const paidAmount = payments
          .filter(p => p.resident?.name === resident.name) // Use optional chaining
          .reduce((s,p) => s + p.amount, 0);
        const remaining  = Math.max(0, totalDue - paidAmount);
        const status     = paidAmount >= totalDue ? 'paid' : 'unpaid';
        return `
        <div class="col-md-6 col-lg-4">
          <div class="payment-status ${status}">
            <h6>${resident.name}</h6>
            <p>${resident.type} (${resident.area})</p>
            <p>Coef.: ${(resident.coefficient*100).toFixed(2)}%</p>
            <p>Pagado: €${paidAmount.toFixed(2)}</p>
            <p>Total: €${totalDue.toFixed(2)}</p>
            <p class="due">Debe: €${remaining.toFixed(2)}</p>
          </div>
        </div>`;
      }).join('');
    console.log('Payment status display updated.');
  } else {
      console.error('Element with ID "paymentStatus" not found.');
  }
}

function updateSummary() {
  console.log('Updating summary display...');
  const summaryElement = document.getElementById('monthlySummary');
  if (summaryElement) {
    const totalExp = expenses.reduce((s,e) => s + e.amount, 0);
    const totalPay = payments.reduce((s,p) => s + p.amount, 0);
    const balance = totalPay - totalExp;
    summaryElement.innerHTML = `
      <p><strong>Total Gastos:</strong> €${totalExp.toFixed(2)}</p>
      <p><strong>Total Recaudado:</strong> €${totalPay.toFixed(2)}</p>
      <p><strong>Balance:</strong> €${balance.toFixed(2)}</p>
    `;
    console.log('Summary display updated.');
  } else {
      console.error('Element with ID "monthlySummary" not found.');
  }
}

function updateHistory() {
  console.log('Updating history table...');
  const historyTableElement = document.getElementById('historyTable');
  if (historyTableElement) {
    const all = [
      ...expenses.map(e => ({ ...e, type: 'Gasto' })),
      // Ensure payment items reference the resident name correctly
      ...payments.map(p => ({ ...p, type: 'Pago', description: p.resident?.name || 'Propietario Desconocido' }))
    ].sort((a,b) => b.date - a.date);

    historyTableElement.innerHTML =
      all.map(item => `
      <tr class="${item.type==='Gasto'?'table-warning':''}"
          ${item.type==='Gasto'?`onclick="showExpenseDetail(${item.amount},'${item.category}')"`:''}>
        <td data-label="Fecha">${item.date instanceof Date && !isNaN(item.date) ? item.date.toLocaleDateString() : 'Fecha Inválida'}</td>
        <td data-label="Descripción">
          ${item.type==='Pago'?item.description:item.description + (item.category!=='general'?` (${item.category})`:'' )}
        </td>
        <td data-label="Importe">€${parseFloat(item.amount).toFixed(2)}</td>
        <td data-label="Tipo">${item.type}</td>
        <td data-label="Acción">
          ${item.type==='Pago'
            ? `<button class="btn btn-sm btn-danger" onclick="deletePayment('${item.id}')">Eliminar</button>`
            : `<button class="btn btn-sm btn-danger" onclick="deleteExpense('${item.id}')">Eliminar</button>`
          }
        </td>
      </tr>
    `).join('');
    console.log('History table updated.');
  } else {
      console.error('Element with ID "historyTable" not found.');
  }
}

// —––– CÁLCULOS —––––––––––––––––––––––––––––––––––––––––––––––––––
function calculateTotalDue(resident) {
  // Calculate the total expenses that apply to this resident based on their coefficient.
  // Sum all expense amounts first, then multiply by the resident's coefficient.
  const totalExpenses = expenses.reduce((s,e) => s + e.amount, 0);
  return totalExpenses * resident.coefficient;
}


// —––– HANDLERS —––––––––––––––––––––––––––––––––––––––––––––––––––
function addExpense(e) {
  e.preventDefault();
  const desc = document.getElementById('expenseDescription').value;
  const amt  = document.getElementById('expenseAmount').value;
  const cat  = document.getElementById('expenseType').value;
  if (!desc || !amt || isNaN(parseFloat(amt)) || parseFloat(amt) < 0) {
    alert('Por favor, introduce una descripción válida y un importe numérico mayor o igual a 0 para el gasto.');
    return;
  }
  expenses.push(new Expense(desc, amt, cat));
  saveData();
  updatePaymentStatus(); // Status needs to be updated as total due changes
  updateSummary();
  updateHistory();
  document.getElementById('expenseForm').reset();
  console.log('Expense added.');
}

function registerPayment() {
  const name = document.getElementById('residentSelect').value;
  const amt  = document.getElementById('paymentAmount').value;
  const res  = residents.find(r => r.name === name);
  if (!res || !amt || isNaN(parseFloat(amt)) || parseFloat(amt) < 0) {
    alert('Por favor, selecciona un propietario e introduce un importe numérico mayor o igual a 0 para el pago.');
    return;
  }
  const payment = new Payment(res, amt);
  payments.push(payment);
  saveData();
  updatePaymentStatus();
  updateSummary();
  updateHistory();
  generateInvoice(payment); // Generate invoice immediately after payment
  document.getElementById('paymentAmount').value = '';
  console.log('Payment registered.');
}

function deleteExpense(id) {
  if (confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
    expenses = expenses.filter(e => e.id !== id);
    saveData();
    updatePaymentStatus(); // Status needs to be updated as total due changes
    updateSummary();
    updateHistory();
    console.log(`Expense with ID ${id} deleted.`);
  }
}

function deletePayment(id) {
  if (confirm('¿Estás seguro de que quieres eliminar este pago?')) {
    payments = payments.filter(p => p.id !== id);
    saveData();
    updatePaymentStatus();
    updateSummary();
    updateHistory();
     console.log(`Payment with ID ${id} deleted.`);
  }
}

function showExpenseDetail(amount, category) {
  console.log(`Showing expense detail for amount: ${amount}, category: ${category}`);
  const modalBody = document.getElementById('expenseDetailContent');
  const modalTitle = document.getElementById('expenseTitle');

  if (!modalBody || !modalTitle) {
      console.error('Modal elements not found.');
      return;
  }

  const parsedAmount = parseFloat(amount);
   if (isNaN(parsedAmount)) {
        console.error('Invalid amount passed to showExpenseDetail.');
        return;
   }

  const rows = residents.map(r => {
    const individualShare = parsedAmount * r.coefficient;
    return `
    <tr>
      <td>${r.name}</td>
      <td>${(r.coefficient*100).toFixed(2)}%</td>
      <td>€${individualShare.toFixed(2)}</td>
    </tr>
  `}).join('');
  modalBody.innerHTML = rows;
  modalTitle.textContent = `Detalle Gasto ${category || 'N/A'}: €${parsedAmount.toFixed(2)}`;

  const expenseDetailModal = new bootstrap.Modal(document.getElementById('expenseDetailModal'));
  expenseDetailModal.show();
   console.log('Expense detail modal shown.');
}

function generateInvoice(payment) {
  console.log('Generating invoice PDF...');
  if (!payment || !payment.resident) {
      console.error('Invalid payment object for invoice generation.');
      return;
  }

  const { jsPDF } = window.jspdf;
  if (!jsPDF) {
      console.error('jsPDF library not loaded.');
      alert('La librería para generar PDFs no está disponible.');
      return;
  }

  const doc = new jsPDF();
  let yPos = 20;

  // Encabezado
  doc.setFontSize(18);
  doc.text("Factura de Pago", 20, yPos);
  yPos += 15;

  // Datos del pago
  doc.setFontSize(12);
  doc.text(`Fecha: ${payment.date.toLocaleDateString()}`, 20, yPos);
  yPos += 10;
  doc.text(`Propietario: ${payment.resident.name}`, 20, yPos);
  yPos += 10;
  doc.text(`Dirección: AV SANT SALVADOR 60, ${payment.resident.address}`, 20, yPos);
  yPos += 10;
  doc.text(`Coeficiente: ${(payment.resident.coefficient*100).toFixed(2)}%`, 20, yPos);
  yPos += 10;
  doc.text(`Importe pagado: €${payment.amount.toFixed(2)}`, 20, yPos);
  yPos += 10;


  // Nº de factura
  // Use a reliable part of the ID or a separate counter if needed for uniqueness
  const invoiceNumber = payment.id ? String(payment.id).substr(-6).toUpperCase() : 'N/A';
  doc.text(
    `Factura Nº ${invoiceNumber}`,
    190, 20, // Adjusted X position slightly
    { align: 'right' }
  );

  doc.save(`Factura_${payment.resident.name.replace(/ /g, '_')}_${invoiceNumber}.pdf`);
  console.log('Invoice PDF generated.');
}

function generateGeneralReport() {
    console.log('Generating general report PDF...');
    const { jsPDF } = window.jspdf;
     if (!jsPDF) {
         console.error('jsPDF library not loaded.');
         alert('La librería para generar PDFs no está disponible.');
         return;
     }
    const doc = new jsPDF();
    let yPos = 20;
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text("Reporte General de Comunidad", margin, yPos);
    yPos += 15;

    doc.setFontSize(12);
    doc.text(`Fecha del Reporte: ${new Date().toLocaleDateString()}`, margin, yPos);
    yPos += 20;

    // Resumen
    doc.setFontSize(14);
    doc.text("Resumen:", margin, yPos);
    yPos += 10;

    const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
    const totalPay = payments.reduce((s, p) => s + p.amount, 0);
    const balance = totalPay - totalExp;

    doc.setFontSize(12);
    doc.text(`Total Gastos: €${totalExp.toFixed(2)}`, margin, yPos);
    yPos += 7; // Reduced line spacing
    doc.text(`Total Recaudado: €${totalPay.toFixed(2)}`, margin, yPos);
    yPos += 7;
    doc.text(`Balance: €${balance.toFixed(2)}`, margin, yPos);
    yPos += 20;

    // Estado de Pagos por Propietario
    doc.setFontSize(14);
    doc.text("Estado de Pagos por Propietario:", margin, yPos);
    yPos += 10;

    // Table headers
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text("Propietario", margin, yPos);
    doc.text("Adeudado (€)", margin + 70, yPos, { align: 'right' });
    doc.text("Pagado (€)", margin + 110, yPos, { align: 'right' });
    doc.text("Debe (€)", margin + 150, yPos, { align: 'right' }); // Adjusted position
    doc.setFont(undefined, 'normal'); // Reset font style
    yPos += 5;
    doc.line(margin, yPos, pageWidth - margin, yPos); // Horizontal line
    yPos += 5;

    doc.setFontSize(10); // Reduced font size for table rows
    residents.forEach(resident => {
        // Check if new page is needed before drawing the row
        if (yPos > 280) {
            doc.addPage();
            yPos = 20;
            doc.setFontSize(14);
            doc.text("Estado de Pagos por Propietario (continuación):", margin, yPos);
            yPos += 15;
             // Repeat headers on new page
            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text("Propietario", margin, yPos);
            doc.text("Adeudado (€)", margin + 70, yPos, { align: 'right' });
            doc.text("Pagado (€)", margin + 110, yPos, { align: 'right' });
             doc.text("Debe (€)", margin + 150, yPos, { align: 'right' }); // Adjusted position
            doc.setFont(undefined, 'normal');
            yPos += 5;
            doc.line(margin, yPos, pageWidth - margin, yPos);
            yPos += 5;
             doc.setFontSize(10); // Reset font size for rows
        }

        const totalDue = calculateTotalDue(resident);
        const paidAmount = payments
            .filter(p => p.resident?.name === resident.name)
            .reduce((s, p) => s + p.amount, 0);
        const remaining = Math.max(0, totalDue - paidAmount);

        doc.text(resident.name, margin, yPos);
        doc.text(totalDue.toFixed(2), margin + 70, yPos, { align: 'right' });
        doc.text(paidAmount.toFixed(2), margin + 110, yPos, { align: 'right' });

        // Set color for remaining amount
        doc.setTextColor(remaining > 0 ? 255 : 0, remaining > 0 ? 0 : 0, remaining > 0 ? 0 : 0); // Red if > 0, Black if 0
        doc.text(remaining.toFixed(2), margin + 150, yPos, { align: 'right' }); // Adjusted position
        doc.setTextColor(0, 0, 0); // Reset color to black

        yPos += 7; // Line spacing for rows
    });

    console.log('General report PDF generated.');
    doc.save(`ReporteGeneral_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
}


// —––– EVENTOS —––––––––––––––––––––––––––––––––––––––––––––––––––
document.getElementById('expenseForm').addEventListener('submit', addExpense);
document.getElementById('btnRegisterPayment').addEventListener('click', registerPayment);
document.getElementById('btnGenerateGeneralReport').addEventListener('click', generateGeneralReport); // New event listener
document.getElementById('btnClearData').addEventListener('click', () => clearAllData(true)); // New event listener, pass true to ask for confirmation
document.addEventListener('DOMContentLoaded', initApp);
