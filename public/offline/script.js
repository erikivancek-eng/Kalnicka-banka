/**
 * Kalnička Banka - Sustav Mobilnog i Internetskog Bankarstva
 * Autori i prava: © 2026 Kalnička Banka d.d.
 */

// 1. CONSTANTS & USER DATABASE
const LOGINS = {
    admin: "kalnicka123",
    erik: "1909",
    nera: "1167",
    vito: "2507"
};

const DISPLAY_NAMES = {
    admin: "Bankar (Admin)",
    erik: "Erik",
    nera: "Nera",
    vito: "Vito"
};

const AVATARS = {
    erik: "👨‍💻",
    nera: "👩‍🎨",
    vito: "🚀"
};

// 2. STATE MANAGEMENT
let state = {
    balances: {
        erik: 50000,
        nera: 50000,
        vito: 50000
    },
    history: [],
    currentUser: null,
    currentRole: null, // 'admin' | 'player'
    txSelectedPlayer: null, // 'erik' | 'nera' | 'vito'
    txSelectedType: null, // 'add' | 'subtract'
    historyFilter: 'all', // 'all' | 'erik' | 'nera' | 'vito'
    p2pSelectedRecipient: null
};

// 3. DOM ELEMENTS
const loginScreen = document.getElementById('login-screen');
const appView = document.getElementById('app-view');
const loginForm = document.getElementById('login-form');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('login-error');

const headerUserDisplay = document.getElementById('header-user-display');
const headerRoleBadge = document.getElementById('header-role-badge');
const playerWelcomeBanner = document.getElementById('player-welcome-banner');

const adminView = document.getElementById('admin-view');
const playerView = document.getElementById('player-view');

// Transaction Form Elements
const transactionForm = document.getElementById('transaction-form');
const txPlayerInput = document.getElementById('tx-player');
const txTypeInput = document.getElementById('tx-type');
const txAmountInput = document.getElementById('tx-amount');
const txDescInput = document.getElementById('tx-desc');
const txError = document.getElementById('tx-error');
const txErrorMsg = document.getElementById('tx-error-msg');

// Admin stats
const adminTotalVault = document.getElementById('admin-total-vault');

// Player Card Elements
const playerCardName = document.getElementById('player-card-name');
const playerAvatar = document.getElementById('player-avatar');
const playerIban = document.getElementById('player-iban');
const playerBalanceValue = document.getElementById('player-balance-value');
const playerPersonalCard = document.getElementById('player-personal-card');

// P2P Elements
const p2pForm = document.getElementById('p2p-form');
const p2pAmountInput = document.getElementById('p2p-amount');
const p2pDescInput = document.getElementById('p2p-desc');
const p2pError = document.getElementById('p2p-error');
const p2pErrorText = document.getElementById('p2p-error-text');
const p2pLimitRemaining = document.getElementById('p2p-limit-remaining');
const p2pLimitBar = document.getElementById('p2p-limit-bar');

// Modals & Toast
const resetModal = document.getElementById('reset-modal');
const resetModalCard = document.getElementById('reset-modal-card');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toast-msg');
const toastIconBg = document.getElementById('toast-icon-bg');

// 4. UTILITY FUNCTIONS

