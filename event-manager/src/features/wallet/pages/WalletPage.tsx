import { ComingSoonPage } from '@/components/ComingSoonPage';

export function WalletPage() {
  return (
    <ComingSoonPage
      title="Digital Wallet"
      description="Manage your digital wallet balance, track transactions, and handle payments seamlessly within the Another Compile L platform."
      features={[
        'View wallet balance in real-time',
        'Track all transactions history',
        'Top-up wallet with multiple payment methods',
        'Withdraw funds to your bank account',
        'Automatic refunds for cancelled events',
        'Payment receipts and invoices',
        'Spending analytics and insights',
        'Secure payment processing',
      ]}
    />
  );
}
