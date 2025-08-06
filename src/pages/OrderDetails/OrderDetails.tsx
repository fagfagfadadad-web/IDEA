{\rtf1\fbidis\ansi\ansicpg1252\deff0\nouicompat\deflang1033{\fonttbl{\f0\fnil\fcharset0 Calibri;}{\f1\fnil\fcharset1 Segoe UI Symbol;}{\f2\fnil Calibri;}{\f3\fnil\fcharset1 Segoe UI Emoji;}{\f4\fnil\fcharset1 Segoe UI Symbol;}}
{\*\generator Riched20 10.0.19041}\viewkind4\uc1 
\pard\sa200\sl276\slmult1\f0\fs22\lang27 import React, \{ useState, useEffect \} from 'react';\par
import \{ useParams, useNavigate \} from 'react-router-dom';\par
import \{ Shield, CheckCircle, AlertTriangle, DollarSign, Clock, Check, FileText, XCircle \} from 'lucide-react';\par
import \{ Button, Card, OrderChat, DisputeModal \} from 'components';\par
import \{ useGetIsLoggedIn, useGetAccount, useGetNetworkConfig, Transaction, Address \} from 'lib';\par
import \{ signAndSendTransactions \} from '../../helpers/signAndSendTransactions';\par
import \{ useOrderById \} from '../../hooks/useOrders';\par
import \{ useAuth \} from '../../context/AuthContext';\par
import \{ useToast \} from '../../context/ToastContext';\par
import \{ supabase \} from '../../lib/supabase';\par
import axios from 'axios';\par
\par
const ESCROW_ADDRESS = 'erd1qqqqqqqqqqqqqpgqvesht6c8ard8zzj5n02fmfae0kuy2z4vpmuqw5q9v0';\par
\par
const isValidAddress = (addr: string | undefined): boolean => \{\par
  if (!addr) return false;\par
  try \{\par
    new Address(addr);\par
    return true;\par
  \} catch \{\par
    return false;\par
  \}\par
\};\par
\par
const addressToHex = (bech32Address: string): string => \{\par
  try \{\par
    if (!isValidAddress(bech32Address)) \{\par
      throw new Error('Invalid address: address is not in correct Bech32 format');\par
    \}\par
    const address = new Address(bech32Address);\par
    const hex = address.hex();\par
    const zeroAddress = '0000000000000000000000000000000000000000000000000000000000000000';\par
    if (hex === zeroAddress) \{\par
      throw new Error('Address cannot be zero');\par
    \}\par
    return hex;\par
  \} catch (error) \{\par
    console.error('Failed to convert address to hex:', error);\par
    throw new Error(`Invalid address format: $\{bech32Address\}`);\par
  \}\par
\};\par
\par
const uuidToHex = (uuid: string): string => \{\par
  const cleanUuid = uuid.replace(/-/g, '');\par
  if (cleanUuid.length !== 32) \{\par
    throw new Error('Invalid UUID format, must have 32 hex characters without hyphens');\par
  \}\par
  console.log('UUID conversion:', \{ original: uuid, clean: cleanUuid, hex: cleanUuid \});\par
  return cleanUuid;\par
\};\par
\par
const getDeadlineTimestamp = (): number => \{\par
  const currentTime = Math.floor(Date.now() / 1000);\par
  const deadline = currentTime + 7 * 24 * 60 * 60;\par
  if (deadline <= currentTime + 86_400) \{\par
    throw new Error('Deadline must be at least 1 day in the future');\par
  \}\par
  console.log('Generated deadline:', \{ currentTime, deadline \});\par
  return deadline;\par
\};\par
\par
const checkWalletBalance = async (walletAddress: string, requiredAmount: number, tokenId: string = 'EGLD') => \{\par
  try \{\par
    console.log('\f1\u-10179?\u-8947?\f2\lang1033  \f0 Checking wallet balance:', \{ walletAddress, requiredAmount, tokenId \});\par
    if (!isValidAddress(walletAddress)) \{\par
      throw new Error('Invalid wallet address');\par
    \}\par
\par
    let balance = 0;\par
    if (tokenId === 'EGLD') \{\par
      const response = await axios.get(\par
        `https://api.multiversx.com/accounts/$\{walletAddress\}`,\par
        \{ timeout: 15000 \}\par
      );\par
      balance = response.data.balance\par
        ? parseFloat(response.data.balance) / Math.pow(10, 18)\par
        : 0;\par
      console.log('\f1\u-10179?\u-9040?\f2  \f0 EGLD balance result:', \{ raw: response.data.balance, formatted: balance \});\par
    \} else \{\par
      console.log(`\f3\u-10178?\u-8551?\f2  \f0 Checking ESDT balance for: $\{tokenId\}`);\par
      try \{\par
        const response = await axios.get(\par
          `https://api.multiversx.com/accounts/$\{walletAddress\}/tokens/$\{tokenId\}`,\par
          \{ timeout: 15000 \}\par
        );\par
        if (response.data && response.data.balance) \{\par
          const tokenDecimals = 18;\par
          balance = parseFloat(response.data.balance) / Math.pow(10, tokenDecimals);\par
          console.log(`\f4\u9989?\f2  \f0 Found balance for $\{tokenId\}:`, \{\par
            raw: response.data.balance,\par
            decimals: tokenDecimals,\par
            formatted: balance,\par
          \});\par
        \} else \{\par
          console.log(`\f4\u10060?\f2  \f0 No balance for $\{tokenId\}`);\par
          balance = 0;\par
        \}\par
      \} catch (error) \{\par
        console.error(`\f3\u9888?\u-497?\f2  \f0 Error checking ESDT balance:`, error);\par
        balance = 0;\par
      \}\par
    \}\par
\par
    const effectiveAmount = tokenId === 'EGLD' ? requiredAmount * 1.1111 : requiredAmount;\par
    console.log('\f1\u-10180?\u-8255?\f2  \f0 Balance check result:', \{\par
      address: walletAddress,\par
      tokenId,\par
      balance,\par
      requiredAmount: effectiveAmount,\par
      hasEnoughFunds: balance >= effectiveAmount,\par
    \});\par
\par
    return \{\par
      hasEnoughFunds: balance >= effectiveAmount,\par
      balance,\par
      required: effectiveAmount,\par
      error: null,\par
    \};\par
  \} catch (error) \{\par
    console.error('\f1\u-10179?\u-9051?\f2  \f0 Error checking balance:', error);\par
    return \{\par
      hasEnoughFunds: false,\par
      balance: 0,\par
      required: requiredAmount,\par
      error: error instanceof Error ? error.message : 'Unknown error',\par
    \};\par
  \}\par
\};\par
\par
const monitorTransactionStatus = async (txHash: string, maxAttempts = 20) => \{\par
  console.log('Starting transaction monitoring for hash:', txHash);\par
  for (let attempt = 1; attempt <= maxAttempts; attempt++) \{\par
    try \{\par
      console.log(`Monitoring attempt $\{attempt\}/$\{maxAttempts\} for transaction:`, txHash);\par
      const response = await axios.get(\par
        `https://api.multiversx.com/transactions/$\{txHash\}`,\par
        \{ timeout: 15000 \}\par
      );\par
      const txData = response.data;\par
      console.log('Transaction status response:', \{\par
        hash: txHash,\par
        status: txData.status,\par
        nonce: txData.nonce,\par
        round: txData.round,\par
        timestamp: txData.timestamp,\par
      \});\par
\par
      if (['success', 'executed'].includes(txData.status)) \{\par
        console.log('Transaction confirmed as successful:', txHash);\par
        return \{ success: true, data: txData \};\par
      \} else if (['fail', 'invalid', 'not_executed'].includes(txData.status)) \{\par
        console.error('Transaction failed:', txHash, txData.status);\par
        return \{ success: false, error: `Transaction failed with status: $\{txData.status\}` \};\par
      \} else \{\par
        console.log(`Transaction still $\{txData.status\}, waiting...`);\par
        await new Promise((resolve) => setTimeout(resolve, 6000));\par
        continue;\par
      \}\par
    \} catch (error) \{\par
      console.log(`Attempt $\{attempt\} failed:`, error instanceof Error ? error.message : error);\par
      if (axios.isAxiosError(error)) \{\par
        if (error.response?.status === 404) \{\par
          console.log('Transaction not yet found, waiting...');\par
        \} else if (error.response?.status === 429) \{\par
          const delay = Math.pow(2, attempt) * 1000;\par
          console.log(`Rate limit exceeded, waiting $\{delay\}ms...`);\par
          await new Promise((resolve) => setTimeout(resolve, delay));\par
        \} else \{\par
          console.error('Axios error:', error.response?.status, error.response?.data);\par
        \}\par
      \}\par
      if (attempt === maxAttempts) \{\par
        throw new Error(`Transaction monitoring failed after $\{maxAttempts\} attempts`);\par
      \}\par
      await new Promise((resolve) => setTimeout(resolve, 6000));\par
    \}\par
  \}\par
  throw new Error('Transaction monitoring timeout');\par
\};\par
\par
const OrderDetails = () => \{\par
  const \{ id \} = useParams();\par
  const navigate = useNavigate();\par
  const isLoggedIn = useGetIsLoggedIn();\par
  const \{ address \} = useGetAccount();\par
  const \{ network \} = useGetNetworkConfig();\par
  const \{ user \} = useAuth();\par
  const \{ success, error: showError \} = useToast();\par
\par
  const \{ data: order, isLoading, error \} = useOrderById(id || '');\par
\par
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);\par
  const [isReleaseLoading, setIsReleaseLoading] = useState(false);\par
  const [isSubmitWorkLoading, setIsSubmitWorkLoading] = useState(false);\par
  const [showPaymentModal, setShowPaymentModal] = useState(false);\par
  const [showDisputeModal, setShowDisputeModal] = useState(false);\par
  const [showReviewModal, setShowReviewModal] = useState(false);\par
  const [providerAddressError, setProviderAddressError] = useState<string | null>(null);\par
\par
  const fetchProviderAddress = async (gigId: string): Promise<string | null> => \{\par
    try \{\par
      console.log('Fetching provider address for gig:', \{ gigId \});\par
      const \{ data, error \} = await supabase\par
        .from('gigs')\par
        .select('provider_id, provider:users!gigs_provider_id_fkey(id, username, avatar_url, wallet_address)')\par
        .eq('id', gigId)\par
        .single();\par
\par
      if (error) \{\par
        console.error('Supabase error fetching provider address:', error);\par
        return null;\par
      \}\par
\par
      const walletAddress = data?.provider?.wallet_address;\par
\par
      console.log('Fetched provider data:', \{ data, walletAddress \});\par
\par
      if (!isValidAddress(walletAddress)) \{\par
        console.error('Invalid provider address from database:', walletAddress);\par
        return null;\par
      \}\par
\par
      return walletAddress;\par
    \} catch (error) \{\par
      console.error('Error fetching provider address:', error);\par
      return null;\par
    \}\par
  \};\par
\par
  const getTokenDisplayName = (paymentToken: string) => \{\par
    if (paymentToken === 'EGLD') return 'EGLD';\par
    if (paymentToken === 'IDA-f9bc1d') return 'IDA';\par
    return paymentToken;\par
  \};\par
\par
  const calculateFees = (amount: number, paymentToken: string) => \{\par
    if (paymentToken === 'EGLD') \{\par
      return \{\par
        clientPays: amount,\par
        providerGets: amount * 0.9,\par
        platformFee: amount * 0.1,\par
        feePercentage: 10,\par
      \};\par
    \} else \{\par
      return \{\par
        clientPays: amount,\par
        providerGets: amount,\par
        platformFee: 0,\par
        feePercentage: 0,\par
      \};\par
    \}\par
  \};\par
\par
  const handlePayment = async () => \{\par
    console.log('Payment button clicked!', \{ address, order \});\par
    if (!address || !order) \{\par
      alert('Please connect your wallet');\par
      return;\par
    \}\par
\par
    if (order.payment_status !== 'pending') \{\par
      alert('Payment has already been processed or is in another status');\par
      return;\par
    \}\par
\par
    const paymentToken = order.payment_token;\par
    const tokenDisplayName = getTokenDisplayName(paymentToken);\par
\par
    try \{\par
      setIsPaymentLoading(true);\par
      console.log('Creating transaction...', \{ orderData: JSON.stringify(order, null, 2) \});\par
\par
      if (!isValidAddress(address)) \{\par
        throw new Error('Invalid client address');\par
      \}\par
\par
      let providerAddress = order.provider_address || order.gig?.provider?.wallet_address;\par
      if (!isValidAddress(providerAddress) && order.gig_id) \{\par
        console.log('Provider address not found in order, fetching from database...', \{ gigId: order.gig_id \});\par
        const fetchedAddress = await fetchProviderAddress(order.gig_id);\par
        if (!fetchedAddress || !isValidAddress(fetchedAddress)) \{\par
          throw new Error('Failed to fetch a valid provider address from the database. Please check the gig details.');\par
        \}\par
        providerAddress = fetchedAddress;\par
\par
        const \{ error: updateError \} = await supabase\par
          .from('orders')\par
          .update(\{ provider_address: providerAddress \})\par
          .eq('id', order.id);\par
        if (updateError) \{\par
          console.error('Error updating provider_address:', updateError);\par
          throw new Error(`Failed to update provider_address: $\{updateError.message\}`);\par
        \}\par
      \}\par
      if (!providerAddress || !isValidAddress(providerAddress)) \{\par
        throw new Error('Invalid or missing provider address. Please check the order details.');\par
      \}\par
\par
      const \{ error: clientUpdateError \} = await supabase\par
        .from('orders')\par
        .update(\{ client_address: address \})\par
        .eq('id', order.id);\par
\par
      if (clientUpdateError) \{\par
        console.error('Error updating client_address:', clientUpdateError);\par
        throw new Error(`Failed to update client_address: $\{clientUpdateError.message\}`);\par
      \}\par
\par
      const balanceCheck = await checkWalletBalance(address, order.amount, paymentToken);\par
      if (!balanceCheck.hasEnoughFunds) \{\par
        const feeText = paymentToken === 'EGLD' ? ' (including 10% fee)' : '';\par
        throw new Error(\par
          `Insufficient funds. You need at least $\{balanceCheck.required.toFixed(4)\} $\{tokenDisplayName\}$\{feeText\}, but you only have $\{balanceCheck.balance.toFixed(4)\} $\{tokenDisplayName\}.`\par
        );\par
      \}\par
\par
      const hexOrderId = uuidToHex(order.id);\par
      const providerAddressHex = addressToHex(providerAddress);\par
      const clientAddressHex = addressToHex(address);\par
      const deadline = getDeadlineTimestamp();\par
      const deadlineHex = deadline.toString(16).padStart(16, '0');\par
\par
      console.log('Transaction parameters:', \{\par
        orderId: order.id,\par
        hexOrderId,\par
        clientAddress: address,\par
        clientAddressHex,\par
        providerAddress,\par
        providerAddressHex,\par
        deadline,\par
        deadlineHex,\par
        paymentToken,\par
        amount: order.amount,\par
      \});\par
\par
      let transaction;\par
      if (paymentToken === 'EGLD') \{\par
        const amount = BigInt(Math.round(order.amount * 1e18));\par
        const data = `deposit@$\{hexOrderId\}@$\{clientAddressHex\}@$\{providerAddressHex\}@$\{deadlineHex\}`;\par
        transaction = new Transaction(\{\par
          value: amount,\par
          data: Buffer.from(data),\par
          receiver: new Address(ESCROW_ADDRESS),\par
          gasLimit: BigInt(20000000),\par
          sender: new Address(address),\par
          chainID: network.chainId,\par
        \});\par
        console.log('Creating EGLD transaction:', \{\par
          orderId: order.id,\par
          hexOrderId,\par
          clientAddressHex,\par
          providerAddress,\par
          providerAddressHex,\par
          deadline,\par
          deadlineHex,\par
          amount: amount.toString(),\par
          data,\par
          escrowAddress: ESCROW_ADDRESS,\par
        \});\par
      \} else \{\par
        const value = BigInt(Math.round(order.amount * 1e18));\par
        const tokenIdHex = Buffer.from(paymentToken, 'utf8').toString('hex');\par
        const amountHex = value.toString(16);\par
        const paddedAmountHex = amountHex.length % 2 === 0 ? amountHex : '0' + amountHex;\par
        const functionNameHex = Buffer.from('depositEsdt', 'utf8').toString('hex');\par
        const data = `ESDTTransfer@$\{tokenIdHex\}@$\{paddedAmountHex\}@$\{functionNameHex\}@$\{hexOrderId\}@$\{providerAddressHex\}@$\{deadlineHex\}`;\par
        transaction = new Transaction(\{\par
          value: BigInt(0),\par
          data: Buffer.from(data),\par
          receiver: new Address(ESCROW_ADDRESS),\par
          gasLimit: BigInt(20000000),\par
          sender: new Address(address),\par
          chainID: network.chainId,\par
        \});\par
        console.log('Creating ESDT transaction:', \{\par
          orderId: order.id,\par
          hexOrderId,\par
          providerAddress,\par
          providerAddressHex,\par
          deadline,\par
          deadlineHex,\par
          tokenId: paymentToken,\par
          tokenIdHex,\par
          paddedAmountHex,\par
          data,\par
          escrowAddress: ESCROW_ADDRESS,\par
        \});\par
      \}\par
\par
      console.log('Calling signAndSendTransactions...');\par
      const sessionId = await signAndSendTransactions(\{\par
        transactions: [transaction],\par
        transactionsDisplayInfo: \{\par
          processingMessage: `Processing $\{tokenDisplayName\} payment...`,\par
          errorMessage: `$\{tokenDisplayName\} payment failed`,\par
          successMessage: `$\{tokenDisplayName\} payment successful`,\par
        \},\par
        timeout: 300000,\par
      \});\par
\par
      console.log(`$\{tokenDisplayName\} payment successful, session ID:`, sessionId);\par
\par
      const verification = await monitorTransactionStatus(sessionId);\par
      if (!verification.success) \{\par
        throw new Error(verification.error || 'Transaction failed during verification');\par
      \}\par
\par
      const \{ error: updateError \} = await supabase\par
        .from('orders')\par
        .update(\{\par
          payment_status: 'escrowed',\par
          status: 'in_progress',\par
          status_updated_at: new Date().toISOString(),\par
          provider_address: providerAddress,\par
          client_address: address,\par
          transaction_hash: sessionId,\par
        \})\par
        .eq('id', order.id);\par
\par
      if (updateError) \{\par
        console.error('Error updating order:', updateError);\par
        throw new Error(`Database update failed: $\{updateError.message\}`);\par
      \}\par
\par
      console.log('Payment successful and database updated');\par
      setShowPaymentModal(false);\par
      window.location.reload();\par
    \} catch (error) \{\par
      console.error('Payment error:', error);\par
      const errorMessage = error instanceof Error\par
        ? error.message.includes('timeout')\par
          ? 'Transaction signing timeout expired. Please try again and ensure your wallet is unlocked.'\par
          : error.message.includes('User rejected')\par
          ? 'Transaction was cancelled by the user.'\par
          : error.message.includes('Insufficient funds')\par
          ? 'Insufficient funds in the wallet.'\par
          : error.message.includes('fail')\par
          ? 'Transaction failed on the smart contract. There may already be a payment for this order or invalid parameters.'\par
          : `$\{tokenDisplayName\} payment failed: $\{error.message\}`\par
        : `$\{tokenDisplayName\} payment failed: Unknown error`;\par
      setProviderAddressError(errorMessage);\par
    \} finally \{\par
      setIsPaymentLoading(false);\par
    \}\par
  \};\par
\par
  const handleReleasePayment = async () => \{\par
    try \{\par
      setIsReleaseLoading(true);\par
      if (!address || !order) \{\par
        alert('Please connect your wallet');\par
        return;\par
      \}\par
\par
      const hexOrderId = uuidToHex(order.id);\par
      const transaction = new Transaction(\{\par
        value: BigInt(0),\par
        data: Buffer.from(`release@$\{hexOrderId\}`),\par
        receiver: new Address(ESCROW_ADDRESS),\par
        gasLimit: BigInt(20000000),\par
        sender: new Address(address),\par
        chainID: network.chainId,\par
      \});\par
\par
      console.log('Creating release transaction:', \{ orderId: order.id, hexOrderId, escrowAddress: ESCROW_ADDRESS \});\par
\par
      const sessionId = await signAndSendTransactions(\{\par
        transactions: [transaction],\par
        transactionsDisplayInfo: \{\par
          processingMessage: 'Releasing payment...',\par
          errorMessage: 'Release failed',\par
          successMessage: 'Payment successfully released',\par
        \},\par
        timeout: 120000,\par
      \});\par
\par
      console.log('Payment released, session ID:', sessionId);\par
      const verification = await monitorTransactionStatus(sessionId);\par
      if (!verification.success) \{\par
        throw new Error(verification.error || 'Release failed during verification');\par
      \}\par
\par
      const \{ error \} = await supabase\par
        .from('orders')\par
        .update(\{\par
          payment_status: 'released',\par
          status: 'completed',\par
          status_updated_at: new Date().toISOString(),\par
          work_status: 'completed',\par
        \})\par
        .eq('id', order.id);\par
\par
      if (error) \{\par
        console.error('Error updating order:', error);\par
        throw new Error(`Database update failed: $\{error.message\}`);\par
      \}\par
\par
      try \{\par
        await supabase.from('notifications').insert(\{\par
          user_id: order.gig?.provider?.id || order.gig?.provider_id,\par
          type: 'payment_released',\par
          title: 'Payment Released',\par
          content: `Payment for order "$\{order.gig?.title || 'Custom Project'\}" has been successfully released.`,\par
          data: \{ order_id: order.id \},\par
          read: false,\par
        \});\par
      \} catch (notificationError) \{\par
        console.error('Error sending notification:', notificationError);\par
      \}\par
\par
      try \{\par
        await supabase.from('messages').insert(\{\par
          order_id: order.id,\par
          sender_id: user?.id || order.client?.id,\par
          content: JSON.stringify(\{\par
            type: 'payment_released',\par
            message: '\f1\u-10179?\u-9040?\f2  \f0 Payment has been successfully released! The order is completed.',\par
          \}),\par
          attachments: [],\par
        \});\par
      \} catch (messageError) \{\par
        console.error('Error adding system message:', messageError);\par
      \}\par
\par
      setTimeout(() => \{\par
        window.location.reload();\par
      \}, 1000);\par
    \} catch (error) \{\par
      console.error('Release error:', error);\par
    \} finally \{\par
      setIsReleaseLoading(false);\par
    \}\par
  \};\par
\par
  const handleDisputePayment = async (reason: string) => \{\par
    try \{\par
      setIsPaymentLoading(true);\par
      if (!address || !order) \{\par
        alert('Please connect your wallet');\par
        return;\par
      \}\par
\par
      const hexOrderId = uuidToHex(order.id);\par
      const transaction = new Transaction(\{\par
        value: BigInt(0),\par
        data: Buffer.from(`dispute@$\{hexOrderId\}`),\par
        receiver: new Address(ESCROW_ADDRESS),\par
        gasLimit: BigInt(20000000),\par
        sender: new Address(address),\par
        chainID: network.chainId,\par
      \});\par
\par
      console.log('Creating dispute transaction:', \{ orderId: order.id, hexOrderId, reason, escrowAddress: ESCROW_ADDRESS \});\par
\par
      const sessionId = await signAndSendTransactions(\{\par
        transactions: [transaction],\par
        transactionsDisplayInfo: \{\par
          processingMessage: 'Creating dispute...',\par
          errorMessage: 'Dispute creation failed',\par
          successMessage: 'Dispute successfully created',\par
        \},\par
        timeout: 120000,\par
      \});\par
\par
      console.log('Dispute created, session ID:', sessionId);\par
      const verification = await monitorTransactionStatus(sessionId);\par
      if (!verification.success) \{\par
        throw new Error(verification.error || 'Dispute creation failed during verification');\par
      \}\par
\par
      const \{ error \} = await supabase\par
        .from('orders')\par
        .update(\{\par
          payment_status: 'disputed',\par
          status_updated_at: new Date().toISOString(),\par
        \})\par
        .eq('id', order.id);\par
\par
      if (error) \{\par
        console.error('Error updating order:', error);\par
        throw new Error(`Database update failed: $\{error.message\}`);\par
      \}\par
\par
      await supabase.from('notifications').insert(\{\par
        user_id: order.client?.id,\par
        type: 'dispute_created',\par
        title: 'Order Disputed',\par
        content: `A dispute has been created for order $\{order.id\}. Reason: $\{reason\}`,\par
        data: \{ order_id: order.id \},\par
        read: false,\par
      \});\par
\par
      setShowDisputeModal(false);\par
      window.location.reload();\par
    \} catch (error) \{\par
      console.error('Dispute error:', error);\par
    \} finally \{\par
      setIsPaymentLoading(false);\par
    \}\par
  \};\par
\par
  const handleSubmitWork = async () => \{\par
    try \{\par
      setIsSubmitWorkLoading(true);\par
      if (!order) \{\par
        alert('Order not found');\par
        return;\par
      \}\par
\par
      const \{ error \} = await supabase\par
        .from('orders')\par
        .update(\{\par
          work_status: 'submitted',\par
          status: 'delivered',\par
          status_updated_at: new Date().toISOString(),\par
        \})\par
        .eq('id', order.id);\par
\par
      if (error) \{\par
        throw new Error(`Order update failed: $\{error.message\}`);\par
      \}\par
\par
      await supabase.from('notifications').insert(\{\par
        user_id: order.client?.id,\par
        type: 'work_delivered',\par
        title: 'Work Delivered',\par
        content: 'The provider has delivered the work for your order. Please review and release the payment if you are satisfied.',\par
        data: \{ order_id: order.id \},\par
        read: false,\par
      \});\par
\par
      await supabase.from('messages').insert(\{\par
        order_id: order.id,\par
        sender_id: user?.id || order.client?.id,\par
        content: JSON.stringify(\{\par
          type: 'work_delivered',\par
          message: '\f4\u9989?\f2  \f0 Work has been delivered! The client can now review and release the payment.',\par
        \}),\par
        attachments: [],\par
      \});\par
\par
      success('Work has been successfully delivered');\par
      window.location.reload();\par
    \} catch (error) \{\par
      console.error('Submit work error:', error);\par
      showError(error instanceof Error ? error.message : 'Error submitting work');\par
    \} finally \{\par
      setIsSubmitWorkLoading(false);\par
    \}\par
  \};\par
\par
  const getStatusColor = (status: string) => \{\par
    switch (status) \{\par
      case 'completed':\par
        return 'green';\par
      case 'delivered':\par
        return 'yellow';\par
      case 'in_progress':\par
        return 'blue';\par
      case 'cancelled':\par
        return 'red';\par
      default:\par
        return 'gray';\par
    \}\par
  \};\par
\par
  const getPaymentStatusColor = (status: string) => \{\par
    switch (status) \{\par
      case 'escrowed':\par
        return 'green';\par
      case 'pending_release':\par
        return 'yellow';\par
      case 'released':\par
        return 'green';\par
      case 'disputed':\par
        return 'red';\par
      case 'resolved':\par
        return 'purple';\par
      default:\par
        return 'gray';\par
    \}\par
  \};\par
\par
  const getProgressValue = (status: string) => \{\par
    switch (status) \{\par
      case 'completed':\par
        return 100;\par
      case 'delivered':\par
        return 75;\par
      case 'in_progress':\par
        return 50;\par
      case 'cancelled':\par
        return 100;\par
      default:\par
        return 25;\par
    \}\par
  \};\par
\par
  const getRemainingTime = () => \{\par
    if (!order?.deadline) return null;\par
    const now = new Date();\par
    const deadline = new Date(order.deadline);\par
    const diff = deadline.getTime() - now.getTime();\par
    if (diff <= 0) return 'Deadline expired';\par
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));\par
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));\par
    if (days > 0) return `$\{days\} days remaining`;\par
    return `$\{hours\} hours remaining`;\par
  \};\par
