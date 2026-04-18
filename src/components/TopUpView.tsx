import React, { useState } from 'react';
import { CreditCard, Zap, Crown, Check, X, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function TopUpView({ currentBalance }: { currentBalance: number }) {
  const [showQris, setShowQris] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  const packages = [
    {
      id: 'starter',
      name: 'Starter Pack',
      price: 'Rp 49.000',
      credits: 5,
      features: ['5 Artikel Full SEO', 'Generasi Gambar AI', 'Posting Otomatis ke WP'],
      icon: Zap,
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro Publisher',
      price: 'Rp 149.000',
      credits: 20,
      features: ['20 Artikel Full SEO', 'Generasi Gambar AI', 'Posting Otomatis ke WP', 'Prioritas Antrean Agen'],
      icon: CreditCard,
      popular: true
    },
    {
      id: 'sultan',
      name: 'Sultan Agency',
      price: 'Rp 399.000',
      credits: 100,
      features: ['100 Artikel Full SEO', 'Resolusi Gambar HD', 'Multi-Website WP', 'Support Prioritas VIP'],
      icon: Crown,
      popular: false
    }
  ];

  const handleBuy = (pkg: any) => {
    setSelectedPackage(pkg);
    setShowQris(true);
  };

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <header className="flex items-end justify-between mb-12">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase">Top-Up Saldo</h2>
          <p className="text-sm text-text-muted mt-2 font-medium">Beli kredit token untuk agen otomatis Anda.</p>
        </div>
        <div className="bg-primary/10 border border-primary/30 px-6 py-4 rounded-2xl flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Saldo Saat Ini</p>
            <p className="text-2xl font-black text-white">{currentBalance} <span className="text-sm text-text-muted">Kredit</span></p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {packages.map((pkg) => {
          const Icon = pkg.icon;
          return (
            <div 
              key={pkg.id} 
              className={`relative glass-panel rounded-[2rem] p-8 flex flex-col transition-all duration-300 hover:-translate-y-2
                ${pkg.popular ? 'border-primary shadow-[0_0_30px_rgba(0,242,254,0.15)] bg-gradient-to-b from-primary/5 to-transparent' : 'border-white/10'}`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-bg px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/30">
                  Paling Laris
                </div>
              )}
              
              <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
                <Icon className={`w-7 h-7 ${pkg.popular ? 'text-primary' : 'text-text-muted'}`} />
              </div>
              
              <h3 className="text-xl font-black text-white mb-2">{pkg.name}</h3>
              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-3xl font-black text-white">{pkg.price}</span>
              </div>
              
              <div className="py-4 border-y border-white/10 mb-8 flex items-center justify-between">
                <span className="text-xs text-text-muted font-bold uppercase tracking-widest">Mendapatkan</span>
                <span className="text-lg font-black text-primary">{pkg.credits} Kredit</span>
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {pkg.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-text-muted">
                    <div className="mt-1 w-4 h-4 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                      <Check className="w-2 h-2 text-success" />
                    </div>
                    {feat}
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handleBuy(pkg)}
                className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                  ${pkg.popular 
                    ? 'bg-primary text-bg shadow-[0_0_20px_rgba(0,242,254,0.3)] hover:shadow-[0_0_30px_rgba(0,242,254,0.5)]' 
                    : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'}`}
              >
                Pilih Paket
              </button>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {showQris && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-bg border border-white/10 p-8 rounded-[2rem] max-w-sm w-full relative"
            >
              <button 
                onClick={() => setShowQris(false)}
                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full bg-primary/20 mx-auto flex items-center justify-center mb-4">
                  <QrCode className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">Scan untuk Bayar</h3>
                <p className="text-sm text-text-muted">Total Pembayaran: <strong className="text-primary">{selectedPackage?.price}</strong></p>
              </div>

              <div className="aspect-square bg-white rounded-2xl p-4 flex items-center justify-center mb-8">
                {/* Mock QRIS */}
                <div className="w-full h-full border-4 border-black/10 rounded-xl bg-[url('https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg')] bg-cover bg-center opacity-80" />
              </div>

              <div className="bg-primary/10 rounded-xl p-4 text-center">
                <p className="text-xs text-text-muted">
                  Simulasi Pembayaran (Fase 1). Di fase 2, ini akan terhubung ke Webhook Midtrans/Tripay.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
