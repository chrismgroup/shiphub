import React, {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {api, setTokenGetter} from '@/lib/api';
import type {User} from '@/lib/types';
const C = createContext<{user:User|null;isLoading:boolean;login:(e:string,p:string)=>Promise<void>;register:(d:{name:string;email:string;password:string;company?:string;phone?:string})=>Promise<void>;logout:()=>Promise<void>}|null>(null);
const TK='shiphub_owner_auth_token', UK='shiphub_owner_auth_user';
export function AuthProvider({children}:{children:React.ReactNode}) { const [user,setUser]=useState<User|null>(null); const [isLoading,setLoading]=useState(true); const token=useRef<string|null>(null);
 useEffect(()=>{setTokenGetter(()=>token.current); return ()=>setTokenGetter(null)},[]);
 useEffect(()=>{(async()=>{try {const [t,u]=await Promise.all([AsyncStorage.getItem(TK),AsyncStorage.getItem(UK)]); if(t&&u){const parsed=JSON.parse(u) as User; if(parsed.role==='owner'||parsed.role==='admin'){token.current=t;setUser(parsed)} else await AsyncStorage.multiRemove([TK,UK]);}} finally {setLoading(false)}})()},[]);
 const store=useCallback(async(t:string,u:User)=>{if(u.role!=='owner'&&u.role!=='admin') throw new Error('This app is only available to owner and admin accounts.'); token.current=t;setUser(u);await AsyncStorage.multiSet([[TK,t],[UK,JSON.stringify(u)]])},[]);
 const login=useCallback(async(e:string,p:string)=>{const x=await api.auth.login(e,p);await store(x.token,x.user)},[store]);
 const register=useCallback(async(d:{name:string;email:string;password:string;company?:string;phone?:string})=>{const x=await api.auth.register({...d,role:'owner'});await store(x.token,x.user)},[store]);
 const logout=useCallback(async()=>{token.current=null;setUser(null);await AsyncStorage.multiRemove([TK,UK])},[]);
 return <C.Provider value={{user,isLoading,login,register,logout}}>{children}</C.Provider> }
export function useAuth(){const value=useContext(C);if(!value)throw new Error('AuthProvider missing');return value}