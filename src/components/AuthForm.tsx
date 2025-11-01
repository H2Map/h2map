import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Lock, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import type { User, Session } from '@supabase/supabase-js';

const emailSchema = z.string().email({ message: "Email inválido" });
const passwordSchema = z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" });

interface AuthFormProps {
  onSuccess?: () => void;
}

export default function AuthForm({ onSuccess }: AuthFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Redirect authenticated users
        if (session?.user) {
          setTimeout(() => {
            onSuccess?.();
            navigate('/dashboard');
          }, 0);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        onSuccess?.();
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, onSuccess]);

  const validateInputs = () => {
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
      return false;
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs()) return;
    
    setLoading(true);
    
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          toast({
            title: "Email já cadastrado",
            description: "Este email já está em uso. Tente fazer login.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao cadastrar",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Cadastro realizado!",
          description: "Você será redirecionado em instantes.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao processar sua solicitação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateInputs()) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast({
            title: "Credenciais inválidas",
            description: "Email ou senha incorretos.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao entrar",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Login realizado!",
          description: "Bem-vindo de volta.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao processar sua solicitação.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-lg opacity-50 -z-10" />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={isLogin ? 'login' : 'signup'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header with icon */}
          <div className="text-center mb-8">
            <motion.div 
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mb-4 shadow-lg"
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {isLogin ? (
                <LogIn className="w-8 h-8 text-white" />
              ) : (
                <UserPlus className="w-8 h-8 text-white" />
              )}
            </motion.div>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
            </h2>
            <p className="text-slate-600 flex items-center justify-center gap-1">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              {isLogin 
                ? 'Acesse sua conta para continuar' 
                : 'Comece sua jornada sustentável'}
            </p>
          </div>

          <form onSubmit={isLogin ? handleSignIn : handleSignUp} className="space-y-5">
            {/* Email field */}
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Label htmlFor="email" className="text-slate-700 font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="pl-10 h-12 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
            </motion.div>

            {/* Password field */}
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Label htmlFor="password" className="text-slate-700 font-medium">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="pl-10 h-12 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500"
                />
              </div>
              {!isLogin && (
                <p className="text-xs text-slate-500 mt-1">
                  Mínimo de 6 caracteres
                </p>
              )}
            </motion.div>

            {/* Submit button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    {isLogin ? (
                      <>
                        <LogIn className="mr-2 h-5 w-5" />
                        Entrar
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-5 w-5" />
                        Cadastrar
                      </>
                    )}
                  </>
                )}
              </Button>
            </motion.div>
          </form>

          {/* Toggle login/signup */}
          <motion.div 
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-slate-500">ou</span>
              </div>
            </div>
            
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="mt-4 text-emerald-600 hover:text-emerald-700 font-semibold hover:underline transition-all"
              disabled={loading}
            >
              {isLogin 
                ? 'Não tem conta? Cadastre-se gratuitamente' 
                : 'Já tem conta? Faça login'}
            </button>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
