import { Connection, VersionedTransaction, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { FormData } from 'formdata-node';
import { fileFromPath } from 'formdata-node/file-from-path';

// Configuration
dotenv.config();

// Paramètres configurables
const CONFIG = {
    // Paramètres du token
    token: {
        name: "DRACELON",            // Nom du token
        symbol: "DRAC",                // Symbole du token
        description: "I mean … yeah ofc I love blood 🩸",    // Description du token
        twitter: "https://x.com/elonmusk/status/1860799826063249842", // Twitter A SUPPRIMER
        imagePath: "./image.png"      // Chemin de l'image
    },
    // Paramètres réseau
    network: {
        rpcEndpoint: "https://api.mainnet-beta.solana.com",
        connectionConfirmation: 'confirmed'
    },
    // Paramètres de transaction
    transaction: {
        createAmount: 1.25,           // Montant pour l'achat lié à la  création
        buyAmount: 2,             // Montant pour l'achat
        slippage: 1,                  // Slippage en pourcentage
        priorityFeeCreate: 0.009,     // Frais prioritaires pour la création
        priorityFeeBuy: 0.0           // Frais prioritaires pour l'achat
    }
};

const connection = new Connection(CONFIG.network.rpcEndpoint, CONFIG.network.connectionConfirmation);
const wallet1 = Keypair.fromSecretKey(bs58.decode(process.env.PKEYPUMP1));
const wallet2 = Keypair.fromSecretKey(bs58.decode(process.env.PKEYPUMP2));

async function createTokenBundle(config = CONFIG) {
    try {
        console.log('\nPréparation de la création du token...');
        const mintKeypair = Keypair.generate();
        console.log(`Adresse du token: ${mintKeypair.publicKey.toString()}`);

        const formData = new FormData();
        formData.append("file", await fileFromPath(config.token.imagePath));
        formData.append("name", config.token.name);
        formData.append("symbol", config.token.symbol);
        formData.append("description", config.token.description);
	formData.append("twitter", config.token.twitter || "");       
        formData.append("showName", "true");

        console.log('Upload des métadonnées sur IPFS...');
        const metadataResponse = await fetch("https://pump.fun/api/ipfs", {
            method: "POST",
            body: formData,
        });
        const metadataResponseJSON = await metadataResponse.json();

        const bundledTxArgs = [
            {
                publicKey: wallet1.publicKey.toString(),
                action: "create",
                tokenMetadata: {
                    name: config.token.name,
                    symbol: config.token.symbol,
                    uri: metadataResponseJSON.metadataUri
                },
                mint: mintKeypair.publicKey.toString(),
                denominatedInSol: "true",
                amount: config.transaction.createAmount,
                slippage: config.transaction.slippage,
                priorityFee: config.transaction.priorityFeeCreate,
                pool: "pump"
            },
            {
                publicKey: wallet2.publicKey.toString(),
                action: "buy",
                mint: mintKeypair.publicKey.toString(),
                denominatedInSol: "true",
                amount: config.transaction.buyAmount,
                slippage: config.transaction.slippage,
                priorityFee: config.transaction.priorityFeeBuy,
                pool: "pump"
            }
        ];

        // Rest of the code remains the same...
        console.log('\nEnvoi du bundle à PumpPortal...');
        const response = await fetch('https://pumpportal.fun/api/trade-local', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bundledTxArgs)
        });

        if (response.status === 200) {
            const transactions = await response.json();
            console.log('Transactions générées, signature en cours...');
            let encodedSignedTransactions = [];
            let signatures = [];

            const tx1 = VersionedTransaction.deserialize(new Uint8Array(bs58.decode(transactions[0])));
            const tx2 = VersionedTransaction.deserialize(new Uint8Array(bs58.decode(transactions[1])));

            tx1.sign([mintKeypair, wallet1]);
            tx2.sign([wallet2]);
            encodedSignedTransactions.push(bs58.encode(tx1.serialize()));
            encodedSignedTransactions.push(bs58.encode(tx2.serialize()));
            signatures.push(bs58.encode(tx1.signatures[0]));
            signatures.push(bs58.encode(tx2.signatures[0]));

            console.log('Envoi du bundle à Jito...');
            const jitoResponse = await fetch('https://mainnet.block-engine.jito.wtf/api/v1/bundles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    id: 1,
                    method: "sendBundle",
                    params: [encodedSignedTransactions]
                })
            });

            console.log('\nStatut du bundle:', jitoResponse.status);
            const jitoData = await jitoResponse.json();
            console.log('Réponse Jito:', jitoData);

            console.log(`Transaction de création: https://solscan.io/tx/${signatures[0]}`);
            console.log(`Transaction d'achat: https://solscan.io/tx/${signatures[1]}`);
            console.log(`Adresse du token créé: ${mintKeypair.publicKey.toString()}`);
            return mintKeypair.publicKey.toString();
        } else {
            const error = await response.text();
            throw new Error(`Erreur API: ${error}`);
        }
    } catch (error) {
        console.error('Erreur lors de la création:', error);
        throw error;
    }
}

// Modification des paramètres via les arguments de ligne de commande
if (process.argv.length > 2) {
    CONFIG.token.name = process.argv[2];
    CONFIG.token.symbol = process.argv[3];
    CONFIG.token.description = process.argv[4];
    CONFIG.token.imagePath = process.argv[5];
}

if (!CONFIG.token.name || !CONFIG.token.symbol || !CONFIG.token.description || !CONFIG.token.imagePath) {
    console.log(`
        Usage: node createTokenBundle.js <nom> <symbole> <description> <chemin_image>
        Exemple:
          node createTokenBundle.js "Mon Token" "MTK" "Description du token" "./image.png"
        `);
            process.exit(1);
        }
        
        createTokenBundle()
            .then((tokenAddress) => {
                console.log(`\nToken créé avec succès à l'adresse: ${tokenAddress}`);
                process.exit(0);
            })
            .catch((error) => {
                console.error('\nÉchec de la création:', error);
                process.exit(1);
            });
        
        
