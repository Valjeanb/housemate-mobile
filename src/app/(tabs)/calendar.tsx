import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal, Alert } from 'react-native';
import useAppStore from '@/lib/state/app-store';
import { HouseholdEvent, EventRecurrence, getRecurrenceLabel } from '@/lib/types';
import { eventOccursOn, getEventsForDate } from '@/lib/events';
import { getTodayString, toDateString, parseDateString } from '@/lib/dates';
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil, CalendarDays } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const EMOJI_CHOICES = ['🗑️', '♻️', '🧾', '💧', '🐔', '🐶', '🎂', '📅'];

const generateEventId = () => `event-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

interface DayCell {
  dateString: string | null; // null = leading/trailing blank cell
  dayNumber: number | null;
}

export default function CalendarScreen() {
  const userRole = useAppStore((s) => s.userRole);
  const events = useAppStore((s) => s.events);
  const addEvent = useAppStore((s) => s.addEvent);
  const updateEvent = useAppStore((s) => s.updateEvent);
  const deleteEvent = useAppStore((s) => s.deleteEvent);

  const todayString = getTodayString();
  const [monthAnchor, setMonthAnchor] = useState<Date>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState<string>(todayString);

  // Editor modal state
  const [editorVisible, setEditorVisible] = useState<boolean>(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [emoji, setEmoji] = useState<string>('📅');
  const [recurrence, setRecurrence] = useState<EventRecurrence>('weekly');
  const [notes, setNotes] = useState<string>('');

  const isOwner = userRole === 'owner';

  const monthWeeks: DayCell[][] = useMemo(() => {
    const year = monthAnchor.getFullYear();
    const month = monthAnchor.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0

    const cells: DayCell[] = [];
    for (let i = 0; i < firstWeekday; i++) {
      cells.push({ dateString: null, dayNumber: null });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({ dateString: toDateString(new Date(year, month, day)), dayNumber: day });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ dateString: null, dayNumber: null });
    }
    const weeks: DayCell[][] = [];
    for (let i = 0; i < cells.length; i += 7) {
      weeks.push(cells.slice(i, i + 7));
    }
    return weeks;
  }, [monthAnchor]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, HouseholdEvent[]> = {};
    for (const cell of monthWeeks.flat()) {
      if (!cell.dateString) continue;
      const dayEvents = events.filter((e) => eventOccursOn(e, cell.dateString!));
      if (dayEvents.length > 0) map[cell.dateString] = dayEvents;
    }
    return map;
  }, [monthWeeks, events]);

  const selectedDayEvents = useMemo(
    () => getEventsForDate(events, selectedDate),
    [events, selectedDate]
  );

  const changeMonth = (delta: number) => {
    Haptics.selectionAsync();
    setMonthAnchor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  };

  const openEditor = (event?: HouseholdEvent, template?: Partial<HouseholdEvent>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingEventId(event?.id ?? null);
    setTitle(event?.title ?? template?.title ?? '');
    setEmoji(event?.emoji ?? template?.emoji ?? '📅');
    setRecurrence(event?.recurrence ?? template?.recurrence ?? 'weekly');
    setNotes(event?.notes ?? '');
    setEditorVisible(true);
  };

  const handleSaveEvent = () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Give the event a name, e.g. Bin night');
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (editingEventId) {
      updateEvent(editingEventId, { title: title.trim(), emoji, recurrence, notes: notes.trim() || undefined });
    } else {
      addEvent({
        id: generateEventId(),
        title: title.trim(),
        emoji,
        recurrence,
        anchorDate: selectedDate,
        notes: notes.trim() || undefined,
      });
    }
    setEditorVisible(false);
  };

  const handleDeleteEvent = (event: HouseholdEvent) => {
    Alert.alert('Delete Event', `Delete "${event.title}"? This removes all its occurrences.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteEvent(event.id);
        },
      },
    ]);
  };

  const recurrences: EventRecurrence[] = ['once', 'weekly', 'fortnightly', 'monthly', 'yearly'];

  const selectedDateLabel = useMemo(() => {
    const d = parseDateString(selectedDate);
    return `${WEEKDAY_LABELS[(d.getDay() + 6) % 7]} ${d.getDate()} ${MONTH_LABELS[d.getMonth()]}`;
  }, [selectedDate]);

  return (
    <ScrollView className="flex-1 bg-amber-50/50">
      <View className="px-4 py-4">
        {/* Month header */}
        <Animated.View entering={FadeInDown.duration(300)}>
          <View className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 mb-4">
            <View className="flex-row items-center justify-between mb-3">
              <Pressable onPress={() => changeMonth(-1)} className="p-2 active:opacity-50" hitSlop={8}>
                <ChevronLeft size={22} color="#C2410C" />
              </Pressable>
              <Text className="text-lg font-bold text-stone-800">
                {MONTH_LABELS[monthAnchor.getMonth()]} {monthAnchor.getFullYear()}
              </Text>
              <Pressable onPress={() => changeMonth(1)} className="p-2 active:opacity-50" hitSlop={8}>
                <ChevronRight size={22} color="#C2410C" />
              </Pressable>
            </View>

            {/* Weekday labels */}
            <View className="flex-row mb-1">
              {WEEKDAY_LABELS.map((label) => (
                <View key={label} className="flex-1 items-center">
                  <Text className="text-xs font-semibold text-stone-400">{label}</Text>
                </View>
              ))}
            </View>

            {/* Day grid — explicit week rows so cells never wrap misaligned */}
            {monthWeeks.map((week, weekIndex) => (
              <View key={`week-${weekIndex}`} className="flex-row">
                {week.map((cell, dayIndex) => {
                  if (!cell.dateString) {
                    return <View key={`blank-${weekIndex}-${dayIndex}`} className="flex-1 py-1" />;
                  }
                  const isToday = cell.dateString === todayString;
                  const isSelected = cell.dateString === selectedDate;
                  const dayEvents = eventsByDate[cell.dateString] ?? [];
                  return (
                    <Pressable
                      key={cell.dateString}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedDate(cell.dateString!);
                      }}
                      className="flex-1 items-center py-1"
                    >
                      <View
                        className={`w-9 h-9 rounded-full items-center justify-center ${
                          isSelected ? 'bg-orange-600' : isToday ? 'bg-orange-100' : ''
                        }`}
                      >
                        <Text
                          className={`text-sm ${
                            isSelected
                              ? 'text-white font-bold'
                              : isToday
                              ? 'text-orange-700 font-bold'
                              : 'text-stone-700'
                          }`}
                        >
                          {cell.dayNumber}
                        </Text>
                      </View>
                      <View className="flex-row h-2 items-center">
                        {dayEvents.slice(0, 3).map((e) => (
                          <View
                            key={e.id}
                            style={{ backgroundColor: e.color ?? '#65A30D' }}
                            className="w-1.5 h-1.5 rounded-full mx-0.5"
                          />
                        ))}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Selected day events */}
        <Animated.View entering={FadeInDown.delay(100).duration(300)}>
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-bold text-stone-800">{selectedDateLabel}</Text>
            {isOwner && (
              <Pressable
                onPress={() => openEditor()}
                className="flex-row items-center bg-orange-600 rounded-full px-4 py-2 active:bg-orange-700"
              >
                <Plus size={16} color="#fff" />
                <Text className="text-white font-semibold text-sm ml-1">Add Event</Text>
              </Pressable>
            )}
          </View>

          {selectedDayEvents.length === 0 ? (
            <View className="bg-white rounded-2xl p-6 items-center border border-stone-100">
              <CalendarDays size={32} color="#D6D3D1" />
              <Text className="text-stone-400 text-sm mt-2">Nothing on this day</Text>
              {isOwner && (
                <View className="flex-row mt-4">
                  <Pressable
                    onPress={() => openEditor(undefined, { title: 'Bin night', emoji: '🗑️', recurrence: 'weekly' })}
                    className="bg-stone-100 rounded-full px-4 py-2 mr-2 active:bg-stone-200"
                  >
                    <Text className="text-stone-600 text-sm font-medium">🗑️ Bin night</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openEditor(undefined, { title: 'Recycling', emoji: '♻️', recurrence: 'fortnightly' })}
                    className="bg-stone-100 rounded-full px-4 py-2 active:bg-stone-200"
                  >
                    <Text className="text-stone-600 text-sm font-medium">♻️ Recycling</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ) : (
            selectedDayEvents.map((event) => (
              <View
                key={event.id}
                className="bg-white rounded-2xl p-4 mb-2 flex-row items-center shadow-sm border border-stone-100"
              >
                <Text className="text-2xl mr-3">{event.emoji ?? '📅'}</Text>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-stone-800">{event.title}</Text>
                  <Text className="text-xs text-stone-400">
                    {getRecurrenceLabel(event.recurrence)}
                    {event.notes ? ` · ${event.notes}` : ''}
                  </Text>
                </View>
                {isOwner && (
                  <View className="flex-row">
                    <Pressable onPress={() => openEditor(event)} className="p-2 active:opacity-50" hitSlop={6}>
                      <Pencil size={18} color="#78716C" />
                    </Pressable>
                    <Pressable onPress={() => handleDeleteEvent(event)} className="p-2 active:opacity-50" hitSlop={6}>
                      <Trash2 size={18} color="#DC2626" />
                    </Pressable>
                  </View>
                )}
              </View>
            ))
          )}
        </Animated.View>
      </View>

      {/* Add / Edit event modal */}
      <Modal visible={editorVisible} transparent animationType="slide" onRequestClose={() => setEditorVisible(false)}>
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-3xl p-6 pb-10">
            <Text className="text-lg font-bold text-stone-800 mb-4">
              {editingEventId ? 'Edit Event' : `New Event · ${selectedDateLabel}`}
            </Text>

            <Text className="text-sm font-medium text-stone-600 mb-2">Title</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Bin night"
              placeholderTextColor="#9CA3AF"
              className="bg-stone-50 rounded-xl p-4 text-stone-800 text-base border border-stone-200 mb-4"
            />

            <Text className="text-sm font-medium text-stone-600 mb-2">Icon</Text>
            <View className="flex-row flex-wrap mb-4">
              {EMOJI_CHOICES.map((choice) => (
                <Pressable
                  key={choice}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setEmoji(choice);
                  }}
                  className={`w-11 h-11 rounded-xl items-center justify-center mr-2 mb-2 ${
                    emoji === choice ? 'bg-orange-100 border border-orange-400' : 'bg-stone-50 border border-stone-200'
                  }`}
                >
                  <Text className="text-xl">{choice}</Text>
                </Pressable>
              ))}
            </View>

            <Text className="text-sm font-medium text-stone-600 mb-2">Repeats</Text>
            <View className="flex-row flex-wrap mb-4">
              {recurrences.map((rec) => (
                <Pressable
                  key={rec}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setRecurrence(rec);
                  }}
                  className={`px-4 py-2 rounded-xl mr-2 mb-2 ${
                    recurrence === rec ? 'bg-orange-600' : 'bg-stone-100'
                  }`}
                >
                  <Text className={`text-sm font-medium ${recurrence === rec ? 'text-white' : 'text-stone-600'}`}>
                    {getRecurrenceLabel(rec)}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text className="text-sm font-medium text-stone-600 mb-2">Notes (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="e.g. Bins out by 6am, red lid this week"
              placeholderTextColor="#9CA3AF"
              className="bg-stone-50 rounded-xl p-4 text-stone-800 text-base border border-stone-200 mb-6"
            />

            <View className="flex-row">
              <Pressable
                onPress={() => setEditorVisible(false)}
                className="flex-1 border border-stone-300 rounded-xl py-4 items-center mr-2 active:bg-stone-50"
              >
                <Text className="text-stone-600 font-medium">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveEvent}
                className="flex-1 bg-orange-600 rounded-xl py-4 items-center ml-2 active:bg-orange-700"
              >
                <Text className="text-white font-bold">{editingEventId ? 'Save' : 'Add Event'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
