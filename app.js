// app.js

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
  new Property('tienda 1 ','Es:1 Pl:00 Pt:01','tienda 1','29 m2','1,967%'),
  new Property('tienda 2','Es:1 Pl:00 Pt:02','tienda 2','50 m2','2,732%'),
  new Property('tienda 3','Es:1 Pl:00 Pt:03','tienda 3','50 m2','3,884%'),
  new Property('tienda 4','Es:1 Pl:00 Pt:04','tienda 4','33 m2','2,63%'),
  new Property('entresuelo primera ','Es:1 Pl:EN Pt:01','Residencial','103 m2','5,974%'),
  new Property('entresuelo segunda','Es:1 Pl:EN Pt:02','Residencial','87 m2','6,367%'),
  new Property('primero primera','Es:1 Pl:01 Pt:01','Residencial','108 m2','5,974%'),
  new Property('primero segunda ','Es:1 Pl:01 Pt:02','Residencial','92 m2','6,367%'),
  new Property('segungundo primera','Es:1 Pl:02 Pt:01','Residencial','108 m2','5,974%'),
  new Property('segundo segunda','Es:1 Pl:02 Pt:02','Residencial','92 m2','6,367%'),
  new Property('tercero primera','Es:1 Pl:03 Pt:01','Residencial','108 m2','5,974%'),
  new Property('tercero segunda','Es:1 Pl:03 Pt:02','Residencial','92 m2','6,367%'),
  new Property('cuarto primera','Es:1 Pl:04 Pt:01','Residencial','108 m2','5,974%'),
  new Property('cuarto segunda','Es:1 Pl:04 Pt:02','Residencial','57 m2','5,443%'),
  new Property('quinto','Es:1 Pl:05 Pt:01','Residencial','132 m2','8,784%'),
  new Property('sexto','Es:1 Pl:06 Pt:01','Residencial','113 m2','7,287%'),
  new Property('septimo','Es:1 Pl:07 Pt:01','Residencial','180 m2','11,937%')
];

let expenses = [];
let payments = [];

// —––– INIT / LOCALSTORAGE —––––––––––––––––––––––––––––––––––––––––––
function initApp() {
  console.log('App initializing...');
  loadData();
  console.log('Data loaded. Residents array:', residents);
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
          const exp = new Expense(e.description, e.amount, e.category, new Date(e.date));
          exp.id = e.id || (Date.now() + Math.random().toString(36).substr(2,9));
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
          const resident = residents.find(r => r.name === p.resident?.name);
          if (resident) {
            const pay = new Payment(resident, p.amount, new Date(p.date));
            pay.id = p.id || (Date.now() + Math.random().toString(36).substr(2,9));
            return pay;
          } else {
            console.warn(`Resident "${p.resident?.name || 'N/A'}" not found for payment ID ${p.id || 'N/A'}. Skipping payment.`);
            return null;
          }
        }).filter(p => p !== null);
        console.log('Payments loaded:', payments.length, 'items.');
      } else {
        payments = [];
        console.log('No valid payments data found in localStorage. Initializing empty payments array.');
      }
      console.log('Data loading from localStorage complete.');

    } catch (error) {
      console.error('Error parsing or processing data from localStorage:', error);
      if (confirm('Hubo un error al cargar los datos guardados. Es posible que estén corruptos. ¿Deseas borrarlos y empezar de nuevo?')) {
        clearAllData(false);
      } else {
        expenses = [];
        payments = [];
        console.log('LocalStorage data load failed, initialized with empty arrays.');
      }
    }
  } else {
    console.log('No communityData found in localStorage.');
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

function clearAllData(askForConfirmation = true) {
  if (askForConfirmation) {
    if (!confirm('¿Estás seguro de que quieres borrar todos los datos? Esta acción no se puede deshacer.')) {
      return;
    }
  }
  localStorage.removeItem('communityData');
  expenses = [];
  payments = [];
  console.log('All data cleared from localStorage and memory.');
  initApp();
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
          ${r.name} – ${r.type} (${(r.coefficient*100).toFixed(3)}%)
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
          .filter(p => p.resident?.name === resident.name)
          .reduce((s,p) => s + p.amount, 0);
        const remaining  = Math.max(0, totalDue - paidAmount);
        const status     = paidAmount >= totalDue ? 'paid' : 'unpaid';
        return `
        <div class="col-md-6 col-lg-4">
          <div class="payment-status ${status}">
            <h6>${resident.name}</h6>
            <p>${resident.type} (${resident.area})</p>
            <p>Coef.: ${(resident.coefficient*100).toFixed(3)}%</p>
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
  updatePaymentStatus();
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
  generateInvoice(payment);
  document.getElementById('paymentAmount').value = '';
  console.log('Payment registered.');
}

function deleteExpense(id) {
  if (confirm('¿Estás seguro de que quieres eliminar este gasto?')) {
    expenses = expenses.filter(e => e.id !== id);
    saveData();
    updatePaymentStatus();
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
        <td>${(r.coefficient*100).toFixed(3)}%</td>
        <td>€${individualShare.toFixed(2)}</td>
      </tr>
    `;
  }).join('');
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
  doc.text(`Coeficiente: ${(payment.resident.coefficient*100).toFixed(3)}%`, 20, yPos);
  yPos += 10;
  doc.text(`Importe pagado: €${payment.amount.toFixed(2)}`, 20, yPos);
  yPos += 10;
  // Nº de factura
  const invoiceNumber = payment.id ? String(payment.id).substr(-6).toUpperCase() : 'N/A';
  doc.text(
    `Factura Nº ${invoiceNumber}`,
    190, 20,
    { align: 'right' }
  );
  doc.save(`Factura_${payment.resident.name.replace(/ /g, '_')}_${invoiceNumber}.pdf`);
  console.log('Invoice PDF generated.');
}