// Format numbers as currency with Croatian locale formatting (e.g., 50.000)
function formatMoney(amount) {
    return Number(amount).toLocaleString('hr-HR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    });
}

// Get current date and time in Croatian format: DD.MM.YYYY HH:MM
function getCurrentFormattedTime() {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

// Save data to localStorage
function saveToLocalStorage() {
    localStorage.setItem('kalnicka_bank_balances', JSON.stringify(state.balances));
    localStorage.setItem('kalnicka_bank_history', JSON.stringify(state.history));
}

// Load data from localStorage
function loadFromLocalStorage() {
    const savedBalances = localStorage.getItem('kalnicka_bank_balances');
    const savedHistory = localStorage.getItem('kalnicka_bank_history');
    
    if (savedBalances) {
        state.balances = JSON.parse(savedBalances);
    }
    if (savedHistory) {
        state.history = JSON.parse(savedHistory);
    }
}

// Show toast notification
function showToast(message, isSuccess = true) {
    toastMsg.textContent = message;
    if (isSuccess) {
        toastIconBg.innerHTML = "✅";
        toastIconBg.className = "w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-500 text-white shadow";
    } else {
        toastIconBg.innerHTML = "❌";
        toastIconBg.className = "w-8 h-8 rounded-lg flex items-center justify-center bg-rose-500 text-white shadow";
    }
    
    // Animate toast in
    toast.classList.remove('translate-y-20', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
    
    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove('translate-y-0', 'opacity-100');
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}

// 5. AUTHENTICATION & LOGIN FLOW

loginForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const username = usernameInput.value.trim().toLowerCase();
    const password = passwordInput.value;
    
    if (LOGINS[username] && LOGINS[username] === password) {
        // Success
        state.currentUser = username;
        state.currentRole = (username === 'admin') ? 'admin' : 'player';
        
        loginError.classList.add('hidden');
        sessionStorage.setItem('kalnicka_session_user', username);
        
        enterDashboard();
        showToast(`Uspješna prijava. Dobrodošli natrag, ${DISPLAY_NAMES[username]}!`);
    } else {
        // Error
        loginError.classList.remove('hidden');
        // Shake animation
        loginForm.classList.add('animate-pulse');
        setTimeout(() => loginForm.classList.remove('animate-pulse'), 500);
    }
});

function enterDashboard() {
    loginScreen.classList.add('hidden');
    appView.classList.remove('hidden');
    appView.classList.add('flex');
    
    // Set Header Info
    headerUserDisplay.textContent = DISPLAY_NAMES[state.currentUser];
    
    if (state.currentRole === 'admin') {
        headerRoleBadge.textContent = "Bankar";
        headerRoleBadge.className = "px-1.5 py-0.5 text-[9px] font-bold rounded uppercase bg-amber-100 text-amber-800 border border-amber-200";
        playerWelcomeBanner.classList.add('hidden');
        
        adminView.classList.remove('hidden');
        playerView.classList.add('hidden');
        
        // Render Admin Screen
        renderBalances();
        renderHistory();
    } else {
        headerRoleBadge.textContent = "Klijent";
        headerRoleBadge.className = "px-1.5 py-0.5 text-[9px] font-bold rounded uppercase bg-blue-100 text-blue-800 border border-blue-200";
        playerWelcomeBanner.classList.remove('hidden');
        
        adminView.classList.add('hidden');
        playerView.classList.remove('hidden');
        
        // Render Player Screen
        setupPlayerCard();
        renderBalances();
        renderHistory();
        updateP2pUI();
    }
    
    // Re-create icons to apply styling
    lucide.createIcons();
}

window.logout = function() {
    state.currentUser = null;
    state.currentRole = null;
    sessionStorage.removeItem('kalnicka_session_user');
    
    // Reset Form fields
    loginForm.reset();
    
    // UI toggle
    appView.classList.add('hidden');
    appView.classList.remove('flex');
    loginScreen.classList.remove('hidden');
    
    showToast("Odjavljeni ste iz sustava.", true);
};

// 6. PLAYER-SPECIFIC SETUP
function setupPlayerCard() {
    const user = state.currentUser;
    playerCardName.textContent = DISPLAY_NAMES[user];
    playerAvatar.textContent = AVATARS[user] || "💳";
    
    // Custom credit card look
    playerPersonalCard.className = "rounded-2xl shadow-xl text-white p-8 relative overflow-hidden transform transition-all duration-300 border bg-" + user;
    
    // IBAN string based on name
    if (user === 'erik') {
        playerIban.textContent = "HR93 2500 0001 ERIK";
    } else if (user === 'nera') {
        playerIban.textContent = "HR93 2500 0002 NERA";
    } else if (user === 'vito') {
        playerIban.textContent = "HR93 2500 0003 VITO";
    }
}

// 7. RENDERING BALANCE AND STATS
function renderBalances() {
    // Admin balances updating
    const erikBal = document.getElementById('admin-balance-erik');
    const neraBal = document.getElementById('admin-balance-nera');
    const vitoBal = document.getElementById('admin-balance-vito');
    
    if (erikBal) erikBal.textContent = formatMoney(state.balances.erik);
    if (neraBal) neraBal.textContent = formatMoney(state.balances.nera);
    if (vitoBal) vitoBal.textContent = formatMoney(state.balances.vito);
    
    // Total treasury state
    const totalVaultVal = state.balances.erik + state.balances.nera + state.balances.vito;
    if (adminTotalVault) adminTotalVault.textContent = `Ukupno u trezoru: ${formatMoney(totalVaultVal)} €`;
    
    // Personal dashboard balance
    if (state.currentUser && state.currentRole === 'player') {
        if (playerBalanceValue) {
            playerBalanceValue.textContent = formatMoney(state.balances[state.currentUser]);
        }
    }
}

// 8. ADMIN TRANSACTION SUBMISSION
window.selectTxPlayer = function(player) {
    state.txSelectedPlayer = player;
    txPlayerInput.value = player;
    txError.classList.add('hidden');
    
    // Update button visual states
    ['erik', 'nera', 'vito'].forEach(p => {
        const btn = document.getElementById(`tx-btn-${p}`);
        if (p === player) {
            btn.classList.add('btn-select-active');
        } else {
            btn.classList.remove('btn-select-active');
        }
    });
};

window.selectTxType = function(type) {
    state.txSelectedType = type;
    txTypeInput.value = type;
    txError.classList.add('hidden');
    
    const addBtn = document.getElementById('tx-type-add');
    const subBtn = document.getElementById('tx-type-subtract');
    
    if (type === 'add') {
        addBtn.classList.add('btn-type-active-add');
        subBtn.classList.remove('btn-type-active-subtract');
    } else if (type === 'subtract') {
        subBtn.classList.add('btn-type-active-subtract');
        addBtn.classList.remove('btn-type-active-add');
    }
};

window.adjustAmount = function(value) {
    let currentVal = parseFloat(txAmountInput.value) || 0;
    txAmountInput.value = currentVal + value;
    txError.classList.add('hidden');
};

window.setPresetDesc = function(desc) {
    txDescInput.value = desc;
    txError.classList.add('hidden');
};

transactionForm.addEventListener('submit', function(e) {
    e.preventDefault();
    txError.classList.add('hidden');
    
    const player = txPlayerInput.value;
    const type = txTypeInput.value;
    const amount = parseFloat(txAmountInput.value);
    const desc = txDescInput.value.trim() || "Transakcija";
    
    // Validations
    if (!player) {
        showTxError("Molimo odaberite klijenta (Erik, Nera ili Vito).");
        return;
    }
    if (!type) {
        showTxError("Molimo odaberite vrstu transakcije (Dodaj ili Oduzmi).");
        return;
    }
    if (isNaN(amount) || amount <= 0) {
        showTxError("Unesite valjan iznos veći od nule.");
        return;
    }
    
    const currentBalance = state.balances[player];
    
    if (type === 'subtract' && currentBalance - amount < 0) {
        showTxError(`Nedovoljno sredstava na računu! Stanje računa ne smije biti negativno. (Trenutno: ${formatMoney(currentBalance)} €)`);
        return;
    }
    
    // Apply changes
    if (type === 'add') {
        state.balances[player] += amount;
    } else {
        state.balances[player] -= amount;
    }
    
    // Record Transaction History
    const txObj = {
        id: 'tx_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
        timestamp: getCurrentFormattedTime(),
        player: player,
        amount: amount,
        type: type,
        description: desc
    };
    
    state.history.unshift(txObj); // Add to beginning of array
    
    // Save, update UI
    saveToLocalStorage();
    renderBalances();
    renderHistory();
    showToast(`Transakcija izvršena! ${DISPLAY_NAMES[player]} primio/la promjenu stanja.`);
    
    // Clear transaction input fields
    txAmountInput.value = '';
    txDescInput.value = '';
    
    // Clear selections visually
    state.txSelectedPlayer = null;
    state.txSelectedType = null;
    txPlayerInput.value = '';
    txTypeInput.value = '';
    
    ['erik', 'nera', 'vito'].forEach(p => {
        document.getElementById(`tx-btn-${p}`).classList.remove('btn-select-active');
    });
    document.getElementById('tx-type-add').classList.remove('btn-type-active-add');
    document.getElementById('tx-type-subtract').classList.remove('btn-type-active-subtract');
});

function showTxError(msg) {
    txErrorMsg.textContent = msg;
    txError.classList.remove('hidden');
    txError.classList.add('animate-pulse');
    setTimeout(() => txError.classList.remove('animate-pulse'), 500);
}

// 9. RENDERING HISTORY
window.filterHistory = function(player) {
    state.historyFilter = player;
    
    // Update active button
    ['all', 'erik', 'nera', 'vito'].forEach(f => {
        const btn = document.getElementById(`filter-${f}`);
        if (btn) {
            if (f === player) {
                btn.className = "py-1 px-3 bg-brand-600 text-white text-xs font-semibold rounded-full shadow transition-all cursor-pointer";
            } else {
                btn.className = "py-1 px-3 bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-semibold rounded-full transition-all cursor-pointer";
            }
        }
    });
    
    renderHistory();
};

function renderHistory() {
    if (state.currentRole === 'admin') {
        const adminHistoryList = document.getElementById('admin-history-list');
        adminHistoryList.innerHTML = '';
        
        let filteredHistory = state.history;
        if (state.historyFilter !== 'all') {
            filteredHistory = state.history.filter(tx => tx.player === state.historyFilter);
        }
        
        if (filteredHistory.length === 0) {
            adminHistoryList.innerHTML = `
                <div class="p-8 text-center text-slate-400 text-xs">
                    <i data-lucide="info" class="w-8 h-8 mx-auto text-slate-300 mb-2"></i>
                    Nema zabilježenih transakcija za odabranog klijenta.
                </div>
            `;
            lucide.createIcons();
            return;
        }
        
        filteredHistory.forEach(tx => {
            const item = document.createElement('div');
            item.className = "p-4 hover:bg-slate-50 flex items-start justify-between gap-4 transition-all";
            
            const isAdd = tx.type === 'add';
            const iconColorClass = isAdd ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50';
            const iconName = isAdd ? 'arrow-up-right' : 'arrow-down-left';
            
            item.innerHTML = `
                <div class="flex items-start gap-3">
                    <div class="w-9 h-9 rounded-xl ${iconColorClass} flex items-center justify-center flex-shrink-0">
                        <i data-lucide="${iconName}" class="w-4.5 h-4.5"></i>
                    </div>
                    <div>
                        <p class="text-xs font-bold text-slate-700">Promjena stanja za: <span class="text-brand-700">${DISPLAY_NAMES[tx.player]}</span></p>
                        <p class="text-[11px] font-medium text-slate-400 mt-0.5">${tx.timestamp}</p>
                        <p class="text-xs font-semibold text-slate-500 mt-1 bg-slate-50 border border-slate-100 py-1 px-2.5 rounded-lg inline-block">Opis: <span class="text-slate-700">${tx.description}</span></p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm font-extrabold ${isAdd ? 'text-emerald-600' : 'text-rose-600'}">
                        ${isAdd ? '+' : '-'}${formatMoney(tx.amount)} €
                    </p>
                </div>
            `;
            
            adminHistoryList.appendChild(item);
        });
    } else {
        // Player viewing their own history
        const playerHistoryList = document.getElementById('player-history-list');
        const playerHistoryCount = document.getElementById('player-history-count');
        playerHistoryList.innerHTML = '';
        
        const myHistory = state.history.filter(tx => tx.player === state.currentUser);
        playerHistoryCount.textContent = `Ukupno: ${myHistory.length}`;
        
        if (myHistory.length === 0) {
            playerHistoryList.innerHTML = `
                <div class="p-8 text-center text-slate-400 text-xs">
                    <i data-lucide="info" class="w-8 h-8 mx-auto text-slate-300 mb-2"></i>
                    Nema zabilježenih transakcija na vašem računu.
                </div>
            `;
            lucide.createIcons();
            return;
        }
        
        myHistory.forEach(tx => {
            const item = document.createElement('div');
            item.className = "p-4 hover:bg-slate-50 flex items-start justify-between gap-4 transition-all";
            
            const isAdd = tx.type === 'add';
            const iconColorClass = isAdd ? 'text-emerald-500 bg-emerald-50' : 'text-rose-500 bg-rose-50';
            const iconName = isAdd ? 'arrow-up-right' : 'arrow-down-left';
            
            item.innerHTML = `
                <div class="flex items-start gap-3">
                    <div class="w-9 h-9 rounded-xl ${iconColorClass} flex items-center justify-center flex-shrink-0">
                        <i data-lucide="${iconName}" class="w-4.5 h-4.5"></i>
                    </div>
                    <div>
                        <p class="text-xs font-bold text-slate-700">${isAdd ? 'Uplata na račun' : 'Isplata s računa'}</p>
                        <p class="text-[11px] font-medium text-slate-400 mt-0.5">${tx.timestamp}</p>
                        <p class="text-xs font-semibold text-slate-500 mt-1 bg-slate-50 border border-slate-100 py-1 px-2.5 rounded-lg inline-block">Opis: <span class="text-slate-700">${tx.description}</span></p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-sm font-extrabold ${isAdd ? 'text-emerald-600' : 'text-rose-600'}">
                        ${isAdd ? '+' : '-'}${formatMoney(tx.amount)} €
                    </p>
                </div>
            `;
            
            playerHistoryList.appendChild(item);
        });
    }
    
    lucide.createIcons();
}

// 10. SYSTEM RESET
window.confirmReset = function() {
    resetModal.classList.remove('hidden');
    resetModal.classList.add('flex');
    setTimeout(() => {
        resetModalCard.classList.add('modal-show');
    }, 10);
};

window.closeResetModal = function() {
    resetModalCard.classList.remove('modal-show');
    setTimeout(() => {
        resetModal.classList.add('hidden');
        resetModal.classList.remove('flex');
    }, 300);
};

window.executeReset = function() {
    state.balances = {
        erik: 50000,
        nera: 50000,
        vito: 50000
    };
    state.history = [];
    
    saveToLocalStorage();
    renderBalances();
    renderHistory();
    closeResetModal();
    showToast("Kalnička Banka je uspješno resetirana na početne postavke!", true);
};

// 11. MANUAL SAVE, EXPORT & IMPORT BACKUP

window.saveData = function(showFeedback = true) {
    saveToLocalStorage();
    if (showFeedback) {
        showToast("Podaci su uspješno spremljeni u lokalnu pohranu preglednika!", true);
    }
};

window.exportData = function() {
    const backupData = {
        bankName: "Kalnička Banka",
        exportTimestamp: getCurrentFormattedTime(),
        balances: state.balances,
        history: state.history
    };
    
    const jsonString = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement("a");
    a.href = url;
    a.download = `Kalnicka_Banka_Sigurnosna_Kopija_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Sigurnosna kopija uspješno izvezena!");
};

window.importData = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            
            // Validation of schema
            if (imported.balances && typeof imported.balances.erik === 'number' && typeof imported.balances.nera === 'number' && typeof imported.balances.vito === 'number') {
                state.balances = {
                    erik: Math.max(0, imported.balances.erik),
                    nera: Math.max(0, imported.balances.nera),
                    vito: Math.max(0, imported.balances.vito)
                };
                
                if (Array.isArray(imported.history)) {
                    state.history = imported.history;
                } else {
                    state.history = [];
                }
                
                saveToLocalStorage();
                renderBalances();
                renderHistory();
                showToast("Sigurnosna kopija je uspješno uvezena i primijenjena!", true);
            } else {
                showToast("Neispravan format sigurnosne kopije. Provjerite datoteku.", false);
            }
        } catch (err) {
            showToast("Greška pri čitanju JSON datoteke.", false);
        }
        
        // Reset file input value to allow importing same file again if edited
        event.target.value = '';
    };
    reader.readAsText(file);
};

// 12. OFFLINE ZIP DOWNLOAD
// Since we are running in browser context, downloading the offline package ZIP
// from here generates it dynamically by reading or carrying the strings of index.html, style.css, and script.js.
// When called from the web version, it packs the offline files and downloads them!
window.downloadOfflineZIP = async function() {
    showToast("Pakiranje i priprema ZIP datoteke...", true);
    
    try {
        const zip = new JSZip();
        
        // Fetch offline files if hosted, or use pre-populated strings.
        // In AI Studio environment we can fetch the local workspace routes, or we can just package them from our asset variables.
        // Let's attempt to fetch them directly from our server or create them. Because we are in AI Studio container,
        // we can fetch the files /offline/index.html etc, or if this script is executed in the developer browser,
        // fetching from relative paths '/offline/index.html' works perfectly!
        
        const resHtml = await fetch('/offline/index.html');
        const textHtml = await resHtml.text();
        
        const resCss = await fetch('/offline/style.css');
        const textCss = await resCss.text();
        
        const resJs = await fetch('/offline/script.js');
        const textJs = await resJs.text();
        
        zip.file("index.html", textHtml);
        zip.file("style.css", textCss);
        zip.file("script.js", textJs);
        
        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        
        const a = document.createElement("a");
        a.href = url;
        a.download = "Kalnicka_Banka_Projekt.zip";
        document.body.appendChild(a);
        a.click();
        
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast("Projekt je spreman! Preuzimanje započeto.", true);
    } catch (err) {
        console.error(err);
        showToast("Greška prilikom preuzimanja ZIP-a. Pokušajte izbornik u AI Studio.", false);
    }
};

// P2P MONEY TRANSFER IMPLEMENTATION
window.selectP2pRecipient = function(player) {
    state.p2pSelectedRecipient = player;
    p2pError.classList.add('hidden');
    
    // Highlight selected button, hide others if they are the logged in user
    ['erik', 'nera', 'vito'].forEach(p => {
        const btn = document.getElementById(`p2p-btn-${p}`);
        if (!btn) return;
        
        if (p === player) {
            btn.className = "flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer bg-brand-600 hover:bg-brand-500 text-white border-brand-700 shadow-md";
        } else {
            btn.className = "flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200";
        }
    });
};

function updateP2pUI() {
    state.p2pSelectedRecipient = null;
    p2pForm.reset();
    p2pError.classList.add('hidden');
    
    const user = state.currentUser;
    if (!user || state.currentRole !== 'player') return;
    
    // Hide or show recipient buttons: you can't send money to yourself!
    ['erik', 'nera', 'vito'].forEach(p => {
        const btn = document.getElementById(`p2p-btn-${p}`);
        if (!btn) return;
        
        if (p === user) {
            btn.classList.add('hidden');
        } else {
            btn.classList.remove('hidden');
            btn.className = "flex items-center gap-2 p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200";
        }
    });
    
    // Compute daily sent total
    const todayPrefix = (() => {
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = now.getFullYear();
        return `${d}.${m}.${y}`;
    })();
    
    const dailySent = state.history
        .filter(tx => {
            const isSender = tx.player === user;
            const isSubtract = tx.type === 'subtract';
            const isToday = tx.timestamp.startsWith(todayPrefix);
            const isP2p = tx.isP2P || tx.description.startsWith('Prijenos za ');
            return isSender && isSubtract && isToday && isP2p;
        })
        .reduce((sum, tx) => sum + tx.amount, 0);
        
    const remaining = 5000 - dailySent;
    p2pLimitRemaining.textContent = `${formatMoney(Math.max(0, remaining))} €`;
    
    const percent = Math.min(100, (dailySent / 5000) * 100);
    p2pLimitBar.style.width = `${percent}%`;
}

window.submitP2pTransfer = function(e) {
    if (e) e.preventDefault();
    p2pError.classList.add('hidden');
    
    const user = state.currentUser;
    const recipient = state.p2pSelectedRecipient;
    const amount = parseFloat(p2pAmountInput.value);
    const desc = p2pDescInput.value.trim();
    
    if (!user || state.currentRole !== 'player') {
        showP2pError('Morate biti prijavljeni kao igrač.');
        return;
    }
    
    if (!recipient) {
        showP2pError('Molimo odaberite primatelja.');
        return;
    }
    
    if (recipient === user) {
        showP2pError('Ne možete poslati novac samom sebi.');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        showP2pError('Unesite valjan iznos veći od nule.');
        return;
    }
    
    const senderBalance = state.balances[user];
    if (senderBalance - amount < 0) {
        showP2pError(`Nedovoljno sredstava! Vaše stanje je ${formatMoney(senderBalance)} €.`);
        return;
    }
    
    // Check limit
    const todayPrefix = (() => {
        const now = new Date();
        const d = String(now.getDate()).padStart(2, '0');
        const m = String(now.getMonth() + 1).padStart(2, '0');
        const y = now.getFullYear();
        return `${d}.${m}.${y}`;
    })();
    
    const dailySent = state.history
        .filter(tx => {
            const isSender = tx.player === user;
            const isSubtract = tx.type === 'subtract';
            const isToday = tx.timestamp.startsWith(todayPrefix);
            const isP2p = tx.isP2P || tx.description.startsWith('Prijenos za ');
            return isSender && isSubtract && isToday && isP2p;
        })
        .reduce((sum, tx) => sum + tx.amount, 0);
        
    if (dailySent + amount > 5000) {
        const remaining = 5000 - dailySent;
        showP2pError(`Dnevni limit je 5.000 €! Danas možete poslati još najviše ${formatMoney(Math.max(0, remaining))} €.`);
        return;
    }
    
    // Perform transfer
    state.balances[user] -= amount;
    state.balances[recipient] += amount;
    
    const timestamp = getCurrentFormattedTime();
    
    const senderTxDesc = desc 
        ? `Prijenos za ${DISPLAY_NAMES[recipient]} (${desc})`
        : `Prijenos za ${DISPLAY_NAMES[recipient]}`;
        
    const receiverTxDesc = desc
        ? `Prijenos od ${DISPLAY_NAMES[user]} (${desc})`
        : `Prijenos od ${DISPLAY_NAMES[user]}`;
        
    const senderTx = {
        id: `tx_${Date.now()}_send_${Math.floor(Math.random() * 1000)}`,
        timestamp: timestamp,
        player: user,
        amount: amount,
        type: 'subtract',
        description: senderTxDesc,
        isP2P: true
    };
    
    const receiverTx = {
        id: `tx_${Date.now()}_recv_${Math.floor(Math.random() * 1000)}`,
        timestamp: timestamp,
        player: recipient,
        amount: amount,
        type: 'add',
        description: receiverTxDesc,
        isP2P: true
    };
    
    state.history.unshift(senderTx, receiverTx);
    
    saveToLocalStorage();
    renderBalances();
    renderHistory();
    updateP2pUI();
    
    showToast(`Uspješno ste poslali ${formatMoney(amount)} € korisniku ${DISPLAY_NAMES[recipient]}!`, true);
};

function showP2pError(msg) {
    p2pErrorText.textContent = msg;
    p2pError.classList.remove('hidden');
}

// 13. INITIALIZATION ON LOAD
function initApp() {
    loadFromLocalStorage();
    
    // Check if session exists in sessionStorage (keeps logged in on refresh)
    const savedSessionUser = sessionStorage.getItem('kalnicka_session_user');
    if (savedSessionUser && LOGINS[savedSessionUser]) {
        state.currentUser = savedSessionUser;
        state.currentRole = (savedSessionUser === 'admin') ? 'admin' : 'player';
        enterDashboard();
    } else {
        // Render login page
        loginScreen.classList.remove('hidden');
        appView.classList.add('hidden');
    }
    
    lucide.createIcons();
}

// Start the application
document.addEventListener('DOMContentLoaded', initApp);
window.addEventListener('load', () => {
    // Fallback trigger in case DOMContentLoaded was already fired
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initApp();
    }
});
