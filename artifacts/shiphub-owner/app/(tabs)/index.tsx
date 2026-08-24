import React from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

export default function Home() {
  const c = useColors(); const insets = useSafeAreaInsets(); const { user } = useAuth();
  const vessels = useQuery({ queryKey:['my-vessels',user?.id], queryFn:api.vessels.list, enabled:!!user });
  const charters = useQuery({ queryKey:['charters'], queryFn:api.charters.list, enabled:!!user });
  if (vessels.isLoading || charters.isLoading) return <View style={[s.center,{backgroundColor:c.background}]}><ActivityIndicator color={c.primary}/></View>;
  const fleet=(vessels.data??[]).filter(v=>user?.role==='admin'||v.ownerId===user?.id);
  const requests=(charters.data??[]).filter(x=>user?.role==='admin'||x.ownerId===user?.id);
  const pad={paddingTop:(Platform.OS==='web'?67:insets.top)+16,paddingBottom:(Platform.OS==='web'?34:insets.bottom)+76};
  return <ScrollView style={{flex:1,backgroundColor:c.background}} contentContainerStyle={[s.page,pad]}>
    <Text style={[s.eyebrow,{color:c.primary}]}>SHIPHUB OWNER</Text><Text style={[s.title,{color:c.foreground}]}>Good day, {user?.name.split(' ')[0]??'Owner'}.</Text>
    <View style={s.metrics}><Metric c={c} value={fleet.length} label="Fleet"/><Metric c={c} value={requests.filter(x=>['enquiry','negotiating'].includes(x.status)).length} label="Open"/><Metric c={c} value={fleet.filter(x=>x.status==='on_hire').length} label="On hire"/></View>
    <Pressable onPress={()=>router.push('/vessel/add')} style={[s.add,{backgroundColor:c.primary}]}><Feather name="plus" color={c.primaryForeground}/><Text style={{color:c.primaryForeground,fontFamily:'Inter_700Bold'}}>Add vessel</Text></Pressable>
    <Text style={[s.section,{color:c.foreground}]}>Charter requests</Text>
    {requests.slice(0,3).map(x=><Pressable key={x.id} onPress={()=>router.push(`/charter/${x.id}`)} style={[s.row,{backgroundColor:c.card,borderColor:c.border}]}><View style={{flex:1}}><Text style={{color:c.foreground,fontFamily:'Inter_600SemiBold'}}>{x.vesselName??`Vessel #${x.vesselId}`}</Text><Text style={{color:c.mutedForeground,fontFamily:'Inter_400Regular',fontSize:13}}>{x.chartererName??'Charter enquiry'}</Text></View><Text style={{color:c.primary,fontFamily:'Inter_600SemiBold',fontSize:12}}>{x.status.replace('_',' ')}</Text></Pressable>)}
  </ScrollView>;
}
function Metric({c,value,label}:{c:ReturnType<typeof useColors>;value:number;label:string}){return <View style={[s.metric,{backgroundColor:c.card,borderColor:c.border}]}><Text style={{color:c.primary,fontFamily:'Inter_700Bold',fontSize:26}}>{value}</Text><Text style={{color:c.mutedForeground,fontFamily:'Inter_500Medium',fontSize:12}}>{label}</Text></View>}
const s=StyleSheet.create({page:{paddingHorizontal:16,gap:12},center:{flex:1,alignItems:'center',justifyContent:'center'},eyebrow:{fontFamily:'Inter_700Bold',fontSize:11,letterSpacing:1.4},title:{fontFamily:'Inter_700Bold',fontSize:27},metrics:{flexDirection:'row',gap:8,marginVertical:10},metric:{flex:1,borderWidth:1,borderRadius:12,padding:12},add:{height:52,borderRadius:12,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8},section:{fontFamily:'Inter_700Bold',fontSize:18,marginTop:14},row:{borderWidth:1,borderRadius:12,padding:14,flexDirection:'row'}});