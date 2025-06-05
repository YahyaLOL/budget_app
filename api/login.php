<?php
header('Content-Type: application/json');
require_once('../db/config.php');

// Debug mode
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $action = $data['action'] ?? '';
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

        // Traitement selon l'action
        if ($action === 'login') {
            if (!$user) {
                echo json_encode(['error' => 'Utilisateur non trouvé']);
                exit;
            }

            // Vérification du mot de passe
            if ($user['password'] === $password) {
                echo json_encode([
                    'user_id' => (int)$user['id'],
                    'solde' => (float)$user['solde']
                ]);
            } else {
                echo json_encode(['error' => 'Mot de passe incorrect']);
            }
        } 
        elseif ($action === 'signup') {
            if ($user) {
                echo json_encode(['error' => 'Ce nom d\'utilisateur est déjà pris']);
                exit;
            }

            $start_solde = isset($data['start_solde']) ? (float)$data['start_solde'] : 0;
            
            // Créer un nouvel utilisateur avec solde initial
            $stmt = $pdo->prepare("INSERT INTO users (username, password, solde) VALUES (?, ?, ?)");
            $stmt->execute([$username, $password, $start_solde]);
            $userId = $pdo->lastInsertId();

            echo json_encode([
                'user_id' => (int)$userId,
                'solde' => $start_solde
            ]);
        }
        else {
            echo json_encode(['error' => 'Action non reconnue']);
        }
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Erreur de base de données: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['error' => 'Méthode non autorisée']);
}
?>