import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

type Props = {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  minimumDate?: string;
  testID?: string;
};

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function parseIsoDate(value?: string): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(value?: string): string {
  const date = parseIsoDate(value);
  if (!date) return 'Select a date';
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function calendarDays(year: number, month: number): Array<number | null> {
  const firstDay = new Date(year, month, 1).getDay();
  const mondayFirstOffset = (firstDay + 6) % 7;
  const numberOfDays = new Date(year, month + 1, 0).getDate();
  return [
    ...Array.from({ length: mondayFirstOffset }, () => null),
    ...Array.from({ length: numberOfDays }, (_, index) => index + 1),
  ];
}

export function DatePickerField({ label, value, onChange, minimumDate, testID }: Props) {
  const colors = useColors();
  const selectedDate = parseIsoDate(value);
  const initialMonth = selectedDate ?? new Date();
  const [open, setOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(
    new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1)
  );

  useEffect(() => {
    if (!selectedDate) return;
    setVisibleMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [value]);

  const days = useMemo(
    () => calendarDays(visibleMonth.getFullYear(), visibleMonth.getMonth()),
    [visibleMonth]
  );
  const monthLabel = new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
  }).format(visibleMonth);

  function shiftMonth(amount: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }

  function selectDay(day: number) {
    const nextDate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
    const nextIso = toIsoDate(nextDate);
    if (minimumDate && nextIso < minimumDate) return;
    onChange(nextIso);
    setOpen(false);
  }

  return (
    <View style={styles.wrapper}>
      <Text style={[styles.label, { color: colors.foreground }]}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formatDate(value)}`}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((current) => !current)}
        testID={testID}
        style={({ pressed }) => [
          styles.field,
          {
            backgroundColor: colors.background,
            borderColor: open ? colors.primary : colors.border,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Feather name="calendar" size={17} color={value ? colors.primary : colors.mutedForeground} />
        <Text style={[styles.value, { color: value ? colors.foreground : colors.mutedForeground }]}>
          {formatDate(value)}
        </Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mutedForeground} />
      </Pressable>

      {open ? (
        <View
          accessibilityLabel={`${label} calendar`}
          testID={testID ? `${testID}-calendar` : undefined}
          style={[styles.calendar, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.calendarHeader}>
            <View>
              <Text style={[styles.calendarEyebrow, { color: colors.mutedForeground }]}>SELECT DATE</Text>
              <Text style={[styles.monthLabel, { color: colors.foreground }]}>{monthLabel}</Text>
            </View>
            <View style={styles.monthControls}>
              <Pressable
                accessibilityLabel={`Previous month for ${label}`}
                onPress={() => shiftMonth(-1)}
                style={[styles.monthButton, { backgroundColor: colors.muted }]}
              >
                <Feather name="chevron-left" size={17} color={colors.foreground} />
              </Pressable>
              <Pressable
                accessibilityLabel={`Next month for ${label}`}
                onPress={() => shiftMonth(1)}
                style={[styles.monthButton, { backgroundColor: colors.muted }]}
              >
                <Feather name="chevron-right" size={17} color={colors.foreground} />
              </Pressable>
            </View>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((weekday, index) => (
              <Text key={`${weekday}-${index}`} style={[styles.weekday, { color: colors.mutedForeground }]}>
                {weekday}
              </Text>
            ))}
          </View>
          <View style={styles.daysGrid}>
            {days.map((day, index) => {
              if (!day) return <View key={`empty-${index}`} style={styles.dayCell} />;
              const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day);
              const iso = toIsoDate(date);
              const isSelected = iso === value;
              const isDisabled = !!minimumDate && iso < minimumDate;
              return (
                <Pressable
                  key={iso}
                  accessibilityRole="button"
                  accessibilityLabel={`${label} ${formatDate(iso)}`}
                  accessibilityState={{ disabled: isDisabled, selected: isSelected }}
                  disabled={isDisabled}
                  onPress={() => selectDay(day)}
                  testID={testID ? `${testID}-day-${iso}` : undefined}
                  style={[
                    styles.dayCell,
                    styles.dayButton,
                    {
                      backgroundColor: isSelected ? colors.primary : 'transparent',
                      opacity: isDisabled ? 0.3 : 1,
                    },
                  ]}
                >
                  <Text style={[styles.dayText, { color: isSelected ? colors.primaryForeground : colors.foreground }]}>
                    {day}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {minimumDate ? (
            <Text style={[styles.helper, { color: colors.mutedForeground }]}>
              Choose {formatDate(minimumDate)} or later.
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  label: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  field: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  value: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 15 },
  calendar: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginTop: 2,
  },
  calendarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  calendarEyebrow: { fontFamily: 'Inter_700Bold', fontSize: 9, letterSpacing: 1 },
  monthLabel: { fontFamily: 'Inter_700Bold', fontSize: 17, marginTop: 3 },
  monthControls: { flexDirection: 'row', gap: 6 },
  monthButton: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  weekRow: { flexDirection: 'row', marginBottom: 5 },
  weekday: { width: '14.2857%', textAlign: 'center', fontFamily: 'Inter_600SemiBold', fontSize: 10 },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.2857%', height: 36, alignItems: 'center', justifyContent: 'center' },
  dayButton: { borderRadius: 10 },
  dayText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  helper: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 8 },
});