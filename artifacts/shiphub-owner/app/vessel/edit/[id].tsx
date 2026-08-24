import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api, createPhotoUploadKey } from '@/lib/api';
import { useColors } from '@/hooks/useColors';
import { VesselPhotoManager } from '@/components/VesselPhotoManager';
import { VESSEL_STATUSES, VESSEL_TYPES, type VesselDetail, type VesselFormData, type VesselPhoto, type VesselStatus } from '@/lib/types';

const empty: VesselFormData = { name:'', vesselType:VESSEL_TYPES[0], contacts:[{contactName:''}] };
type PendingPhotoUpload = {
  asset: ImagePicker.ImagePickerAsset;
  uploadKey: string;
};
export default function EditVessel() {
  const c=useColors(), insets=useSafeAreaInsets(), {id}=useLocalSearchParams<{id:string}>(), vesselId=Number(id), qc=useQueryClient();
  const vessel=useQuery({queryKey:['vessel',vesselId],queryFn:()=>api.vessels.get(vesselId),enabled:vesselId>0});
  const [form,setForm]=useState<VesselFormData>(empty); const [ready,setReady]=useState(false);
   const [selectedPhoto,setSelectedPhoto]=useState<PendingPhotoUpload|null>(null); const [uploadError,setUploadError]=useState<string|null>(null); const [uploadProgress,setUploadProgress]=useState<number|null>(null);
  useEffect(()=>{ if(vessel.data&&!ready){const v=vessel.data;setForm({name:v.name,vesselType:v.vesselType,imoNumber:v.imoNumber??'',flag:v.flag??'',dwt:v.dwt??'',grt:v.grt??'',yearBuilt:v.yearBuilt?String(v.yearBuilt):'',loa:v.loa??'',beam:v.beam??'',draft:v.draft??'',classificationSociety:v.classificationSociety??'',tradingArea:v.tradingArea??'',description:v.description??'',contacts:v.contacts.length?v.contacts.map(x=>({contactName:x.contactName,phone:x.phone??'',email:x.email??'',address:x.address??''})):[{contactName:''}]});setReady(true)} },[vessel.data,ready]);
  const refresh=()=>{qc.invalidateQueries({queryKey:['vessel',vesselId]});qc.invalidateQueries({queryKey:['my-vessels']});};
  const save=useMutation({mutationFn:()=>api.vessels.update(vesselId,form),onSuccess:()=>{refresh();Alert.alert('Saved','Vessel listing updated.')},onError:(e:Error)=>Alert.alert('Save failed',e.message)});
  const status=useMutation({mutationFn:(value:VesselStatus)=>api.vessels.patchStatus(vesselId,value),onSuccess:refresh,onError:(e:Error)=>Alert.alert('Status update failed',e.message)});
  const removePhoto=useMutation({mutationFn:(photoId:number)=>api.vessels.photos.delete(vesselId,photoId),onSuccess:refresh,onError:(e:Error)=>Alert.alert('Photo removal failed',e.message)});
  const reorderPhotos=useMutation({
    mutationFn:(photoIds:number[])=>api.vessels.photos.reorder(vesselId,photoIds),
    onMutate:async(photoIds)=>{
      await qc.cancelQueries({queryKey:['vessel',vesselId]});
      const previous=qc.getQueryData<VesselDetail>(['vessel',vesselId]);
      qc.setQueryData<VesselDetail>(['vessel',vesselId],current=>{
        if(!current)return current;
        const byId=new Map(current.photos.map(photo=>[photo.id,photo]));
        return {...current,photos:photoIds.map((photoId,index)=>({...byId.get(photoId)!,sortOrder:index}))};
      });
      return {previous};
    },
    onSuccess:(photos)=>{
      qc.setQueryData<VesselDetail>(['vessel',vesselId],current=>current?{...current,photos}:current);
    },
    onError:(error:Error,_photoIds,context)=>{
      if(context?.previous)qc.setQueryData(['vessel',vesselId],context.previous);
      Alert.alert('Photo order not saved',error.message);
    },
    onSettled:refresh,
  });
  const handlePhotoReorder=(photos:VesselPhoto[])=>{
    reorderPhotos.mutate(photos.map(photo=>photo.id));
  };
     const uploadPhoto=useMutation({mutationFn:async({asset,uploadKey}:PendingPhotoUpload)=>{
     const blob=await (await fetch(asset.uri)).blob();
     const rawType=(asset.mimeType||blob.type).toLowerCase();
     const contentType=rawType==='image/jpg'?'image/jpeg':rawType;
     if(!(['image/jpeg','image/png','image/webp'] as string[]).includes(contentType)) throw new Error('Choose a JPEG, PNG, or WebP image.');
     if(!blob.size||blob.size>10*1024*1024) throw new Error('Choose an image no larger than 10 MB.');
        await api.vessels.photos.upload(vesselId,blob,contentType as 'image/jpeg'|'image/png'|'image/webp',uploadKey,setUploadProgress);
    },onMutate:()=>{setUploadError(null);setUploadProgress(0);},onSuccess:()=>{setSelectedPhoto(null);setUploadError(null);setUploadProgress(null);refresh();},onError:(e:Error)=>{setUploadProgress(null);setUploadError(e.message)}});
    const choosePhoto=async()=>{if((vessel.data?.photos.length??0)>=5){Alert.alert('Photo limit reached','A vessel can have up to 5 photos.');return;}const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:['images' as const],quality:1});if(!result.canceled){const pendingPhoto={asset:result.assets[0],uploadKey:createPhotoUploadKey()};setSelectedPhoto(pendingPhoto);setUploadError(null);uploadPhoto.mutate(pendingPhoto);}};
  const set=(key:keyof VesselFormData,value:unknown)=>setForm(x=>({...x,[key]:value}));
  if(vessel.isLoading||!ready)return <View style={[s.center,{backgroundColor:c.background}]}><ActivityIndicator color={c.primary}/></View>;
  const v=vessel.data;if(!v)return <View style={{flex:1,backgroundColor:c.background}}/>;
  const pad={paddingTop:(Platform.OS==='web'?67:insets.top)+12,paddingBottom:(Platform.OS==='web'?34:insets.bottom)+24};
  return <ScrollView style={{flex:1,backgroundColor:c.background}} contentContainerStyle={[s.page,pad]} keyboardShouldPersistTaps="handled">
    <View style={s.head}><Pressable onPress={()=>router.back()}><Feather name="arrow-left" color={c.primary} size={22}/></Pressable><Text style={[s.title,{color:c.foreground}]}>Edit vessel</Text><Pressable onPress={()=>save.mutate()} disabled={save.isPending}>{save.isPending?<ActivityIndicator color={c.primary}/>:<Text style={{color:c.primary,fontFamily:'Inter_700Bold'}}>Save</Text>}</Pressable></View>
    <Label c={c}>Listing status</Label><View style={s.chips}>{VESSEL_STATUSES.map(x=><Pressable key={x} disabled={v.status==='on_hire'||status.isPending} onPress={()=>status.mutate(x)} style={[s.chip,{borderColor:v.status===x?c.primary:c.border,backgroundColor:v.status===x?c.primary:c.card}]}><Text style={{color:v.status===x?c.primaryForeground:c.foreground,fontFamily:'Inter_500Medium',fontSize:12}}>{x.replace('_',' ')}</Text></Pressable>)}</View>
    <Label c={c}>Basic information</Label><Field c={c} label="Vessel name *" value={form.name} onChange={x=>set('name',x)}/><Field c={c} label="IMO number" value={form.imoNumber??''} onChange={x=>set('imoNumber',x)} keyboard="numeric"/><Field c={c} label="Flag" value={form.flag??''} onChange={x=>set('flag',x)}/>
    <Text style={[s.fieldLabel,{color:c.mutedForeground}]}>Vessel type</Text><View style={s.chips}>{VESSEL_TYPES.map(x=><Pressable key={x} onPress={()=>set('vesselType',x)} style={[s.chip,{borderColor:form.vesselType===x?c.primary:c.border,backgroundColor:form.vesselType===x?c.primary:c.card}]}><Text style={{color:form.vesselType===x?c.primaryForeground:c.foreground,fontFamily:'Inter_500Medium',fontSize:12}}>{x}</Text></Pressable>)}</View>
    <Label c={c}>Technical specifications</Label><View style={s.two}><Field c={c} label="DWT" value={form.dwt??''} onChange={x=>set('dwt',x)} keyboard="numeric"/><Field c={c} label="GRT" value={form.grt??''} onChange={x=>set('grt',x)} keyboard="numeric"/></View><View style={s.two}><Field c={c} label="LOA (m)" value={form.loa??''} onChange={x=>set('loa',x)} keyboard="numeric"/><Field c={c} label="Beam (m)" value={form.beam??''} onChange={x=>set('beam',x)} keyboard="numeric"/></View><View style={s.two}><Field c={c} label="Draft (m)" value={form.draft??''} onChange={x=>set('draft',x)} keyboard="numeric"/><Field c={c} label="Year built" value={form.yearBuilt??''} onChange={x=>set('yearBuilt',x)} keyboard="numeric"/></View><Field c={c} label="Classification society" value={form.classificationSociety??''} onChange={x=>set('classificationSociety',x)}/><Field c={c} label="Trading area" value={form.tradingArea??''} onChange={x=>set('tradingArea',x)}/><Field c={c} label="Description" value={form.description??''} onChange={x=>set('description',x)} multiline/>
    <Label c={c}>Contacts</Label>{(form.contacts??[]).map((contact,index)=><View key={index} style={[s.contact,{borderColor:c.border}]}><View style={s.contactHead}><Text style={{color:c.foreground,fontFamily:'Inter_600SemiBold'}}>Contact {index+1}</Text>{(form.contacts?.length??0)>1&&<Pressable onPress={()=>set('contacts',form.contacts?.filter((_,i)=>i!==index))}><Feather name="trash-2" color={c.destructive}/></Pressable>}</View><Field c={c} label="Name" value={contact.contactName} onChange={x=>set('contacts',form.contacts?.map((z,i)=>i===index?{...z,contactName:x}:z))}/><Field c={c} label="Phone" value={contact.phone??''} onChange={x=>set('contacts',form.contacts?.map((z,i)=>i===index?{...z,phone:x}:z))}/><Field c={c} label="Email" value={contact.email??''} onChange={x=>set('contacts',form.contacts?.map((z,i)=>i===index?{...z,email:x}:z))}/><Field c={c} label="Address" value={contact.address??''} onChange={x=>set('contacts',form.contacts?.map((z,i)=>i===index?{...z,address:x}:z))}/></View>)}<Pressable onPress={()=>set('contacts',[...(form.contacts??[]),{contactName:''}])}><Text style={{color:c.primary,fontFamily:'Inter_600SemiBold'}}>+ Add contact</Text></Pressable>
      <Label c={c}>Registered photos</Label><Text style={[s.note,{color:c.mutedForeground}]}>Upload up to 5 JPEG, PNG, or WebP images (10 MB each).</Text><Pressable disabled={uploadPhoto.isPending||reorderPhotos.isPending||v.photos.length>=5} onPress={choosePhoto} style={[s.upload,{backgroundColor:c.primary,opacity:(uploadPhoto.isPending||reorderPhotos.isPending||v.photos.length>=5)?.55:1}]}>{uploadPhoto.isPending?<ActivityIndicator color={c.primaryForeground}/>:<><Feather name="upload" color={c.primaryForeground}/><Text style={s.uploadText}>Upload photo</Text></>}</Pressable>{uploadPhoto.isPending&&uploadProgress!==null&&<View accessibilityLabel={`Photo upload ${uploadProgress}% complete`} accessibilityRole="progressbar" style={s.progressWrap}><View style={[s.progressTrack,{backgroundColor:c.muted}]}><View style={[s.progressFill,{backgroundColor:c.primary,width:`${uploadProgress}%`}]}/></View><Text style={[s.note,{color:c.mutedForeground}]}>Uploading photo… {uploadProgress}% — Please keep this screen open.</Text></View>}{uploadError&&selectedPhoto&&<View style={s.retry}><Text style={[s.note,{color:c.destructive,flex:1}]}>{uploadError}</Text><Pressable onPress={()=>uploadPhoto.mutate(selectedPhoto)}><Text style={{color:c.primary,fontFamily:'Inter_700Bold'}}>Retry</Text></Pressable></View>}<VesselPhotoManager photos={v.photos} colors={c} isSaving={reorderPhotos.isPending} onReorder={handlePhotoReorder} onDelete={photoId=>removePhoto.mutate(photoId)}/>
  </ScrollView>;
}
function Label({c,children}:{c:ReturnType<typeof useColors>;children:React.ReactNode}){return <Text style={[s.label,{color:c.primary}]}>{children}</Text>}
function Field({c,label,value,onChange,keyboard,multiline}:{c:ReturnType<typeof useColors>;label:string;value:string;onChange:(x:string)=>void;keyboard?:'numeric';multiline?:boolean}){return <View style={s.field}><Text style={[s.fieldLabel,{color:c.mutedForeground}]}>{label}</Text><TextInput value={value} onChangeText={onChange} keyboardType={keyboard} multiline={multiline} style={[s.input,{borderColor:c.border,backgroundColor:c.card,color:c.foreground,height:multiline?94:48,textAlignVertical:multiline?'top':'center'}]} placeholderTextColor={c.mutedForeground}/></View>}
  const s=StyleSheet.create({page:{paddingHorizontal:16,gap:11},center:{flex:1,alignItems:'center',justifyContent:'center'},head:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',marginBottom:6},title:{fontFamily:'Inter_700Bold',fontSize:20},label:{fontFamily:'Inter_700Bold',fontSize:11,textTransform:'uppercase',letterSpacing:1,marginTop:12},field:{flex:1,gap:5},fieldLabel:{fontFamily:'Inter_500Medium',fontSize:12},input:{borderWidth:1,borderRadius:10,paddingHorizontal:12,fontFamily:'Inter_400Regular',fontSize:15},two:{flexDirection:'row',gap:10},chips:{flexDirection:'row',flexWrap:'wrap',gap:7},chip:{borderWidth:1,borderRadius:16,paddingHorizontal:10,paddingVertical:8},contact:{borderWidth:1,borderRadius:12,padding:12,gap:9},contactHead:{flexDirection:'row',justifyContent:'space-between'},note:{fontFamily:'Inter_400Regular',fontSize:13,lineHeight:19},upload:{height:46,borderRadius:10,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8},uploadText:{fontFamily:'Inter_700Bold',color:'#fff'},progressWrap:{gap:6},progressTrack:{height:6,borderRadius:3,overflow:'hidden'},progressFill:{height:'100%',borderRadius:3},retry:{flexDirection:'row',alignItems:'center',gap:12},photo:{height:50,borderWidth:1,borderRadius:10,paddingHorizontal:12,flexDirection:'row',alignItems:'center',gap:10}});