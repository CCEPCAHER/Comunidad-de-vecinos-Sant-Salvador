// app.js

// —––– CLASES —––––––––––––––––––––––––––––––––––––––––––––––––––––––
class Property {
  constructor(name, address, type, area, coefficient) {
    this.name = name;
    this.address = address;
    this.type = type;
    this.area = area;
    this.coefficient = parseFloat(
      String(coefficient).replace('%','').replace(',','.')
    ) / 100;
    if (isNaN(this.coefficient) || this.coefficient < 0 || this.coefficient > 1) {
      console.error(`Invalid coefficient for property "${this.name}": ${coefficient}`);
      this.coefficient = 0;
    }
  }
}

class Expense {
  constructor(description, amount, category, date = new Date()) {
    this.description = description;
    this.amount = parseFloat(amount);
    if (isNaN(this.amount) || this.amount < 0) {
      console.error(`Invalid amount for expense "${description}": ${amount}`);
      this.amount = 0;
    }
    this.category = category;
    this.date = date;
    this.id = Date.now() + Math.random().toString(36).substr(2,9);
  }
}

class Payment {
  constructor(resident, amount, date = new Date()) {
    this.resident = resident;
    this.amount = parseFloat(amount);
    if (isNaN(this.amount) || this.amount < 0) {
      console.error(`Invalid amount for payment to "${resident?.name}": ${amount}`);
      this.amount = 0;
    }
    this.date = date;
    this.id = Date.now() + Math.random().toString(36).substr(2,9);
  }
}

// —––– DATOS INICIALES —––––––––––––––––––––––––––––––––––––––––––––––
const residents = [
  new Property('tienda 1','Es:1 Pl:00 Pt:01','tienda 1','29 m2','1,967%'),
  new Property('tienda 2','Es:1 Pl:00 Pt:02','tienda 2','50 m2','2,732%'),
  new Property('tienda 3','Es:1 Pl:00 Pt:03','tienda 3','50 m2','3,884%'),
  new Property('tienda 4','Es:1 Pl:00 Pt:04','tienda 4','33 m2','2,63%'),
  new Property('entresuelo primera','Es:1 Pl:EN Pt:01','Residencial','103 m2','5,974%'),
  new Property('entresuelo segunda','Es:1 Pl:EN Pt:02','Residencial','87 m2','6,367%'),
  new Property('primero primera','Es:1 Pl:01 Pt:01','Residencial','108 m2','5,974%'),
  new Property('primero segunda','Es:1 Pl:01 Pt:02','Residencial','92 m2','6,367%'),
  new Property('segundo primera','Es:1 Pl:02 Pt:01','Residencial','108 m2','5,974%'),
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
  loadData();
  renderResidents();
  updatePaymentStatus();
  updateSummary();
  updateHistory();
}

function loadData() {
  const saved = localStorage.getItem('communityData');
  if (saved) {
    try {
      const data = JSON.parse(saved);
      if (Array.isArray(data.expenses)) {
        expenses = data.expenses.map(e => {
          const exp = new Expense(e.description, e.amount, e.category, new Date(e.date));
          exp.id = e.id;
          return exp;
        });
      }
      if (Array.isArray(data.payments)) {
        payments = data.payments.map(p => {
          const resident = residents.find(r => r.name === p.resident?.name);
          if (resident) {
            const pay = new Payment(resident, p.amount, new Date(p.date));
            pay.id = p.id;
            return pay;
          }
          return null;
        }).filter(p => p !== null);
      }
    } catch (err) {
      console.error('Error loading data:', err);
      if (confirm('Error al cargar datos. ¿Borrar todo y empezar de nuevo?')) {
        clearAllData(false);
      }
    }
  }
}

function saveData() {
  localStorage.setItem('communityData', JSON.stringify({ expenses, payments }));
}

function clearAllData(ask = true) {
  if (!ask || confirm('¿Borrar todos los datos?')) {
    localStorage.removeItem('communityData');
    expenses = [];
    payments = [];
    initApp();
  }
}

// —––– RENDERIZADOS —––––––––––––––––––––––––––––––––––––––––––––––––
function renderResidents() {
  const select = document.getElementById('residentSelect');
  if (!select) return;
  select.innerHTML = residents.map(r =>
    `<option value="${r.name}">${r.name} – ${r.type} (${(r.coefficient*100).toFixed(3)}%)</option>`
  ).join('');
}

