import { StyleSheet, Text, View } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Stack, useLocalSearchParams } from 'expo-router';
import DrawingBoard from '~/components/DrawingBoard';

import { RealtimeChannel, createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_API_KEY;
const client = createClient(supabaseUrl!, supabaseAnonKey!);

const randomUsername = `user-${Math.floor(Math.random() * 1000)}`;
const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;

const Page = () => {
  const { channel } = useLocalSearchParams();
  const [broadcastChannel, setBroadcastChannel] = useState<RealtimeChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!channel || isConnected) return;

    const newChannel = client.channel(`Drawing-${channel}`);
    setBroadcastChannel(newChannel);

    const subscription = newChannel
      .on('broadcast', { event: 'start' }, ({ payload }) => {
        console.log('Recevied start ', payload);
      })
      .on('broadcast', { event: 'active' }, ({ payload }) => {
        console.log('Recevied active ', payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
        }
      });

    return () => {
      subscription.unsubscribe();
      newChannel.unsubscribe();
    };
  }, [channel]);

  const onDrawingStart = (x: number, y: number) => {
    console.log('Drawing started at', x, y);
    broadcastChannel?.send({
      type: 'broadcast',
      event: 'start',
      payload: { x, y, color: randomColor, name: randomUsername },
    });
  };
  const onDrawingActive = (x1: number, y1: number, x2: number, y2: number) => {
    console.log('Drawing active from ', x1, y1, 'to', x2, y2);
    broadcastChannel?.send({
      type: 'broadcast',
      event: 'active',
      payload: { x1, y1, x2, y2, name: randomUsername },
    });
  };
  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: `Channel ${channel} - User - ${randomUsername}` }} />
      {isConnected && <DrawingBoard onStart={onDrawingStart} onActive={onDrawingActive} />}
    </View>
  );
};

export default Page;

const styles = StyleSheet.create({});