\par
  const isClient = user?.id === order?.client?.id;\par
  const isProvider =\par
    user?.id === order?.gig?.provider_id ||\par
    user?.id === order?.gig?.provider?.id ||\par
    (user?.wallet_address && order?.provider_address && user.wallet_address === order.provider_address) ||\par
    (user?.wallet_address && order?.gig?.provider?.wallet_address && user.wallet_address === order.gig.provider.wallet_address);\par
\par
  const canPay =\par
    isClient &&\par
    (order?.status === 'pending_approval' || order?.status === 'in_progress') &&\par
    order?.payment_status === 'pending' &&\par
    !providerAddressError;\par
  const canRelease = isClient && order?.status === 'delivered' && order?.payment_status === 'escrowed';\par
  const canSubmitWork =\par
    isProvider &&\par
    order?.status === 'in_progress' &&\par
    order?.payment_status === 'escrowed' &&\par
    order?.work_status !== 'submitted';\par
  const canDispute =\par
    (isClient || isProvider) &&\par
    order?.payment_status === 'escrowed' &&\par
    order?.status !== 'completed' &&\par
    order?.status !== 'cancelled';\par
  const wasDisputed = order?.payment_status === 'disputed' || order?.payment_status === 'resolved';\par
  const isDisputeResolved = order?.payment_status === 'resolved';\par