function generateGeneralReport() {
  console.log('Generating general report PDF with grid lines and totals...');
  const { jsPDF } = window.jspdf;
  if (!jsPDF) {
    console.error('jsPDF library not loaded.');
    alert('La librería para generar PDFs no está disponible.');
    return;
  }

  const doc = new jsPDF();
  const margin = 20;
  let yPos = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const tableX = margin;
  const tableY = yPos + 60; // espacio para encabezados y resumen
  const colWidths = [70, 40, 40, 40]; // Propietario, Adeudado, Pagado, Debe
  const rowHeight = 8;

  // --- Encabezado ---
  doc.setFontSize(18);
  doc.text("Reporte General de Comunidad", margin, yPos);
  yPos += 15;
  doc.setFontSize(12);
  doc.text(`Fecha del Reporte: ${new Date().toLocaleDateString()}`, margin, yPos);
  yPos += 20;

  // --- Resumen ---
  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
  const totalPay = payments.reduce((s, p) => s + p.amount, 0);
  const balance  = totalPay - totalExp;
  doc.setFontSize(12);
  doc.text(`Total Gastos: €${totalExp.toFixed(2)}`, margin, yPos);
  yPos += 7;
  doc.text(`Total Recaudado: €${totalPay.toFixed(2)}`, margin, yPos);
  yPos += 7;
  doc.text(`Balance: €${balance.toFixed(2)}`, margin, yPos);

  // --- Preparar datos de la tabla ---
  const rows = residents.map(resident => {
    const due    = calculateTotalDue(resident);
    const paid   = payments
      .filter(p => p.resident?.name === resident.name)
      .reduce((s, p) => s + p.amount, 0);
    const remain = Math.max(0, due - paid);
    return [resident.name, due.toFixed(2), paid.toFixed(2), remain.toFixed(2)];
  });

  // Calcular totales de columnas
  const totalDueAll    = rows.reduce((s, r) => s + parseFloat(r[1]), 0);
  const totalPaidAll   = rows.reduce((s, r) => s + parseFloat(r[2]), 0);
  const totalRemainAll = rows.reduce((s, r) => s + parseFloat(r[3]), 0);
  const totalRow = [
    "TOTAL",
    totalDueAll.toFixed(2),
    totalPaidAll.toFixed(2),
    totalRemainAll.toFixed(2)
  ];
  rows.push(totalRow); // añadimos fila de totales al final

  // --- Dibujar cabecera de tabla ---
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  const headers = ["Propietario", "Adeudado (€)", "Pagado (€)", "Debe (€)"];
  let x = tableX;
  headers.forEach((h, i) => {
    doc.text(h, x + 2, tableY + rowHeight - 2);
    x += colWidths[i];
  });
  doc.setFont(undefined, 'normal');

  // --- Dibujar contenido de cada celda ---
  rows.forEach((row, rowIndex) => {
    const yRow = tableY + (rowIndex + 1) * rowHeight;
    row.forEach((cell, colIndex) => {
      const xCell = tableX + colWidths.slice(0, colIndex).reduce((a,b)=>a+b, 0) + 2;
      // Si es la fila de totales, la pintamos en negrita
      if (rowIndex === rows.length - 1) {
        doc.setFont(undefined, 'bold');
      }
      doc.text(cell, xCell, yRow - 2);
      if (rowIndex === rows.length - 1) {
        doc.setFont(undefined, 'normal');
      }
    });
  });

  // --- Dibujar líneas de la cuadrícula ---
  const tableWidth  = colWidths.reduce((a,b) => a + b, 0);
  const tableHeight = rowHeight * (rows.length + 1);
  // Líneas verticales
  let xLine = tableX;
  for (let i = 0; i <= colWidths.length; i++) {
    doc.line(xLine, tableY, xLine, tableY + tableHeight);
    if (i < colWidths.length) xLine += colWidths[i];
  }
  // Líneas horizontales
  for (let i = 0; i <= rows.length + 1; i++) {
    const yLine = tableY + i * rowHeight;
    doc.line(tableX, yLine, tableX + tableWidth, yLine);
  }

  // --- Guardar PDF ---
  console.log('General report PDF with grid lines and totals generated.');
  doc.save(`ReporteGeneral_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`);
}
// —––– EVENTOS —––––––––––––––––––––––––––––––––––––––––––––––––––
document.getElementById('expenseForm').addEventListener('submit', addExpense);
document.getElementById('btnRegisterPayment').addEventListener('click', registerPayment);
document.getElementById('btnGenerateGeneralReport').addEventListener('click', generateGeneralReport);
document.getElementById('btnClearData').addEventListener('click', () => clearAllData(true));
document.addEventListener('DOMContentLoaded', initApp);