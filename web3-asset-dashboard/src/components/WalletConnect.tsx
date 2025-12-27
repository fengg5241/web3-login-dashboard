import { useEffect, useState } from "react";
import { getProvider } from "@/utils/web3";
import NetworkBadge from "@/components/NetworkBadge";
import BalanceCard from "@/components/BalanceCard";
import TransactionList from "@/components/TransactionList";
import SwitchNetworkButton from "@/components/SwitchNetworkButton";
import TokenBalances from "./TokenBalances";


// 钱包连接组件 - 面试加分点说明：
// 1. 使用 React Hooks 管理状态
// 2. 集成 ethers.js v6 进行区块链交互
// 3. 实现钱包连接和账户信息获取
// 4. 响应式UI状态管理
export default function WalletConnect() {
  // 使用useState管理钱包地址状态，初始值为空字符串
  const [address, setAddress] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // 连接钱包的异步函数
  const connectWallet = async () => {
    if (isConnecting) return; // 防止重复点击
    setIsConnecting(true);

    try{

        // 1. 获取Web3提供者（如MetaMask）
      const provider = getProvider();
      // 如果用户未安装钱包扩展，则直接返回
      if (!provider) return;

      // 2. 请求用户授权连接钱包
      // 这会触发MetaMask弹窗要求用户确认连接
      await provider.send("eth_requestAccounts", []);
      
      // 3. 获取签名者对象，用于后续交易签名
      const signer = await provider.getSigner();
      
      // 4. 获取用户的钱包地址
      const addr = await signer.getAddress();
      
      // 5. 更新组件状态，保存钱包地址
      setAddress(addr);
    } catch (error) {
      console.error("连接钱包失败:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  // ✅ 新增：页面加载时检查是否已连接
  useEffect(() => {
    const checkConnectedWallet = async () => {
      const provider = getProvider();
      if (!provider) return;

      const accounts = await provider.send("eth_accounts", []);
      if (accounts.length > 0) {
        setAddress(accounts[0]);
      }
    };

    checkConnectedWallet();
  }, []);

  return (
    // 主容器：添加内边距、边框、圆角和最大宽度
    <div className="p-6 border rounded-lg max-w-md mx-auto text-center">
      {/* 条件渲染：根据是否已连接钱包显示不同UI */}
      {!address ? (
        // 未连接钱包时显示连接按钮
        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className={`px-4 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors ${isConnecting ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </button>
      ) : (
        // 已连接钱包时显示钱包地址
        <div className="space-y-2">
          <p className="text-sm text-gray-500">Connected Wallet</p>
          {/* 显示格式化的钱包地址：前6位 + ... + 后4位 */}
          <p className="font-mono mt-2" title={address}>
            {address.slice(0, 6)}...{address.slice(-4)}
          </p>
          <SwitchNetworkButton />
          <NetworkBadge />
          <BalanceCard address={address} />
          <TransactionList address={address} />
          <TokenBalances address={address} />
        </div>
      )}
    </div>
  );
}

