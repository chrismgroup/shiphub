import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import {useAuth} from '@/context/AuthContext';
import {useColors} from '@/hooks/useColors';
export default function Index(){const {user,isLoading}=useAuth();const c=useColors(); if(isLoading)return <View style={{flex:1,backgroundColor:c.background,alignItems:'center',justifyContent:'center'}}><ActivityIndicator color={c.primary}/></View>;return <Redirect href={user ? '/(tabs)' : '/auth'} />;}