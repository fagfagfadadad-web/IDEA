import { ethers, Contract, BrowserProvider } from 'ethers';

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export interface SwapQuote {
  amountIn: string;
  amountOut: string;
  path: string[];
  priceImpact: number;
  minimumReceived: string;
}

const PANCAKESWAP_ROUTER_ADDRESS = '0x10ED43C718714eb63d5aA57B78B54704E256024E';

const ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
  'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
  'function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)',
  'function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
];

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
];

const WBNB_ADDRESS = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';

export const PUPFI_TOKEN: Token = {
  address: '0xF727588a7912DdB94d9A38e76D291D6BA2894D1B',
  symbol: 'PUPFI',
  name: 'PupFi Token',
  decimals: 18,
  logoURI: '/pupfi-logo.png',
};

export const POPULAR_TOKENS: Token[] = [
  {
    address: WBNB_ADDRESS,
    symbol: 'WBNB',
    name: 'Wrapped BNB',
    decimals: 18,
    logoURI: 'https://tokens.pancakeswap.finance/images/0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c.png',
  },
  PUPFI_TOKEN,
  {
    address: '0x55d398326f99059fF775485246999027B3197955',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 18,
    logoURI: 'https://tokens.pancakeswap.finance/images/0x55d398326f99059fF775485246999027B3197955.png',
  },
  {
    address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82',
    symbol: 'CAKE',
    name: 'PancakeSwap Token',
    decimals: 18,
    logoURI: 'https://tokens.pancakeswap.finance/images/0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82.png',
  },
  {
    address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    symbol: 'BTCB',
    name: 'Bitcoin BEP2',
    decimals: 18,
    logoURI: 'https://tokens.pancakeswap.finance/images/0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c.png',
  },
];

export const BNB_TOKEN: Token = {
  address: 'BNB',
  symbol: 'BNB',
  name: 'BNB',
  decimals: 18,
  logoURI: 'https://tokens.pancakeswap.finance/images/symbol/bnb.png',
};