\par
  useEffect(() => \{\par
    console.log('\f1\u-10179?\u-8947?\f2  \f0 OrderDetails: Provider Debug info:', \{\par
      userId: user?.id,\par
      userWalletAddress: user?.wallet_address,\par
      orderGigProviderId: order?.gig?.provider_id,\par
      orderGigProviderUserId: order?.gig?.provider?.id,\par
      orderProviderAddress: order?.provider_address,\par
      gigProviderWalletAddress: order?.gig?.provider?.wallet_address,\par
      isProvider,\par
      isClient,\par
      canSubmitWork,\par
      orderStatus: order?.status,\par
      paymentStatus: order?.payment_status,\par
      workStatus: order?.work_status,\par
    \});\par
\par
    if (order && !isLoading) \{\par
      const providerAddress = order.provider_address || order.gig?.provider?.wallet_address;\par
      if (!isValidAddress(providerAddress) && order.gig_id) \{\par
        fetchProviderAddress(order.gig_id).then((address) => \{\par
          if (!address) \{\par
            setProviderAddressError('Invalid or missing provider address. Please check the gig details.');\par
          \}\par
        \});\par
      \}\par
    \}\par
  \}, [order, isLoading]);\par
\par
  if (isLoading) \{\par
    return (\par
      <div className="container mx-auto max-w-7xl px-6 py-8">\par
        <Card className="p-8" title="Loading order details" reference="#">\par
          <div className="flex justify-center">\par
            <div className="space-y-4 text-center">\par
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>\par
              <p className="text-white">Loading order details...</p>\par
            </div>\par
          </div>\par
        </Card>\par
      </div>\par
    );\par
  \}\par
