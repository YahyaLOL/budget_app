<?php
header('Content-Type: application/json');
require_once('../db/config.php');

// Debug mode
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $username = trim($data['username'] ?? '');
    $password = trim($data['password'] ?? '');

    if (empty($username) || empty($password)) {
        echo json_encode(['error' => 'Le nom d\'utilisateur et le mot de passe sont requis']);
        exit;
    }

    try {
        // Vérifier si l'utilisateur existe
        $stmt = $pdo->prepare("SELECT id, solde, password FROM users WHERE username = ?");
        $stmt->execute([$username]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            // Vérification du mot de passe exact (non hashé ici)
            if ($user['password'] === $password) {
                echo json_encode([
                    'user_id' => (int)$user['id'],
                    'solde' => (float)$user['solde']
                ]);
            } else {
                echo json_encode(['error' => 'Mot de passe incorrect']);
            }
        } else {
            // Créer un nouvel utilisateur
            $stmt = $pdo->prepare("INSERT INTO users (username, password, solde) VALUES (?, ?, 0)");
            $stmt->execute([$username, $password]);
            $userId = $pdo->lastInsertId();

            echo json_encode([
                'user_id' => (int)$userId,
                'solde' => 0.00
            ]);
        }
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Erreur de base de données: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['error' => 'Méthode non autorisée']);
}
?>
