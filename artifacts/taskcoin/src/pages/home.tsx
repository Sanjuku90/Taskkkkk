import { PublicLayout } from "@/components/layout";
import { Button } from "@/components/ui-core";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ChevronRight, ShieldCheck, Zap, Coins } from "lucide-react";

export default function Home() {
  return (
    <PublicLayout>
      <div className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center lg:text-left"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                  V 2.0 Now Live
                </div>
                <h1 className="text-5xl lg:text-7xl font-display font-extrabold tracking-tight text-white mb-6 leading-tight">
                  Invest Smart. <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-amber-200">
                    Earn Daily.
                  </span>
                </h1>
                <p className="text-lg lg:text-xl text-zinc-400 mb-8 max-w-2xl mx-auto lg:mx-0">
                  TaskCoin is the premium platform connecting strategic crypto investments with daily active rewards. Complete simple tasks and multiply your portfolio.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                  <Link href="/register">
                    <Button size="lg" className="w-full sm:w-auto group">
                      Start Earning Now
                      <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" variant="glass" className="w-full sm:w-auto">
                      View Plans
                    </Button>
                  </Link>
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative hidden lg:block"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent blur-3xl rounded-full" />
                <img 
                  src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
                  alt="Crypto 3D representation" 
                  className="relative z-10 w-full rounded-3xl border border-white/10 shadow-2xl shadow-black/50 box-glow object-cover aspect-video"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-24 bg-card/30 border-y border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-bold text-white mb-4">Why Choose TaskCoin?</h2>
              <p className="text-zinc-400 max-w-2xl mx-auto">We provide a secure, transparent, and highly rewarding ecosystem for modern crypto investors.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Zap, title: "Daily Payouts", desc: "Complete simple daily tasks and see returns added instantly to your balance." },
                { icon: ShieldCheck, title: "Secure Platform", desc: "Enterprise-grade security for your USDT and TRX deposits and withdrawals." },
                { icon: Coins, title: "Multiple Plans", desc: "From Starter to VIP Elite, find an investment tier that matches your goals." },
              ].map((feature, i) => (
                <div key={i} className="glass-card p-8 rounded-2xl text-center hover:-translate-y-1 transition-transform duration-300">
                  <div className="w-14 h-14 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-zinc-400">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