function updatePaymentStatus() {
  const container = document.getElementById('paymentStatus');
  if (!container) return;
  container.innerHTML = residents.map(r => {
    const due   = calculateTotalDue(r);
    const paid  = payments.filter(p => p.resident.name === r.name).reduce((s,p) => s + p.amount, 0);
    const rem   = Math.max(0, due - paid);
    const stat  = paid >= due ? 'paid' : 'unpaid';
    return `
      <div class="col-md-6 col-lg-4">
        <div class="payment-status ${stat}">
          <h6>${r.name}</h6>
          <p>${r.type} (${r.area})</p>
          <p>Coef.: ${(r.coefficient*100).toFixed(3)}%</p>
          <p>Pagado: ${paid.toFixed(2)}€</p>
          <p>Total: ${due.toFixed(2)}€</p>
          <p class="due">Debe: ${rem.toFixed(2)}€</p>
        </div>
      </div>`;
  }).join('');
}

function updateSummary() {
  const el = document.getElementById('monthlySummary');
  if (!el) return;
  const totalExp = expenses.reduce((s,e) => s + e.amount, 0);
  const totalPay = payments.reduce((s,p) => s + p.amount, 0);
  const bal = totalPay - totalExp;
  el.innerHTML = `
    <p><strong>Total Gastos:</strong> ${totalExp.toFixed(2)}€</p>
    <p><strong>Total Recaudado:</strong> ${totalPay.toFixed(2)}€</p>
    <p><strong>Balance:</strong> ${bal.toFixed(2)}€</p>
  `;
}

function updateHistory() {
  const tbl = document.getElementById('historyTable');
  if (!tbl) return;
  const all = [
    ...expenses.map(e => ({ ...e, type: 'Gasto' })),
    ...payments.map(p => ({ ...p, type: 'Pago', description: p.resident.name }))
  ].sort((a,b) => b.date - a.date);

  tbl.innerHTML = all.map(item => `
    <tr class="${item.type==='Gasto'?'table-warning':''}"
      ${item.type==='Gasto' && item.category!=='general'
        ? `onclick="showExpenseDetail(${item.amount},'${item.category}')"`
        : ''}>
      <td>${item.date.toLocaleDateString()}</td>
      <td>${item.description}${item.type==='Gasto' && item.category!=='general' ? ` (${item.category})` : ''}</td>
      <td>${item.amount.toFixed(2)}€</td>
      <td>${item.type}</td>
      <td>
        ${item.type==='Pago'
          ? `<button class="btn btn-sm btn-danger" onclick="deletePayment('${item.id}')">Eliminar</button>`
          : `
            <button class="btn btn-sm btn-danger" onclick="deleteExpense('${item.id}')">Eliminar</button>
            ${item.category!=='general'
              ? `<button class="btn btn-sm btn-secondary ms-1" onclick="generateExpenseReport('${item.id}')">Imprimir</button>`
              : ''}`
        }
      </td>
    </tr>
  `).join('');
}

// —––– CÁLCULOS —––––––––––––––––––––––––––––––––––––––––––––––––––
function calculateTotalDue(resident) {
  const totalExtra = expenses
    .filter(e => e.category !== 'general')
    .reduce((s, e) => s + e.amount, 0);
  return totalExtra * resident.coefficient;
}

// —––– HANDLERS —––––––––––––––––––––––––––––––––––––––––––––––––––
function addExpense(e) {
  e.preventDefault();
  const desc = document.getElementById('expenseDescription').value;
  const amt  = document.getElementById('expenseAmount').value;
  const cat  = document.getElementById('expenseType').value;
  if (!desc || isNaN(parseFloat(amt)) || parseFloat(amt) < 0) {
    return alert('Descripción e importe válidos.');
  }
  expenses.push(new Expense(desc, amt, cat));
  saveData();
  updatePaymentStatus();
  updateSummary();
  updateHistory();
  document.getElementById('expenseForm').reset();
}

function registerPayment() {
  const name = document.getElementById('residentSelect').value;
  const amt  = document.getElementById('paymentAmount').value;
  const res  = residents.find(r => r.name === name);
  if (!res || isNaN(parseFloat(amt)) || parseFloat(amt) < 0) {
    return alert('Selecciona propietario e importe válido.');
  }
  const pay = new Payment(res, amt);
  payments.push(pay);
  saveData();
  updatePaymentStatus();
  updateSummary();
  updateHistory();
  generateInvoice(pay);
  document.getElementById('paymentAmount').value = '';
}

