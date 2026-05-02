'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Lock, Unlock, Key, Plus, Trash2, 
  Search, Copy, Eye, EyeOff, Globe, User, ShieldAlert,
  Loader2, Sparkles, RefreshCw, Info, Download, Upload
} from 'lucide-react';
import { useLanguage } from '@/context/language-context';
import { useToast } from '@/hooks/use-toast';

interface Account {
  id: string;
  site: string;
  username: string;
  pass: string;
}

export default function PasswordVault() {
  const [isLocked, setIsLocked] = useState(true);
  const [masterPass, setMasterPass] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [search, setSearch] = useState('');
  const [showPass, setShowPass] = useState<Record<string, boolean>>({});
  
  const [newSite, setNewSite] = useState('');
  const [newUser, setNewUser] = useState('');
  const [newPass, setNewPass] = useState('');
  
  const { t } = useLanguage();
  const { toast } = useToast();

  // AES-GCM Key Derivation
  const deriveKey = async (password: string, salt: Uint8Array) => {
    const encoder = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits', 'deriveKey']
    );
    return window.crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']
    );
  };

  const decryptData = async (encryptedBase64: string, pass: string) => {
    try {
      const combined = new Uint8Array(atob(encryptedBase64).split('').map(c => c.charCodeAt(0)));
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const data = combined.slice(28);
      const key = await deriveKey(pass, salt);
      const decrypted = await window.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
      return JSON.parse(new TextDecoder().decode(decrypted));
    } catch (e) {
      throw new Error("Invalid Master Password");
    }
  };

  const encryptData = async (data: any, pass: string) => {
    const encoder = new TextEncoder();
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(pass, salt);
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv }, key, encoder.encode(JSON.stringify(data))
    );
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0); combined.set(iv, 16); combined.set(new Uint8Array(encrypted), 28);
    return btoa(String.fromCharCode(...combined));
  };

  const handleUnlock = async () => {
    const stored = localStorage.getItem('vault_data');
    if (!stored) {
      setAccounts([]);
      setIsLocked(false);
      return;
    }
    try {
      const decrypted = await decryptData(stored, masterPass);
      setAccounts(decrypted);
      setIsLocked(false);
      toast({ title: "Vault Unlocked", description: "Access granted to secure storage." });
    } catch (e) {
      toast({ title: "Access Denied", variant: "destructive" });
    }
  };

  const saveVault = async (updatedAccounts: Account[]) => {
    const encrypted = await encryptData(updatedAccounts, masterPass);
    localStorage.setItem('vault_data', encrypted);
    setAccounts(updatedAccounts);
  };

  const addAccount = () => {
    if (!newSite || !newPass) return;
    const newAcc = { id: Math.random().toString(36).substr(2, 9), site: newSite, username: newUser, pass: newPass };
    saveVault([...accounts, newAcc]);
    setNewSite(''); setNewUser(''); setNewPass('');
    toast({ title: "Account Added", description: "Credentials encrypted and saved." });
  };

  const deleteAccount = (id: string) => {
    saveVault(accounts.filter(a => a.id !== id));
  };

  const filtered = accounts.filter(a => 
    a.site.toLowerCase().includes(search.toLowerCase()) || 
    a.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    const data = localStorage.getItem('vault_data');
    if (!data) return toast({ title: "Vault Empty", description: "Nothing to backup." });
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `universal_vault_backup_${new Date().toISOString().split('T')[0]}.vault`;
    a.click();
    toast({ title: "Backup Created", description: "Encrypted vault file downloaded." });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      localStorage.setItem('vault_data', content);
      setIsLocked(true);
      setMasterPass('');
      toast({ title: "Import Successful", description: "Vault updated. Please unlock with the original master password." });
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <Card className="border-none shadow-2xl bg-gradient-to-br from-background via-muted/50 to-background overflow-hidden font-sans">
        <CardHeader className="bg-primary/5 border-b border-primary/10 p-8 text-center sm:text-left">
           <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20">
                    <ShieldCheck className="w-8 h-8" />
                 </div>
                 <div>
                    <CardTitle className="text-3xl font-black tracking-tight uppercase">{t('passwordVaultTitle' as any)}</CardTitle>
                    <CardDescription className="text-base font-bold text-primary/60">{t('passwordVaultDesc' as any)}</CardDescription>
                 </div>
              </div>
              {!isLocked && (
                 <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center p-1 bg-muted rounded-xl border-2">
                       <Button variant="ghost" size="sm" onClick={handleExport} className="h-9 rounded-lg gap-2 text-[10px] font-black uppercase">
                          <Download className="w-3 h-3" /> EXPORT
                       </Button>
                       <div className="relative">
                          <input type="file" accept=".vault" onChange={handleImport} className="absolute inset-0 opacity-0 cursor-pointer" />
                          <Button variant="ghost" size="sm" className="h-9 rounded-lg gap-2 text-[10px] font-black uppercase">
                             <Upload className="w-3 h-3" /> IMPORT
                          </Button>
                       </div>
                    </div>
                    <Button variant="outline" onClick={() => { setIsLocked(true); setMasterPass(''); }} className="h-11 rounded-xl border-2 font-black gap-2 bg-background hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all">
                       <Lock className="w-4 h-4" /> LOCK VAULT
                    </Button>
                 </div>
              )}
           </div>
        </CardHeader>

        <CardContent className="p-8">
           <AnimatePresence mode="wait">
              {isLocked ? (
                 <motion.div key="lock" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md mx-auto py-20 space-y-8">
                    <div className="text-center space-y-4">
                       <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Key className="w-10 h-10 text-primary" />
                       </div>
                       <h3 className="text-2xl font-black uppercase tracking-tighter italic">Enter Master Password</h3>
                       <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Only your master key can decrypt this vault.</p>
                    </div>
                    
                    <div className="space-y-4">
                       <Input 
                         type="password" 
                         value={masterPass} 
                         onChange={(e) => setMasterPass(e.target.value)} 
                         onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                         className="h-16 rounded-2xl border-2 text-center text-2xl font-black tracking-widest focus:ring-primary"
                         placeholder="••••••••"
                       />
                       <Button onClick={handleUnlock} className="w-full h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-xl shadow-primary/20">
                          UNLOCK STORAGE
                       </Button>
                    </div>
                    <div className="flex items-center gap-2 p-4 bg-muted/50 rounded-2xl border-2 border-dashed">
                       <ShieldAlert className="w-4 h-4 text-primary" />
                       <p className="text-[10px] font-bold text-muted-foreground italic uppercase">We never see your password. Everything stays local.</p>
                    </div>
                 </motion.div>
              ) : (
                 <motion.div key="vault" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-[1fr,1.5fr] gap-12">
                    {/* Add Section */}
                    <div className="space-y-8">
                       <div className="p-8 rounded-[2.5rem] bg-card border-2 shadow-xl space-y-6">
                          <div className="flex items-center gap-2 mb-2">
                             <Plus className="w-4 h-4 text-primary" />
                             <span className="text-[10px] font-black uppercase tracking-widest opacity-40">New Entry</span>
                          </div>
                          <div className="space-y-4">
                             <div className="relative">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input value={newSite} onChange={(e) => setNewSite(e.target.value)} placeholder="Website / App Name" className="h-12 pl-12 rounded-xl border-2" />
                             </div>
                             <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input value={newUser} onChange={(e) => setNewUser(e.target.value)} placeholder="Username / Email" className="h-12 pl-12 rounded-xl border-2" />
                             </div>
                             <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                <Input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder="Password" className="h-12 pl-12 rounded-xl border-2" />
                             </div>
                             <Button onClick={addAccount} className="w-full h-12 rounded-xl bg-primary text-white font-black uppercase tracking-widest shadow-lg">ENCRYPT & SAVE</Button>
                          </div>
                       </div>

                       <div className="p-8 rounded-[2.5rem] bg-muted/30 border-2 shadow-inner space-y-4">
                          <div className="flex items-center gap-2">
                             <Info className="w-4 h-4 text-primary" />
                             <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Vault Intelligence</span>
                          </div>
                          <p className="text-xs font-bold text-muted-foreground leading-relaxed italic">
                             Using AES-256 GCM encryption. Your data is stored in your browser's persistent storage, making it both fast and impenetrable without your key.
                          </p>
                       </div>
                    </div>

                    {/* List Section */}
                    <div className="space-y-6">
                       <div className="relative">
                          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input 
                            value={search} 
                            onChange={(e) => setSearch(e.target.value)} 
                            placeholder="Search your vault..." 
                            className="h-14 pl-12 rounded-2xl border-2 bg-card/50"
                          />
                       </div>

                       <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                          {filtered.map(acc => (
                             <motion.div 
                               key={acc.id}
                               layout
                               className="p-6 rounded-[2rem] bg-card border-2 shadow-sm hover:shadow-xl hover:border-primary/40 transition-all flex items-center justify-between group"
                             >
                                <div className="flex items-center gap-4">
                                   <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center font-black text-primary text-xl uppercase">
                                      {acc.site[0]}
                                   </div>
                                   <div>
                                      <h4 className="text-lg font-black tracking-tight">{acc.site}</h4>
                                      <p className="text-xs font-bold text-muted-foreground uppercase">{acc.username || 'No Username'}</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-2">
                                   <div className="bg-muted px-4 py-2 rounded-xl border-2 flex items-center gap-3">
                                      <span className="text-sm font-black font-mono">
                                         {showPass[acc.id] ? acc.pass : '••••••••'}
                                      </span>
                                      <Button variant="ghost" size="icon" onClick={() => setShowPass(p => ({ ...p, [acc.id]: !p[acc.id] }))} className="h-6 w-6">
                                         {showPass[acc.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                      </Button>
                                   </div>
                                   <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(acc.pass); toast({ title: "Password Copied" }); }} className="h-10 w-10 text-primary rounded-xl hover:bg-primary/10">
                                      <Copy className="w-4 h-4" />
                                   </Button>
                                   <Button variant="ghost" size="icon" onClick={() => deleteAccount(acc.id)} className="h-10 w-10 text-rose-500 rounded-xl hover:bg-rose-50">
                                      <Trash2 className="w-4 h-4" />
                                   </Button>
                                </div>
                             </motion.div>
                          ))}
                          {filtered.length === 0 && (
                             <div className="py-20 text-center opacity-20 border-2 border-dashed rounded-[3rem]">
                                <RefreshCw className="w-12 h-12 mx-auto mb-4 animate-spin-slow" />
                                <p className="text-[10px] font-black uppercase tracking-widest">Your Vault is Empty</p>
                             </div>
                          )}
                       </div>
                    </div>
                 </motion.div>
              )}
           </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
