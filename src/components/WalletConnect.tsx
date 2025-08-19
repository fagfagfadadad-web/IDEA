import React from 'react';
import { Wallet, LogOut } from 'lucide-react';
import { useWallet, formatAddress } from '../lib/wallet';
import { Button } from './Button';

export const WalletConnect: React.FC = () => {
  const { address, isConnected, login, logout } = useWallet();

  return (
    <div className="flex items-center gap-3">
      {isConnected && address ? (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span className="text-sm font-mono text-white/80">
              {formatAddress(address)}
            </span>
          </div>
          <Button
            onClick={logout}
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg flex items-center gap-2"
          >
            <LogOut size={16} />
            Disconnect
          </Button>
        </div>
      ) : (
        <Button
          onClick={login}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Wallet size={16} />
          Connect Wallet
        </Button>
      )}
    </div>
  );
};