function deleteExpense(id) {
  if (!confirm('Eliminar gasto?')) return;
  expenses = expenses.filter(e => e.id !== id);
  saveData();
  updatePaymentStatus();
  updateSummary();
  updateHistory();
}

function deletePayment(id) {
  if (!confirm('Eliminar pago?')) return;
  payments = payments.filter(p => p.id !== id);
  saveData();
  updatePaymentStatus();
  updateSummary();
  updateHistory();
}

// —––– MODAL DETALLE GASTO —––––––––––––––––––––––––––––––––––––––––
function showExpenseDetail(amount, category) {
  const modalBody  = document.getElementById('expenseDetailContent');
  const modalTitle = document.getElementById('expenseTitle');
  const parsed     = parseFloat(amount);
  modalTitle.textContent = `Detalle Gasto ${category||''}: ${parsed.toFixed(2)}€`;
  modalBody.innerHTML = residents.map(r => {
    const part = parsed * r.coefficient;
    return `
      <tr>
        <td>${r.name}</td>
        <td>${(r.coefficient*100).toFixed(3)}%</td>
        <td>${part.toFixed(2)}€</td>
      </tr>`;
  }).join('');
  new bootstrap.Modal(document.getElementById('expenseDetailModal')).show();
}

// —––– FACTURA —–––––––––––––––––––––––––––––––––––––––––––––––––––
function generateInvoice(payment) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  let y = 20;
  doc.setFontSize(18); doc.text("Factura de Pago", 20, y); y+=15;
  doc.setFontSize(12);
  doc.text(`Fecha: ${payment.date.toLocaleDateString()}`, 20, y); y+=10;
  doc.text(`Propietario: ${payment.resident.name}`, 20, y); y+=10;
  doc.text(`Dirección: AV SANT SALVADOR 60, ${payment.resident.address}`, 20, y); y+=10;
  doc.text(`Coeficiente: ${(payment.resident.coefficient*100).toFixed(3)}%`, 20, y); y+=10;
  doc.text(`Importe: ${payment.amount.toFixed(2)}€`, 20, y);
  const num = payment.id.slice(-6).toUpperCase();
  doc.text(`Factura Nº ${num}`, 190, 20, { align: 'right' });
  doc.save(`Factura_${payment.resident.name.replace(/ /g,'_')}_${num}.pdf`);
}

// —––– REPORTE GASTO —––––––––––––––––––––––––––––––––––––––––––––
function generateExpenseReport(expenseId) {
  const exp = expenses.find(e => e.id === expenseId);
  if (!exp) return console.error('Gasto no encontrado:', expenseId);
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const margin = 20;
  let y = margin;

  doc.setFontSize(18);
  doc.text(`Gasto: ${exp.description}`, margin, y);
  y += 10;
  doc.setFontSize(12);
  doc.text(`Fecha: ${exp.date.toLocaleDateString()}`, margin, y);
  y += 8;
  doc.text(`Importe Total: ${exp.amount.toFixed(2)}€`, margin, y);
  y += 12;

  const headers = ['Propietario', 'Coef. (%)', 'Parte (€)'];
  const colWidths = [80, 40, 50];
  const rowHeight = 8;
  const tableX = margin;
  const tableY = y;

  doc.setFontSize(10).setFont(undefined, 'bold');
  headers.forEach((h, i) => {
    doc.text(h, tableX + 2 + colWidths.slice(0, i).reduce((a,b)=>a+b,0), y + 6);
  });
  doc.setFont(undefined, 'normal');

  const expRows = residents.map(r => {
    const part = exp.amount * r.coefficient;
    return [
      r.name,
      (r.coefficient * 100).toFixed(3) + '%',
      part.toFixed(2) + '€'
    ];
  });

  expRows.forEach((row, idx) => {
    const yRow = y + rowHeight * (idx + 1);
    row.forEach((cell, j) => {
      doc.text(cell, tableX + 2 + colWidths.slice(0, j).reduce((a,b)=>a+b,0), yRow + 6);
    });
  });

  const totalRows = expRows.length + 1;
  const tableHeight = totalRows * rowHeight;
  const tableWidth = colWidths.reduce((a,b)=>a+b, 0);

  for (let i = 0; i <= totalRows; i++) {
    const yLine = tableY + i * rowHeight;
    doc.line(tableX, yLine, tableX + tableWidth, yLine);
  }
  let xLine = tableX;
  for (let i = 0; i <= colWidths.length; i++) {
    doc.line(xLine, tableY, xLine, tableY + tableHeight);
    if (i < colWidths.length) xLine += colWidths[i];
  }

  doc.save(`DetalleGasto_${exp.description.replace(/\s+/g,'_')}.pdf`);
}

