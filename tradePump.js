import { Connection, VersionedTransaction, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Configuration
dotenv.config();
const RPC_ENDPOINT = "https://api.mainnet-beta.solana.com";
const connection = new Connection(RPC_ENDPOINT, 'confirmed');
const wallet = Keypair.fromSecretKey(bs58.decode(process.env.PKEYPUMP2));

// Paramètres par défaut
const DEFAULT_SLIPPAGE = 1;
const DEFAULT_PRIORITY_FEE = 0.005;

async function executeTrade(params) {
    try {
        console.log('\nPréparation de la transaction...');
        console.log(`Action: ${params.action}`);
        console.log(`Token: ${params.mint}`);
        console.log(`${params.action === 'buy' ? 'Montant' : 'Pourcentage'}: ${params.amount}`);
        console.log(`Slippage: ${params.slippage}%`);
        console.log(`Priority Fee: ${params.priorityFee} SOL`);

        const response = await fetch('https://pumpportal.fun/api/trade-local', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                publicKey: wallet.publicKey.toString(),
                ...params
            })
        });

        if (response.status === 200) {
            const buffer = await response.arrayBuffer();
            const tx = VersionedTransaction.deserialize(new Uint8Array(buffer));
            tx.sign([wallet]);

            console.log('Envoi de la transaction...');
            const signature = await connection.sendTransaction(tx, {
                skipPreflight: true,
                maxRetries: 3
            });

            console.log(`Transaction envoyée: https://solscan.io/tx/${signature}`);
            return signature;
        } else {
            const error = await response.text();
            throw new Error(`Erreur API: ${error}`);
        }
    } catch (error) {
        console.error('Erreur:', error);
        throw error;
    }
}

async function buy(tokenMint, solAmount, slippage = DEFAULT_SLIPPAGE) {
    return executeTrade({
        action: "buy",
        mint: tokenMint,
        amount: solAmount,
        denominatedInSol: "true",
        slippage: slippage,
        priorityFee: DEFAULT_PRIORITY_FEE,
        pool: "pump"
    });
}

async function sell(tokenMint, percentage = 100, slippage = DEFAULT_SLIPPAGE) {
    // S'assurer que le pourcentage est bien formaté avec le symbole %
    const formattedPercentage = `${percentage}%`;
    console.log(`\nPréparation de la vente de ${formattedPercentage} des tokens...`);

    return executeTrade({
        action: "sell",
        mint: tokenMint,
        amount: formattedPercentage,  // Important : ajouter le % ici
        denominatedInSol: "false",
        slippage: slippage,
        priorityFee: DEFAULT_PRIORITY_FEE,
        pool: "pump"
    });
}

// Gestion des commandes CLI
const command = process.argv[2];
const tokenMint = process.argv[3];
const amount = process.argv[4];
const slippage = process.argv[5] ? parseFloat(process.argv[5]) : DEFAULT_SLIPPAGE;

if (!command || !tokenMint || !amount) {
    console.log(`
Usage:
  Achat:  node tradePump.js buy <token_address> <montant_sol> [slippage]
  Vente:  node tradePump.js sell <token_address> <pourcentage> [slippage]

Exemples:
  node tradePump.js buy GgCEExk6KcziW6vhyV2t4A4ksxqoNh1CiGFiaaS3pump 0.1
  node tradePump.js buy GgCEExk6KcziW6vhyV2t4A4ksxqoNh1CiGFiaaS3pump 0.1 2
  node tradePump.js sell GgCEExk6KcziW6vhyV2t4A4ksxqoNh1CiGFiaaS3pump 100    # Vendre 100%
  node tradePump.js sell GgCEExk6KcziW6vhyV2t4A4ksxqoNh1CiGFiaaS3pump 50     # Vendre 50%
`);
    process.exit(1);
}

switch (command.toLowerCase()) {
    case 'buy':
        buy(tokenMint, parseFloat(amount), slippage)
            .then(() => process.exit(0))
            .catch(() => process.exit(1));
        break;

    case 'sell':
        sell(tokenMint, parseFloat(amount), slippage)
            .then(() => process.exit(0))
            .catch(() => process.exit(1));
        break;

    default:
        console.log('Commande invalide. Utilisez "buy" ou "sell"');
        process.exit(1);
}
