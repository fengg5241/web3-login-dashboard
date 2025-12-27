"use client";

import { useEffect, useRef, useState } from "react";
import { ethers } from "ethers";

interface TxItem {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  timestamp: number;
}

export default function TransactionList({ address }: { address: string }) {
  const [txs, setTxs] = useState<TxItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchingRef = useRef(false);

  useEffect(() => {
    if (!address) return;
    if (fetchingRef.current) return;

    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
    if (!rpcUrl) {
      setError('RPC URL is not configured');
      return;
    }

    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    const fetchTxs = async () => {
      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const currentBlock = await provider.getBlockNumber();
        const startBlock = Math.max(currentBlock - 10, 0); // Reduced from 20 to 10 blocks
        const results: TxItem[] = [];
        const MAX_TXS = 10; // Maximum transactions to process per block
        const MAX_RESULTS = 5; // Maximum results to return

        for (let i = currentBlock; i >= startBlock; i--) {
          if (results.length >= MAX_RESULTS) break;

          try {
            const block = await provider.getBlock(i, true);
            if (!block?.transactions?.length) continue;

            // Process transactions in parallel with a limit
            const txPromises = block.transactions
              .slice(0, MAX_TXS)
              .map(async (txHash) => {
                try {
                  const tx = await provider.getTransaction(txHash);
                  if (!tx) return null;

                  const fromMatch = tx.from?.toLowerCase() === address.toLowerCase();
                  const toMatch = tx.to?.toLowerCase() === address.toLowerCase();
                  
                  if (fromMatch || toMatch) {
                    return {
                      hash: tx.hash,
                      from: tx.from,
                      to: tx.to,
                      value: ethers.formatEther(tx.value),
                      timestamp: block.timestamp,
                    };
                  }
                } catch (error) {
                  return null;
                }
                return null;
              });

            // Wait for all transaction checks to complete
            const txResults = (await Promise.all(txPromises)).filter(Boolean) as TxItem[];
            results.push(...txResults.slice(0, MAX_RESULTS - results.length));

          } catch (error) {
            console.warn(`Error processing block ${i}:`, error);
            continue;
          }
        }

        setTxs(results);
      } catch (e: any) {
        setError(`Failed to load transactions: ${e.message || 'Check console for details'}`);
        console.error('Error fetching transactions:', e);
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    };

    fetchTxs();

    return () => {
      fetchingRef.current = false;
    };
  }, [address]);

  return (
    <div style={{ marginTop: 24 }}>
      <h3>Recent Transactions</h3>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && txs.length === 0 && (
        <p>No recent transactions found.</p>
      )}

      <ul>
        {txs.map((tx) => (
          <li key={tx.hash}>
            {tx.from.toLowerCase() === address.toLowerCase()
              ? "Sent"
              : "Received"}{" "}
            {tx.value} ETH
          </li>
        ))}
      </ul>
    </div>
  );
}