// —––– REPORTE GENERAL —––––––––––––––––––––––––––––––––––––––––––––
function generateGeneralReport() {
  const { jsPDF } = window.jspdf;
  if (!jsPDF) {
    alert('La librería para generar PDFs no está disponible.');
    return;
  }

  const doc = new jsPDF();
  const margin = 20;
  let yPos = margin;

  doc.setFontSize(18);
  doc.text("Reporte General de Comunidad", margin, yPos);
  yPos += 15;
  doc.setFontSize(12);
  doc.text(`Fecha del Reporte: ${new Date().toLocaleDateString()}`, margin, yPos);
  yPos += 20;

  const totalExp = expenses.reduce((s, e) => s + e.amount, 0);
  const totalPay = payments.reduce((s, p) => s + p.amount, 0);
  const balance  = totalPay - totalExp;
  doc.text(`Total Gastos: ${totalExp.toFixed(2)}€`, margin, yPos); yPos+=7;
  doc.text(`Total Recaudado: ${totalPay.toFixed(2)}€`, margin, yPos); yPos+=7;
  doc.text(`Balance: ${balance.toFixed(2)}€`, margin, yPos); yPos+=15;

  const colW = [70, 40, 40, 40];
  const rh = 10;
  const tx = margin;
  const ty = yPos;

  const hdrs = ["Propietario", "Adeudado (€)", "Pagado (€)", "Debe (€)"];
  doc.setFontSize(10).setFont(undefined, 'bold');
  hdrs.forEach((h, i) => {
    doc.text(h, tx + 2 + colW.slice(0,i).reduce((a,b)=>a+b,0), ty + rh/2 + 3);
  });
  doc.setFont(undefined, 'normal');

  const rows = residents.map(res => {
    const due = calculateTotalDue(res);
    const paid = payments.filter(p=>p.resident.name===res.name).reduce((s,p)=>s+p.amount,0);
    const rem = Math.max(0, due - paid);
    return [
      res.name,
      due.toFixed(2) + '€',
      paid.toFixed(2) + '€',
      rem.toFixed(2) + '€'
    ];
  });
  const sums = rows.reduce((acc,row) => {
    acc.due += parseFloat(row[1]);
    acc.paid += parseFloat(row[2]);
    acc.rem += parseFloat(row[3]);
    return acc;
  }, { due:0, paid:0, rem:0 });
  rows.push([
    "TOTAL",
    sums.due.toFixed(2) + '€',
    sums.paid.toFixed(2) + '€',
    sums.rem.toFixed(2) + '€'
  ]);

  rows.forEach((row,i) => {
    const yCell = ty + (i+1)*rh + rh/2 + 3;
    row.forEach((cell,j)=>{
      if(i===rows.length-1) doc.setFont(undefined,'bold');
      doc.text(cell, tx + 2 + colW.slice(0,j).reduce((a,b)=>a+b,0), yCell);
      if(i===rows.length-1) doc.setFont(undefined,'normal');
    });
  });

  const tRows = rows.length + 1;
  const tH = tRows * rh;
  const tW = colW.reduce((a,b)=>a+b,0);
  for(let i=0;i<=tRows;i++){
    const yL = ty + i*rh;
    doc.line(tx, yL, tx+tW, yL);
  }
  let xL = tx;
  for(let i=0;i<=colW.length;i++){
    doc.line(xL, ty, xL, ty+tH);
    if(i<colW.length) xL += colW[i];
  }

  doc.save(`ReporteGeneral_${new Date().toLocaleDateString().replace(/\//g,'-')}.pdf`);
}

// —––– EVENTOS —––––––––––––––––––––––––––––––––––––––––––––––––––
document.getElementById('expenseForm').addEventListener('submit', addExpense);
document.getElementById('btnRegisterPayment').addEventListener('click', registerPayment);
document.getElementById('btnGenerateGeneralReport').addEventListener('click', generateGeneralReport);
document.getElementById('btnClearData').addEventListener('click', () => clearAllData(true));
document.addEventListener('DOMContentLoaded', initApp);