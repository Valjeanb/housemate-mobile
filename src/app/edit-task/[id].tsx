import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import useAppStore from '@/lib/state/app-store';
import {
  Task,
  TaskCategory,
  TaskFrequency,
  TaskPriority,
  TimeOfDay,
  getCategoryColor,
  getPriorityColor,
  parseDescriptionToSteps,
  stepsToDescription,
} from '@/lib/types';
import { Check, Trash2, Plus, X, ChevronUp, ChevronDown, ImagePlus, Film, Play, BookOpen } from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const generateId = () => `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export default function EditTaskScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === 'new';

  const tasks = useAppStore((s) => s.tasks);
  const categories = useAppStore((s) => s.categories);
  const howToGuides = useAppStore((s) => s.howToGuides);
  const addTask = useAppStore((s) => s.addTask);
  const updateTask = useAppStore((s) => s.updateTask);
  const deleteTask = useAppStore((s) => s.deleteTask);

  const existingTask = useMemo(() => tasks.find((t) => t.id === id), [tasks, id]);

  // Check for AI-generated task data
  const aiGeneratedTask = useAppStore((s) => s.aiGeneratedTask);
  const setAiGeneratedTask = useAppStore((s) => s.setAiGeneratedTask);

  // Use AI-generated task if creating new and one exists
  const sourceTask = useMemo(() => {
    if (isNew && aiGeneratedTask) {
      return aiGeneratedTask as any;
    }
    return existingTask;
  }, [isNew, aiGeneratedTask, existingTask]);

  // Clear AI task after loading it
  React.useEffect(() => {
    if (isNew && aiGeneratedTask) {
      // Clear it after a tick so it doesn't re-populate on re-renders
      const timer = setTimeout(() => setAiGeneratedTask(null), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Parse existing task's description into overview + steps if needed
  const parsedContent = useMemo(() => {
    if (sourceTask?.steps && sourceTask.steps.length > 0) {
      return { overview: sourceTask.overview ?? '', steps: sourceTask.steps };
    }
    if (sourceTask?.description) {
      return parseDescriptionToSteps(sourceTask.description);
    }
    return { overview: '', steps: [] };
  }, [sourceTask]);

  const [title, setTitle] = useState(sourceTask?.title ?? '');
  const [category, setCategory] = useState<TaskCategory>(sourceTask?.category ?? 'property');
  const [frequency, setFrequency] = useState<TaskFrequency>(sourceTask?.frequency ?? 'daily');
  const [customIntervalDays, setCustomIntervalDays] = useState(
    sourceTask?.customIntervalDays?.toString() ?? '3'
  );
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(sourceTask?.timeOfDay ?? 'anytime');
  const [estimatedMinutes, setEstimatedMinutes] = useState(
    sourceTask?.estimatedMinutes?.toString() ?? '10'
  );
  const [priority, setPriority] = useState<TaskPriority>(sourceTask?.priority ?? 'routine');

  // New: Separate overview and steps
  const [overview, setOverview] = useState(parsedContent.overview);
  const [steps, setSteps] = useState<string[]>(parsedContent.steps);

  const [doneProperlyText, setDoneProperlyText] = useState(sourceTask?.doneProperlyText ?? '');
  const [redFlagsText, setRedFlagsText] = useState(sourceTask?.redFlagsText ?? '');
  const [requiresMedication, setRequiresMedication] = useState(
    sourceTask?.requiresMedication ?? false
  );
  const [medicationText, setMedicationText] = useState(sourceTask?.medicationText ?? '');
  const [requiresPhoto, setRequiresPhoto] = useState(sourceTask?.requiresPhoto ?? false);
  const [isActive, setIsActive] = useState(sourceTask?.isActive ?? true);
  const [mediaAttachments, setMediaAttachments] = useState<string[]>(
    sourceTask?.mediaAttachments ?? []
  );
  const [selectedGuideIds, setSelectedGuideIds] = useState<string[]>(
    sourceTask?.howToGuideIds ?? []
  );

  const frequencies: { id: TaskFrequency; label: string }[] = [
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'custom', label: 'Every X Days' },
    { id: 'seasonal', label: 'Seasonal' },
    { id: 'as-needed', label: 'As Needed' },
  ];

  const timesOfDay: { id: TimeOfDay; label: string }[] = [
    { id: 'morning', label: 'Morning' },
    { id: 'anytime', label: 'Anytime' },
    { id: 'evening', label: 'Evening' },
  ];

  const priorities: { id: TaskPriority; label: string }[] = [
    { id: 'critical', label: 'Critical' },
    { id: 'important', label: 'Important' },
    { id: 'routine', label: 'Routine' },
  ];

  // Step management functions
  const addStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSteps([...steps, '']);
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  const removeStep = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSteps(steps.filter((_, i) => i !== index));
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === steps.length - 1) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newSteps = [...steps];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];
    setSteps(newSteps);
  };

  // Media picker functions
  const pickMedia = async (type: 'images' | 'videos') => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant access to your photo library to add media.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'images' ? ['images'] : ['videos'],
      allowsMultipleSelection: true,
      selectionLimit: 5,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      const newUris = result.assets.map((asset) => asset.uri);
      setMediaAttachments((prev) => [...prev, ...newUris]);
    }
  };

  const removeMedia = (uri: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMediaAttachments((prev) => prev.filter((m) => m !== uri));
  };

  const isVideoUri = (uri: string) => {
    return uri.includes('.mov') || uri.includes('.mp4') || uri.includes('.MOV') || uri.includes('.MP4');
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Filter out empty steps
    const filteredSteps = steps.filter((s) => s.trim() !== '');

    // Generate description from overview + steps for backwards compatibility
    const description = stepsToDescription(overview.trim(), filteredSteps);

    const taskData: Task = {
      id: isNew ? generateId() : id,
      title: title.trim(),
      category,
      frequency,
      customIntervalDays: frequency === 'custom' ? parseInt(customIntervalDays, 10) || 3 : undefined,
      timeOfDay,
      estimatedMinutes: parseInt(estimatedMinutes, 10) || 10,
      priority,
      overview: overview.trim(),
      steps: filteredSteps,
      description,
      doneProperlyText: doneProperlyText.trim() || undefined,
      redFlagsText: redFlagsText.trim() || undefined,
      requiresMedication,
      medicationText: requiresMedication ? medicationText.trim() : undefined,
      requiresPhoto,
      isActive,
      mediaAttachments: mediaAttachments.length > 0 ? mediaAttachments : undefined,
      howToGuideIds: selectedGuideIds.length > 0 ? selectedGuideIds : undefined,
    };

    if (isNew) {
      addTask(taskData);
    } else {
      updateTask(id, taskData);
    }

    router.back();
  };

  const handleDelete = () => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteTask(id);
          router.back();
        },
      },
    ]);
  };

  const OptionButton = ({
    selected,
    onPress,
    label,
    color,
  }: {
    selected: boolean;
    onPress: () => void;
    label: string;
    color?: string;
  }) => (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      className={`px-4 py-2 rounded-xl mr-2 mb-2 ${
        selected ? 'bg-orange-600' : 'bg-stone-100'
      }`}
      style={selected && color ? { backgroundColor: color } : undefined}
    >
      <Text className={`text-sm font-medium ${selected ? 'text-white' : 'text-stone-600'}`}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <KeyboardAwareScrollView
      className="flex-1 bg-amber-50/50"
      keyboardShouldPersistTaps="handled"
      bottomOffset={20}
    >
      <View className="px-4 py-6">
          {/* Title */}
          <Animated.View entering={FadeInDown.duration(300)} className="mb-6">
            <Text className="text-sm font-medium text-stone-600 mb-2">Task Title *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g., Feed Scout"
              placeholderTextColor="#9CA3AF"
              className="bg-white rounded-xl p-4 text-stone-800 text-base border border-stone-200"
            />
            <Text className="text-xs text-stone-400 mt-1">
              Tip: Don't include time of day in title - use the schedule below
            </Text>
          </Animated.View>

          {/* Schedule Section */}
          <Animated.View entering={FadeInDown.delay(50).duration(300)} className="mb-6">
            <View className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <Text className="text-sm font-semibold text-blue-800 mb-3">Schedule</Text>

              {/* Time of Day */}
              <Text className="text-xs font-medium text-blue-600 mb-2">Preferred Time</Text>
              <View className="flex-row flex-wrap mb-3">
                {timesOfDay.map((time) => (
                  <OptionButton
                    key={time.id}
                    selected={timeOfDay === time.id}
                    onPress={() => setTimeOfDay(time.id)}
                    label={time.label}
                  />
                ))}
              </View>

              {/* Frequency */}
              <Text className="text-xs font-medium text-blue-600 mb-2">Frequency</Text>
              <View className="flex-row flex-wrap">
                {frequencies.map((freq) => (
                  <OptionButton
                    key={freq.id}
                    selected={frequency === freq.id}
                    onPress={() => setFrequency(freq.id)}
                    label={freq.label}
                  />
                ))}
              </View>

              {/* Custom Interval Input */}
              {frequency === 'custom' && (
                <View className="mt-3 flex-row items-center">
                  <Text className="text-sm text-blue-700 mr-2">Every</Text>
                  <TextInput
                    value={customIntervalDays}
                    onChangeText={setCustomIntervalDays}
                    keyboardType="number-pad"
                    placeholder="3"
                    placeholderTextColor="#9CA3AF"
                    className="bg-white rounded-lg px-3 py-2 text-blue-800 text-base font-semibold border border-blue-200 w-16 text-center"
                  />
                  <Text className="text-sm text-blue-700 ml-2">days</Text>
                </View>
              )}
            </View>
          </Animated.View>

          {/* Category */}
          <Animated.View entering={FadeInDown.delay(100).duration(300)} className="mb-6">
            <Text className="text-sm font-medium text-stone-600 mb-2">Category</Text>
            <View className="flex-row flex-wrap">
              {categories.map((cat) => (
                <OptionButton
                  key={cat.id}
                  selected={category === cat.id}
                  onPress={() => setCategory(cat.id)}
                  label={cat.label}
                  color={cat.color}
                />
              ))}
            </View>
          </Animated.View>

          {/* Priority */}
          <Animated.View entering={FadeInDown.delay(150).duration(300)} className="mb-6">
            <Text className="text-sm font-medium text-stone-600 mb-2">Priority</Text>
            <View className="flex-row flex-wrap">
              {priorities.map((pri) => (
                <OptionButton
                  key={pri.id}
                  selected={priority === pri.id}
                  onPress={() => setPriority(pri.id)}
                  label={pri.label}
                  color={getPriorityColor(pri.id)}
                />
              ))}
            </View>
          </Animated.View>

          {/* Estimated Time */}
          <Animated.View entering={FadeInDown.delay(200).duration(300)} className="mb-6">
            <Text className="text-sm font-medium text-stone-600 mb-2">Estimated Minutes</Text>
            <TextInput
              value={estimatedMinutes}
              onChangeText={setEstimatedMinutes}
              keyboardType="number-pad"
              placeholder="10"
              placeholderTextColor="#9CA3AF"
              className="bg-white rounded-xl p-4 text-stone-800 text-base border border-stone-200 w-24"
            />
          </Animated.View>

          {/* Instructions Section */}
          <Animated.View entering={FadeInDown.delay(250).duration(300)} className="mb-6">
            <View className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
              <Text className="text-sm font-semibold text-orange-800 mb-3">Instructions</Text>

              {/* Overview */}
              <Text className="text-xs font-medium text-orange-600 mb-2">Overview</Text>
              <TextInput
                value={overview}
                onChangeText={setOverview}
                placeholder="Brief description of what this task involves..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={2}
                className="bg-white rounded-xl p-3 text-stone-800 text-sm border border-orange-200 mb-4"
                style={{ textAlignVertical: 'top', minHeight: 60 }}
              />

              {/* Steps */}
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-xs font-medium text-orange-600">Steps</Text>
                <Text className="text-xs text-orange-500">Auto-numbered</Text>
              </View>

              {steps.map((step, index) => (
                <Animated.View
                  key={index}
                  entering={FadeIn.duration(200)}
                  exiting={FadeOut.duration(200)}
                  layout={Layout.springify()}
                  className="flex-row items-center mb-2"
                >
                  {/* Reorder Buttons */}
                  <View className="mr-2">
                    <Pressable
                      onPress={() => moveStep(index, 'up')}
                      disabled={index === 0}
                      className={`p-1 ${index === 0 ? 'opacity-30' : 'active:opacity-50'}`}
                      hitSlop={{ top: 5, bottom: 2, left: 5, right: 5 }}
                    >
                      <ChevronUp size={16} color="#C2410C" />
                    </Pressable>
                    <Pressable
                      onPress={() => moveStep(index, 'down')}
                      disabled={index === steps.length - 1}
                      className={`p-1 ${index === steps.length - 1 ? 'opacity-30' : 'active:opacity-50'}`}
                      hitSlop={{ top: 2, bottom: 5, left: 5, right: 5 }}
                    >
                      <ChevronDown size={16} color="#C2410C" />
                    </Pressable>
                  </View>

                  {/* Step Number */}
                  <View className="w-7 h-7 rounded-full bg-orange-600 items-center justify-center mr-2">
                    <Text className="text-white text-xs font-bold">{index + 1}</Text>
                  </View>

                  {/* Step Input */}
                  <TextInput
                    value={step}
                    onChangeText={(value) => updateStep(index, value)}
                    placeholder={`Step ${index + 1}...`}
                    placeholderTextColor="#9CA3AF"
                    className="flex-1 bg-white rounded-xl p-3 text-stone-800 text-sm border border-orange-200"
                  />

                  {/* Remove Button */}
                  <Pressable
                    onPress={() => removeStep(index)}
                    className="ml-2 p-2 active:opacity-50"
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={18} color="#DC2626" />
                  </Pressable>
                </Animated.View>
              ))}

              {/* Add Step Button */}
              <Pressable
                onPress={addStep}
                className="flex-row items-center justify-center py-3 mt-2 border-2 border-dashed border-orange-300 rounded-xl active:bg-orange-100"
              >
                <Plus size={18} color="#C2410C" />
                <Text className="text-orange-600 font-medium ml-2">Add Step</Text>
              </Pressable>
            </View>
          </Animated.View>

          {/* Media Attachments Section */}
          <Animated.View entering={FadeInDown.delay(275).duration(300)} className="mb-6">
            <View className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
              <Text className="text-sm font-semibold text-purple-800 mb-3">
                Photos & Videos
              </Text>
              <Text className="text-xs text-purple-600 mb-4">
                Add images or videos to help explain the workflow
              </Text>

              {/* Media Grid */}
              {mediaAttachments.length > 0 && (
                <View className="flex-row flex-wrap mb-4">
                  {mediaAttachments.map((uri, index) => (
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
                        {/* Remove Button */}
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
                  className="flex-1 flex-row items-center justify-center py-3 mr-2 border-2 border-dashed border-purple-300 rounded-xl active:bg-purple-100"
                >
                  <ImagePlus size={18} color="#9333EA" />
                  <Text className="text-purple-600 font-medium ml-2">Add Photos</Text>
                </Pressable>
                <Pressable
                  onPress={() => pickMedia('videos')}
                  className="flex-1 flex-row items-center justify-center py-3 ml-2 border-2 border-dashed border-purple-300 rounded-xl active:bg-purple-100"
                >
                  <Film size={18} color="#9333EA" />
                  <Text className="text-purple-600 font-medium ml-2">Add Videos</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>

          {/* How-To Guides Section */}
          {howToGuides.length > 0 && (
            <Animated.View entering={FadeInDown.delay(290).duration(300)} className="mb-6">
              <View className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                <View className="flex-row items-center mb-3">
                  <BookOpen size={18} color="#D97706" />
                  <Text className="text-sm font-semibold text-amber-800 ml-2">
                    How-To Guides
                  </Text>
                </View>
                <Text className="text-xs text-amber-600 mb-4">
                  Assign existing guides to show in this task's detail view
                </Text>

                {/* Guide Selection */}
                {howToGuides.map((guide) => {
                  const isSelected = selectedGuideIds.includes(guide.id);
                  return (
                    <Pressable
                      key={guide.id}
                      onPress={() => {
                        Haptics.selectionAsync();
                        if (isSelected) {
                          setSelectedGuideIds(selectedGuideIds.filter((gid) => gid !== guide.id));
                        } else {
                          setSelectedGuideIds([...selectedGuideIds, guide.id]);
                        }
                      }}
                      className={`flex-row items-center p-3 rounded-xl mb-2 border ${
                        isSelected ? 'bg-amber-100 border-amber-300' : 'bg-white border-stone-200'
                      }`}
                    >
                      <View
                        className={`w-6 h-6 rounded-md border-2 items-center justify-center mr-3 ${
                          isSelected ? 'border-amber-600 bg-amber-600' : 'border-stone-300'
                        }`}
                      >
                        {isSelected && <Check size={14} color="#fff" strokeWidth={3} />}
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-stone-800">{guide.title}</Text>
                        <Text className="text-xs text-stone-500">
                          {guide.mediaUrls.length} {guide.mediaUrls.length === 1 ? 'item' : 'items'}
                        </Text>
                      </View>
                      {guide.mediaUrls[0] && !guide.mediaUrls[0].toLowerCase().includes('.mov') && !guide.mediaUrls[0].toLowerCase().includes('.mp4') && (
                        <Image
                          source={{ uri: guide.mediaUrls[0] }}
                          style={{ width: 40, height: 40, borderRadius: 8 }}
                          resizeMode="cover"
                        />
                      )}
                    </Pressable>
                  );
                })}

                {selectedGuideIds.length > 0 && (
                  <Text className="text-xs text-amber-700 mt-2 text-center">
                    {selectedGuideIds.length} {selectedGuideIds.length === 1 ? 'guide' : 'guides'} selected
                  </Text>
                )}
              </View>
            </Animated.View>
          )}

          {/* Done Properly Text */}
          <Animated.View entering={FadeInDown.delay(300).duration(300)} className="mb-6">
            <Text className="text-sm font-medium text-stone-600 mb-2">
              What "Done" Looks Like (optional)
            </Text>
            <TextInput
              value={doneProperlyText}
              onChangeText={setDoneProperlyText}
              placeholder="Describe the completed state..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              className="bg-white rounded-xl p-4 text-stone-800 text-base border border-stone-200 min-h-[80px]"
              style={{ textAlignVertical: 'top' }}
            />
          </Animated.View>

          {/* Red Flags Text */}
          <Animated.View entering={FadeInDown.delay(350).duration(300)} className="mb-6">
            <Text className="text-sm font-medium text-stone-600 mb-2">Red Flags (optional)</Text>
            <TextInput
              value={redFlagsText}
              onChangeText={setRedFlagsText}
              placeholder="Warning signs to watch for..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              className="bg-white rounded-xl p-4 text-stone-800 text-base border border-stone-200 min-h-[80px]"
              style={{ textAlignVertical: 'top' }}
            />
          </Animated.View>

          {/* Toggles */}
          <Animated.View entering={FadeInDown.delay(400).duration(300)} className="mb-6">
            {/* Requires Medication */}
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setRequiresMedication(!requiresMedication);
              }}
              className={`flex-row items-center p-4 rounded-xl mb-3 border ${
                requiresMedication ? 'bg-red-50 border-red-200' : 'bg-white border-stone-200'
              }`}
            >
              <View
                className={`w-6 h-6 rounded-md border-2 items-center justify-center mr-3 ${
                  requiresMedication ? 'border-red-500 bg-red-500' : 'border-stone-300'
                }`}
              >
                {requiresMedication && <Check size={14} color="#fff" strokeWidth={3} />}
              </View>
              <Text className="text-base text-stone-800">Requires Medication</Text>
            </Pressable>

            {requiresMedication && (
              <TextInput
                value={medicationText}
                onChangeText={setMedicationText}
                placeholder="Medication instructions..."
                placeholderTextColor="#9CA3AF"
                className="bg-white rounded-xl p-4 text-stone-800 text-base border border-stone-200 mb-3"
              />
            )}

            {/* Active Toggle */}
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setIsActive(!isActive);
              }}
              className={`flex-row items-center p-4 rounded-xl border ${
                isActive ? 'bg-lime-50 border-lime-200' : 'bg-white border-stone-200'
              }`}
            >
              <View
                className={`w-6 h-6 rounded-md border-2 items-center justify-center mr-3 ${
                  isActive ? 'border-lime-600 bg-lime-600' : 'border-stone-300'
                }`}
              >
                {isActive && <Check size={14} color="#fff" strokeWidth={3} />}
              </View>
              <Text className="text-base text-stone-800">Active (visible to sitter)</Text>
            </Pressable>
          </Animated.View>

          {/* Action Buttons */}
          <Animated.View entering={FadeInDown.delay(450).duration(300)} className="mt-4 pb-8">
            <Pressable
              onPress={handleSave}
              className="bg-orange-600 rounded-xl py-4 items-center mb-3 active:bg-orange-700"
            >
              <View className="flex-row items-center">
                <Check size={20} color="#fff" />
                <Text className="text-white font-bold text-base ml-2">
                  {isNew ? 'Create Task' : 'Save Changes'}
                </Text>
              </View>
            </Pressable>

            {!isNew && (
              <Pressable
                onPress={handleDelete}
                className="border border-red-300 rounded-xl py-4 items-center"
              >
                <View className="flex-row items-center">
                  <Trash2 size={20} color="#DC2626" />
                  <Text className="text-red-600 font-medium text-base ml-2">Delete Task</Text>
                </View>
              </Pressable>
            )}
          </Animated.View>
        </View>
    </KeyboardAwareScrollView>
  );
}