\par
  if (error || !order) \{\par
    return (\par
      <div className="container mx-auto max-w-7xl px-6 py-8">\par
        <div className="bg-gray-800 p-8 rounded-lg">\par
          <p className="text-white">\{error ? `Error: $\{error.message\}` : 'Order not found'\}</p>\par
        </div>\par
      </div>\par
    );\par
  \}\par
\par
  const paymentToken = order.payment_token;\par
  const tokenDisplayName = getTokenDisplayName(paymentToken);\par
  const feeInfo = calculateFees(order.amount, paymentToken);\par
  return (\par
    <div className="container mx-auto max-w-7xl px-6 py-8">\par
      <div className="space-y-8">\par
        <Card className="p-8" title="Order Details" reference="#">\par
          <div className="space-y-6">\par
            <div className="flex justify-between items-center flex-wrap gap-4">\par
              <h1 className="text-2xl font-bold text-white">\{order.gig?.title || 'Custom Project'\}</h1>\par
              <div className="flex gap-3">\par
                <span\par
                  className=\{`px-3 py-1 rounded-full text-sm font-medium $\{\par
                    getStatusColor(order.status) === 'green'\par
                      ? 'bg-green-100 text-green-800'\par
                      : getStatusColor(order.status) === 'blue'\par
                      ? 'bg-blue-100 text-blue-800'\par
                      : getStatusColor(order.status) === 'red'\par
                      ? 'bg-red-100 text-red-800'\par
                      : 'bg-gray-100 text-gray-800'\par
                  \}`\}\par
                >\par
                  \{order.status.charAt(0).toUpperCase() + order.status.slice(1)\}\par
                </span>\par
                <span\par
                  className=\{`px-3 py-1 rounded-full text-sm font-medium $\{\par
                    getPaymentStatusColor(order.payment_status) === 'green'\par
                      ? 'bg-green-100 text-green-800'\par
                      : getPaymentStatusColor(order.payment_status) === 'yellow'\par
                      ? 'bg-yellow-100 text-yellow-800'\par
                      : getPaymentStatusColor(order.payment_status) === 'red'\par
                      ? 'bg-red-100 text-red-800'\par
                      : 'bg-gray-100 text-gray-800'\par
                  \}`\}\par
                >\par
                  Payment: \{order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)\} (\par
                  \{tokenDisplayName\})\par
                </span>\par
                \{wasDisputed && (\par
                  <span\par
                    className=\{`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 $\{\par
                      isDisputeResolved ? 'bg-purple-100 text-purple-800' : 'bg-red-100 text-red-800'\par
                    \}`\}\par
                  >\par
                    \{isDisputeResolved ? (\par
                      <>\par
                        <Shield size=\{14\} className="text-purple-400" />\par
                        Resolved by Admin\par
                      </>\par
                    ) : (\par
                      <>\par
                        <AlertTriangle size=\{14\} className="text-red-800" />\par
                        Dispute\par
                      </>\par
                    )\}\par
                  </span>\par
                )\}\par
              </div>\par
            </div>\par