export class PancakeSwapService {
  static async getTokenBalance(
    tokenAddress: string,
    userAddress: string,
    provider: BrowserProvider
  ): Promise<string> {
    try {
      if (tokenAddress === 'BNB') {
        const balance = await provider.getBalance(userAddress);
        return ethers.formatEther(balance);
      }

      const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider);
      const balance = await tokenContract.balanceOf(userAddress);
      const decimals = await tokenContract.decimals();
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error('Error getting token balance:', error);
      return '0';
    }
  }

  static async getSwapQuote(
    tokenIn: Token,
    tokenOut: Token,
    amountIn: string,
    provider: BrowserProvider
  ): Promise<SwapQuote | null> {
    try {
      console.log('getSwapQuote called with:', { tokenIn: tokenIn.symbol, tokenOut: tokenOut.symbol, amountIn });

      if (!amountIn || parseFloat(amountIn) <= 0) {
        console.log('Invalid amount, returning null');
        return null;
      }

      const router = new Contract(PANCAKESWAP_ROUTER_ADDRESS, ROUTER_ABI, provider);

      const tokenInAddress = tokenIn.address === 'BNB' ? WBNB_ADDRESS : tokenIn.address;
      const tokenOutAddress = tokenOut.address === 'BNB' ? WBNB_ADDRESS : tokenOut.address;

      let path: string[];
      if (tokenInAddress === tokenOutAddress) {
        throw new Error('Cannot swap identical tokens');
      } else if (tokenInAddress === WBNB_ADDRESS || tokenOutAddress === WBNB_ADDRESS) {
        path = [tokenInAddress, tokenOutAddress];
      } else {
        path = [tokenInAddress, WBNB_ADDRESS, tokenOutAddress];
      }
      console.log('Swap path:', path);

      const amountInWei = ethers.parseUnits(amountIn, tokenIn.decimals);
      console.log('Amount in Wei:', amountInWei.toString());

      const amounts = await router.getAmountsOut(amountInWei, path);
      console.log('Amounts from router:', amounts.map((a: any) => a.toString()));

      const amountOut = ethers.formatUnits(amounts[amounts.length - 1], tokenOut.decimals);
      console.log('Amount out formatted:', amountOut);

      const priceImpact = 0;
      const slippageTolerance = 0.005;
      const minimumReceived = (parseFloat(amountOut) * (1 - slippageTolerance)).toFixed(6);

      return {
        amountIn,
        amountOut,
        path,
        priceImpact,
        minimumReceived,
      };
    } catch (error: any) {
      console.error('Error getting swap quote:', error);

      if (error?.code === 'CALL_EXCEPTION') {
        console.warn('Liquidity pool may not exist for this pair or insufficient liquidity');
      }

      return null;
    }
  }

  static async checkAllowance(
    tokenAddress: string,
    userAddress: string,
    provider: BrowserProvider
  ): Promise<string> {
    try {
      if (tokenAddress === 'BNB') {
        return ethers.MaxUint256.toString();
      }

      const tokenContract = new Contract(tokenAddress, ERC20_ABI, provider);
      const allowance = await tokenContract.allowance(userAddress, PANCAKESWAP_ROUTER_ADDRESS);
      return allowance.toString();
    } catch (error) {
      console.error('Error checking allowance:', error);
      return '0';
    }
  }

  static async approveToken(
    tokenAddress: string,
    amount: string,
    decimals: number,
    signer: any
  ): Promise<boolean> {
    try {
      if (tokenAddress === 'BNB') {
        return true;
      }

      const tokenContract = new Contract(tokenAddress, ERC20_ABI, signer);
      const amountWei = ethers.parseUnits(amount, decimals);

      const tx = await tokenContract.approve(PANCAKESWAP_ROUTER_ADDRESS, amountWei);
      await tx.wait();

      return true;
    } catch (error) {
      console.error('Error approving token:', error);
      throw error;
    }
  }

  static async executeSwap(
    tokenIn: Token,
    tokenOut: Token,
    amountIn: string,
    slippageTolerance: number,
    userAddress: string,
    signer: any
  ): Promise<string> {
    try {
      if (!amountIn || parseFloat(amountIn) <= 0) {
        throw new Error('Invalid swap amount');
      }

      const router = new Contract(PANCAKESWAP_ROUTER_ADDRESS, ROUTER_ABI, signer);

      const tokenInAddress = tokenIn.address === 'BNB' ? WBNB_ADDRESS : tokenIn.address;
      const tokenOutAddress = tokenOut.address === 'BNB' ? WBNB_ADDRESS : tokenOut.address;

      let path: string[];
      if (tokenInAddress === tokenOutAddress) {
        throw new Error('Cannot swap identical tokens');
      } else if (tokenInAddress === WBNB_ADDRESS || tokenOutAddress === WBNB_ADDRESS) {
        path = [tokenInAddress, tokenOutAddress];
      } else {
        path = [tokenInAddress, WBNB_ADDRESS, tokenOutAddress];
      }

      const amountInWei = ethers.parseUnits(amountIn, tokenIn.decimals);

      const amounts = await router.getAmountsOut(amountInWei, path);
      const amountOutMin = (amounts[amounts.length - 1] * BigInt(Math.floor((1 - slippageTolerance) * 10000))) / BigInt(10000);

      const deadline = Math.floor(Date.now() / 1000) + 60 * 20;

      let tx;

      if (tokenIn.address === 'BNB') {
        tx = await router.swapExactETHForTokens(
          amountOutMin,
          path,
          userAddress,
          deadline,
          { value: amountInWei }
        );
      } else if (tokenOut.address === 'BNB') {
        tx = await router.swapExactTokensForETH(
          amountInWei,
          amountOutMin,
          path,
          userAddress,
          deadline
        );
      } else {
        tx = await router.swapExactTokensForTokens(
          amountInWei,
          amountOutMin,
          path,
          userAddress,
          deadline
        );
      }

      const receipt = await tx.wait();
      return receipt.hash;
    } catch (error: any) {
      console.error('Error executing swap:', error);

      if (error?.code === 'CALL_EXCEPTION') {
        throw new Error('Swap failed: Insufficient liquidity or invalid trading pair');
      }

      if (error?.code === 'ACTION_REJECTED') {
        throw new Error('Transaction rejected by user');
      }

      throw new Error(error?.reason || error?.message || 'Swap failed');
    }
  }

  static calculatePriceImpact(amountIn: string, amountOut: string, price: number): number {
    try {
      const expectedOut = parseFloat(amountIn) * price;
      const actualOut = parseFloat(amountOut);
      const impact = ((expectedOut - actualOut) / expectedOut) * 100;
      return Math.max(0, impact);
    } catch {
      return 0;
    }
  }

  static formatTokenAmount(amount: string, decimals: number = 6): string {
    const num = parseFloat(amount);
    if (num === 0) return '0';
    if (num < 0.000001) return '<0.000001';
    if (num < 1) return num.toFixed(decimals);
    if (num < 1000) return num.toFixed(4);
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  static isValidAmount(amount: string): boolean {
    if (!amount || amount === '') return false;
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  }
}
