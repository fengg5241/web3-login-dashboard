import { useEffect, useState } from "react";
import { formatEther } from "ethers";
import { getProvider } from "@/utils/web3";

type Props = {
  address: string;
};

// 在其他组件中使用
// <BalanceCard address="0x1234..." />
export default function BalanceCard({ address }: Props) {
    // This is equivalent to:
    // const balanceState = useState<string>("");
    // const balance = balanceState[0];       // Current value
    // const setBalance = balanceState[1];    // Function to update the value
    const [balance, setBalance] = useState<string>("");

  useEffect(() => {
    const loadBalance = async () => {
      const provider = getProvider();
      if (!provider || !address) return;

      const bal = await provider.getBalance(address);
      // To update the balance
      //setBalance("100.5");  // Updates balance to "100.5"
      // To use the current balance
      //console.log(balance);  // Outputs the current balance
      setBalance(formatEther(bal));
    };

    loadBalance();
  }, [address]);

  return (
    <div className="p-4 border rounded-lg mt-4 text-center">
      <p className="text-sm text-gray-500">ETH Balance</p>
      <p className="text-xl font-semibold mt-2">
        {balance ? `${Number(balance).toFixed(4)} ETH` : "Loading..."}
      </p>
    </div>
  );
}