\par
            \{isDisputeResolved && (\par
              <div className="bg-gradient-to-r from-purple-900 to-blue-900 border-2 border-purple-400 rounded-xl p-6 text-center">\par
                <div className="flex justify-center gap-3 mb-3">\par
                  <Shield size=\{24\} className="text-purple-400" />\par
                  <CheckCircle size=\{24\} className="text-green-400" />\par
                </div>\par
                <h3 className="text-lg font-bold text-white mb-2">\f3\u-10180?\u-8229?\u-497?\f2  \f0 Dispute Resolved by Administration</h3>\par
                <p className="text-gray-300 max-w-sm mx-auto">\par
                  This dispute has been officially resolved by the platform administration. The decision is final, and\par
                  funds have been distributed.\par
                </p>\par
              </div>\par
            )\}\par
\par
            \{providerAddressError && (\par
              <div className="bg-red-100 border border-red-500 rounded-xl p-4">\par
                <div className="flex items-center">\par
                  <AlertTriangle size=\{20\} className="text-red-800 mr-2" />\par
                  <p className="text-red-800">\{providerAddressError\}</p>\par
                </div>\par
              </div>\par
            )\}\par
\par
            \{canPay && (\par
              <div className="bg-blue-100 border border-blue-500 rounded-xl p-4">\par
                <div className="flex justify-between items-center">\par
                  <div>\par
                    <h3 className="text-gray-800 font-bold">Payment Required</h3>\par
                    <p className="text-gray-800">\par
                      Please pay \{feeInfo.clientPays\} \{tokenDisplayName\} to start the order.\par
                    </p>\par
                    \{paymentToken === 'EGLD' && (\par
                      <p className="text-gray-600 text-sm mt-1">\par
                        Provider will receive \{feeInfo.providerGets\} EGLD (after deducting \{feeInfo.feePercentage\}% fee)\par
                      </p>\par
                    )\}\par
                  </div>\par
                  <Button\par
                    onClick=\{() => setShowPaymentModal(true)\}\par
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"\par
                    disabled=\{!!providerAddressError\}\par
                  >\par
                    <DollarSign size=\{16\} className="text-white" />\par
                    Pay Now\par
                  </Button>\par
                </div>\par
              </div>\par
            )\}\par
