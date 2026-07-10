import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Alert, Share, Linking, Modal } from 'react-native';
import useAppStore from '@/lib/state/app-store';
import { ShoppingItem, getRoleLabel } from '@/lib/types';
import { Plus, X, Check, ShoppingCart, ExternalLink, Trash2 } from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';

const COLES_URL = 'https://www.coles.com.au/';

const colesSearchUrl = (itemName: string) =>
  `https://www.coles.com.au/search/products?q=${encodeURIComponent(itemName)}`;

const formatList = (items: ShoppingItem[]): string =>
  items.map((i) => `• ${i.name}`).join('\n');

export default function ShoppingScreen() {
  const userRole = useAppStore((s) => s.userRole);
  const shoppingItems = useAppStore((s) => s.shoppingItems);
  const addShoppingItem = useAppStore((s) => s.addShoppingItem);
  const removeShoppingItem = useAppStore((s) => s.removeShoppingItem);
  const setItemPurchased = useAppStore((s) => s.setItemPurchased);
  const markAllPurchased = useAppStore((s) => s.markAllPurchased);
  const clearPurchasedItems = useAppStore((s) => s.clearPurchasedItems);

  const [newItemName, setNewItemName] = useState<string>('');
  const [purchaseSheetVisible, setPurchaseSheetVisible] = useState<boolean>(false);

  const isOwner = userRole === 'owner';
  const toBuy = useMemo(() => shoppingItems.filter((i) => !i.purchased), [shoppingItems]);
  const purchased = useMemo(
    () =>
      shoppingItems
        .filter((i) => i.purchased)
        .sort((a, b) => (b.purchasedAt ?? '').localeCompare(a.purchasedAt ?? '')),
    [shoppingItems]
  );

  const handleAdd = () => {
    const name = newItemName.trim();
    if (!name) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addShoppingItem(name);
    setNewItemName('');
  };

  const handleTogglePurchased = (item: ShoppingItem) => {
    if (!isOwner) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Owner only', 'Only the owner can mark items as purchased.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setItemPurchased(item.id, !item.purchased);
  };

  // A bottom-sheet Modal instead of Alert.alert: Android silently drops the 4th
  // (Cancel) button from alerts and won't dismiss on back — the dialog became a trap.
  const handlePurchase = () => {
    if (toBuy.length === 0) {
      Alert.alert('Nothing to buy', 'The shopping list is empty.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPurchaseSheetVisible(true);
  };

  const handleCopyAndOpenColes = async () => {
    setPurchaseSheetVisible(false);
    await Clipboard.setStringAsync(formatList(toBuy));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Linking.openURL(COLES_URL);
  };

  const handleShareList = () => {
    setPurchaseSheetVisible(false);
    Share.share({ message: `Shopping list:\n${formatList(toBuy)}` });
  };

  const handleMarkAllPurchased = () => {
    setPurchaseSheetVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    markAllPurchased();
  };

  const handleClearPurchased = () => {
    Alert.alert('Clear purchased items', 'Remove all purchased items from the list?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          clearPurchasedItems();
        },
      },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-amber-50/50" keyboardShouldPersistTaps="handled">
      <View className="px-4 py-4">
        {/* Add item */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <View className="flex-row items-center mb-4">
            <TextInput
              value={newItemName}
              onChangeText={setNewItemName}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
              placeholder="Add an item, e.g. Milk"
              placeholderTextColor="#9CA3AF"
              className="flex-1 bg-white rounded-xl p-4 text-stone-800 text-base border border-stone-200 mr-2"
            />
            <Pressable
              onPress={handleAdd}
              className="w-12 h-12 rounded-xl bg-orange-600 items-center justify-center active:bg-orange-700"
            >
              <Plus size={24} color="#fff" />
            </Pressable>
          </View>
        </Animated.View>

        {/* Owner purchase button */}
        {isOwner && toBuy.length > 0 && (
          <Animated.View entering={FadeInDown.delay(50).duration(300)}>
            <Pressable
              onPress={handlePurchase}
              className="bg-lime-600 rounded-xl py-4 items-center mb-4 active:bg-lime-700"
            >
              <View className="flex-row items-center">
                <ShoppingCart size={20} color="#fff" />
                <Text className="text-white font-bold text-base ml-2">
                  Purchase ({toBuy.length})
                </Text>
              </View>
            </Pressable>
          </Animated.View>
        )}

        {/* To buy */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <Text className="text-lg font-bold text-stone-800 mb-3">
            To Buy {toBuy.length > 0 ? `(${toBuy.length})` : ''}
          </Text>
          {toBuy.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center border border-stone-100 mb-6">
              <ShoppingCart size={32} color="#D6D3D1" />
              <Text className="text-stone-400 text-sm mt-2">
                List is empty — anyone can add items
              </Text>
            </View>
          ) : (
            <View className="mb-6">
              {toBuy.map((item) => (
                <Animated.View
                  key={item.id}
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(200)}
                  layout={Layout.springify()}
                  className="bg-white rounded-2xl p-4 mb-2 flex-row items-center shadow-sm border border-stone-100"
                >
                  {/* Purchased checkbox — owner only */}
                  <Pressable
                    onPress={() => handleTogglePurchased(item)}
                    className={`w-7 h-7 rounded-full border-2 items-center justify-center mr-3 ${
                      isOwner ? 'border-lime-600' : 'border-stone-200'
                    }`}
                    hitSlop={8}
                  />
                  <View className="flex-1">
                    <Text className="text-base text-stone-800">{item.name}</Text>
                    <Text className="text-xs text-stone-400">
                      {item.addedBy} · {getRoleLabel(item.addedByRole)}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => Linking.openURL(colesSearchUrl(item.name))}
                    className="p-2 active:opacity-50"
                    hitSlop={6}
                  >
                    <ExternalLink size={18} color="#A8A29E" />
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      removeShoppingItem(item.id);
                    }}
                    className="p-2 active:opacity-50"
                    hitSlop={6}
                  >
                    <X size={18} color="#DC2626" />
                  </Pressable>
                </Animated.View>
              ))}
            </View>
          )}
        </Animated.View>

        {/* Purchased */}
        {purchased.length > 0 && (
          <Animated.View entering={FadeInDown.delay(150).duration(300)}>
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold text-stone-800">
                Purchased ({purchased.length})
              </Text>
              {isOwner && (
                <Pressable
                  onPress={handleClearPurchased}
                  className="flex-row items-center px-3 py-1.5 rounded-full bg-stone-100 active:bg-stone-200"
                >
                  <Trash2 size={14} color="#78716C" />
                  <Text className="text-stone-500 text-xs font-medium ml-1">Clear</Text>
                </Pressable>
              )}
            </View>
            {purchased.map((item) => (
              <Animated.View
                key={item.id}
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                layout={Layout.springify()}
                className="bg-white/60 rounded-2xl p-4 mb-2 flex-row items-center border border-stone-100"
              >
                <Pressable
                  onPress={() => handleTogglePurchased(item)}
                  className="w-7 h-7 rounded-full bg-lime-600 items-center justify-center mr-3"
                  hitSlop={8}
                >
                  <Check size={16} color="#fff" strokeWidth={3} />
                </Pressable>
                <View className="flex-1">
                  <Text className="text-base text-stone-400 line-through">{item.name}</Text>
                  <Text className="text-xs text-stone-300">{item.addedBy}</Text>
                </View>
              </Animated.View>
            ))}
          </Animated.View>
        )}

        {/* Footer note */}
        <View className="bg-stone-100 rounded-2xl p-4 mt-2 mb-8">
          <Text className="text-xs text-stone-500 leading-4">
            Anyone can add items and tick the Coles link to check a product.
            Only the owner can mark items purchased — "Purchase" copies the list and opens Coles
            online, ready to add to the trolley.
          </Text>
        </View>
      </View>

      {/* Purchase actions bottom sheet */}
      <Modal
        visible={purchaseSheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setPurchaseSheetVisible(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/40"
          onPress={() => setPurchaseSheetVisible(false)}
        >
          <Pressable className="bg-white rounded-t-3xl p-6 pb-10" onPress={() => {}}>
            <Text className="text-lg font-bold text-stone-800 mb-1">Purchase list</Text>
            <Text className="text-sm text-stone-500 mb-5">
              {toBuy.length} item{toBuy.length === 1 ? '' : 's'} to buy
            </Text>

            <Pressable
              onPress={handleCopyAndOpenColes}
              className="bg-lime-600 rounded-xl py-4 items-center mb-3 active:bg-lime-700"
            >
              <Text className="text-white font-bold text-base">Copy list & open Coles</Text>
            </Pressable>

            <Pressable
              onPress={handleShareList}
              className="border border-stone-300 rounded-xl py-4 items-center mb-3 active:bg-stone-50"
            >
              <Text className="text-stone-700 font-medium text-base">Share list…</Text>
            </Pressable>

            <Pressable
              onPress={handleMarkAllPurchased}
              className="border border-stone-300 rounded-xl py-4 items-center mb-3 active:bg-stone-50"
            >
              <Text className="text-stone-700 font-medium text-base">Mark all purchased</Text>
            </Pressable>

            <Pressable
              onPress={() => setPurchaseSheetVisible(false)}
              className="py-3 items-center active:opacity-60"
            >
              <Text className="text-stone-400 font-medium">Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ScrollView>
  );
}
