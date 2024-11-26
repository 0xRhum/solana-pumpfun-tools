// newTokens.js
import WebSocket from 'ws';

// Création de la connexion WebSocket
const ws = new WebSocket('wss://pumpportal.fun/api/data');

// Quand la connexion est établie
ws.on('open', function open() {
    console.log('Connecté au WebSocket de Pump.fun');

    // S'abonner aux nouveaux tokens
    const payload = {
        method: "subscribeNewToken"
    };
    ws.send(JSON.stringify(payload));
    console.log('Abonné aux nouveaux tokens. En attente...');
});

// Quand on reçoit un message
ws.on('message', function message(data) {
    const event = JSON.parse(data);

    // Afficher les informations du nouveau token
    console.log('\n=== Nouveau Token Détecté ===');
    console.log('Adresse:', event.mint);
    console.log('Nom:', event.name);
    console.log('Timestamp:', new Date(event.timestamp).toLocaleString());
    console.log('===========================\n');
});

// Gestion des erreurs
ws.on('error', function error(err) {
    console.error('Erreur WebSocket:', err);
});

// Gestion de la fermeture
ws.on('close', function close() {
    console.log('Connexion WebSocket fermée');
});