\par
            \{canSubmitWork && (\par
              <div className="bg-blue-100 border border-blue-500 rounded-xl p-4">\par
                <div className="flex justify-between items-center">\par
                  <div>\par
                    <h3 className="text-gray-800 font-bold">Work Ready to Submit?</h3>\par
                    <p className="text-gray-800">\par
                      Once the work is completed, click the button to notify the client.\par
                    </p>\par
                  </div>\par
                  <Button\par
                    onClick=\{handleSubmitWork\}\par
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"\par
                    disabled=\{isSubmitWorkLoading\}\par
                  >\par
                    <FileText size=\{16\} className="text-white" />\par
                    Submit Work\par
                  </Button>\par
                </div>\par
              </div>\par
            )\}\par
\par
            \{canRelease && (\par
              <div className="bg-green-100 border border-green-500 rounded-xl p-4">\par
                <div className="flex justify-between items-center">\par
                  <div>\par
                    <h3 className="text-gray-800 font-bold">Work Delivered</h3>\par
                    <p className="text-gray-800">\par
                      The provider has delivered the work. Please review and release the payment if you are satisfied.\par
                    </p>\par
                  </div>\par
                  <Button\par
                    onClick=\{handleReleasePayment\}\par
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"\par
                    disabled=\{isReleaseLoading\}\par
                  >\par
                    <Check size=\{16\} className="text-white" />\par
                    Release Payment\par
                  </Button>\par
                </div>\par
              </div>\par
            )\}\par
