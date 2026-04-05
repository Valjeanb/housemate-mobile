import React, { useState, useMemo, useRef } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, KeyboardAvoidingView, Platform, Image, Dimensions, Modal } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import useAppStore from '@/lib/state/app-store';
import {
  getPriorityColor,
  getPriorityLabel,
  getCategoryColor,
  getTimeOfDayLabel,
  getFrequencyLabel,
  parseDescriptionToSteps,
} from '@/lib/types';
import {
  Check,
  Clock,
  AlertTriangle,
  Pill,
  Camera,
  Flag,
  CheckCircle2,
  Info,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Edit3,
  Play,
  X,
  ImageIcon,
  Film,
  BookOpen,
} from 'lucide-react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const tasks = useAppStore((s) => s.tasks);
  const userRole = useAppStore((s) => s.userRole);
  const getGuidesForTask = useAppStore((s) => s.getGuidesForTask);
  const completeTask = useAppStore((s) => s.completeTask);
  const uncompleteTask = useAppStore((s) => s.uncompleteTask);
  const isTaskCompletedToday = useAppStore((s) => s.isTaskCompletedToday);

  const [notes, setNotes] = useState('');
  const [flagNeedsAttention, setFlagNeedsAttention] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showDoneSection, setShowDoneSection] = useState(false);
  const [showRedFlags, setShowRedFlags] = useState(false);
  const [showMedia, setShowMedia] = useState(true);
  const [showHowToGuides, setShowHowToGuides] = useState(true);
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const videoRef = useRef<Video>(null);

  const task = useMemo(() => tasks.find((t) => t.id === id), [tasks, id]);

  // Get assigned how-to guides
  const assignedGuides = useMemo(() => {
    if (!id) return [];
    return getGuidesForTask(id);
  }, [id, getGuidesForTask]);

  // Parse steps from task
  const { overview, steps } = useMemo(() => {
    if (task?.steps && task.steps.length > 0) {
      return { overview: task.overview ?? '', steps: task.steps };
    }
    if (task?.description) {
      return parseDescriptionToSteps(task.description);
    }
    return { overview: '', steps: [] };
  }, [task]);

  if (!task) {
    return (
      <View className="flex-1 bg-amber-50/50 items-center justify-center">
        <Text className="text-stone-500">Task not found</Text>
      </View>
    );
  }

  const isCompleted = isTaskCompletedToday(task.id);
  const priorityColor = getPriorityColor(task.priority);
  const categoryColor = getCategoryColor(task.category);

  const handleComplete = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    completeTask(task.id, notes || undefined, undefined, flagNeedsAttention);
    router.back();
  };

  const handleUncomplete = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    uncompleteTask(task.id);
  };

  const isVideoUri = (uri: string) => {
    return uri.includes('.mov') || uri.includes('.mp4') || uri.includes('.MOV') || uri.includes('.MP4');
  };

  const hasMedia = task.mediaAttachments && task.mediaAttachments.length > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <ScrollView className="flex-1 bg-amber-50/50">
        {/* Header Card */}
        <LinearGradient
          colors={[categoryColor, `${categoryColor}CC`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            borderRadius: 20,
            padding: 20,
          }}
        >
          <Animated.View entering={FadeInDown.duration(400)}>
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <View
                  style={{ backgroundColor: `${priorityColor}30` }}
                  className="px-3 py-1 rounded-full mr-2"
                >
                  <Text style={{ color: '#fff' }} className="text-xs font-bold">
                    {getPriorityLabel(task.priority).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-row items-center bg-white/20 px-3 py-1 rounded-full">
                  <Clock size={12} color="#fff" />
                  <Text className="text-white text-xs ml-1">{task.estimatedMinutes} min</Text>
                </View>
              </View>

              {/* Edit button for owners */}
              {userRole === 'owner' && (
                <Pressable
                  onPress={() => router.push(`/edit-task/${task.id}`)}
                  className="bg-white/20 rounded-full p-2 active:bg-white/30"
                >
                  <Edit3 size={18} color="#fff" />
                </Pressable>
              )}
            </View>

            <Text className="text-white text-2xl font-bold mt-2">{task.title}</Text>

            <View className="flex-row items-center mt-3">
              <Text className="text-white/80 text-sm capitalize">{task.category}</Text>
              <Text className="text-white/50 mx-2">•</Text>
              <Text className="text-white/80 text-sm">{getTimeOfDayLabel(task.timeOfDay)}</Text>
              <Text className="text-white/50 mx-2">•</Text>
              <Text className="text-white/80 text-sm">{getFrequencyLabel(task.frequency, task.customIntervalDays)}</Text>
            </View>

            {/* Medication Warning */}
            {task.requiresMedication && (
              <View className="flex-row items-center mt-4 bg-red-500/30 rounded-xl p-3">
                <Pill size={20} color="#fff" />
                <View className="ml-3 flex-1">
                  <Text className="text-white font-semibold text-sm">Medication Required</Text>
                  {task.medicationText && (
                    <Text className="text-white/80 text-xs mt-1">{task.medicationText}</Text>
                  )}
                </View>
              </View>
            )}
          </Animated.View>
        </LinearGradient>

        <View className="px-4 pt-6 pb-8">
          {/* Instructions Section */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)}>
            <Pressable
              onPress={() => setShowInstructions(!showInstructions)}
              className="flex-row items-center justify-between mb-3"
            >
              <View className="flex-row items-center">
                <Info size={18} color="#C2410C" />
                <Text className="text-lg font-bold text-stone-800 ml-2">Instructions</Text>
              </View>
              {showInstructions ? (
                <ChevronUp size={20} color="#9CA3AF" />
              ) : (
                <ChevronDown size={20} color="#9CA3AF" />
              )}
            </Pressable>

            {showInstructions && (
              <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-stone-100">
                {/* Overview */}
                {overview ? (
                  <Text className="text-stone-700 text-sm leading-6 mb-4">{overview}</Text>
                ) : null}

                {/* Steps */}
                {steps.length > 0 ? (
                  <View>
                    <Text className="text-xs font-semibold text-stone-500 uppercase mb-3">Steps</Text>
                    {steps.map((step, index) => (
                      <View key={index} className="flex-row items-start mb-3">
                        <View className="w-6 h-6 rounded-full bg-orange-600 items-center justify-center mr-3 mt-0.5">
                          <Text className="text-white text-xs font-bold">{index + 1}</Text>
                        </View>
                        <Text className="text-stone-700 text-sm leading-5 flex-1">{step}</Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  /* Fallback to raw description if no steps parsed */
                  <Text className="text-stone-700 text-sm leading-6">{task.description}</Text>
                )}
              </View>
            )}
          </Animated.View>

          {/* Media Section */}
          {hasMedia && (
            <Animated.View entering={FadeInDown.delay(125).duration(300)}>
              <Pressable
                onPress={() => setShowMedia(!showMedia)}
                className="flex-row items-center justify-between mb-3"
              >
                <View className="flex-row items-center">
                  <Film size={18} color="#9333EA" />
                  <Text className="text-lg font-bold text-stone-800 ml-2">Photos & Videos</Text>
                  <View className="bg-purple-100 rounded-full px-2 py-0.5 ml-2">
                    <Text className="text-purple-700 text-xs font-medium">
                      {task.mediaAttachments?.length}
                    </Text>
                  </View>
                </View>
                {showMedia ? (
                  <ChevronUp size={20} color="#9CA3AF" />
                ) : (
                  <ChevronDown size={20} color="#9CA3AF" />
                )}
              </Pressable>

              {showMedia && (
                <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-stone-100">
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ flexGrow: 0 }}
                  >
                    {task.mediaAttachments?.map((uri, index) => (
                      <Pressable
                        key={uri}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedMedia(uri);
                        }}
                        className="mr-3 active:opacity-80"
                      >
                        {isVideoUri(uri) ? (
                          <View
                            className="bg-stone-800 rounded-xl items-center justify-center"
                            style={{ width: 120, height: 120 }}
                          >
                            <View className="bg-white/20 rounded-full p-3">
                              <Play size={24} color="#fff" fill="#fff" />
                            </View>
                            <Text className="text-white text-xs mt-2">Tap to play</Text>
                          </View>
                        ) : (
                          <Image
                            source={{ uri }}
                            style={{
                              width: 120,
                              height: 120,
                              borderRadius: 12,
                            }}
                            resizeMode="cover"
                          />
                        )}
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              )}
            </Animated.View>
          )}

          {/* How-To Guides Section */}
          {assignedGuides.length > 0 && (
            <Animated.View entering={FadeInDown.delay(140).duration(300)}>
              <Pressable
                onPress={() => setShowHowToGuides(!showHowToGuides)}
                className="flex-row items-center justify-between mb-3"
              >
                <View className="flex-row items-center">
                  <BookOpen size={18} color="#D97706" />
                  <Text className="text-lg font-bold text-stone-800 ml-2">How-To Guides</Text>
                  <View className="bg-amber-100 rounded-full px-2 py-0.5 ml-2">
                    <Text className="text-amber-700 text-xs font-medium">
                      {assignedGuides.length}
                    </Text>
                  </View>
                </View>
                {showHowToGuides ? (
                  <ChevronUp size={20} color="#9CA3AF" />
                ) : (
                  <ChevronDown size={20} color="#9CA3AF" />
                )}
              </Pressable>

              {showHowToGuides && (
                <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-stone-100">
                  {assignedGuides.map((guide, guideIndex) => (
                    <View
                      key={guide.id}
                      className={guideIndex > 0 ? 'mt-4 pt-4 border-t border-stone-100' : ''}
                    >
                      <Text className="text-base font-semibold text-stone-800 mb-1">
                        {guide.title}
                      </Text>
                      {guide.description && (
                        <Text className="text-sm text-stone-500 mb-3">{guide.description}</Text>
                      )}
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ flexGrow: 0 }}
                      >
                        {guide.mediaUrls.map((uri) => (
                          <Pressable
                            key={uri}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setSelectedMedia(uri);
                            }}
                            className="mr-3 active:opacity-80"
                          >
                            {isVideoUri(uri) ? (
                              <View
                                className="bg-stone-800 rounded-xl items-center justify-center"
                                style={{ width: 100, height: 100 }}
                              >
                                <View className="bg-white/20 rounded-full p-2">
                                  <Play size={20} color="#fff" fill="#fff" />
                                </View>
                                <Text className="text-white text-xs mt-1">Video</Text>
                              </View>
                            ) : (
                              <Image
                                source={{ uri }}
                                style={{
                                  width: 100,
                                  height: 100,
                                  borderRadius: 12,
                                }}
                                resizeMode="cover"
                              />
                            )}
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  ))}
                </View>
              )}
            </Animated.View>
          )}

          {/* Done Properly Section */}
          {task.doneProperlyText && (
            <Animated.View entering={FadeInDown.delay(150).duration(300)}>
              <Pressable
                onPress={() => setShowDoneSection(!showDoneSection)}
                className="flex-row items-center justify-between mb-3"
              >
                <View className="flex-row items-center">
                  <CheckCircle2 size={18} color="#65A30D" />
                  <Text className="text-base font-semibold text-stone-800 ml-2">
                    What "Done" Looks Like
                  </Text>
                </View>
                {showDoneSection ? (
                  <ChevronUp size={20} color="#9CA3AF" />
                ) : (
                  <ChevronDown size={20} color="#9CA3AF" />
                )}
              </Pressable>

              {showDoneSection && (
                <View className="bg-lime-50 rounded-2xl p-4 mb-4 border border-lime-200">
                  <Text className="text-lime-800 text-sm leading-5">
                    {task.doneProperlyText}
                  </Text>
                </View>
              )}
            </Animated.View>
          )}

          {/* Red Flags Section */}
          {task.redFlagsText && (
            <Animated.View entering={FadeInDown.delay(200).duration(300)}>
              <Pressable
                onPress={() => setShowRedFlags(!showRedFlags)}
                className="flex-row items-center justify-between mb-3"
              >
                <View className="flex-row items-center">
                  <AlertCircle size={18} color="#DC2626" />
                  <Text className="text-base font-semibold text-stone-800 ml-2">Red Flags</Text>
                </View>
                {showRedFlags ? (
                  <ChevronUp size={20} color="#9CA3AF" />
                ) : (
                  <ChevronDown size={20} color="#9CA3AF" />
                )}
              </Pressable>

              {showRedFlags && (
                <View className="bg-red-50 rounded-2xl p-4 mb-4 border border-red-100">
                  <Text className="text-red-800 text-sm leading-5">{task.redFlagsText}</Text>
                </View>
              )}
            </Animated.View>
          )}

          {/* Completion Section */}
          {!isCompleted ? (
            <Animated.View entering={FadeInDown.delay(250).duration(300)}>
              <Text className="text-lg font-bold text-stone-800 mb-3">Complete Task</Text>

              {/* Notes Input */}
              <View className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-stone-100">
                <Text className="text-sm font-medium text-stone-600 mb-2">
                  Notes (optional)
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add any observations or egg counts..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  className="text-stone-800 text-base min-h-[80px]"
                  style={{ textAlignVertical: 'top' }}
                />
              </View>

              {/* Flag Needs Attention */}
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  setFlagNeedsAttention(!flagNeedsAttention);
                }}
                className={`flex-row items-center p-4 rounded-2xl mb-6 border ${
                  flagNeedsAttention
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-white border-stone-100'
                }`}
              >
                <View
                  className={`w-6 h-6 rounded-md border-2 items-center justify-center mr-3 ${
                    flagNeedsAttention ? 'border-amber-500 bg-amber-500' : 'border-stone-300'
                  }`}
                >
                  {flagNeedsAttention && <Check size={14} color="#fff" strokeWidth={3} />}
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-stone-800">Needs Attention</Text>
                  <Text className="text-xs text-stone-500">
                    Flag this for the owner to review
                  </Text>
                </View>
                <Flag size={20} color={flagNeedsAttention ? '#F59E0B' : '#9CA3AF'} />
              </Pressable>

              {/* Complete Button */}
              <Pressable
                onPress={handleComplete}
                className="bg-orange-600 rounded-2xl py-4 items-center active:bg-orange-700"
              >
                <View className="flex-row items-center">
                  <CheckCircle2 size={22} color="#fff" />
                  <Text className="text-white text-lg font-bold ml-2">Mark Complete</Text>
                </View>
              </Pressable>

              {/* Help Text */}
              <Text className="text-center text-stone-400 text-xs mt-4">
                If you're unsure or something looks wrong, take a photo and flag "Needs
                Attention"
              </Text>
            </Animated.View>
          ) : (
            <Animated.View
              entering={FadeIn.duration(400)}
              className="items-center py-8"
            >
              <View className="bg-lime-100 rounded-full p-4 mb-4">
                <CheckCircle2 size={48} color="#65A30D" />
              </View>
              <Text className="text-xl font-bold text-lime-700 mb-2">Task Completed</Text>
              <Text className="text-stone-500 text-sm mb-6">Great work!</Text>

              <Pressable
                onPress={handleUncomplete}
                className="border border-stone-300 rounded-xl px-6 py-3"
              >
                <Text className="text-stone-600 font-medium">Undo Completion</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* Media Viewer Modal */}
      <Modal
        visible={selectedMedia !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMedia(null)}
      >
        <View className="flex-1 bg-black">
          {/* Close Button */}
          <Pressable
            onPress={() => setSelectedMedia(null)}
            className="absolute top-14 right-4 z-10 bg-white/20 rounded-full p-3"
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <X size={24} color="#fff" />
          </Pressable>

          {/* Media Content */}
          <View className="flex-1 items-center justify-center">
            {selectedMedia && isVideoUri(selectedMedia) ? (
              <Video
                ref={videoRef}
                source={{ uri: selectedMedia }}
                style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH * (16 / 9) }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                isLooping
              />
            ) : selectedMedia ? (
              <Image
                source={{ uri: selectedMedia }}
                style={{ width: SCREEN_WIDTH, height: SCREEN_WIDTH }}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
