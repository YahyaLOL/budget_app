document.addEventListener("DOMContentLoaded", async () => {
    const soldeEl        = document.getElementById('solde');
    const listEl         = document.getElementById('transaction-list');
    const filterTypeEl   = document.getElementById('filter-type');
    const usernameEl     = document.getElementById('username');
    const totalDepEl     = document.getElementById('total-depenses');
    const totalRevEl     = document.getElementById('total-revenus');

    const recipientInput  = document.getElementById('recipient');
    const amountInput     = document.getElementById('transfer-amount');
    const motifInput      = document.getElementById('transfer-motif'); // champ facultatif pour motif
    const transferBtn     = document.getElementById('transfer-btn');
    const transferMessage = document.getElementById('transfer-message');

    const userId = sessionStorage.getItem('user_id');
    if (!userId) {
        window.location.href = 'index.html';
        return;
    }

    let allTransactions = [];
    let soldeBase = 0;

    async function loadDashboard(filter = 'all') {
        try {
            listEl.innerHTML = '<li class="loading">Chargement...</li>';

            const res = await fetch(`api/dashboard.php?user_id=${userId}&filter=${filter}`);
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Erreur inconnue');

            usernameEl.textContent = sanitize(data.username);
            soldeBase = parseFloat(data.solde_base) || 0;
            allTransactions = data.all_transactions;

            updateSummary(allTransactions);
            updateTransactionList(data.filtered_transactions);
            clearTransferMessage();
        } catch (err) {
            console.error(err);
            listEl.innerHTML = `<li class="error">Erreur: ${sanitize(err.message)}</li>`;
        }
    }

    function updateSummary(transactions) {
    let revenus = 0;
    let depenses = 0;

    transactions.forEach(t => {
        const montant = parseFloat(t.montant);
        
        if (t.type === 'revenu' || (t.motif && t.motif.includes('Transfert de'))) {
            revenus += montant;
        }
        if (t.type === 'depense' || (t.motif && t.motif.includes('Transfert à'))) {
            depenses += montant;
        }
    });

    soldeEl.textContent = `${soldeBase.toFixed(2)} €`;
    totalDepEl.textContent = `${depenses.toFixed(2)} €`;
    totalRevEl.textContent = `${revenus.toFixed(2)} €`;
}

    function updateTransactionList(transactions) {
    if (!transactions || transactions.length === 0) {
        listEl.innerHTML = '<li class="empty">Aucune transaction trouvée</li>';
        return;
    }

    listEl.innerHTML = '';
    transactions.forEach(t => {
        const montant = parseFloat(t.montant);
        const li = document.createElement('li');
        
        // Détermine la classe CSS en fonction du type de transaction
        if (t.motif.includes('Transfert à')) {
            li.className = 'transfert-out';
        } else if (t.motif.includes('Transfert de')) {
            li.className = 'transfert-in';
        } else {
            li.className = t.type;
        }
        
        li.innerHTML = `
            <div class="transaction-details">
                <span class="motif">${sanitize(t.motif)}</span>
                <span class="date">${formatDate(t.made_at)}</span>
            </div>
            <span class="montant">${montant.toFixed(2)} €</span>
        `;
        listEl.appendChild(li);
    });
}
    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('fr-FR');
    }

    function sanitize(str) {
        return str.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function showTransferMessage(text, type) {
    // Créer la notification si elle n'existe pas
    let notification = document.querySelector('.notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.className = 'notification';
        document.body.appendChild(notification);
    }

    // Configurer la notification
    notification.textContent = text;
    notification.style.backgroundColor = type === 'success' ? '#2ecc71' : '#e74c3c';
    
    // Afficher la notification
    notification.classList.remove('hide');
    notification.classList.add('show');

    // Masquer après 5 secondes
    setTimeout(() => {
        notification.classList.remove('show');
        notification.classList.add('hide');
        
        // Optionnel: supprimer l'élément après l'animation
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

    function clearTransferMessage() {
        transferMessage.textContent = '';
        transferMessage.className = 'message';
        transferMessage.style.display = 'none';
    }

    transferBtn.addEventListener('click', async () => {
        clearTransferMessage();

        const recipientUsername = recipientInput.value.trim();
        const amount = parseFloat(amountInput.value);
        const motif = motifInput ? motifInput.value.trim() : '';
        const motifToSend = motif || `Transfert à ${recipientUsername}`;

        if (!recipientUsername || isNaN(amount) || amount <= 0) {
            showTransferMessage('Veuillez remplir le destinataire et un montant valide.', 'error');
            return;
        }

        const soldeActuel = parseFloat(soldeEl.textContent.replace(' €', '')) || 0;
        if (soldeActuel < 0) {
            showTransferMessage('Impossible : vous avez déjà un solde négatif.', 'error');
            return;
        }
        if (amount > soldeActuel) {
            showTransferMessage('Montant supérieur à votre solde actuel.', 'error');
            return;
        }

        transferBtn.disabled = true;
        transferBtn.textContent = 'Transfert en cours...';

        try {
            const response = await fetch('api/transfer.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sender_id: userId,
                    receiver_username: recipientUsername,
                    amount: amount,
                    motif: motifToSend
                })
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.error || 'Erreur inconnue');

            showTransferMessage('Transfert effectué avec succès.', 'success');
            loadDashboard(filterTypeEl.value);
            recipientInput.value = '';
            amountInput.value = '';
            if (motifInput) motifInput.value = '';

        } catch (err) {
            console.error(err);
            showTransferMessage(err.message, 'error');
        } finally {
            transferBtn.disabled = false;
            transferBtn.textContent = 'Transférer';
        }
    });

    filterTypeEl.addEventListener('change', () => {
        loadDashboard(filterTypeEl.value);
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        sessionStorage.clear();
        localStorage.clear();
        window.location.href = 'index.html';
    });

    loadDashboard();
});