\par
            \{canDispute && (\par
              <div className="bg-red-100 border border-red-500 rounded-xl p-4">\par
                <div className="flex justify-between items-center">\par
                  <div>\par
                    <h3 className="text-gray-800 font-bold">Issue with the Order?</h3>\par
                    <p className="text-gray-800">\par
                      If you have an issue, you can create a dispute to be reviewed by the administration.\par
                    </p>\par
                  </div>\par
                  <Button\par
                    onClick=\{() => setShowDisputeModal(true)\}\par
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"\par
                    disabled=\{isPaymentLoading\}\par
                  >\par
                    <AlertTriangle size=\{16\} className="text-white" />\par
                    Create Dispute\par
                  </Button>\par
                </div>\par
              </div>\par
            )\}\par
\par
            <div>\par
              <div className="flex justify-between mb-2">\par
                <span className="text-gray-400">Order Progress</span>\par
                \{order.status === 'in_progress' && <span className="text-blue-400">\{getRemainingTime()\}</span>\}\par
              </div>\par
              <div className="w-full bg-gray-700 rounded-full h-2">\par
                <div\par
                  className=\{`h-2 rounded-full $\{\par
                    getStatusColor(order.status) === 'green'\par
                      ? 'bg-green-500'\par
                      : getStatusColor(order.status) === 'blue'\par
                      ? 'bg-blue-500'\par
                      : getStatusColor(order.status) === 'red'\par
                      ? 'bg-red-500'\par
                      : 'bg-yellow-500'\par
                  \}`\}\par
                  style=\{\{ width: `$\{getProgressValue(order.status)\}%` \}\}\par
                ></div>\par
              </div>\par
              <div className="flex justify-between mt-2 text-gray-400 text-sm">\par
                <span>Order Created</span>\par
                <span>In Progress</span>\par
                <span>Delivered</span>\par
                <span>Completed</span>\par
              </div>\par
            </div>\par
\par
            <hr className="border-gray-600" />\par
\par
            <div>\par
              <p className="text-gray-400 mb-2">Order Requirements:</p>\par
              <p className="text-grey">\{order.requirements?.description || 'No specific requirements'\}</p>\par
            </div>\par
\par
            <hr className="border-gray-600" />\par
