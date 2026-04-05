import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import useAppStore from '@/lib/state/app-store';
import { Category } from '@/lib/types';
import {
  Plus,
  Trash2,
  Check,
  X,
  GripVertical,
  Palette,
  Dog,
  Bird,
  Fish,
  Flower2,
  Bot,
  Home,
  Sun,
  Folder,
  Car,
  Wrench,
  Zap,
  Heart,
  Star,
  Package,
  Leaf,
  Droplets,
  Flame,
} from 'lucide-react-native';
import Animated, {
  FadeInDown,
  FadeIn,
  FadeOut,
  Layout,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const generateId = () => `cat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Available colors for categories
const COLORS = [
  '#8B5CF6', // violet
  '#F97316', // orange
  '#0EA5E9', // sky
  '#22C55E', // green
  '#6366F1', // indigo
  '#78716C', // stone
  '#EAB308', // yellow
  '#EC4899', // pink
  '#14B8A6', // teal
  '#EF4444', // red
  '#3B82F6', // blue
  '#A855F7', // purple
];

// Available icons
const ICONS = [
  { name: 'Dog', component: Dog },
  { name: 'Bird', component: Bird },
  { name: 'Fish', component: Fish },
  { name: 'Flower2', component: Flower2 },
  { name: 'Bot', component: Bot },
  { name: 'Home', component: Home },
  { name: 'Sun', component: Sun },
  { name: 'Folder', component: Folder },
  { name: 'Car', component: Car },
  { name: 'Wrench', component: Wrench },
  { name: 'Zap', component: Zap },
  { name: 'Heart', component: Heart },
  { name: 'Star', component: Star },
  { name: 'Package', component: Package },
  { name: 'Leaf', component: Leaf },
  { name: 'Droplets', component: Droplets },
  { name: 'Flame', component: Flame },
];

interface EditingCategory {
  id: string;
  label: string;
  color: string;
  icon: string;
  isNew?: boolean;
}

export default function CategoryManagerScreen() {
  const router = useRouter();
  const categories = useAppStore((s) => s.categories);
  const tasks = useAppStore((s) => s.tasks);
  const addCategory = useAppStore((s) => s.addCategory);
  const updateCategory = useAppStore((s) => s.updateCategory);
  const deleteCategory = useAppStore((s) => s.deleteCategory);

  const [editingCategory, setEditingCategory] = useState<EditingCategory | null>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);

  const getTaskCountForCategory = (categoryId: string) => {
    return tasks.filter((t) => t.category === categoryId).length;
  };

  const handleAddCategory = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditingCategory({
      id: generateId(),
      label: '',
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      icon: 'Folder',
      isNew: true,
    });
  };

  const handleEditCategory = (category: Category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingCategory({ ...category });
  };

  const handleSaveCategory = () => {
    if (!editingCategory) return;

    if (!editingCategory.label.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (editingCategory.isNew) {
      addCategory({
        id: editingCategory.id,
        label: editingCategory.label.trim(),
        color: editingCategory.color,
        icon: editingCategory.icon,
      });
    } else {
      updateCategory(editingCategory.id, {
        label: editingCategory.label.trim(),
        color: editingCategory.color,
        icon: editingCategory.icon,
      });
    }

    setEditingCategory(null);
    setShowColorPicker(false);
    setShowIconPicker(false);
  };

  const handleDeleteCategory = (category: Category) => {
    const taskCount = getTaskCountForCategory(category.id);

    if (taskCount > 0) {
      Alert.alert(
        'Cannot Delete',
        `This category has ${taskCount} task${taskCount > 1 ? 's' : ''} assigned to it. Please reassign or delete those tasks first.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.label}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteCategory(category.id);
          },
        },
      ]
    );
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setShowColorPicker(false);
    setShowIconPicker(false);
  };

  const getIconComponent = (iconName: string) => {
    const found = ICONS.find((i) => i.name === iconName);
    return found?.component ?? Folder;
  };

  return (
    <ScrollView className="flex-1 bg-amber-50/50" keyboardShouldPersistTaps="handled">
      <View className="px-4 py-6">
        {/* Header Stats */}
        <Animated.View entering={FadeInDown.duration(300)} className="mb-6">
          <View className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
            <Text className="text-2xl font-bold text-stone-800">{categories.length}</Text>
            <Text className="text-sm text-stone-500">Categories</Text>
          </View>
        </Animated.View>

        {/* Add New Category Button */}
        <Animated.View entering={FadeInDown.delay(50).duration(300)}>
          <Pressable
            onPress={handleAddCategory}
            className="bg-orange-600 rounded-2xl p-4 flex-row items-center justify-center mb-6 active:bg-orange-700"
          >
            <Plus size={20} color="#fff" />
            <Text className="text-white font-bold text-base ml-2">Add New Category</Text>
          </Pressable>
        </Animated.View>

        {/* Edit Modal */}
        {editingCategory && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            className="mb-6"
          >
            <View className="bg-white rounded-2xl p-4 shadow-lg border-2 border-orange-500">
              <Text className="text-lg font-bold text-stone-800 mb-4">
                {editingCategory.isNew ? 'New Category' : 'Edit Category'}
              </Text>

              {/* Name Input */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-stone-600 mb-2">Name</Text>
                <TextInput
                  value={editingCategory.label}
                  onChangeText={(text) =>
                    setEditingCategory({ ...editingCategory, label: text })
                  }
                  placeholder="Category name..."
                  placeholderTextColor="#9CA3AF"
                  className="bg-stone-50 rounded-xl p-4 text-stone-800 text-base border border-stone-200"
                  autoFocus
                />
              </View>

              {/* Color Picker */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-stone-600 mb-2">Color</Text>
                <Pressable
                  onPress={() => {
                    setShowColorPicker(!showColorPicker);
                    setShowIconPicker(false);
                  }}
                  className="flex-row items-center bg-stone-50 rounded-xl p-4 border border-stone-200"
                >
                  <View
                    style={{ backgroundColor: editingCategory.color }}
                    className="w-8 h-8 rounded-full mr-3"
                  />
                  <Text className="text-stone-600 flex-1">Tap to change color</Text>
                  <Palette size={20} color="#78716C" />
                </Pressable>

                {showColorPicker && (
                  <Animated.View
                    entering={FadeIn.duration(150)}
                    className="flex-row flex-wrap mt-3 p-3 bg-stone-100 rounded-xl"
                  >
                    {COLORS.map((color) => (
                      <Pressable
                        key={color}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setEditingCategory({ ...editingCategory, color });
                          setShowColorPicker(false);
                        }}
                        className="m-1"
                      >
                        <View
                          style={{ backgroundColor: color }}
                          className={`w-10 h-10 rounded-full items-center justify-center ${
                            editingCategory.color === color ? 'border-2 border-white' : ''
                          }`}
                        >
                          {editingCategory.color === color && (
                            <Check size={18} color="#fff" strokeWidth={3} />
                          )}
                        </View>
                      </Pressable>
                    ))}
                  </Animated.View>
                )}
              </View>

              {/* Icon Picker */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-stone-600 mb-2">Icon</Text>
                <Pressable
                  onPress={() => {
                    setShowIconPicker(!showIconPicker);
                    setShowColorPicker(false);
                  }}
                  className="flex-row items-center bg-stone-50 rounded-xl p-4 border border-stone-200"
                >
                  <View
                    style={{ backgroundColor: editingCategory.color }}
                    className="w-8 h-8 rounded-full items-center justify-center mr-3"
                  >
                    {React.createElement(getIconComponent(editingCategory.icon), {
                      size: 18,
                      color: '#fff',
                    })}
                  </View>
                  <Text className="text-stone-600 flex-1">Tap to change icon</Text>
                </Pressable>

                {showIconPicker && (
                  <Animated.View
                    entering={FadeIn.duration(150)}
                    className="flex-row flex-wrap mt-3 p-3 bg-stone-100 rounded-xl"
                  >
                    {ICONS.map((icon) => {
                      const IconComp = icon.component;
                      return (
                        <Pressable
                          key={icon.name}
                          onPress={() => {
                            Haptics.selectionAsync();
                            setEditingCategory({ ...editingCategory, icon: icon.name });
                            setShowIconPicker(false);
                          }}
                          className="m-1"
                        >
                          <View
                            style={{
                              backgroundColor:
                                editingCategory.icon === icon.name
                                  ? editingCategory.color
                                  : '#E7E5E4',
                            }}
                            className="w-10 h-10 rounded-full items-center justify-center"
                          >
                            <IconComp
                              size={20}
                              color={editingCategory.icon === icon.name ? '#fff' : '#78716C'}
                            />
                          </View>
                        </Pressable>
                      );
                    })}
                  </Animated.View>
                )}
              </View>

              {/* Action Buttons */}
              <View className="flex-row mt-2">
                <Pressable
                  onPress={handleCancelEdit}
                  className="flex-1 border border-stone-300 rounded-xl py-3 items-center mr-2 active:bg-stone-100"
                >
                  <View className="flex-row items-center">
                    <X size={18} color="#78716C" />
                    <Text className="text-stone-600 font-medium ml-2">Cancel</Text>
                  </View>
                </Pressable>
                <Pressable
                  onPress={handleSaveCategory}
                  className="flex-1 bg-orange-600 rounded-xl py-3 items-center ml-2 active:bg-orange-700"
                >
                  <View className="flex-row items-center">
                    <Check size={18} color="#fff" />
                    <Text className="text-white font-bold ml-2">Save</Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Category List */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <Text className="text-lg font-bold text-stone-800 mb-3">Your Categories</Text>
          <View className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-100">
            {categories.map((category, index) => {
              const IconComp = getIconComponent(category.icon);
              const taskCount = getTaskCountForCategory(category.id);

              return (
                <Animated.View
                  key={category.id}
                  layout={Layout.springify()}
                  className={`${
                    index < categories.length - 1 ? 'border-b border-stone-100' : ''
                  }`}
                >
                  <Pressable
                    onPress={() => handleEditCategory(category)}
                    className="flex-row items-center p-4 active:bg-stone-50"
                  >
                    {/* Icon */}
                    <View
                      style={{ backgroundColor: category.color }}
                      className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    >
                      <IconComp size={20} color="#fff" />
                    </View>

                    {/* Label & Count */}
                    <View className="flex-1">
                      <Text className="text-base font-medium text-stone-800">
                        {category.label}
                      </Text>
                      <Text className="text-sm text-stone-500">
                        {taskCount} task{taskCount !== 1 ? 's' : ''}
                      </Text>
                    </View>

                    {/* Delete Button */}
                    <Pressable
                      onPress={() => handleDeleteCategory(category)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      className="p-2 active:opacity-50"
                    >
                      <Trash2 size={18} color="#DC2626" />
                    </Pressable>
                  </Pressable>
                </Animated.View>
              );
            })}

            {categories.length === 0 && (
              <View className="p-8 items-center">
                <Folder size={32} color="#9CA3AF" />
                <Text className="text-stone-400 text-base mt-2">No categories yet</Text>
              </View>
            )}
          </View>
        </Animated.View>
      </View>
    </ScrollView>
  );
}
