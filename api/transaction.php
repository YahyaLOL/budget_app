<?php
header('Content-Type: application/json');
require_once('../db/config.php');

// GET: Retrieve user transactions
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
  if (!isset($_GET['user_id'])) {
    echo json_encode(["error" => "ID utilisateur manquant"]);
    exit;
  }
  
  $userId = (int)$_GET['user_id'];
  $stmt = $pdo->prepare("SELECT * FROM transactions WHERE user_id = ? ORDER BY made_at DESC");
  $stmt->execute([$userId]);
  $transactions = $stmt->fetchAll();
  
  echo json_encode($transactions);
  exit;
}

// POST: Add new transaction
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $data = json_decode(file_get_contents('php://input'), true);
  
  // Validate data
  if (empty($data['motif']) || !isset($data['montant']) || empty($data['type']) || !isset($data['user_id'])) {
    echo json_encode(["status" => "error", "message" => "Données manquantes"]);
    exit;
  }
  
  $motif = $data['motif'];
  $montant = (float)$data['montant'];
  $type = $data['type'];
  $userId = (int)$data['user_id'];
  
  try {
    $pdo->beginTransaction();
    
    // Insert transaction
    $stmt = $pdo->prepare("INSERT INTO transactions (user_id, motif, type, montant) VALUES (?, ?, ?, ?)");
    $stmt->execute([$userId, $motif, $type, $montant]);
    
    // Update user balance
    $sign = ($type === 'income') ? '+' : '-';
    $updateStmt = $pdo->prepare("UPDATE users SET solde = solde $sign ? WHERE id = ?");
    $updateStmt->execute([$montant, $userId]);
    
    // Get new balance
    $balanceStmt = $pdo->prepare("SELECT solde FROM users WHERE id = ?");
    $balanceStmt->execute([$userId]);
    $newSolde = (float)$balanceStmt->fetchColumn();
    
    $pdo->commit();
    
    echo json_encode([
      "status" => "success",
      "new_solde" => $newSolde
    ]);
  } catch (PDOException $e) {
    $pdo->rollBack();
    echo json_encode([
      "status" => "error",
      "message" => "Erreur de base de données: " . $e->getMessage()
    ]);
  }
}
?>