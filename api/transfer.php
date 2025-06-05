<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../db/config.php';

// Désactiver l'affichage des erreurs HTML
ini_set('display_errors', 0);
error_reporting(0);

try {
    $input = file_get_contents('php://input');
    if (empty($input)) {
        throw new Exception("Données manquantes");
    }

    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("JSON invalide");
    }

    // Validation des données
    $required = ['sender_id', 'receiver_username', 'amount'];
    foreach ($required as $field) {
        if (!isset($data[$field])) {
            throw new Exception("Champ $field manquant");
        }
    }

    $sender_id = (int)$data['sender_id'];
    $receiver_username = trim($data['receiver_username']);
    $amount = (float)$data['amount'];
    $motif = $data['motif'] ?? 'Transfert';

    if ($amount <= 0) {
        throw new Exception("Montant doit être positif");
    }

    $pdo->beginTransaction();

    // Vérification expéditeur
    $stmt = $pdo->prepare("SELECT id, username, solde FROM users WHERE id = ? FOR UPDATE");
    $stmt->execute([$sender_id]);
    $sender = $stmt->fetch();

    if (!$sender) {
        throw new Exception("Expéditeur introuvable");
    }

    // Vérification destinataire
    $stmt = $pdo->prepare("SELECT id, username FROM users WHERE username = ? FOR UPDATE");
    $stmt->execute([$receiver_username]);
    $receiver = $stmt->fetch();

    if (!$receiver) {
        throw new Exception("Destinataire introuvable");
    }

    // Vérification solde
    if ($sender['solde'] < $amount) {
        throw new Exception("Solde insuffisant");
    }

    // Mise à jour des soldes
    $pdo->prepare("UPDATE users SET solde = solde - ? WHERE id = ?")
        ->execute([$amount, $sender_id]);
    $pdo->prepare("UPDATE users SET solde = solde + ? WHERE id = ?")
        ->execute([$amount, $receiver['id']]);

   // Modification des requêtes d'insertion
$pdo->prepare("INSERT INTO transactions (user_id, motif, montant, type) VALUES (?, ?, ?, 'depense')")
    ->execute([$sender_id, "Transfert à {$receiver['username']}: $motif", $amount]);

$pdo->prepare("INSERT INTO transactions (user_id, motif, montant, type) VALUES (?, ?, ?, 'revenu')")
    ->execute([$receiver['id'], "Transfert de {$sender['username']}: $motif", $amount]);

    $pdo->commit();

    echo json_encode([
        'success' => true,
        'new_balance' => $sender['solde'] - $amount
    ]);

} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
?>