import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Image,
  Alert,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import useAppStore from '@/lib/state/app-store';
import { HowToGuide } from '@/lib/types';
import {
  Plus,
  Trash2,
  X,
  Play,
  ImagePlus,
  Film,
  BookOpen,
  ChevronRight,
  Edit3,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const generateId = () => `guide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function HowToLibraryScreen() {
  const router = useRouter();
  const howToGuides = useAppStore((s) => s.howToGuides);
  const tasks = useAppStore((s) => s.tasks);
  const addHowToGuide = useAppStore((s) => s.addHowToGuide);
  const updateHowToGuide = useAppStore((s) => s.updateHowToGuide);
  const deleteHowToGuide = useAppStore((s) => s.deleteHowToGuide);

  const [isCreating, setIsCreating] = useState(false);
  const [editingGuide, setEditingGuide] = useState<HowToGuide | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setMediaUrls([]);
    setIsCreating(false);
    setEditingGuide(null);
  };

  const startEditing = (guide: HowToGuide) => {
    setEditingGuide(guide);
    setTitle(guide.title);
    setDescription(guide.description ?? '');
    setMediaUrls(guide.mediaUrls);
    setIsCreating(true);
  };

  const pickMedia = async (type: 'images' | 'videos') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant access to your photo library to add media.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'images' ? ['images'] : ['videos'],
      allowsMultipleSelection: true,
      selectionLimit: 10,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const newUris = result.assets.map((asset) => asset.uri);
      setMediaUrls((prev) => [...prev, ...newUris]);
    }
  };

  const removeMedia = (uri: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMediaUrls((prev) => prev.filter((m) => m !== uri));
  };

  const isVideoUri = (uri: string) => {
    const lower = uri.toLowerCase();
    return lower.includes('.mov') || lower.includes('.mp4') || lower.includes('.avi');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for the guide');
      return;
    }

    if (mediaUrls.length === 0) {
      Alert.alert('Error', 'Please add at least one photo or video');
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (editingGuide) {
      updateHowToGuide(editingGuide.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        mediaUrls,
      });
    } else {
      const newGuide: HowToGuide = {
        id: generateId(),
        title: title.trim(),
        description: description.trim() || undefined,
        mediaUrls,
        createdAt: new Date().toISOString(),
      };
      addHowToGuide(newGuide);
    }

    resetForm();
  };

  const handleDelete = (guide: HowToGuide) => {
    const usedByTasks = tasks.filter((t) => t.howToGuideIds?.includes(guide.id));

    Alert.alert(
      'Delete Guide',
      usedByTasks.length > 0
        ? `This guide is used by ${usedByTasks.length} task(s). Deleting it will remove it from those tasks. Continue?`
        : 'Are you sure you want to delete this guide?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteHowToGuide(guide.id);
          },
        },
      ]
    );
  };

  const getTaskCountForGuide = (guideId: string) => {
    return tasks.filter((t) => t.howToGuideIds?.includes(guideId)).length;
  };

  if (isCreating) {
    return (
      <KeyboardAwareScrollView
        className="flex-1 bg-amber-50/50"
        keyboardShouldPersistTaps="handled"
        bottomOffset={20}
      >
        <View className="px-4 py-6">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-xl font-bold text-stone-800">
              {editingGuide ? 'Edit Guide' : 'New How-To Guide'}
            </Text>
            <Pressable
              onPress={resetForm}
              className="p-2 rounded-full bg-stone-100 active:bg-stone-200"
            >
              <X size={20} color="#78716C" />
            </Pressable>
          </View>

          {/* Title */}
          <Animated.View entering={FadeInDown.duration(300)} className="mb-6">
            <Text className="text-sm font-medium text-stone-600 mb-2">Title *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., How to feed Scout"
              placeholderTextColor="#9CA3AF"
              className="bg-white rounded-xl p-4 text-stone-800 text-base border border-stone-200"
            />
          </Animated.View>

          {/* Description */}
          <Animated.View entering={FadeInDown.delay(50).duration(300)} className="mb-6">
            <Text className="text-sm font-medium text-stone-600 mb-2">Description (optional)</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Brief description of this guide..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              className="bg-white rounded-xl p-4 text-stone-800 text-base border border-stone-200 min-h-[80px]"
              style={{ textAlignVertical: 'top' }}
            />
          </Animated.View>

          {/* Media Section */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)} className="mb-6">
            <View className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
              <Text className="text-sm font-semibold text-amber-800 mb-3">
                Photos & Videos *
              </Text>
              <Text className="text-xs text-amber-600 mb-4">
                Add instructional photos or videos for this guide
              </Text>

              {/* Media Grid */}
              {mediaUrls.length > 0 && (
                <View className="flex-row flex-wrap mb-4">
                  {mediaUrls.map((uri) => (
                    <Animated.View
                      key={uri}
                      entering={FadeIn.duration(200)}
                      exiting={FadeOut.duration(200)}
                      className="mr-2 mb-2"
                    >
                      <View className="relative">
                        {isVideoUri(uri) ? (
                          <View
                            className="bg-stone-800 rounded-xl items-center justify-center"
                            style={{ width: (SCREEN_WIDTH - 64) / 3, height: (SCREEN_WIDTH - 64) / 3 }}
                          >
                            <View className="bg-white/20 rounded-full p-3">
                              <Play size={24} color="#fff" fill="#fff" />
                            </View>
                            <Text className="text-white text-xs mt-2">Video</Text>
                          </View>
                        ) : (
                          <Image
                            source={{ uri }}
                            style={{
                              width: (SCREEN_WIDTH - 64) / 3,
                              height: (SCREEN_WIDTH - 64) / 3,
                              borderRadius: 12,
                            }}
                            resizeMode="cover"
                          />
                        )}
                        <Pressable
                          onPress={() => removeMedia(uri)}
                          className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <X size={14} color="#fff" />
                        </Pressable>
                      </View>
                    </Animated.View>
                  ))}
                </View>
              )}

              {/* Add Media Buttons */}
              <View className="flex-row">
                <Pressable
                  onPress={() => pickMedia('images')}
                  className="flex-1 flex-row items-center justify-center py-3 mr-2 border-2 border-dashed border-amber-300 rounded-xl active:bg-amber-100"
                >
                  <ImagePlus size={18} color="#D97706" />
                  <Text className="text-amber-600 font-medium ml-2">Add Photos</Text>
                </Pressable>
                <Pressable
                  onPress={() => pickMedia('videos')}
                  className="flex-1 flex-row items-center justify-center py-3 ml-2 border-2 border-dashed border-amber-300 rounded-xl active:bg-amber-100"
                >
                  <Film size={18} color="#D97706" />
                  <Text className="text-amber-600 font-medium ml-2">Add Videos</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>

          {/* Save Button */}
          <Animated.View entering={FadeInDown.delay(150).duration(300)} className="mt-4">
            <Pressable
              onPress={handleSave}
              className="bg-amber-500 rounded-xl py-4 items-center active:bg-amber-600"
            >
              <Text className="text-white font-bold text-base">
                {editingGuide ? 'Save Changes' : 'Create Guide'}
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </KeyboardAwareScrollView>
    );
  }

  return (
    <KeyboardAwareScrollView className="flex-1 bg-amber-50/50" keyboardShouldPersistTaps="handled">
      <View className="px-4 py-6">
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(300)} className="mb-6">
          <View className="flex-row items-center mb-2">
            <BookOpen size={24} color="#D97706" />
            <Text className="text-xl font-bold text-stone-800 ml-2">How-To Library</Text>
          </View>
          <Text className="text-sm text-stone-500">
            Create reusable how-to guides with photos and videos. Assign them to multiple tasks.
          </Text>
        </Animated.View>

        {/* Create New Button */}
        <Animated.View entering={FadeInDown.delay(50).duration(300)}>
          <Pressable
            onPress={() => setIsCreating(true)}
            className="bg-amber-500 rounded-2xl p-4 flex-row items-center justify-center mb-6 active:bg-amber-600"
          >
            <Plus size={20} color="#fff" />
            <Text className="text-white font-bold text-base ml-2">Create New Guide</Text>
          </Pressable>
        </Animated.View>

        {/* Guides List */}
        {howToGuides.length === 0 ? (
          <View className="items-center py-12">
            <BookOpen size={48} color="#D1D5DB" />
            <Text className="text-stone-400 text-base mt-4">No guides yet</Text>
            <Text className="text-stone-400 text-sm mt-1">Create your first how-to guide</Text>
          </View>
        ) : (
          <View>
            {howToGuides.map((guide, index) => {
              const taskCount = getTaskCountForGuide(guide.id);
              const firstMedia = guide.mediaUrls[0];
              const isVideo = firstMedia ? isVideoUri(firstMedia) : false;

              return (
                <Animated.View
                  key={guide.id}
                  entering={FadeInDown.delay(100 + index * 50).duration(300)}
                  layout={Layout.springify()}
                >
                  <Pressable
                    onPress={() => startEditing(guide)}
                    className="bg-white rounded-2xl mb-3 overflow-hidden shadow-sm border border-stone-100 active:bg-stone-50"
                  >
                    <View className="flex-row">
                      {/* Thumbnail */}
                      <View className="w-24 h-24">
                        {isVideo ? (
                          <View className="w-full h-full bg-stone-800 items-center justify-center">
                            <Play size={24} color="#fff" fill="#fff" />
                          </View>
                        ) : firstMedia ? (
                          <Image
                            source={{ uri: firstMedia }}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                          />
                        ) : (
                          <View className="w-full h-full bg-stone-200 items-center justify-center">
                            <BookOpen size={24} color="#9CA3AF" />
                          </View>
                        )}
                      </View>

                      {/* Content */}
                      <View className="flex-1 p-3 justify-center">
                        <Text className="text-base font-semibold text-stone-800" numberOfLines={1}>
                          {guide.title}
                        </Text>
                        {guide.description && (
                          <Text className="text-sm text-stone-500 mt-1" numberOfLines={1}>
                            {guide.description}
                          </Text>
                        )}
                        <View className="flex-row items-center mt-2">
                          <Text className="text-xs text-stone-400">
                            {guide.mediaUrls.length} {guide.mediaUrls.length === 1 ? 'item' : 'items'}
                          </Text>
                          <Text className="text-xs text-stone-300 mx-2">•</Text>
                          <Text className="text-xs text-amber-600">
                            Used in {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                          </Text>
                        </View>
                      </View>

                      {/* Actions */}
                      <View className="flex-row items-center pr-3">
                        <Pressable
                          onPress={() => handleDelete(guide)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          className="p-2 active:opacity-50"
                        >
                          <Trash2 size={18} color="#DC2626" />
                        </Pressable>
                        <ChevronRight size={18} color="#9CA3AF" />
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        )}
      </View>
    </KeyboardAwareScrollView>
  );
}