\par
            <div className="flex justify-between items-center">\par
              <div>\par
                <p className="text-gray-400 mb-2">Client</p>\par
                <div className="flex items-center gap-3">\par
                  <div className="w-8 h-8 rounded-full overflow-hidden relative bg-gray-600">\par
                    \{order.client?.avatar_url ? (\par
                      <>\par
                        <img\par
                          src=\{order.client.avatar_url\}\par
                          alt=\{order.client.username || 'Client'\}\par
                          className="w-full h-full object-cover"\par
                          onError=\{(e) => \{\par
                            const target = e.target as HTMLImageElement;\par
                            target.style.display = 'none';\par
                            const parent = target.parentElement;\par
                            if (parent) \{\par
                              const fallback = parent.querySelector('.fallback-avatar') as HTMLElement;\par
                              if (fallback) fallback.style.display = 'flex';\par
                            \}\par
                          \}\}\par
                        />\par
                        <div\par
                          className="fallback-avatar w-full h-full bg-gray-600 flex items-center justify-center text-xs text-white absolute inset-0"\par
                          style=\{\{ display: 'none' \}\}\par
                        >\par
                          \{order.client?.username?.charAt(0)?.toUpperCase() || '?'\}\par
                        </div>\par
                      </>\par
                    ) : (\par
                      <div className="w-full h-full bg-gray-600 flex items-center justify-center text-xs text-white">\par
                        \{order.client?.username?.charAt(0)?.toUpperCase() || '?'\}\par
                      </div>\par
                    )\}\par
                  </div>\par
                  <span className="text-grey">\{order.client?.username || 'Unknown'\}</span>\par
                </div>\par
              </div>\par
              <div>\par
                <p className="text-gray-400 mb-2">Amount</p>\par
                <p className="text-blue-400 text-xl font-bold">\par
                  \{order.amount\} \{tokenDisplayName\}\par
                </p>\par
                \{paymentToken === 'EGLD' && (\par
                  <p className="text-gray-400 text-sm">Provider will receive: \{feeInfo.providerGets\} EGLD</p>\par
                )\}\par
                \{isDisputeResolved && <p className="text-purple-300 text-sm mt-1">\f4\u9989?\f2  \f0 Resolved by Admin</p>\}\par
              </div>\par
            </div>\par
          </div>\par
        </Card>\par
\par
        <div className="bg-gray-800 p-8 rounded-lg">\par
          <h2 className="text-xl font-bold text-white mb-6">Communication</h2>\par
          <OrderChat orderId=\{order.id\} />\par
        </div>\par
      </div>\par
\par
      \{showPaymentModal && (\par
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">\par
          <div className="bg-gray-800 p-6 max-w-lg w-full mx-4 rounded-lg">\par
            <h3 className="text-xl font-bold text-white mb-4">Complete Payment</h3>\par
            <div className="space-y-4">\par
              <div className="bg-blue-100 border border-blue-500 rounded-md p-3">\par
                <div className="flex items-center">\par
                  <span className="text-blue-800 mr-2">\f3\u8505?\u-497?\f0 </span>\par
                  <div>\par
                    <p className="text-blue-800 font-medium">Secure escrow payment</p>\par
                    <p className="text-blue-800 text-sm">\par
                      Your payment will be held in escrow until approval of completed work.\par
                    </p>\par
                  </div>\par
                </div>\par
              </div>\par
              <div className="bg-gray-800 p-4 rounded-md">\par
                <div className="space-y-3">\par
                  <div className="flex justify-between">\par
                    <span className="text-gray-400">Order amount:</span>\par
                    <span className="text-white font-bold">\par
                      \{order.amount\} \{tokenDisplayName\}\par
                    </span>\par
                  </div>\par
                  <div className="flex justify-between">\par
                    <span className="text-gray-400">Service fee:</span>\par
                    <span className="text-white">\par
                      \{feeInfo.platformFee > 0\par
                        ? `$\{feeInfo.platformFee.toFixed(2)\} $\{tokenDisplayName\} ($\{feeInfo.feePercentage\}%)`\par
                        : `0 $\{tokenDisplayName\} (0%)`\}\par
                    </span>\par
                  </div>\par
                  <div className="flex justify-between">\par
                    <span className="text-gray-400">Provider will receive:</span>\par
                    <span className="text-white font-bold">\par
                      \{feeInfo.providerGets\} \{tokenDisplayName\}\par
                    </span>\par
                  </div>\par
                  <hr className="border-gray-600" />\par
                  <div className="flex justify-between">\par
                    <span className="text-gray-400">You will pay total:</span>\par
                    <span className="text-blue-400 font-bold">\par
                      \{feeInfo.clientPays\} \{tokenDisplayName\}\par
                    </span>\par
                  </div>\par
                </div>\par
              </div>\par
            </div>\par
            <div className="flex gap-3 mt-6">\par
              <Button\par
                onClick=\{() => setShowPaymentModal(false)\}\par
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg"\par
              >\par
                Cancel\par
              </Button>\par
              <Button\par
                onClick=\{handlePayment\}\par
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2"\par
                disabled=\{isPaymentLoading || !!providerAddressError\}\par
              >\par
                <DollarSign size=\{16\} className="text-white" />\par
                \{isPaymentLoading ? 'Processing...' : 'Pay Now'\}\par
              </Button>\par
            </div>\par
          </div>\par
        </div>\par
      )\}\par
\par
      <DisputeModal\par
        isOpen=\{showDisputeModal\}\par
        onClose=\{() => setShowDisputeModal(false)\}\par
        order=\{order\}\par
        onDisputeSubmitted=\{() => \{\par
          setShowDisputeModal(false);\par
          window.location.reload();\par
        \}\}\par
      />\par
    </div>\par
  );\par
\};\par
\par
export \{ OrderDetails \};\lang27\par
}
 