<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../db/config.php';
error_reporting(0);

try {
    if (empty($_GET['user_id'])) {
        http_response_code(400);
        throw new Exception('ID utilisateur requis');
    }

    $userId = (int)$_GET['user_id'];
    $filter = $_GET['filter'] ?? 'all';

    // Récupérer les informations de l'utilisateur
    $stmt = $pdo->prepare("SELECT username, solde FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        throw new Exception('Utilisateur non trouvé');
    }

    // Toutes les transactions (pour le solde global)
    $stmtAll = $pdo->prepare("SELECT motif, type, montant, made_at FROM transactions WHERE user_id = ?");
    $stmtAll->execute([$userId]);
    $allTransactions = $stmtAll->fetchAll(PDO::FETCH_ASSOC);

    // Transactions filtrées (pour affichage)
    // Modifiez la requête SQL pour marquer les transferts
$sql = "SELECT motif, 
               CASE 
                   WHEN type = 'transfert_out' THEN 'depense'
                   WHEN type = 'transfert_in' THEN 'revenu'
                   ELSE type
               END as type,
               montant, 
               made_at 
        FROM transactions 
        WHERE user_id = ?";
    $params = [$userId];
    if ($filter !== 'all') {
        $sql .= " AND type = ?";
        $params[] = $filter;
    }
    $stmtFiltered = $pdo->prepare($sql);
    $stmtFiltered->execute($params);
    $filteredTransactions = $stmtFiltered->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'username' => $user['username'],
        'solde_base' => (float)$user['solde'],
        'all_transactions' => $allTransactions,
        'filtered_transactions' => $filteredTransactions
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
